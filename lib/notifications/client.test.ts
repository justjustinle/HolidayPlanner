// Unit tests for notification toggle helpers.
// Run: npx tsx --test lib/notifications/client.test.ts
import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';

type FakeSub = {
  endpoint: string;
  unsubscribe: () => Promise<boolean>;
  toJSON: () => {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
};

function installPushMocks(opts: {
  permission?: NotificationPermission;
  subscription?: FakeSub | null;
  vapid?: string | undefined;
}) {
  const permission = opts.permission ?? 'default';
  const vapid =
    'vapid' in opts
      ? opts.vapid
      : // Valid-looking URL-safe base64 (applicationServerKey)
        'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM';
  let subscription = opts.subscription ?? null;

  const pushManager = {
    getSubscription: async () => subscription,
    subscribe: async () => {
      subscription = {
        endpoint: 'https://fcm.example/sub-1',
        unsubscribe: async () => {
          subscription = null;
          return true;
        },
        toJSON: () => ({
          endpoint: 'https://fcm.example/sub-1',
          keys: { p256dh: 'pk', auth: 'ak' },
        }),
      };
      return subscription;
    },
  };

  const registration = { pushManager };

  (globalThis as unknown as { window: unknown }).window = globalThis;
  Object.defineProperty(globalThis, 'Notification', {
    configurable: true,
    writable: true,
    value: {
      permission,
      requestPermission: async () => {
        (Notification as unknown as { permission: string }).permission = 'granted';
        return 'granted';
      },
    },
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: {
      serviceWorker: {
        register: async () => registration,
        getRegistration: async () => registration,
        ready: Promise.resolve(registration),
      },
    },
  });
  Object.defineProperty(globalThis, 'PushManager', {
    configurable: true,
    writable: true,
    value: function PushManager() {},
  });

  if (vapid === undefined) delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  else process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapid;

  const fetches: { method: string; url: string; body: unknown }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    fetches.push({ method, url, body });
    if (url.includes('/api/notifications/subscribe') && (method === 'POST' || method === 'DELETE')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  }) as typeof fetch;

  return {
    fetches,
    restore() {
      globalThis.fetch = originalFetch;
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    },
  };
}

describe('notifications client toggle', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  });

  it('isPushEnabled is false when permission granted but no subscription', async () => {
    const env = installPushMocks({ permission: 'granted', subscription: null });
    const { isPushEnabled } = await import('./client');
    assert.equal(await isPushEnabled(), false);
    env.restore();
  });

  it('isPushEnabled is true when an active subscription exists', async () => {
    const sub: FakeSub = {
      endpoint: 'https://fcm.example/existing',
      unsubscribe: async () => true,
      toJSON: () => ({
        endpoint: 'https://fcm.example/existing',
        keys: { p256dh: 'pk', auth: 'ak' },
      }),
    };
    const env = installPushMocks({ permission: 'granted', subscription: sub });
    const { isPushEnabled } = await import('./client');
    assert.equal(await isPushEnabled(), true);
    env.restore();
  });

  it('enablePush posts subscription to the API', async () => {
    const env = installPushMocks({ permission: 'default', subscription: null });
    const { enablePush } = await import('./client');
    const result = await enablePush('profile-1');
    assert.equal(result.ok, true);
    assert.equal(env.fetches.length, 1);
    assert.equal(env.fetches[0].method, 'POST');
    assert.match(env.fetches[0].url, /\/api\/notifications\/subscribe$/);
    assert.equal(
      (env.fetches[0].body as { profileId: string }).profileId,
      'profile-1'
    );
    env.restore();
  });

  it('disablePush unsubscribes locally and DELETEs the endpoint', async () => {
    let alive = true;
    const sub: FakeSub = {
      endpoint: 'https://fcm.example/to-remove',
      unsubscribe: async () => {
        alive = false;
        return true;
      },
      toJSON: () => ({
        endpoint: 'https://fcm.example/to-remove',
        keys: { p256dh: 'pk', auth: 'ak' },
      }),
    };
    const env = installPushMocks({ permission: 'granted', subscription: sub });
    const { disablePush } = await import('./client');
    const result = await disablePush('profile-1');
    assert.equal(result.ok, true);
    assert.equal(alive, false);
    assert.equal(env.fetches.length, 1);
    assert.equal(env.fetches[0].method, 'DELETE');
    assert.deepEqual(env.fetches[0].body, {
      profileId: 'profile-1',
      endpoint: 'https://fcm.example/to-remove',
    });
    env.restore();
  });

  it('enablePush fails closed when VAPID key is missing', async () => {
    const env = installPushMocks({
      permission: 'granted',
      subscription: null,
      vapid: undefined,
    });
    const { enablePush } = await import('./client');
    const result = await enablePush('profile-1');
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, 'not-configured');
    env.restore();
  });
});
