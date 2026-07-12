'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { Camera, Download, Loader2, Trash2, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTripData } from '../TripDataProvider';
import { savePhoto } from '@/lib/image';
import type { ItineraryItem } from '@/lib/types';

const SWIPE_CLOSE_PX = 100;

// Full-screen memories gallery for one activity. Opens over the timeline;
// close via ✕, scrim tap, or a downward swipe on the header — no navigation / reload.
export default function MemoriesModal({
  item,
  onClose,
}: {
  item: ItineraryItem;
  onClose: () => void;
}) {
  const { photos, profiles, addPhotos, deletePhoto } = useTripData();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const dragYRef = useRef(0);
  const closingRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [closing, setClosing] = useState(false);

  const mine = useMemo(
    () =>
      photos
        .filter((p) => p.activity_id === item.id)
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')),
    [photos, item.id]
  );

  const dismiss = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    // Let the exit animation play, then unmount via parent.
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
    // Bind once for modal lifetime; dismiss closes via refs + onClose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      await addPhotos(item.id, files);
    } catch (err) {
      setError((err as Error).message || 'Could not upload photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const slideCount = mine.length + 1; // photos + trailing Add Memory frame
  const active = mine[Math.min(index, mine.length - 1)];
  const onPhotoSlide = mine.length > 0 && index < mine.length;
  const uploader = active
    ? profiles.find((p) => p.id === active.uploaded_by_id)
    : undefined;

  const onHeaderTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const onHeaderTouchMove = (e: TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only drag the sheet down (not up); ignore small jitter.
    const next = dy > 0 ? dy : 0;
    dragYRef.current = next;
    setDragY(next);
  };

  const onHeaderTouchEnd = () => {
    if (dragYRef.current >= SWIPE_CLOSE_PX) {
      dismiss();
    } else {
      dragYRef.current = 0;
      setDragY(0);
    }
    touchStartY.current = null;
  };

  const addFrame = (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      className="relative flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-white/25 bg-white/5 text-white/80"
    >
      <Camera size={28} />
      <span className="text-[15px] font-medium">Add Memory</span>
      <span className="text-[12px] text-white/50">Tap to upload photos</span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 size={26} className="animate-spin text-white" />
        </span>
      )}
    </button>
  );

  const panelStyle: CSSProperties = {
    transform: closing
      ? 'translateY(100%)'
      : dragY > 0
        ? `translateY(${dragY}px)`
        : undefined,
    opacity: closing ? 0 : dragY > 0 ? Math.max(0.45, 1 - dragY / 400) : 1,
    transition: dragY > 0 && !closing ? 'none' : 'transform 0.16s ease, opacity 0.16s ease',
  };

  return (
    <div
      className={`fixed inset-0 z-50 mx-auto flex max-w-app flex-col ${
        closing ? '' : 'animate-fade-in'
      }`}
      style={{ background: `rgba(20,14,8,${closing ? 0 : Math.max(0.35, 0.72 - dragY / 600)})` }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={`Memories — ${item.title}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex h-full w-full flex-col bg-[#1a1610] text-white ${
          closing || dragY > 0 ? '' : 'animate-modal-up'
        }`}
        style={panelStyle}
      >
        {/* drag handle + header — swipe down here to close */}
        <div
          className="flex-none touch-none px-4 pb-2 pt-3"
          onTouchStart={onHeaderTouchStart}
          onTouchMove={onHeaderTouchMove}
          onTouchEnd={onHeaderTouchEnd}
        >
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-white/25" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                Memories
              </p>
              <h2 className="truncate font-serif text-[20px] leading-tight text-white">
                {item.title}
              </h2>
              {item.time_label && (
                <p className="mt-0.5 text-[13px] text-white/50">{item.time_label}</p>
              )}
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* gallery body */}
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 pt-2">
          {mine.length === 0 ? (
            <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-2xl">
              {addFrame}
            </div>
          ) : (
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl">
              <div
                ref={scrollRef}
                onScroll={onScroll}
                className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
              >
                {mine.map((photo) => (
                  <div key={photo.id} className="relative h-full w-full flex-none snap-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={item.title}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                ))}
                <div className="h-full w-full flex-none snap-center">{addFrame}</div>
              </div>

              {onPhotoSlide && active && (
                <div className="absolute right-3 top-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      savePhoto(active.url, `${item.title.replace(/\W+/g, '-')}.webp`)
                    }
                    aria-label="Save photo"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(active.id)}
                    aria-label="Delete photo"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {slideCount > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {Array.from({ length: slideCount }, (_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {onPhotoSlide && uploader && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/55">
              <Avatar name={uploader.name} src={uploader.avatar_url} size={18} />
              taken by {uploader.name}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-saigon/20 px-3 py-2 text-center text-[12px] text-[#f0b4a4]">
              {error}
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="hidden"
        />
      </div>

      {confirmId && (
        <ConfirmDialog
          title="Delete photo?"
          message="This photo will be removed for everyone on the trip."
          onCancel={() => setConfirmId(null)}
          onConfirm={() => {
            setConfirmId(null);
            deletePhoto(confirmId);
          }}
        />
      )}
    </div>
  );
}
