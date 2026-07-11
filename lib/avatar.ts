// Deterministic avatar color + initial from a person's name, so the same
// person always renders the same swatch across the app.
const HUES = [35, 95, 155, 230, 320, 15, 265, 190];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = HUES[hash % HUES.length];
  return `oklch(58% 0.12 ${hue})`;
}

export function initialOf(name: string): string {
  return (name.trim()[0] || '?').toUpperCase();
}
