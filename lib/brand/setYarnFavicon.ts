import { YARN_BRAND } from '@/lib/brand/yarn';
import { yarnIconSvg } from '@/lib/brand/yarn-icon';

const FAVICON_ID = 'yarn-dynamic-favicon';

/** Swap the browser tab icon to a themed yarn-ball SVG. */
export function setYarnFavicon(color: string = YARN_BRAND.colors.gold) {
  if (typeof document === 'undefined') return;

  const href = `data:image/svg+xml,${encodeURIComponent(yarnIconSvg(color))}`;

  let link = document.getElementById(FAVICON_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = FAVICON_ID;
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.head.appendChild(link);
  }
  link.href = href;
}

export const YARN_DEFAULT_ACCENT = YARN_BRAND.colors.gold;
