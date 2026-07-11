'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useTripData } from '../TripDataProvider';

// Flow B: one-card, one-photo Polaroid frame. Blank → a dashed camera-capture
// canvas. Loaded → a 1:1 image inside the white border with a handwritten
// caption. Re-uploading overwrites the single photo for this card.
export default function Polaroid({
  activityId,
  photoUrl,
  caption,
}: {
  activityId: string;
  photoUrl: string | null;
  caption: string;
}) {
  const { setPhoto } = useTripData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setBusy(true);
    try {
      await setPhoto(activityId, file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-[4px] bg-white p-2 pb-3 shadow-polaroid [transform:rotate(-1deg)]">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="relative block aspect-square w-full overflow-hidden rounded-[2px]"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={caption} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-black/15 bg-cream text-muted">
            <Camera size={26} />
            <span className="text-sm">📸 Add Memory</span>
          </span>
        )}

        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 size={22} className="animate-spin text-ink" />
          </span>
        )}
      </button>

      <p className="mt-2 text-center font-hand text-[19px] leading-none text-ink">
        {caption}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
