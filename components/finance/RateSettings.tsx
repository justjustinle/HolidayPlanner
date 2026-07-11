'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTripData } from '../TripDataProvider';

// The Financial Matrix Controller: anyone can edit the group's baseline
// exchange rates (local units per £1). These drive every GBP conversion.
export default function RateSettings() {
  const { settings, updateRates } = useTripData();
  const [vnd, setVnd] = useState(String(settings.vnd_per_gbp));
  const [thb, setThb] = useState(String(settings.thb_per_gbp));
  const [saved, setSaved] = useState(false);

  // Keep local inputs in sync if another device updates the rates.
  useEffect(() => {
    setVnd(String(settings.vnd_per_gbp));
    setThb(String(settings.thb_per_gbp));
  }, [settings.vnd_per_gbp, settings.thb_per_gbp]);

  const dirty =
    parseFloat(vnd) !== settings.vnd_per_gbp ||
    parseFloat(thb) !== settings.thb_per_gbp;

  const save = async () => {
    const v = parseFloat(vnd);
    const t = parseFloat(thb);
    if (!v || !t) return;
    await updateRates(v, t);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const field =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-ink';

  return (
    <div className="rounded-2xl border border-black/5 bg-cream-card/60 p-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Exchange rates
      </h2>
      <p className="mb-3 mt-1 text-[13px] text-muted">How much local currency equals £1.</p>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">₫ VND per £1</span>
          <input
            value={vnd}
            onChange={(e) => setVnd(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">฿ THB per £1</span>
          <input
            value={thb}
            onChange={(e) => setThb(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
            className={field}
          />
        </label>
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
