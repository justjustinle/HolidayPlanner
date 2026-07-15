/** Shared motion tokens for itinerary interaction polish. */
export const MOTION = {
  /** Icon fade / card select chrome */
  fast: '180ms',
  /** Soft settle (borders, shadows) */
  snappy: '220ms',
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/** Light tap feedback where the Vibration API is available (no-op on iOS Safari). */
export function hapticLight(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch {
    /* ignore */
  }
}
