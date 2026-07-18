'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Sheet from './Sheet';
import { useTripData } from '../TripDataProvider';

export default function EditNameSheet({ onClose }: { onClose: () => void }) {
  const { me, updateMyName } = useTripData();
  const [name, setName] = useState(me?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = name.trim();
  const canSave = Boolean(trimmed && trimmed !== me?.name && !saving);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateMyName(trimmed);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update your name.');
      setSaving(false);
    }
  };

  return (
    <Sheet title="Edit name" onClose={onClose}>
      <form onSubmit={save}>
        <label htmlFor="display-name" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Display name
        </label>
        <input
          ref={inputRef}
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoComplete="name"
          className="w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[16px] text-ink outline-none focus:border-ink"
        />
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          This is the name friends see on this trip, including expenses and photos.
        </p>
        {error && (
          <p className="mt-3 text-[13px] text-saigon" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
        >
          {saving && <Loader2 size={17} className="animate-spin" />}
          Save name
        </button>
      </form>
    </Sheet>
  );
}
