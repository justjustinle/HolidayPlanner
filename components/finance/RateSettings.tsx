'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTripData } from '../TripDataProvider';

export default function RateSettings() {
  const { trip, currencies, updateCurrencyRates } = useTripData();
  const destinationCurrencies = useMemo(
    () => currencies.filter((currency) => currency.code !== trip.base_currency),
    [currencies, trip.base_currency]
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues(
      Object.fromEntries(
        destinationCurrencies.map((currency) => [
          currency.code,
          currency.rate_per_base == null ? '' : String(currency.rate_per_base),
        ])
      )
    );
  }, [destinationCurrencies]);

  const dirty = destinationCurrencies.some((currency) => {
    const entered = Number(values[currency.code]);
    return entered > 0 && entered !== currency.rate_per_base;
  });
  const valid =
    destinationCurrencies.length > 0 &&
    destinationCurrencies.every((currency) => Number(values[currency.code]) > 0);

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateCurrencyRates(
        Object.fromEntries(
          destinationCurrencies.map((currency) => [
            currency.code,
            Number(values[currency.code]),
          ])
        )
      );
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save rates.');
    } finally {
      setSaving(false);
    }
  };

  const field =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-ink';

  return (
    <div className="rounded-2xl border border-black/5 bg-cream-card/60 p-4">
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
        Exchange rates
      </h2>
      {destinationCurrencies.length === 0 ? (
        <p className="mt-1 text-[13px] text-muted">
          This trip only uses {trip.base_currency}.
        </p>
      ) : (
        <>
          <p className="mb-3 mt-1 text-[13px] text-muted">
            How much destination currency equals 1 {trip.base_currency}.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {destinationCurrencies.map((currency) => (
              <label key={currency.code} className="block">
                <span className="mb-1 block text-xs text-muted">
                  {currency.symbol} {currency.code} per 1 {trip.base_currency}
                </span>
                <input
                  value={values[currency.code] ?? ''}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [currency.code]: event.target.value.replace(/[^0-9.]/g, ''),
                    }))
                  }
                  inputMode="decimal"
                  placeholder="Set rate"
                  className={field}
                />
              </label>
            ))}
          </div>
          {error && (
            <p className="mt-3 text-[13px] text-saigon" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || !valid || saving}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              'Update rates'
            )}
          </button>
        </>
      )}
    </div>
  );
}
