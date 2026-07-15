/** Shared motion tokens for itinerary interaction polish. */
export const MOTION = {
  /** Icon fade / card select chrome */
  fast: '180ms',
  /** Soft settle (borders, shadows) */
  snappy: '220ms',
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/** Hidden iOS 17.4+ `<input switch>` used to trigger a native haptic tick. */
let hapticSwitchEl: HTMLInputElement | null = null;

export function registerHapticSwitch(el: HTMLInputElement | null): void {
  hapticSwitchEl = el;
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS desktop UA
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

/**
 * Short haptic tick for committed state changes only (card select, delete
 * confirm, save new activity). Call synchronously at the top of the handler,
 * before any setState.
 *
 * - Android: `navigator.vibrate(10)`
 * - iOS 17.4+: programmatic click on a hidden `<input type="checkbox" switch>`
 * - Anything else: silent no-op
 */
export function hapticTick(): void {
  if (typeof window === 'undefined') return;

  if (isAndroid()) {
    try {
      navigator.vibrate?.(10);
    } catch {
      /* ignore */
    }
    return;
  }

  if (isIOS() && hapticSwitchEl) {
    try {
      hapticSwitchEl.click();
    } catch {
      /* ignore */
    }
  }
}
