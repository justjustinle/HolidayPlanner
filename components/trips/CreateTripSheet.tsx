'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';

// Fixed accent palette (the four trip cities + spares). Free hex is avoided so
// the color-mix tints stay legible against the cream surfaces.
const ACCENTS = ['#c9992e', '#2f97a6', '#b0472f', '#3f9b8a', '#7a5cc9', '#4f7fd6'];

// Known symbols; unknown codes fall back to the code itself.
const SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', THB: '฿', VND: '₫', JPY: '¥', AUD: '$', SGD: '$',
};
const symbolFor = (code: string) => SYMBOLS[code.toUpperCase()] ?? code.toUpperCase();

interface Leg {
  destination: string;
  nights: number;
  accentHex: string;
}
interface LocalCurrency {
  code: string;
  ratePerBase: string; // local units per 1 base unit
}

function addDays(startISO: string, offset: number): string {
  const [y, m, d] = startISO.split('-').map(Number);
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + offset);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

export default function CreateTripSheet({ onClose }: { onClose: () => void }) {
  const { createTrip } = useTripData();
  const { account } = useAuth();

  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState(account?.name ?? '');
  const [startDate, setStartDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('GBP');
  const [legs, setLegs] = useState<Leg[]>([
    { destination: '', nights: 3, accentHex: ACCENTS[0] },
  ]);
  const [locals, setLocals] = useState<LocalCurrency[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalDays = legs.reduce((n, l) => n + Math.max(1, l.nights), 0);
  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink';

  const setLeg = (i: number, patch: Partial<Leg>) =>
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    if (busy) return;
    if (!name.trim()) return setError('Give the trip a name.');
    if (!startDate) return setError('Pick a start date.');
    if (!legs.every((l) => l.destination.trim())) return setError('Name each destination.');
    setBusy(true);
    setError(null);

    // Build sequential days across the legs from the start date.
    const days: { day_number: number; date: string; destination: string; accent_hex: string }[] = [];
    let offset = 0;
    for (const leg of legs) {
      for (let n = 0; n < Math.max(1, leg.nights); n++) {
        days.push({
          day_number: offset + 1,
          date: addDays(startDate, offset),
          destination: leg.destination.trim(),
          accent_hex: leg.accentHex,
        });
        offset += 1;
      }
    }

    const base = baseCurrency.toUpperCase();
    const currencies = [
      { code: base, symbol: symbolFor(base), rate_per_base: 1 },
      ...locals
        .filter((c) => c.code.trim() && Number(c.ratePerBase) > 0)
        .map((c) => ({
          code: c.code.toUpperCase(),
          symbol: symbolFor(c.code),
          rate_per_base: Number(c.ratePerBase),
        })),
    ];

    try {
      await createTrip({
        name: name.trim(),
        startDate,
        endDate: days[days.length - 1]?.date ?? startDate,
        baseCurrency: base,
        ownerName: ownerName.trim(),
        days,
        currencies,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip.');
      setBusy(false);
    }
  };

  return (
    <Sheet title="Create a trip" onClose={onClose}>
      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Trip name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Japan 2027" className={`${inputCls} mb-3`} autoFocus />

      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Your name</label>
      <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="How you show up on the trip" className={`${inputCls} mb-3`} />

      <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Start date</label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inputCls} mb-4`} />

      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs uppercase tracking-wide text-muted">Destinations</label>
        <span className="text-[11px] text-muted">{totalDays} day{totalDays === 1 ? '' : 's'} total</span>
      </div>
      <div className="mb-2 space-y-2">
        {legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={leg.destination}
              onChange={(e) => setLeg(i, { destination: e.target.value })}
              placeholder="City"
              className={`${inputCls} flex-1`}
            />
            <input
              type="number"
              min={1}
              value={leg.nights}
              onChange={(e) => setLeg(i, { nights: Math.max(1, Number(e.target.value) || 1) })}
              aria-label="Days in this destination"
              className={`${inputCls} w-16 text-center`}
            />
            <div className="flex gap-1">
              {ACCENTS.slice(0, 4).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setLeg(i, { accentHex: hex })}
                  aria-label={`Accent ${hex}`}
                  className={`h-6 w-6 rounded-full ${leg.accentHex === hex ? 'ring-2 ring-ink ring-offset-1' : ''}`}
                  style={{ background: hex }}
                />
              ))}
            </div>
            {legs.length > 1 && (
              <button
                type="button"
                onClick={() => setLegs((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove destination"
                className="text-muted/60 hover:text-saigon"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLegs((prev) => [...prev, { destination: '', nights: 2, accentHex: ACCENTS[prev.length % ACCENTS.length] }])}
        className="mb-4 flex items-center gap-1 text-[13px] font-medium text-ink"
      >
        <Plus size={15} /> Add destination
      </button>

      <div className="mb-1 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">Base currency</label>
          <input value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value.slice(0, 3))} className={inputCls} />
        </div>
      </div>
      <div className="mb-2 mt-2 space-y-2">
        {locals.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={c.code}
              onChange={(e) => setLocals((prev) => prev.map((x, idx) => (idx === i ? { ...x, code: e.target.value.slice(0, 3) } : x)))}
              placeholder="THB"
              className={`${inputCls} w-24`}
            />
            <input
              type="number"
              value={c.ratePerBase}
              onChange={(e) => setLocals((prev) => prev.map((x, idx) => (idx === i ? { ...x, ratePerBase: e.target.value } : x)))}
              placeholder={`per 1 ${baseCurrency.toUpperCase()}`}
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={() => setLocals((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Remove currency" className="text-muted/60 hover:text-saigon">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLocals((prev) => [...prev, { code: '', ratePerBase: '' }])}
        className="mb-5 flex items-center gap-1 text-[13px] font-medium text-ink"
      >
        <Plus size={15} /> Add local currency
      </button>

      {error && <p className="mb-3 text-center text-[13px] text-saigon">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
      >
        {busy && <Loader2 size={16} className="animate-spin" />}
        Create trip
      </button>
    </Sheet>
  );
}
