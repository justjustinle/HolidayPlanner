'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

// Full-screen lightbox for a stored receipt photo. Close via ✕, scrim, or Escape.
export default function ReceiptViewer({
  src,
  alt = 'Receipt',
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 160);
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col bg-black/85 transition-opacity duration-150 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={dismiss}
    >
      <div className="flex items-center justify-end px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          aria-label="Close receipt"
          className="rounded-full bg-white/15 p-2 text-white backdrop-blur-sm hover:bg-white/25"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
