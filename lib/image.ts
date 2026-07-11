import imageCompression from 'browser-image-compression';

// Every photo passes through here before upload: capped at 1200px on the long
// edge and re-encoded as WebP so a 5–10MB camera shot lands around 100–300KB.
// Keeps the free-tier 1GB storage bucket viable for a whole trip of uploads.
const MAX_DIMENSION = 1200;

export async function compressToWebp(file: File): Promise<File> {
  try {
    const blob = await imageCompression(file, {
      maxWidthOrHeight: MAX_DIMENSION,
      maxSizeMB: 0.4,
      fileType: 'image/webp',
      useWebWorker: true,
      initialQuality: 0.82,
    });
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } catch {
    // Compression can fail on exotic formats/old browsers — upload the
    // original rather than losing the memory.
    return file;
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Strip the data-url prefix so the raw base64 can be sent to the Gemini API.
export function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [head, base64] = dataUrl.split(',');
  const mimeType = head.match(/data:(.*?);/)?.[1] ?? 'image/webp';
  return { base64, mimeType };
}

// Save a photo to the device. On mobile the share sheet (→ "Save Image") is
// the only way into the camera roll from a PWA; elsewhere fall back to a
// regular file download.
export async function savePhoto(url: string, filename = 'memory.webp'): Promise<void> {
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: blob.type || 'image/webp' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // user closed the sheet
      // otherwise fall through to download
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}
