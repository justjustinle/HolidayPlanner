'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTripData } from '../TripDataProvider';

// The group's exchange rates: for each of the trip's local currencies, how many
// local units equal one unit of the base currency. These drive every base-money
// conversion. Sourced from the trip's currency list (trip_currencies); the base
// currency row is fixed at 1 and not editable.
export default function RateSettings() {
  const { trip, currencies, updateCurrencyRate } = useTripData();
  const locals = currencies.filter((c) => c.code !== trip.base_currency);

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Keep inputs in sync when rates change elsewhere (another device / trip).
  useEffect(() => {
    setDraft(Object.fromEntries(locals.map((c) => [c.code, String(c.rate_per_base)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencies, trip.base_currency]);

  const dirty = locals.some(
    (c) => parseFloat(draft[c.code] ?? '') !== c.rate_per_base
  );

  const save = async () => {
    for (const c of locals) {
      const v = parseFloat(draft[c.code] ?? '');
      if (v > 0 && v !== c.rate_per_base) {
        await updateCurrencyRate(c.code, v);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const field =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-ink';

  if (locals.length === 0) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-cream-card/60 p-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Exchange rates
      </h2>
      <p className="mb-3 mt-1 text-[13px] text-muted">
        How much local currency equals 1 {trip.base_currency}.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {locals.map((c) => (
          <label key={c.code} className="block">
            <span className="mb-1 block text-xs text-muted">
              {c.symbol} {c.code} per 1 {trip.base_currency}
            </span>
            <input
              value={draft[c.code] ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, [c.code]: e.target.value.replace(/[^0-9.]/g, '') }))
              }
              inputMode="decimal"
              className={field}
            />
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={!dirty}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
      >
        {saved ? (
          <>
            <Check size={16} /> Saved
          </>
        ) : (
          'Update rates'
        )}
      </button>
    </div>
  );
}
