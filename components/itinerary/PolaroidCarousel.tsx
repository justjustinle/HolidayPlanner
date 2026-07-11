'use client';

import { useMemo, useRef, useState } from 'react';
import { Camera, Download, Loader2, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useTripData } from '../TripDataProvider';
import { savePhoto } from '@/lib/image';
import type { ItineraryItem } from '@/lib/types';

// The activity's Polaroid frame.
//
// No photos yet → the frame collapses to a short (~30% height) "Add Memory"
// strip so cards stay compact. With photos → a swipeable carousel inside the
// white frame: one slide per photo, and the LAST slide is always Add Memory.
// Multiple images can be added at once; each photo is credited to its
// uploader (feeds the Stats photos-taken counter) and can be saved to the
// device.
export default function PolaroidCarousel({ item }: { item: ItineraryItem }) {
  const { photos, profiles, addPhotos, deletePhoto } = useTripData();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(
    () =>
      photos
        .filter((p) => p.activity_id === item.id)
        .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? '')),
    [photos, item.id]
  );

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow re-selecting the same files later
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
  const onPhotoSlide = index < mine.length;
  const uploader = active
    ? profiles.find((p) => p.id === active.uploaded_by_id)
    : undefined;

  const addFrame = (collapsed: boolean) => (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      className={`relative flex w-full flex-col items-center justify-center gap-1.5 border-2 border-dashed border-black/15 bg-cream text-muted ${
        collapsed ? 'aspect-[10/3]' : 'h-full'
      }`}
    >
      <Camera size={collapsed ? 20 : 26} />
      <span className="text-sm">📸 Add Memory</span>
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 size={22} className="animate-spin text-ink" />
        </span>
      )}
    </button>
  );

  return (
    <div className="rounded-[4px] bg-white p-2 pb-3 shadow-polaroid [transform:rotate(-1deg)]">
      {mine.length === 0 ? (
        // Collapsed: ~30% of the full square, just an add strip.
        addFrame(true)
      ) : (
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="no-scrollbar flex aspect-square w-full snap-x snap-mandatory overflow-x-auto rounded-[2px]"
          >
            {mine.map((photo) => (
              <div key={photo.id} className="relative h-full w-full flex-none snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
            <div className="h-full w-full flex-none snap-center">{addFrame(false)}</div>
          </div>

          {/* overlay actions for the visible photo */}
          {onPhotoSlide && active && (
            <div className="absolute right-2 top-2 flex gap-1.5">
              <button
                onClick={() => savePhoto(active.url, `${item.title.replace(/\W+/g, '-')}.webp`)}
                aria-label="Save photo"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
              >
                <Download size={15} />
              </button>
              <button
                onClick={() => deletePhoto(active.id)}
                aria-label="Delete photo"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {/* dots */}
          {slideCount > 1 && (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {Array.from({ length: slideCount }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-center font-hand text-[19px] leading-none text-ink">
        {item.title}
      </p>

      {/* photo credit */}
      {onPhotoSlide && uploader && (
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Avatar name={uploader.name} src={uploader.avatar_url} size={18} />
          taken by {uploader.name}
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-saigon/10 px-2 py-1.5 text-center text-[12px] text-saigon">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
