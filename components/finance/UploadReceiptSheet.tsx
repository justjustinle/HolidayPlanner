'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Plus, ScanLine, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { compressToWebp, dataUrlToBase64, fileToDataUrl } from '@/lib/image';
import { toGbp, formatGbp, round2 } from '@/lib/currency';
import { CURRENCY_SYMBOL, TRIP_DAYS } from '@/lib/trip';
import type { CurrencyCode } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['VND', 'THB', 'GBP'];

interface DraftItem {
  name: string;
  quantity: number;
  price: string; // keep as string while editing
}

// Upload → Gemini scan → review/edit → save. The photo is compressed to WebP
// before it's sent anywhere. After saving, items appear in the Money tab where
// everyone self-claims what they ordered.
export default function UploadReceiptSheet({
  defaultDay,
  onClose,
}: {
  defaultDay: number;
  onClose: () => void;
}) {
  const { profiles, me, settings, addReceiptExpense } = useTripData();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false); // review stage reached
  const [error, setError] = useState<string | null>(null);

  const [merchant, setMerchant] = useState('');
  const [day, setDay] = useState(defaultDay || 1);
  const [currency, setCurrency] = useState<CurrencyCode>('THB');
  const [totalStr, setTotalStr] = useState('');
  const [paidById, setPaidById] = useState<string>(me?.id ?? profiles[0]?.id ?? '');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError(null);
    const compressed = await compressToWebp(f);
    setFile(compressed);
    setPreview(await fileToDataUrl(compressed));
  };

  const scan = async () => {
    if (!preview || scanning) return;
    setScanning(true);
    setError(null);
    try {
      const { base64, mimeType } = dataUrlToBase64(preview);
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Scan failed (${res.status})`);
      setMerchant(data.merchant || '');
      setCurrency(data.currency as CurrencyCode);
      setTotalStr(data.total ? String(data.total) : '');
      setItems(
        (data.items as { name: string; quantity: number; price: number }[]).map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: String(i.price),
        }))
      );
      setScanned(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const itemSum = useMemo(
    () => round2(items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)),
    [items]
  );
  const total = parseFloat(totalStr) || itemSum;
  const gbp = toGbp(total, currency, settings);

  const updateItem = (idx: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const canSave =
    scanned && total > 0 && paidById && items.some((i) => (parseFloat(i.price) || 0) > 0) && !busy;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      await addReceiptExpense({
        merchant,
        dayNumber: day,
        currency,
        total,
        paidById,
        items: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: parseFloat(i.price) || 0,
        })),
        imageFile: file,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  return (
    <Sheet title="Upload a receipt" onClose={onClose}>
      {/* stage 1: pick + scan */}
      {!scanned && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            className="mb-3 flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-black/15 bg-cream-card py-6 text-muted"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Receipt" className="max-h-56 rounded-lg object-contain" />
            ) : (
              <>
                <Camera size={26} />
                <span className="text-sm">Snap or choose a receipt photo</span>
              </>
            )}
          </button>

          {error && (
            <p className="mb-3 rounded-xl bg-saigon/10 px-3 py-2 text-[13px] text-saigon">
              {error}
            </p>
          )}

          <button
            onClick={scan}
            disabled={!preview || scanning}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {scanning ? <Loader2 size={17} className="animate-spin" /> : <ScanLine size={17} />}
            {scanning ? 'Reading receipt…' : 'Scan with Gemini'}
          </button>
          <button
            onClick={() => {
              setScanned(true);
              if (!items.length) setItems([{ name: '', quantity: 1, price: '' }]);
            }}
            className="w-full rounded-xl border border-black/10 py-3 text-[14px] text-ink"
          >
            Skip scan — enter items manually
          </button>
        </>
      )}

      {/* stage 2: review + save */}
      {scanned && (
        <>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Merchant / place"
            className={`${inputCls} mb-3`}
          />

          <div className="mb-3 grid grid-cols-2 gap-2">
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className={`${inputCls} appearance-none`}
            >
              {TRIP_DAYS.map((d) => (
                <option key={d.dayNumber} value={d.dayNumber}>
                  {d.label} · {d.destination}
                </option>
              ))}
            </select>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className={`${inputCls} appearance-none`}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_SYMBOL[c]} {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted">Items</span>
            <span className="text-[12px] text-muted">
              lines sum to {CURRENCY_SYMBOL[currency]}
              {itemSum.toLocaleString()}
            </span>
          </div>
          <div className="mb-2 space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={it.name}
                  onChange={(e) => updateItem(idx, { name: e.target.value })}
                  placeholder="Item"
                  className="min-w-0 flex-1 rounded-lg border border-black/10 bg-cream-card px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
                />
                <input
                  value={it.price}
                  onChange={(e) =>
                    updateItem(idx, { price: e.target.value.replace(/[^0-9.]/g, '') })
                  }
                  inputMode="decimal"
                  placeholder="0"
                  className="w-24 rounded-lg border border-black/10 bg-cream-card px-3 py-2 text-right text-[14px] text-ink outline-none focus:border-ink"
                />
                <button
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                  aria-label="Remove item"
                  className="text-muted/60 hover:text-saigon"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, { name: '', quantity: 1, price: '' }])}
            className="mb-4 flex items-center gap-1 text-[13px] text-muted"
          >
            <Plus size={14} /> Add item
          </button>

          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Receipt total (incl. tax & service)
          </label>
          <div className="relative mb-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              {CURRENCY_SYMBOL[currency]}
            </span>
            <input
              value={totalStr}
              onChange={(e) => setTotalStr(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              placeholder={String(itemSum || 0)}
              className="w-full rounded-xl border border-black/10 bg-cream-card py-3 pl-9 pr-4 text-[18px] text-ink outline-none focus:border-ink"
            />
          </div>
          <p className="mb-4 text-right text-[13px] text-muted">
            = <span className="font-semibold text-ink">{formatGbp(gbp)}</span> base
          </p>

          <div className="mb-2 text-xs uppercase tracking-wide text-muted">Paid by</div>
          <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
            {profiles.map((p) => {
              const active = p.id === paidById;
              return (
                <button
                  key={p.id}
                  onClick={() => setPaidById(p.id)}
                  className={`flex flex-none items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                    active ? 'border-ink bg-ink/5 text-ink' : 'border-black/10 text-muted'
                  }`}
                >
                  <Avatar name={p.name} src={p.avatar_url} size={20} />
                  {p.name}
                </button>
              );
            })}
          </div>

          <p className="mb-4 text-[12px] leading-relaxed text-muted">
            After saving, everyone claims their own items in the Money tab. Unclaimed
            items stay untagged (the payer carries them until claimed).
          </p>

          <button
            onClick={save}
            disabled={!canSave}
            className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save receipt'}
          </button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
    </Sheet>
  );
}
