'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Centered "are you sure?" dialog for destructive actions. Tapping the scrim
// or Cancel dismisses without doing anything.
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      data-app-overlay
      onClick={onCancel}
      className="fixed inset-0 z-50 mx-auto flex max-w-app animate-fade-in items-center justify-center px-8"
      style={{ background: 'rgba(30,20,10,.35)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] rounded-2xl bg-cream p-5 shadow-sheet"
      >
        <h2 className="font-serif text-[18px] font-semibold text-ink">{title}</h2>
        {message && <p className="mt-1.5 text-[13px] leading-snug text-muted">{message}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-black/10 bg-cream-card py-2.5 text-[14px] font-medium text-ink"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl py-2.5 text-[14px] font-medium text-white ${
              tone === 'primary' ? 'bg-ink' : 'bg-saigon'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
