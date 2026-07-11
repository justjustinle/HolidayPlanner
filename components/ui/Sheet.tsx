'use client';

import { X } from 'lucide-react';

// A bottom sheet that slides up over a scrim. Tapping the scrim or ✕ closes it.
export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 mx-auto flex max-w-app items-end animate-fade-in"
      style={{ background: 'rgba(30,20,10,.35)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[85%] w-full animate-sheet-up overflow-auto rounded-t-[24px] bg-cream px-5 pb-8 pt-4 shadow-sheet"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-[19px] text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
