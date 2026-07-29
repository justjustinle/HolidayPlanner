import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activityDurationMinutes,
  computeReorderTimes,
  insertIndexFromY,
  minutesToTimeLabel,
  snapMinutes,
} from './reorder';

describe('snapMinutes / minutesToTimeLabel', () => {
  it('snaps to 5-minute grid and clamps', () => {
    assert.equal(snapMinutes(17), 15);
    assert.equal(snapMinutes(18), 20);
    assert.equal(snapMinutes(-10), 0);
    assert.equal(snapMinutes(24 * 60), 23 * 60 + 55);
    assert.equal(minutesToTimeLabel(125), '02:05');
  });
});

describe('activityDurationMinutes', () => {
  it('returns duration when end is after start', () => {
    assert.equal(
      activityDurationMinutes({
        time_label: '17:30',
        end_time_label: '18:15',
      }),
      45
    );
  });

  it('returns null without a usable end', () => {
    assert.equal(
      activityDurationMinutes({ time_label: '17:30', end_time_label: null }),
      null
    );
    assert.equal(
      activityDurationMinutes({
        time_label: '18:00',
        end_time_label: '17:00',
      }),
      null
    );
  });
});

describe('computeReorderTimes', () => {
  const a = {
    id: 'a',
    time_label: '17:30',
    end_time_label: '18:15' as string | null,
  };
  const b = {
    id: 'b',
    time_label: '20:00',
    end_time_label: null as string | null,
  };
  const c = {
    id: 'c',
    time_label: '21:30',
    end_time_label: null as string | null,
  };

  it('places before first with 30m pad', () => {
    const result = computeReorderTimes([b, c], 0, {
      time_label: '12:00',
      end_time_label: null,
    });
    assert.equal(result.time_label, '19:30');
    assert.equal(result.end_time_label, null);
    assert.equal(result.overlaps, false);
  });

  it('places after last with 30m pad', () => {
    const result = computeReorderTimes([a, b], 2, c);
    assert.equal(result.time_label, '20:30');
    assert.equal(result.end_time_label, null);
  });

  it('places between neighbors at midpoint and preserves duration', () => {
    const result = computeReorderTimes([b, c], 1, a);
    // midpoint of 20:00 and 21:30 = 20:45; duration 45 → 21:30
    assert.equal(result.time_label, '20:45');
    assert.equal(result.end_time_label, '21:30');
  });

  it('flags overlap when landing inside another window', () => {
    const long = {
      id: 'long',
      time_label: '18:00',
      end_time_label: '22:00' as string | null,
    };
    const result = computeReorderTimes([long], 1, b);
    // after long start + 30 = 18:30, inside 18–22 window
    assert.equal(result.time_label, '18:30');
    assert.equal(result.overlaps, true);
  });
});

describe('insertIndexFromY', () => {
  it('returns slot from pointer vs row centers', () => {
    assert.equal(insertIndexFromY(50, [100, 200, 300]), 0);
    assert.equal(insertIndexFromY(150, [100, 200, 300]), 1);
    assert.equal(insertIndexFromY(250, [100, 200, 300]), 2);
    assert.equal(insertIndexFromY(400, [100, 200, 300]), 3);
    assert.equal(insertIndexFromY(10, []), 0);
  });
});
