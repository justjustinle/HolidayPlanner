'use client';

/** Undo toast after a same-day activity reorder. */
export default function ReorderToast({
  message,
  detail,
  onUndo,
  onDismiss,
}: {
  message: string;
  detail?: string | null;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
      role="status"
    >
      <div className="pointer-events-auto flex max-w-app w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-cream shadow-card">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium leading-snug">{message}</p>
          {detail && (
            <p className="mt-0.5 text-[11px] leading-snug text-cream/65">{detail}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onUndo}
          className="flex-none rounded-full bg-cream/15 px-3 py-1.5 text-[13px] font-semibold text-cream"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-none text-[12px] text-cream/55"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
