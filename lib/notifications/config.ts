// Central notification config: batching thresholds and the event-type
// registry. Reclassify an event between tiers by editing EVENT_CONFIG only.

// The app is single-trip today; every notification table carries this trip_id
// so per-trip preferences / multi-trip support can be added without a reshape.
export const TRIP_ID = 'thailand-vietnam-2026';
export const TRIP_NAME = 'Thailand & Vietnam';

// Hybrid batching rule — a push goes out when EITHER is met, whichever first:
// 5+ unnotified events for a recipient, or the oldest unnotified event is
// older than 2 hours (enforced by the cron, which ticks every ~15 minutes via
// .github/workflows/notifications-cron.yml).
export const BATCH_MIN_COUNT = 5;
export const BATCH_MAX_AGE_MINUTES = 120;
export const CRON_INTERVAL_MINUTES = 15; // documentation only — set in the workflow cron

export type NotificationTier = 'batched' | 'immediate';

export interface EventTypeConfig {
  tier: NotificationTier;
  // Nouns for the batch summary, e.g. "3 expenses, 2 photos".
  singular: string;
  plural: string;
}

export const EVENT_CONFIG = {
  expense_added: { tier: 'batched', singular: 'expense', plural: 'expenses' },
  photo_added: { tier: 'batched', singular: 'photo', plural: 'photos' },
  activity_added: { tier: 'batched', singular: 'activity', plural: 'activities' },
  // Targeted at one recipient (recipient_id set) and pushed instantly.
  expense_split_added: { tier: 'immediate', singular: 'split', plural: 'splits' },
} as const satisfies Record<string, EventTypeConfig>;

export type EventType = keyof typeof EVENT_CONFIG;

export const BATCHED_EVENT_TYPES = (
  Object.keys(EVENT_CONFIG) as EventType[]
).filter((t) => EVENT_CONFIG[t].tier === 'batched');
