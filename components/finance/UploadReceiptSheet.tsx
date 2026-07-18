'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { compressToWebp, dataUrlToBase64, fileToDataUrl } from '@/lib/image';
import { toGbp, formatGbp, round2, symbolFor } from '@/lib/currency';
import { receiptTaxMultiplier } from '@/lib/settle';
import type { CurrencyCode, Expense } from '@/lib/types';

const CURRENCIES: CurrencyCode[] = ['VND', 'THB', 'GBP'];

interface DraftItem {
  id?: string;
  name: string;
  quantity: number;
  price: string; // keep as string while editing
  claimed_by_id?: string | null;
}

// Upload → scan → review/edit → save. Also opens in edit mode when passed an
// existing receipt expense. Tax/service above the item sum is spread
// proportionally at settlement via receiptTaxMultiplier (everyone who claims
// an item pays their share of the gap).
export default function UploadReceiptSheet({
  defaultDay,
  expense,
  onClose,
}: {
  defaultDay: number;
  expense?: Expense;
  onClose: () => void;
}) {
  const {
    profiles,
    me,
    settings,
    receipts,
    receiptItems,
    tripDays,
    currencies,
    addReceiptExpense,
    updateReceiptExpense,
  } = useTripData();
  const inputRef = useRef<HTMLInputElement>(null);

  const existingReceipt = expense
    ? receipts.find((r) => r.expense_id === expense.id)
    : undefined;
  const existingItems = existingReceipt
    ? receiptItems.filter((i) => i.receipt_id === existingReceipt.id)
    : [];
  const isEditing = expense?.kind === 'receipt' && !!existingReceipt;

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    existingReceipt?.image_url ?? null
  );
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(isEditing); // edit mode skips pick/scan
  const [error, setError] = useState<string | null>(null);

  const [merchant, setMerchant] = useState(
    existingReceipt?.merchant ?? expense?.label ?? ''
  );
  const [day, setDay] = useState(expense?.day_number ?? defaultDay ?? 1);
  const [currency, setCurrency] = useState<CurrencyCode>(
    expense?.local_currency ?? 'THB'
  );
  const [totalStr, setTotalStr] = useState(
    expense ? String(expense.local_amount) : ''
  );
  const [paidById, setPaidById] = useState<string>(
    expense?.paid_by_id ?? me?.id ?? profiles[0]?.id ?? ''
  );
  const [items, setItems] = useState<DraftItem[]>(() =>
    existingItems.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: String(i.local_amount),
      claimed_by_id: i.claimed_by_id,
    }))
  );
  const [busy, setBusy] = useState(false);

  const currencySymbol = symbolFor(currency, currencies);

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
      const nextItems = (
        data.items as { name: string; quantity: number; price: number }[]
      ).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: String(i.price),
      }));
      const scannedSubtotal = round2(
        nextItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)
      );
      setMerchant(data.merchant || '');
      setCurrency(data.currency as CurrencyCode);
      const scannedTotal = Number(data.total) || 0;
      setTotalStr(
        scannedTotal > 0
          ? String(scannedTotal)
          : scannedSubtotal > 0
            ? String(scannedSubtotal)
            : ''
      );
      setItems(nextItems);
      setScanned(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const itemSubtotal = useMemo(
    () => round2(items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0)),
    [items]
  );
  const typedTotal = parseFloat(totalStr) || 0;
  const receiptTotal = typedTotal > 0 ? typedTotal : itemSubtotal;
  const multiplier = receiptTaxMultiplier(itemSubtotal, receiptTotal);
  const taxGap = round2(receiptTotal - itemSubtotal);
  const showTaxBadge = typedTotal > itemSubtotal && itemSubtotal > 0;
  const gbp = toGbp(receiptTotal, currency, settings);

  const updateItem = (idx: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const canSave =
    scanned &&
    receiptTotal > 0 &&
    paidById &&
    items.some((i) => (parseFloat(i.price) || 0) > 0) &&
    !busy;

  const save = async () => {
    if (!canSave) return;
    if (!(parseFloat(totalStr) > 0) && itemSubtotal > 0) {
      setTotalStr(String(itemSubtotal));
    }
    setBusy(true);
    try {
      const payload = {
        merchant,
        dayNumber: day,
        currency,
        total: receiptTotal,
        paidById,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: parseFloat(i.price) || 0,
          claimed_by_id: i.claimed_by_id ?? null,
        })),
        imageFile: file,
      };
      if (isEditing && expense) {
        await updateReceiptExpense(expense.id, payload);
      } else {
        await addReceiptExpense(payload);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink';

  return (
    <Sheet title={isEditing ? 'Edit receipt' : 'Upload a receipt'} onClose={onClose}>
      {/* stage 1: pick + scan (create only) */}
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
            {scanning ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
            {scanning ? 'Reading receipt…' : 'Upload'}
          </button>
          <button
            onClick={() => {
              setScanned(true);
              if (!items.length) setItems([{ name: '', quantity: 1, price: '' }]);
            }}
            className="w-full rounded-xl border border-black/10 py-3 text-[14px] text-ink"
          >
            Enter items manually
          </button>
        </>
      )}

      {/* stage 2: review + save */}
      {scanned && (
        <>
          {isEditing && preview && (
            <button
              onClick={() => inputRef.current?.click()}
              className="mb-3 overflow-hidden rounded-2xl border border-black/10 bg-cream-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Receipt" className="max-h-40 w-full object-contain" />
            </button>
          )}

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
              {tripDays.map((d) => (
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
                  {symbolFor(c, currencies)} {c}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted">Items</span>
            <span className="text-[12px] text-muted">
              lines sum to {currencySymbol}
              {itemSubtotal.toLocaleString()}
            </span>
          </div>
          <div className="space-y-1.5">
            {items.map((it, idx) => {
              const base = parseFloat(it.price) || 0;
              const withTax = showTaxBadge ? round2(base * multiplier) : base;
              return (
                <div key={it.id ?? idx} className="flex items-center gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="Item"
                    className="min-w-0 flex-1 rounded-lg border border-black/10 bg-cream-card px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
                  />
                  <div className="relative w-24 flex-none">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">
                      {currencySymbol}
                    </span>
                    <input
                      value={it.price}
                      onChange={(e) =>
                        updateItem(idx, { price: e.target.value.replace(/[^0-9.]/g, '') })
                      }
                      inputMode="decimal"
                      placeholder="0"
                      className="w-full rounded-lg border border-black/10 bg-cream-card py-2 pl-5 pr-2 text-right text-[14px] text-ink outline-none focus:border-ink"
                    />
                  </div>
                  {showTaxBadge && base > 0 && (
                    <span className="w-14 flex-none text-right text-[11px] text-nhatrang">
                      →{currencySymbol}
                      {withTax.toLocaleString()}
                    </span>
                  )}
                  <button
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove item"
                    className="text-muted/60 hover:text-saigon"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setItems((prev) => [...prev, { name: '', quantity: 1, price: '' }])}
            className="mb-2 mt-1.5 flex items-center gap-1 text-[13px] text-muted"
          >
            <Plus size={14} /> Add item
          </button>

          <label className="mb-1 block text-xs uppercase tracking-wide text-muted">
            Receipt total (incl. tax & service)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              {currencySymbol}
            </span>
            <input
              value={totalStr}
              onChange={(e) => setTotalStr(e.target.value.replace(/[^0-9.]/g, ''))}
              onBlur={() => {
                if (!(parseFloat(totalStr) > 0) && itemSubtotal > 0) {
                  setTotalStr(String(itemSubtotal));
                }
              }}
              inputMode="decimal"
              placeholder={`${currencySymbol}${itemSubtotal || 0}`}
              className="w-full rounded-xl border border-black/10 bg-cream-card py-3 pl-9 pr-4 text-[18px] text-ink outline-none focus:border-ink"
            />
          </div>
          {showTaxBadge && (
            <p className="mt-1 text-xs font-medium text-nhatrang">
              ✓ {currencySymbol}
              {taxGap.toLocaleString()} tax/service split proportionally across claimed items
            </p>
          )}
          <p className="mb-4 mt-1 text-right text-[13px] text-muted">
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
            After saving, everyone claims their own items. Unclaimed items stay on the
            payer until claimed. Any gap between line items and the receipt total is
            shared proportionally — claiming an item includes its share of tax & service.
          </p>

          <button
            onClick={save}
            disabled={!canSave}
            className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
          >
            {busy ? 'Saving…' : isEditing ? 'Save changes' : 'Save receipt'}
          </button>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
    </Sheet>
  );
}
