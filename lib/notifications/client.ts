// Browser-side web push enrolment. Call enablePush / disablePush from a user
// gesture (the permission prompt is blocked otherwise).

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function pushPermission(): NotificationPermission | 'unsupported' {
  return pushSupported() ? Notification.permission : 'unsupported';
}

export type PushToggleResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'unsupported' | 'denied' | 'not-configured' | 'failed';
    };

/** @deprecated Prefer PushToggleResult */
export type EnablePushResult = PushToggleResult;

/** True when this browser has an active push subscription (not merely permission). */
export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    const registration =
      (await navigator.serviceWorker.getRegistration('/sw.js')) ??
      (await navigator.serviceWorker.getRegistration());
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
}

export async function enablePush(profileId: string): Promise<PushToggleResult> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, reason: 'not-configured' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    // Register explicitly rather than waiting on `ready`: the boot-time
    // registration only runs in production builds, and register() is
    // idempotent when the SW is already active.
    const registration = await ensureServiceWorker();

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      }));

    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, subscription: subscription.toJSON() }),
    });
    if (!res.ok) return { ok: false, reason: 'failed' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/** Drop the local push subscription and remove it from the server. */
export async function disablePush(profileId: string): Promise<PushToggleResult> {
  if (!pushSupported()) return { ok: false, reason: 'unsupported' };

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration('/sw.js')) ??
      (await navigator.serviceWorker.getRegistration());

    const subscription = registration
      ? await registration.pushManager.getSubscription()
      : null;

    const endpoint = subscription?.endpoint;

    if (subscription) {
      const unsubscribed = await subscription.unsubscribe();
      if (!unsubscribed) return { ok: false, reason: 'failed' };
    }

    // Always ask the server to drop the row when we know the endpoint, so a
    // half-cleared device does not keep receiving digests.
    if (endpoint) {
      const res = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, endpoint }),
      });
      // 404/503 are fine — local unsubscribe already succeeded.
      if (!res.ok && res.status !== 404 && res.status !== 503) {
        return { ok: false, reason: 'failed' };
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
