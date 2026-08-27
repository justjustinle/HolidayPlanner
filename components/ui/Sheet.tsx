'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// A bottom sheet that slides up over a scrim. Tapping the scrim or ✕ closes it.
// Portaled to body so it stays viewport-fixed even when a parent (tab pager)
// applies a transform.
export default function Sheet({
  title,
  onClose,
  children,
  /** Optional icons/actions rendered left of the close button. */
  headerActions,
  /** Extra classes for the title (e.g. font-semibold). */
  titleClassName,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  titleClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      data-app-overlay
      onClick={onClose}
      className="fixed inset-0 z-50 mx-auto flex max-w-app items-end animate-fade-in"
      style={{ background: 'rgba(30,20,10,.35)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="no-scrollbar max-h-[85%] w-full animate-sheet-up overflow-auto rounded-t-[24px] bg-cream px-5 pb-8 pt-4 shadow-sheet"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-black/15" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            className={`min-w-0 font-serif text-[19px] text-ink ${titleClassName ?? ''}`}
          >
            {title}
          </h2>
          <div className="flex flex-none items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
