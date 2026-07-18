// Small, crisp SVG flags (reliable across platforms, unlike emoji flags).
// Same shell as the original Thai / Vietnam marks: 60×40 viewBox, soft radius + hairline shadow.

import type { ReactNode } from 'react';
import type { CountryName } from '@/lib/countries';
import { normalizeCountryName } from '@/lib/countries';

const FLAG_CLASS = 'rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]';

function FlagShell({
  size = 30,
  label,
  children,
}: {
  size?: number;
  label: string;
  children: ReactNode;
}) {
  const h = (size * 2) / 3;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 40"
      className={FLAG_CLASS}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}

const FLAG_ART: Record<CountryName, ReactNode> = {
  "France": (
    <>
      <rect width="20" height="40" fill="#002395" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#ED2939" />
    </>
  ),
  "Italy": (
    <>
      <rect width="20" height="40" fill="#009246" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#CE2B37" />
    </>
  ),
  "Spain": (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  ),
  "United Kingdom": (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
      <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="6" />
    </>
  ),
  "Greece": (
    <>
      <rect width="60" height="40" fill="#0D5EAF" />
      <rect y="4.44" width="60" height="4.44" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="4.44" fill="#FFFFFF" />
      <rect y="22.22" width="60" height="4.44" fill="#FFFFFF" />
      <rect y="31.11" width="60" height="4.44" fill="#FFFFFF" />
      <rect width="24" height="22.22" fill="#0D5EAF" />
      <rect x="9.6" width="4.8" height="22.22" fill="#FFFFFF" />
      <rect y="8.89" width="24" height="4.44" fill="#FFFFFF" />
    </>
  ),
  "Egypt": (
    <>
      <rect width="60" height="13.33" fill="#CE1126" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#000000" />
      <circle cx="30" cy="20" r="4" fill="#C09300" />
    </>
  ),
  "Japan": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="10" fill="#BC002D" />
    </>
  ),
  "China": (
    <>
      <rect width="60" height="40" fill="#DE2910" />
      <path d="M12,8 L13.2,11.6 L17,11.6 L14,13.9 L15.2,17.5 L12,15.2 L8.8,17.5 L10,13.9 L7,11.6 L10.8,11.6 Z" fill="#FFDE00" />
      <path d="M22,4 L22.5,5.5 L24,5.5 L22.8,6.4 L23.3,7.9 L22,7 L20.7,7.9 L21.2,6.4 L20,5.5 L21.5,5.5 Z" fill="#FFDE00" />
      <path d="M25,9 L25.5,10.5 L27,10.5 L25.8,11.4 L26.3,12.9 L25,12 L23.7,12.9 L24.2,11.4 L23,10.5 L24.5,10.5 Z" fill="#FFDE00" />
      <path d="M25,15 L25.5,16.5 L27,16.5 L25.8,17.4 L26.3,18.9 L25,18 L23.7,18.9 L24.2,17.4 L23,16.5 L24.5,16.5 Z" fill="#FFDE00" />
      <path d="M22,20 L22.5,21.5 L24,21.5 L22.8,22.4 L23.3,23.9 L22,23 L20.7,23.9 L21.2,22.4 L20,21.5 L21.5,21.5 Z" fill="#FFDE00" />
    </>
  ),
  "India": (
    <>
      <rect width="60" height="13.33" fill="#FF9933" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#138808" />
      <circle cx="30" cy="20" r="5" fill="none" stroke="#000080" strokeWidth="1.2" />
      <circle cx="30" cy="20" r="1.2" fill="#000080" />
    </>
  ),
  "Peru": (
    <>
      <rect width="20" height="40" fill="#D91023" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#D91023" />
    </>
  ),
  "Jordan": (
    <>
      <rect width="60" height="13.33" fill="#000000" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#007A3D" />
      <path d="M0,0 L26,20 L0,40 Z" fill="#CE1126" />
      <path d="M9,16 L10.2,19.5 L14,19.5 L11,21.7 L12.2,25.2 L9,23 L5.8,25.2 L7,21.7 L4,19.5 L7.8,19.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Cambodia": (
    <>
      <rect width="60" height="10" fill="#032EA1" />
      <rect y="10" width="60" height="20" fill="#E00025" />
      <rect y="30" width="60" height="10" fill="#032EA1" />
      <path d="M22,26 L24,20 L27,24 L30,16 L33,24 L36,20 L38,26 Z" fill="#FFFFFF" />
    </>
  ),
  "Uzbekistan": (
    <>
      <rect width="60" height="13.33" fill="#1EB53A" />
      <rect y="13.33" width="60" height="2" fill="#CE1126" />
      <rect y="15.33" width="60" height="9.34" fill="#FFFFFF" />
      <rect y="24.67" width="60" height="2" fill="#CE1126" />
      <rect y="26.67" width="60" height="13.33" fill="#0099B5" />
      <circle cx="12" cy="7" r="3.5" fill="#FFFFFF" />
      <circle cx="13.5" cy="7" r="3" fill="#1EB53A" />
    </>
  ),
  "Mexico": (
    <>
      <rect width="20" height="40" fill="#006847" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#CE1126" />
      <circle cx="30" cy="20" r="4" fill="#8B4513" />
    </>
  ),
  "Thailand": (
    <>
      <rect width="60" height="40" fill="#A51931" />
      <rect y="6.67" width="60" height="26.67" fill="#F4F5F8" />
      <rect y="13.33" width="60" height="13.33" fill="#2D2A4A" />
    </>
  ),
  "Indonesia": (
    <>
      <rect width="60" height="20" fill="#FF0000" />
      <rect y="20" width="60" height="20" fill="#FFFFFF" />
    </>
  ),
  "The Maldives": (
    <>
      <rect width="60" height="40" fill="#D21034" />
      <rect x="10" y="8" width="40" height="24" fill="#007E3A" />
      <circle cx="32" cy="20" r="8" fill="#FFFFFF" />
      <circle cx="35" cy="20" r="6.5" fill="#007E3A" />
    </>
  ),
  "The Philippines": (
    <>
      <rect width="60" height="20" fill="#0038A8" />
      <rect y="20" width="60" height="20" fill="#CE1126" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#FFFFFF" />
      <circle cx="12" cy="20" r="4" fill="#FCD116" />
    </>
  ),
  "Fiji": (
    <>
      <rect width="60" height="40" fill="#68BFE5" />
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="2.4" />
      <circle cx="42" cy="24" r="7" fill="#FFFFFF" stroke="#CE1126" strokeWidth="1.5" />
    </>
  ),
  "Mauritius": (
    <>
      <rect width="60" height="10" fill="#EA281F" />
      <rect y="10" width="60" height="10" fill="#1A3A6D" />
      <rect y="20" width="60" height="10" fill="#FFD500" />
      <rect y="30" width="60" height="10" fill="#00A551" />
    </>
  ),
  "Bahamas": (
    <>
      <rect width="60" height="13.33" fill="#00ABC9" />
      <rect y="13.33" width="60" height="13.33" fill="#FAE042" />
      <rect y="26.67" width="60" height="13.33" fill="#00ABC9" />
      <path d="M0,0 L26,20 L0,40 Z" fill="#000000" />
    </>
  ),
  "St. Lucia": (
    <>
      <rect width="60" height="40" fill="#66CCFF" />
      <path d="M30,4 L48,36 H12 Z" fill="#FFFFFF" />
      <path d="M30,10 L43,36 H17 Z" fill="#000000" />
      <path d="M30,22 L38,36 H22 Z" fill="#FCD116" />
    </>
  ),
  "Croatia": (
    <>
      <rect width="60" height="13.33" fill="#FF0000" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#171796" />
      <rect x="24" y="12" width="12" height="12" fill="#FFFFFF" stroke="#171796" strokeWidth="0.8" />
      <path d="M24,12 h3 v3 h-3 z M30,12 h3 v3 h-3 z M27,15 h3 v3 h-3 z M24,18 h3 v3 h-3 z M30,18 h3 v3 h-3 z" fill="#FF0000" />
    </>
  ),
  "Seychelles": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#003F87" />
      <path d="M0,0 L60,0 L60,13.33 L0,40 Z" fill="#FCD856" />
      <path d="M0,0 L60,13.33 L60,26.67 L0,40 Z" fill="#D62828" />
      <path d="M0,0 L60,26.67 L60,40 L0,40 Z" fill="#FFFFFF" />
      <path d="M0,13 L60,40 H0 Z" fill="#007A3D" />
    </>
  ),
  "Portugal": (
    <>
      <rect width="24" height="40" fill="#006600" />
      <rect x="24" width="36" height="40" fill="#FF0000" />
      <circle cx="24" cy="20" r="7" fill="#FFCC00" stroke="#FFFFFF" strokeWidth="1.2" />
    </>
  ),
  "Canada": (
    <>
      <rect width="15" height="40" fill="#FF0000" />
      <rect x="15" width="30" height="40" fill="#FFFFFF" />
      <rect x="45" width="15" height="40" fill="#FF0000" />
      <path d="M30,8 L32,16 L40,14 L34,20 L38,28 L30,23 L22,28 L26,20 L20,14 L28,16 Z" fill="#FF0000" />
    </>
  ),
  "New Zealand": (
    <>
      <rect width="60" height="40" fill="#00247D" />
      <rect width="30" height="20" fill="#00247D" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="2.4" />
      <path d="M42,10 L43,13 L46,13 L43.5,15 L44.5,18 L42,16 L39.5,18 L40.5,15 L38,13 L41,13 Z" fill="#FFFFFF" />
      <path d="M48,16 L48.7,18 L51,18 L49.2,19.3 L49.9,21.3 L48,20 L46.1,21.3 L46.8,19.3 L45,18 L47.3,18 Z" fill="#FFFFFF" />
      <path d="M45,22 L45.7,24 L48,24 L46.2,25.3 L46.9,27.3 L45,26 L43.1,27.3 L43.8,25.3 L42,24 L44.3,24 Z" fill="#FFFFFF" />
      <path d="M50,26 L50.5,27.5 L52,27.5 L50.8,28.4 L51.3,29.9 L50,29 L48.7,29.9 L49.2,28.4 L48,27.5 L49.5,27.5 Z" fill="#FFFFFF" />
    </>
  ),
  "South Africa": (
    <>
      <rect width="60" height="20" fill="#DE3831" />
      <rect y="20" width="60" height="20" fill="#002395" />
      <path d="M0,0 L24,20 L0,40 Z" fill="#000000" />
      <path d="M0,5 L20,20 L0,35 Z" fill="#007A4D" />
      <path d="M0,0 L28,20 L60,20 L60,14 L32,14 L10,0 Z" fill="#FFFFFF" />
      <path d="M0,40 L28,20 L60,20 L60,26 L32,26 L10,40 Z" fill="#FFFFFF" />
      <path d="M32,14 H60 V26 H32 L28,20 Z" fill="#FFB612" />
    </>
  ),
  "Iceland": (
    <>
      <rect width="60" height="40" fill="#02529C" />
      <rect x="16" width="8" height="40" fill="#FFFFFF" />
      <rect y="16" width="60" height="8" fill="#FFFFFF" />
      <rect x="18" width="4" height="40" fill="#DC1E35" />
      <rect y="18" width="60" height="4" fill="#DC1E35" />
    </>
  ),
  "Switzerland": (
    <>
      <rect width="60" height="40" fill="#FF0000" />
      <rect x="25" y="10" width="10" height="20" fill="#FFFFFF" />
      <rect x="20" y="15" width="20" height="10" fill="#FFFFFF" />
    </>
  ),
  "Costa Rica": (
    <>
      <rect width="60" height="6.67" fill="#002B7F" />
      <rect y="6.67" width="60" height="6.67" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.34" fill="#CE1126" />
      <rect y="26.67" width="60" height="6.67" fill="#FFFFFF" />
      <rect y="33.33" width="60" height="6.67" fill="#002B7F" />
    </>
  ),
  "Norway": (
    <>
      <rect width="60" height="40" fill="#BA0C2F" />
      <rect x="16" width="8" height="40" fill="#FFFFFF" />
      <rect y="16" width="60" height="8" fill="#FFFFFF" />
      <rect x="18" width="4" height="40" fill="#00205B" />
      <rect y="18" width="60" height="4" fill="#00205B" />
    </>
  ),
  "Tanzania": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#1EB53A" />
      <path d="M60,0 V40 H0 Z" fill="#00A3DD" />
      <path d="M0,32 L52,0 H60 L0,40 Z" fill="#FCD116" />
      <path d="M0,36 L56,0 H60 L8,40 H0 Z" fill="#000000" />
    </>
  ),
  "Nepal": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <path d="M8,4 H40 L20,20 H42 L8,36 Z" fill="#DC143C" stroke="#003893" strokeWidth="2" />
      <circle cx="18" cy="12" r="3" fill="#FFFFFF" />
      <path d="M16,28 L18,24 L20,28 Z" fill="#FFFFFF" />
    </>
  ),
  "Argentina": (
    <>
      <rect width="60" height="13.33" fill="#74ACDF" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#74ACDF" />
      <circle cx="30" cy="20" r="4.5" fill="#F6B40E" />
    </>
  ),
  "Colombia": (
    <>
      <rect width="60" height="20" fill="#FCD116" />
      <rect y="20" width="60" height="10" fill="#003893" />
      <rect y="30" width="60" height="10" fill="#CE1126" />
    </>
  ),
  "Kyrgyzstan": (
    <>
      <rect width="60" height="40" fill="#E8112D" />
      <circle cx="30" cy="20" r="9" fill="#FFEF00" />
      <circle cx="30" cy="20" r="5" fill="none" stroke="#E8112D" strokeWidth="1.5" />
      <path d="M30,11 V29 M21,20 H39 M23.5,13.5 L36.5,26.5 M36.5,13.5 L23.5,26.5" stroke="#E8112D" strokeWidth="1" />
    </>
  ),
  "Chile": (
    <>
      <rect width="60" height="20" fill="#FFFFFF" />
      <rect y="20" width="60" height="20" fill="#D52B1E" />
      <rect width="20" height="20" fill="#0039A6" />
      <path d="M10,5 L11.2,8.5 L15,8.5 L12,10.7 L13.2,14.2 L10,12 L6.8,14.2 L8,10.7 L5,8.5 L8.8,8.5 Z" fill="#FFFFFF" />
    </>
  ),
  "United States": (
    <>
      <rect width="60" height="40" fill="#B22234" />
      <rect y="3.08" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="9.23" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="15.38" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="21.54" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="27.69" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="33.85" width="60" height="3.08" fill="#FFFFFF" />
      <rect width="24" height="21.54" fill="#3C3B6E" />
    </>
  ),
  "United Arab Emirates": (
    <>
      <rect width="60" height="13.33" fill="#00732F" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#000000" />
      <rect width="15" height="40" fill="#FF0000" />
    </>
  ),
  "Singapore": (
    <>
      <rect width="60" height="20" fill="#EF3340" />
      <rect y="20" width="60" height="20" fill="#FFFFFF" />
      <circle cx="14" cy="10" r="5" fill="#FFFFFF" />
      <circle cx="16" cy="10" r="4" fill="#EF3340" />
      <path d="M24,5 L24.7,7 L27,7 L25.2,8.3 L25.9,10.3 L24,9 L22.1,10.3 L22.8,8.3 L21,7 L23.3,7 Z" fill="#FFFFFF" />
      <path d="M28,8 L28.5,9.5 L30,9.5 L28.8,10.4 L29.3,11.9 L28,11 L26.7,11.9 L27.2,10.4 L26,9.5 L27.5,9.5 Z" fill="#FFFFFF" />
      <path d="M30,12 L30.5,13.5 L32,13.5 L30.8,14.4 L31.3,15.9 L30,15 L28.7,15.9 L29.2,14.4 L28,13.5 L29.5,13.5 Z" fill="#FFFFFF" />
      <path d="M26,14 L26.5,15.5 L28,15.5 L26.8,16.4 L27.3,17.9 L26,17 L24.7,17.9 L25.2,16.4 L24,15.5 L25.5,15.5 Z" fill="#FFFFFF" />
      <path d="M22,12 L22.5,13.5 L24,13.5 L22.8,14.4 L23.3,15.9 L22,15 L20.7,15.9 L21.2,14.4 L20,13.5 L21.5,13.5 Z" fill="#FFFFFF" />
    </>
  ),
  "South Korea": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="9" fill="#CD2E3A" />
      <path d="M21,20 A9,9 0 0,1 39,20 A4.5,4.5 0 0,1 30,20 A4.5,4.5 0 0,0 21,20" fill="#0047A0" />
      <rect x="8" y="8" width="10" height="2.2" transform="rotate(-35 13 9)" fill="#000000" />
      <rect x="8" y="12" width="10" height="2.2" transform="rotate(-35 13 13)" fill="#000000" />
      <rect x="42" y="8" width="10" height="2.2" transform="rotate(35 47 9)" fill="#000000" />
      <rect x="42" y="12" width="10" height="2.2" transform="rotate(35 47 13)" fill="#000000" />
      <rect x="8" y="26" width="10" height="2.2" transform="rotate(35 13 27)" fill="#000000" />
      <rect x="8" y="30" width="10" height="2.2" transform="rotate(35 13 31)" fill="#000000" />
      <rect x="42" y="26" width="10" height="2.2" transform="rotate(-35 47 27)" fill="#000000" />
      <rect x="42" y="30" width="10" height="2.2" transform="rotate(-35 47 31)" fill="#000000" />
    </>
  ),
  "Australia": (
    <>
      <rect width="60" height="40" fill="#00008B" />
      <rect width="30" height="20" fill="#00008B" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="3.5" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="5" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="2.4" />
      <path d="M42,12 L43,15 L46,15 L43.5,17 L44.5,20 L42,18 L39.5,20 L40.5,17 L38,15 L41,15 Z" fill="#FFFFFF" />
      <path d="M50,18 L50.7,20 L53,20 L51.2,21.3 L51.9,23.3 L50,22 L48.1,23.3 L48.8,21.3 L47,20 L49.3,20 Z" fill="#FFFFFF" />
      <path d="M46,24 L46.7,26 L49,26 L47.2,27.3 L47.9,29.3 L46,28 L44.1,29.3 L44.8,27.3 L43,26 L45.3,26 Z" fill="#FFFFFF" />
      <path d="M38,22 L38.5,23.5 L40,23.5 L38.8,24.4 L39.3,25.9 L38,25 L36.7,25.9 L37.2,24.4 L36,23.5 L37.5,23.5 Z" fill="#FFFFFF" />
      <path d="M52,28 L52.5,29.5 L54,29.5 L52.8,30.4 L53.3,31.9 L52,31 L50.7,31.9 L51.2,30.4 L50,29.5 L51.5,29.5 Z" fill="#FFFFFF" />
      <circle cx="42" cy="32" r="2" fill="#FFFFFF" />
    </>
  ),
  "Hong Kong": (
    <>
      <rect width="60" height="40" fill="#DE2910" />
      <path d="M30,12 C26,14 24,18 26,22 C28,18 32,18 34,22 C36,18 34,14 30,12 Z" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="2" fill="#DE2910" />
      <path d="M22,18 C20,20 20,24 23,26 C22,23 24,21 27,22 C24,20 22,18 22,18 Z" fill="#FFFFFF" />
      <path d="M38,18 C40,20 40,24 37,26 C38,23 36,21 33,22 C36,20 38,18 38,18 Z" fill="#FFFFFF" />
      <path d="M24,28 C26,30 30,30 32,28 C28,29 26,27 26,24 C25,27 24,28 24,28 Z" fill="#FFFFFF" />
      <path d="M36,28 C34,30 30,30 28,28 C32,29 34,27 34,24 C35,27 36,28 36,28 Z" fill="#FFFFFF" />
    </>
  ),
  "Qatar": (
    <>
      <rect width="60" height="40" fill="#8D1B3D" />
      <path d="M0,0 H18 L12,5 L18,10 L12,15 L18,20 L12,25 L18,30 L12,35 L18,40 H0 Z" fill="#FFFFFF" />
    </>
  ),
  "Vietnam": (
    <>
      <rect width="60" height="40" fill="#DA251D" />
      <path d="M30,9 L32.47,16.6 L40.46,16.6 L33.99,21.3 L36.47,28.9 L30,24.2 L23.53,28.9 L26.01,21.3 L19.54,16.6 L27.53,16.6 Z" fill="#FFFF00" />
    </>
  ),
  "Turkey": (
    <>
      <rect width="60" height="40" fill="#E30A17" />
      <circle cx="24" cy="20" r="9" fill="#FFFFFF" />
      <circle cx="27" cy="20" r="7" fill="#E30A17" />
      <path d="M32,14 L34.2,18.5 L39,18.5 L35.2,21.3 L36.6,26 L32,23 L27.4,26 L28.8,21.3 L25,18.5 L29.8,18.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Morocco": (
    <>
      <rect width="60" height="40" fill="#C1272D" />
      <path d="M30,10 L32.5,17.5 L40.5,17.5 L34,22.2 L36.5,29.7 L30,25 L23.5,29.7 L26,22.2 L19.5,17.5 L27.5,17.5 Z" fill="none" stroke="#006233" strokeWidth="2.2" />
    </>
  ),
  "Albania": (
    <>
      <rect width="60" height="40" fill="#E41E20" />
      <path d="M30,6 C22,12 20,18 22,26 C26,20 34,20 38,26 C40,18 38,12 30,6 Z" fill="#000000" />
      <path d="M24,16 L20,14 M36,16 L40,14 M22,22 L18,24 M38,22 L42,24" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "Saudi Arabia": (
    <>
      <rect width="60" height="40" fill="#006C35" />
      <path d="M12,14 H48 M14,18 H46 M16,22 H36" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38,24 H48 V30 H38 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
      <path d="M14,28 H34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  "Germany": (
    <>
      <rect width="60" height="13.33" fill="#000000" />
      <rect y="13.33" width="60" height="13.33" fill="#DD0000" />
      <rect y="26.67" width="60" height="13.33" fill="#FFCE00" />
    </>
  ),
  "Austria": (
    <>
      <rect width="60" height="13.33" fill="#ED2939" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#ED2939" />
    </>
  ),
  "Malaysia": (
    <>
      <rect width="60" height="40" fill="#CC0001" />
      <rect y="3.08" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="9.23" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="15.38" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="21.54" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="27.69" width="60" height="3.08" fill="#FFFFFF" />
      <rect y="33.85" width="60" height="3.08" fill="#FFFFFF" />
      <rect width="30" height="20" fill="#010066" />
      <circle cx="15" cy="10" r="6" fill="#FFCC00" />
      <circle cx="17" cy="10" r="5" fill="#010066" />
      <path d="M22,6 L23,9 L26,9 L23.5,11 L24.5,14 L22,12 L19.5,14 L20.5,11 L18,9 L21,9 Z" fill="#FFCC00" />
    </>
  ),
  "Netherlands": (
    <>
      <rect width="60" height="13.33" fill="#AE1C28" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#21468B" />
    </>
  ),
  "Poland": (
    <>
      <rect width="60" height="20" fill="#FFFFFF" />
      <rect y="20" width="60" height="20" fill="#DC143C" />
    </>
  ),
  "Hungary": (
    <>
      <rect width="60" height="13.33" fill="#CE2939" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#477050" />
    </>
  ),
  "Czechia": (
    <>
      <rect width="60" height="20" fill="#FFFFFF" />
      <rect y="20" width="60" height="20" fill="#D7141A" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#11457E" />
    </>
  ),
  "Belgium": (
    <>
      <rect width="20" height="40" fill="#000000" />
      <rect x="20" width="20" height="40" fill="#FDDA24" />
      <rect x="40" width="20" height="40" fill="#EF3340" />
    </>
  ),
  "Ireland": (
    <>
      <rect width="20" height="40" fill="#169B62" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#FF883E" />
    </>
  ),
  "Denmark": (
    <>
      <rect width="60" height="40" fill="#C8102E" />
      <rect x="18" width="6" height="40" fill="#FFFFFF" />
      <rect y="17" width="60" height="6" fill="#FFFFFF" />
    </>
  ),
  "Sweden": (
    <>
      <rect width="60" height="40" fill="#006AA7" />
      <rect x="18" width="6" height="40" fill="#FECC00" />
      <rect y="17" width="60" height="6" fill="#FECC00" />
    </>
  ),
  "Finland": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <rect x="18" width="6" height="40" fill="#003580" />
      <rect y="17" width="60" height="6" fill="#003580" />
    </>
  ),
  "Brazil": (
    <>
      <rect width="60" height="40" fill="#009C3B" />
      <path d="M30,4 L54,20 L30,36 L6,20 Z" fill="#FFDF00" />
      <circle cx="30" cy="20" r="8" fill="#002776" />
    </>
  ),
  "Taiwan": (
    <>
      <rect width="60" height="40" fill="#FE0000" />
      <rect width="30" height="20" fill="#000095" />
      <circle cx="15" cy="10" r="6" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="3.5" fill="#000095" />
      <circle cx="15" cy="10" r="2" fill="#FFFFFF" />
    </>
  ),
  "Bahrain": (
    <>
      <rect width="60" height="40" fill="#CE1126" />
      <path d="M0,0 H22 L16,5 L22,10 L16,15 L22,20 L16,25 L22,30 L16,35 L22,40 H0 Z" fill="#FFFFFF" />
    </>
  ),
  "Romania": (
    <>
      <rect width="20" height="40" fill="#002B7F" />
      <rect x="20" width="20" height="40" fill="#FCD116" />
      <rect x="40" width="20" height="40" fill="#CE1126" />
    </>
  ),
  "Bulgaria": (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.33" fill="#00966E" />
      <rect y="26.67" width="60" height="13.33" fill="#D62612" />
    </>
  ),
  "Ukraine": (
    <>
      <rect width="60" height="20" fill="#0057B7" />
      <rect y="20" width="60" height="20" fill="#FFD700" />
    </>
  ),
  "Tunisia": (
    <>
      <rect width="60" height="40" fill="#E70013" />
      <circle cx="30" cy="20" r="10" fill="#FFFFFF" />
      <circle cx="33" cy="20" r="8" fill="#E70013" />
      <path d="M36,14 L37.5,18 L41.5,18 L38.3,20.5 L39.5,24.5 L36,22 L32.5,24.5 L33.7,20.5 L30.5,18 L34.5,18 Z" fill="#E70013" />
    </>
  ),
  "Israel": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <rect y="4" width="60" height="5" fill="#0038B8" />
      <rect y="31" width="60" height="5" fill="#0038B8" />
      <path d="M30,12 L34,24 H26 Z" fill="none" stroke="#0038B8" strokeWidth="1.6" />
      <path d="M30,28 L26,16 H34 Z" fill="none" stroke="#0038B8" strokeWidth="1.6" />
    </>
  ),
  "Oman": (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.33" fill="#DB161B" />
      <rect y="26.67" width="60" height="13.33" fill="#008000" />
      <rect width="15" height="40" fill="#DB161B" />
    </>
  ),
  "Georgia": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <rect x="26" width="8" height="40" fill="#FF0000" />
      <rect y="16" width="60" height="8" fill="#FF0000" />
      <path d="M10,6 h6 v2 h-2 v4 h-2 v-4 h-2 z M44,6 h6 v2 h-2 v4 h-2 v-4 h-2 z M10,28 h6 v2 h-2 v4 h-2 v-4 h-2 z M44,28 h6 v2 h-2 v4 h-2 v-4 h-2 z" fill="#FF0000" />
    </>
  ),
  "Armenia": (
    <>
      <rect width="60" height="13.33" fill="#D90012" />
      <rect y="13.33" width="60" height="13.33" fill="#0033A0" />
      <rect y="26.67" width="60" height="13.33" fill="#F2A800" />
    </>
  ),
  "Azerbaijan": (
    <>
      <rect width="60" height="13.33" fill="#00B5E2" />
      <rect y="13.33" width="60" height="13.33" fill="#EF3340" />
      <rect y="26.67" width="60" height="13.33" fill="#509E2F" />
      <circle cx="28" cy="20" r="5" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="4" fill="#EF3340" />
      <path d="M34,16 L35,18.5 L37.5,18.5 L35.5,20 L36.2,22.5 L34,21 L31.8,22.5 L32.5,20 L30.5,18.5 L33,18.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Kazakhstan": (
    <>
      <rect width="60" height="40" fill="#00AFCA" />
      <path d="M8,6 V34" stroke="#FAC704" strokeWidth="3" />
      <circle cx="34" cy="16" r="7" fill="#FAC704" />
      <path d="M22,28 Q34,20 46,28 Q34,24 22,28 Z" fill="#FAC704" />
    </>
  ),
  "Mongolia": (
    <>
      <rect width="20" height="40" fill="#C4272F" />
      <rect x="20" width="20" height="40" fill="#015197" />
      <rect x="40" width="20" height="40" fill="#C4272F" />
      <circle cx="30" cy="12" r="4" fill="#F9CF02" />
      <rect x="28" y="18" width="4" height="12" fill="#F9CF02" />
    </>
  ),
  "Sri Lanka": (
    <>
      <rect width="10" height="40" fill="#FFBE29" />
      <rect x="10" width="10" height="40" fill="#00534E" />
      <rect x="20" width="40" height="40" fill="#8D153A" />
      <circle cx="40" cy="20" r="8" fill="#FFBE29" />
    </>
  ),
  "Laos": (
    <>
      <rect width="60" height="10" fill="#CE1126" />
      <rect y="10" width="60" height="20" fill="#002868" />
      <rect y="30" width="60" height="10" fill="#CE1126" />
      <circle cx="30" cy="20" r="7" fill="#FFFFFF" />
    </>
  ),
  "Myanmar": (
    <>
      <rect width="60" height="13.33" fill="#FECB00" />
      <rect y="13.33" width="60" height="13.33" fill="#34B233" />
      <rect y="26.67" width="60" height="13.33" fill="#EA2839" />
      <path d="M30,10 L33,19 L42,19 L35,25 L37.5,34 L30,28 L22.5,34 L25,25 L18,19 L27,19 Z" fill="#FFFFFF" />
    </>
  ),
  "Dominican Republic": (
    <>
      <rect width="30" height="20" fill="#002D62" />
      <rect x="30" width="30" height="20" fill="#CE1126" />
      <rect y="20" width="30" height="20" fill="#CE1126" />
      <rect x="30" y="20" width="30" height="20" fill="#002D62" />
      <rect x="26" width="8" height="40" fill="#FFFFFF" />
      <rect y="16" width="60" height="8" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="3.5" fill="#006600" />
    </>
  ),
  "Cuba": (
    <>
      <rect width="60" height="8" fill="#002A8F" />
      <rect y="8" width="60" height="8" fill="#FFFFFF" />
      <rect y="16" width="60" height="8" fill="#002A8F" />
      <rect y="24" width="60" height="8" fill="#FFFFFF" />
      <rect y="32" width="60" height="8" fill="#002A8F" />
      <path d="M0,0 L26,20 L0,40 Z" fill="#CF142B" />
      <path d="M9,14 L10.5,18 L14.5,18 L11.3,20.5 L12.5,24.5 L9,22 L5.5,24.5 L6.7,20.5 L3.5,18 L7.5,18 Z" fill="#FFFFFF" />
    </>
  ),
  "Jamaica": (
    <>
      <path d="M0,0 H60 L30,20 Z" fill="#009B3A" />
      <path d="M0,40 H60 L30,20 Z" fill="#009B3A" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#000000" />
      <path d="M60,0 L30,20 L60,40 Z" fill="#000000" />
      <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FED100" strokeWidth="6" />
    </>
  ),
  "Panama": (
    <>
      <rect width="30" height="20" fill="#FFFFFF" />
      <rect x="30" width="30" height="20" fill="#DA121A" />
      <rect y="20" width="30" height="20" fill="#072357" />
      <rect x="30" y="20" width="30" height="20" fill="#FFFFFF" />
      <path d="M15,6 L16.2,9.5 L20,9.5 L17,11.7 L18.2,15.2 L15,13 L11.8,15.2 L13,11.7 L10,9.5 L13.8,9.5 Z" fill="#072357" />
      <path d="M45,26 L46.2,29.5 L50,29.5 L47,31.7 L48.2,35.2 L45,33 L41.8,35.2 L43,31.7 L40,29.5 L43.8,29.5 Z" fill="#DA121A" />
    </>
  ),
  "Guatemala": (
    <>
      <rect width="20" height="40" fill="#4997D0" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#4997D0" />
      <circle cx="30" cy="20" r="5" fill="#6B8E23" />
    </>
  ),
  "Ecuador": (
    <>
      <rect width="60" height="20" fill="#FFDD00" />
      <rect y="20" width="60" height="10" fill="#034EA2" />
      <rect y="30" width="60" height="10" fill="#ED1C24" />
      <circle cx="30" cy="18" r="5" fill="#8B4513" />
    </>
  ),
  "Bolivia": (
    <>
      <rect width="60" height="13.33" fill="#D52B1E" />
      <rect y="13.33" width="60" height="13.33" fill="#FCE300" />
      <rect y="26.67" width="60" height="13.33" fill="#007934" />
    </>
  ),
  "Uruguay": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <rect y="4.44" width="60" height="4.44" fill="#0038A8" />
      <rect y="13.33" width="60" height="4.44" fill="#0038A8" />
      <rect y="22.22" width="60" height="4.44" fill="#0038A8" />
      <rect y="31.11" width="60" height="4.44" fill="#0038A8" />
      <rect width="24" height="22.22" fill="#FFFFFF" />
      <circle cx="12" cy="11" r="5" fill="#FCD116" />
    </>
  ),
  "Kenya": (
    <>
      <rect width="60" height="12" fill="#000000" />
      <rect y="12" width="60" height="2" fill="#FFFFFF" />
      <rect y="14" width="60" height="12" fill="#BB0000" />
      <rect y="26" width="60" height="2" fill="#FFFFFF" />
      <rect y="28" width="60" height="12" fill="#006600" />
      <ellipse cx="30" cy="20" rx="8" ry="10" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
      <ellipse cx="30" cy="20" rx="3" ry="8" fill="#BB0000" />
    </>
  ),
  "Ethiopia": (
    <>
      <rect width="60" height="13.33" fill="#078930" />
      <rect y="13.33" width="60" height="13.33" fill="#FCDD09" />
      <rect y="26.67" width="60" height="13.33" fill="#DA121A" />
      <circle cx="30" cy="20" r="8" fill="#0F47AF" />
      <path d="M30,14 L31.5,18.5 L36,18.5 L32.5,21 L33.8,25.5 L30,22.5 L26.2,25.5 L27.5,21 L24,18.5 L28.5,18.5 Z" fill="#FCDD09" />
    </>
  ),
  "Ghana": (
    <>
      <rect width="60" height="13.33" fill="#CE1126" />
      <rect y="13.33" width="60" height="13.33" fill="#FCD116" />
      <rect y="26.67" width="60" height="13.33" fill="#006B3F" />
      <path d="M30,15 L31.5,19.5 L36,19.5 L32.5,22 L33.8,26.5 L30,23.5 L26.2,26.5 L27.5,22 L24,19.5 L28.5,19.5 Z" fill="#000000" />
    </>
  ),
  "Malta": (
    <>
      <rect width="30" height="40" fill="#FFFFFF" />
      <rect x="30" width="30" height="40" fill="#CF142B" />
      <rect x="6" y="8" width="8" height="8" fill="none" stroke="#CCCCCC" strokeWidth="1.5" />
    </>
  ),
  "Cyprus": (
    <>
      <rect width="60" height="40" fill="#FFFFFF" />
      <path d="M22,14 L28,12 L34,14 L38,18 L36,24 L30,26 L24,24 L20,18 Z" fill="#D4762C" />
      <path d="M24,28 Q30,32 36,28" fill="none" stroke="#4E5B31" strokeWidth="2" />
    </>
  ),
  "Slovakia": (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.33" fill="#0B4EA2" />
      <rect y="26.67" width="60" height="13.33" fill="#EE1C25" />
      <path d="M14,10 L14,28 L22,24 L14,20 Z" fill="#FFFFFF" stroke="#0B4EA2" strokeWidth="0.8" />
    </>
  ),
  "Slovenia": (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.33" fill="#0000FF" />
      <rect y="26.67" width="60" height="13.33" fill="#FF0000" />
      <path d="M12,8 L18,18 L6,18 Z" fill="#0000FF" />
      <circle cx="12" cy="10" r="2" fill="#FFFF00" />
    </>
  ),
  "Serbia": (
    <>
      <rect width="60" height="13.33" fill="#C6363C" />
      <rect y="13.33" width="60" height="13.33" fill="#0C4076" />
      <rect y="26.67" width="60" height="13.33" fill="#FFFFFF" />
      <circle cx="18" cy="16" r="6" fill="#C6363C" stroke="#FFFFFF" strokeWidth="1" />
    </>
  ),
  "Montenegro": (
    <>
      <rect width="60" height="40" fill="#C40308" />
      <rect x="2" y="2" width="56" height="36" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      <path d="M30,10 L34,22 H26 Z" fill="#D4AF37" />
    </>
  ),
  "Bosnia and Herzegovina": (
    <>
      <rect width="60" height="40" fill="#002395" />
      <path d="M18,0 L48,0 L48,40 Z" fill="#FECB00" />
      <path d="M22,4 L23.2,7.5 L27,7.5 L24,9.7 L25.2,13.2 L22,11 L18.8,13.2 L20,9.7 L17,7.5 L20.8,7.5 Z" fill="#FFFFFF" />
      <path d="M26,12 L27.2,15.5 L31,15.5 L28,17.7 L29.2,21.2 L26,19 L22.8,21.2 L24,17.7 L21,15.5 L24.8,15.5 Z" fill="#FFFFFF" />
      <path d="M30,20 L31.2,23.5 L35,23.5 L32,25.7 L33.2,29.2 L30,27 L26.8,29.2 L28,25.7 L25,23.5 L28.8,23.5 Z" fill="#FFFFFF" />
      <path d="M34,28 L35.2,31.5 L39,31.5 L36,33.7 L37.2,37.2 L34,35 L30.8,37.2 L32,33.7 L29,31.5 L32.8,31.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Estonia": (
    <>
      <rect width="60" height="13.33" fill="#0072CE" />
      <rect y="13.33" width="60" height="13.33" fill="#000000" />
      <rect y="26.67" width="60" height="13.33" fill="#FFFFFF" />
    </>
  ),
  "Latvia": (
    <>
      <rect width="60" height="16" fill="#9E3039" />
      <rect y="16" width="60" height="8" fill="#FFFFFF" />
      <rect y="24" width="60" height="16" fill="#9E3039" />
    </>
  ),
  "Lithuania": (
    <>
      <rect width="60" height="13.33" fill="#FDB913" />
      <rect y="13.33" width="60" height="13.33" fill="#006A44" />
      <rect y="26.67" width="60" height="13.33" fill="#C1272D" />
    </>
  ),
  "Andorra": (
    <>
      <rect width="20" height="40" fill="#10069F" />
      <rect x="20" width="20" height="40" fill="#FEDD00" />
      <rect x="40" width="20" height="40" fill="#D50032" />
      <circle cx="30" cy="20" r="5" fill="#C8102E" />
    </>
  ),
  "Macau": (
    <>
      <rect width="60" height="40" fill="#00785E" />
      <path d="M30,8 L32,14 L38,14 L33,18 L35,24 L30,20 L25,24 L27,18 L22,14 L28,14 Z" fill="#FFFFFF" />
      <circle cx="30" cy="28" r="3" fill="#FFFFFF" />
      <path d="M18,30 Q30,34 42,30" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    </>
  ),
  "Barbados": (
    <>
      <rect width="20" height="40" fill="#00267F" />
      <rect x="20" width="20" height="40" fill="#FFC726" />
      <rect x="40" width="20" height="40" fill="#00267F" />
      <path d="M30,10 L28,30 H32 Z" fill="#000000" />
      <path d="M24,16 H36 M24,22 H36" stroke="#000000" strokeWidth="2" />
    </>
  ),
  "Belize": (
    <>
      <rect width="60" height="40" fill="#003F87" />
      <rect y="0" width="60" height="6" fill="#CE1126" />
      <rect y="34" width="60" height="6" fill="#CE1126" />
      <circle cx="30" cy="20" r="9" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="6" fill="#6B8E23" />
    </>
  ),
  "Honduras": (
    <>
      <rect width="60" height="13.33" fill="#0073CF" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#0073CF" />
      <path d="M22,18 L23,20.5 L25.5,20.5 L23.5,22 L24.2,24.5 L22,23 L19.8,24.5 L20.5,22 L18.5,20.5 L21,20.5 Z" fill="#0073CF" />
      <path d="M30,16 L31,18.5 L33.5,18.5 L31.5,20 L32.2,22.5 L30,21 L27.8,22.5 L28.5,20 L26.5,18.5 L29,18.5 Z" fill="#0073CF" />
      <path d="M38,18 L39,20.5 L41.5,20.5 L39.5,22 L40.2,24.5 L38,23 L35.8,24.5 L36.5,22 L34.5,20.5 L37,20.5 Z" fill="#0073CF" />
      <path d="M26,22 L27,24.5 L29.5,24.5 L27.5,26 L28.2,28.5 L26,27 L23.8,28.5 L24.5,26 L22.5,24.5 L25,24.5 Z" fill="#0073CF" />
      <path d="M34,22 L35,24.5 L37.5,24.5 L35.5,26 L36.2,28.5 L34,27 L31.8,28.5 L32.5,26 L30.5,24.5 L33,24.5 Z" fill="#0073CF" />
    </>
  ),
  "Nicaragua": (
    <>
      <rect width="60" height="13.33" fill="#0067C6" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#0067C6" />
      <circle cx="30" cy="20" r="5" fill="#C8A200" />
    </>
  ),
  "El Salvador": (
    <>
      <rect width="60" height="13.33" fill="#0047AB" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#0047AB" />
      <circle cx="30" cy="20" r="4.5" fill="#FCD116" />
    </>
  ),
  "Madagascar": (
    <>
      <rect width="20" height="40" fill="#FFFFFF" />
      <rect x="20" width="40" height="20" fill="#FC3D32" />
      <rect x="20" y="20" width="40" height="20" fill="#007E3A" />
    </>
  ),
  "Botswana": (
    <>
      <rect width="60" height="14" fill="#75AADB" />
      <rect y="14" width="60" height="4" fill="#FFFFFF" />
      <rect y="18" width="60" height="4" fill="#000000" />
      <rect y="22" width="60" height="4" fill="#FFFFFF" />
      <rect y="26" width="60" height="14" fill="#75AADB" />
    </>
  ),
  "Namibia": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#003580" />
      <path d="M60,0 V40 H0 Z" fill="#009543" />
      <path d="M0,32 L52,0 H60 L0,40 Z" fill="#C8102E" />
      <path d="M0,28 L48,0 H52 L0,32 Z" fill="#FFFFFF" />
      <path d="M8,40 L60,8 V12 L12,40 Z" fill="#FFFFFF" />
      <path d="M14,8 L16,12 L20,12 L17,14.5 L18,18.5 L14,16 L10,18.5 L11,14.5 L8,12 L12,12 Z" fill="#FFCE00" />
    </>
  ),
  "Rwanda": (
    <>
      <rect width="60" height="16" fill="#00A1DE" />
      <rect y="16" width="60" height="12" fill="#FAD201" />
      <rect y="28" width="60" height="12" fill="#20603D" />
      <path d="M46,6 L47.5,10 L52,10 L48.5,12.5 L50,16.5 L46,14 L42,16.5 L43.5,12.5 L40,10 L44.5,10 Z" fill="#E5BE01" />
    </>
  ),
  "Uganda": (
    <>
      <rect width="60" height="6.67" fill="#000000" />
      <rect y="6.67" width="60" height="6.67" fill="#FCDC04" />
      <rect y="13.33" width="60" height="6.67" fill="#D90000" />
      <rect y="20" width="60" height="6.67" fill="#000000" />
      <rect y="26.67" width="60" height="6.67" fill="#FCDC04" />
      <rect y="33.33" width="60" height="6.67" fill="#D90000" />
      <circle cx="30" cy="20" r="7" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="3.5" fill="#000000" />
    </>
  ),
  "Zambia": (
    <>
      <rect width="60" height="40" fill="#198A00" />
      <rect x="40" y="0" width="20" height="16" fill="#DE2010" />
      <rect x="40" y="16" width="20" height="8" fill="#000000" />
      <rect x="40" y="24" width="20" height="8" fill="#EF7D00" />
    </>
  ),
  "Zimbabwe": (
    <>
      <rect width="60" height="6.67" fill="#009543" />
      <rect y="6.67" width="60" height="6.67" fill="#FDE100" />
      <rect y="13.33" width="60" height="6.67" fill="#DE2010" />
      <rect y="20" width="60" height="6.67" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="6.67" fill="#000000" />
      <rect y="33.33" width="60" height="6.67" fill="#9E1A1A" />
      <path d="M0,0 L24,20 L0,40 Z" fill="#FFFFFF" />
      <path d="M8,14 L10,18 L14,18 L11,20.5 L12,24.5 L8,22 L4,24.5 L5,20.5 L2,18 L6,18 Z" fill="#DE2010" />
    </>
  ),
  "Mozambique": (
    <>
      <rect width="60" height="10" fill="#007168" />
      <rect y="10" width="60" height="2" fill="#FFFFFF" />
      <rect y="12" width="60" height="10" fill="#000000" />
      <rect y="22" width="60" height="2" fill="#FFFFFF" />
      <rect y="24" width="60" height="10" fill="#FCE100" />
      <rect y="34" width="60" height="6" fill="#D21034" />
      <path d="M0,0 L26,20 L0,40 Z" fill="#D21034" />
      <path d="M9,14 L11,18 L15,18 L12,20.5 L13,24.5 L9,22 L5,24.5 L6,20.5 L3,18 L7,18 Z" fill="#FCE100" />
    </>
  ),
  "Senegal": (
    <>
      <rect width="20" height="40" fill="#00853F" />
      <rect x="20" width="20" height="40" fill="#FDEF42" />
      <rect x="40" width="20" height="40" fill="#E31B23" />
      <path d="M30,14 L31.5,18.5 L36,18.5 L32.5,21 L33.8,25.5 L30,22.5 L26.2,25.5 L27.5,21 L24,18.5 L28.5,18.5 Z" fill="#00853F" />
    </>
  ),
  "C\u00f4te d'Ivoire": (
    <>
      <rect width="20" height="40" fill="#F77F00" />
      <rect x="20" width="20" height="40" fill="#FFFFFF" />
      <rect x="40" width="20" height="40" fill="#009E60" />
    </>
  ),
  "Kuwait": (
    <>
      <rect width="60" height="13.33" fill="#007A3D" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#CE1126" />
      <path d="M0,0 L20,13.33 V26.67 L0,40 Z" fill="#000000" />
    </>
  ),
  "Lebanon": (
    <>
      <rect width="60" height="10" fill="#EE161F" />
      <rect y="10" width="60" height="20" fill="#FFFFFF" />
      <rect y="30" width="60" height="10" fill="#EE161F" />
      <path d="M30,12 L34,24 H26 Z" fill="#00A651" />
      <rect x="28" y="24" width="4" height="4" fill="#00A651" />
    </>
  ),
  "Iran": (
    <>
      <rect width="60" height="13.33" fill="#239F40" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#DA0000" />
      <circle cx="30" cy="20" r="4" fill="#DA0000" />
    </>
  ),
  "Pakistan": (
    <>
      <rect width="15" height="40" fill="#FFFFFF" />
      <rect x="15" width="45" height="40" fill="#01411C" />
      <circle cx="36" cy="18" r="8" fill="#FFFFFF" />
      <circle cx="39" cy="16" r="6.5" fill="#01411C" />
      <path d="M44,12 L45.2,15.5 L48.5,15.5 L45.8,17.5 L46.8,21 L44,18.8 L41.2,21 L42.2,17.5 L39.5,15.5 L42.8,15.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Bhutan": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#FFD520" />
      <path d="M60,0 V40 H0 Z" fill="#FF4E12" />
      <circle cx="30" cy="20" r="8" fill="#FFFFFF" stroke="#000000" strokeWidth="1" />
    </>
  ),
  "Bangladesh": (
    <>
      <rect width="60" height="40" fill="#006A4E" />
      <circle cx="26" cy="20" r="10" fill="#F42A41" />
    </>
  ),
  "Papua New Guinea": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#000000" />
      <path d="M60,0 V40 H0 Z" fill="#CE1126" />
      <path d="M12,8 L13,11 L16,11 L13.5,13 L14.5,16 L12,14 L9.5,16 L10.5,13 L8,11 L11,11 Z" fill="#FFFFFF" />
      <path d="M20,14 L20.7,16 L23,16 L21.2,17.3 L21.9,19.3 L20,18 L18.1,19.3 L18.8,17.3 L17,16 L19.3,16 Z" fill="#FFFFFF" />
      <path d="M42,24 L46,28 L42,32 L38,28 Z" fill="#FCD116" />
    </>
  ),
  "Vanuatu": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#D21034" />
      <path d="M60,0 V40 H0 Z" fill="#009543" />
      <path d="M0,16 L40,16 L60,0 V8 L44,20 L60,32 V40 L40,24 H0 Z" fill="#000000" />
      <path d="M0,18 H42 L60,4 V8 L44,20 L60,32 V36 L42,22 H0 Z" fill="#FDCE12" />
    </>
  ),
  "Samoa": (
    <>
      <rect width="60" height="40" fill="#CE1126" />
      <rect width="30" height="20" fill="#002B7F" />
      <path d="M8,4 L8.8,6.5 L11.5,6.5 L9.4,8 L10.1,10.5 L8,9 L5.9,10.5 L6.6,8 L4.5,6.5 L7.2,6.5 Z" fill="#FFFFFF" />
      <path d="M16,6 L16.7,8 L19,8 L17.2,9.3 L17.9,11.3 L16,10 L14.1,11.3 L14.8,9.3 L13,8 L15.3,8 Z" fill="#FFFFFF" />
      <path d="M20,12 L20.7,14 L23,14 L21.2,15.3 L21.9,17.3 L20,16 L18.1,17.3 L18.8,15.3 L17,14 L19.3,14 Z" fill="#FFFFFF" />
      <path d="M12,12 L12.7,14 L15,14 L13.2,15.3 L13.9,17.3 L12,16 L10.1,17.3 L10.8,15.3 L9,14 L11.3,14 Z" fill="#FFFFFF" />
      <path d="M15,16 L15.5,17.5 L17,17.5 L15.8,18.4 L16.3,19.9 L15,19 L13.7,19.9 L14.2,18.4 L13,17.5 L14.5,17.5 Z" fill="#FFFFFF" />
    </>
  ),
  "French Polynesia": (
    <>
      <rect width="60" height="10" fill="#CE1126" />
      <rect y="10" width="60" height="20" fill="#FFFFFF" />
      <rect y="30" width="60" height="10" fill="#CE1126" />
      <circle cx="30" cy="20" r="7" fill="#FFD100" />
      <path d="M24,20 Q30,14 36,20 Q30,26 24,20 Z" fill="#0035AD" />
    </>
  ),
  "Luxembourg": (
    <>
      <rect width="60" height="13.33" fill="#ED2939" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#00A1DE" />
    </>
  ),
  "Moldova": (
    <>
      <rect width="20" height="40" fill="#003DA5" />
      <rect x="20" width="20" height="40" fill="#FFD200" />
      <rect x="40" width="20" height="40" fill="#CC092F" />
      <circle cx="30" cy="20" r="5" fill="#A67C00" />
    </>
  ),
  "Belarus": (
    <>
      <rect width="12" height="40" fill="#C8312A" />
      <rect x="12" width="48" height="28" fill="#C8312A" />
      <rect x="12" y="28" width="48" height="12" fill="#4AA657" />
      <path d="M2,8 h8 M2,14 h8 M2,20 h8 M2,26 h8 M2,32 h8" stroke="#FFFFFF" strokeWidth="1.5" />
    </>
  ),
  "Russia": (
    <>
      <rect width="60" height="13.33" fill="#FFFFFF" />
      <rect y="13.33" width="60" height="13.33" fill="#0039A6" />
      <rect y="26.67" width="60" height="13.33" fill="#D52B1E" />
    </>
  ),
  "Algeria": (
    <>
      <rect width="30" height="40" fill="#006233" />
      <rect x="30" width="30" height="40" fill="#FFFFFF" />
      <circle cx="28" cy="20" r="8" fill="#D21034" />
      <circle cx="31" cy="20" r="6.5" fill="#006233" />
      <path d="M33,13.5 L34.3,17.5 L38.5,17.5 L35.2,20 L36.3,24 L33,21.5 L29.7,24 L30.8,20 L27.5,17.5 L31.7,17.5 Z" fill="#D21034" />
    </>
  ),
  "Angola": (
    <>
      <rect width="60" height="20" fill="#CC092F" />
      <rect y="20" width="60" height="20" fill="#000000" />
      <path d="M22,14 A12,12 0 0,1 38,26" fill="none" stroke="#FFCD00" strokeWidth="3" />
      <circle cx="34" cy="18" r="3" fill="#FFCD00" />
    </>
  ),
  "Cameroon": (
    <>
      <rect width="20" height="40" fill="#007A5E" />
      <rect x="20" width="20" height="40" fill="#CE1126" />
      <rect x="40" width="20" height="40" fill="#FCD116" />
      <path d="M30,14 L31.5,18.5 L36,18.5 L32.5,21 L33.8,25.5 L30,22.5 L26.2,25.5 L27.5,21 L24,18.5 L28.5,18.5 Z" fill="#FCD116" />
    </>
  ),
  "Paraguay": (
    <>
      <rect width="60" height="13.33" fill="#D52B1E" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#0038A8" />
      <circle cx="30" cy="20" r="4.5" fill="#D4A017" />
    </>
  ),
  "Venezuela": (
    <>
      <rect width="60" height="13.33" fill="#FFCC00" />
      <rect y="13.33" width="60" height="13.33" fill="#00247D" />
      <rect y="26.67" width="60" height="13.33" fill="#CF142B" />
      <path d="M20,18 L21,20.5 L23.5,20.5 L21.5,22 L22.2,24.5 L20,23 L17.8,24.5 L18.5,22 L16.5,20.5 L19,20.5 Z" fill="#FFFFFF" />
      <path d="M26,16 L27,18.5 L29.5,18.5 L27.5,20 L28.2,22.5 L26,21 L23.8,22.5 L24.5,20 L22.5,18.5 L25,18.5 Z" fill="#FFFFFF" />
      <path d="M32,16 L33,18.5 L35.5,18.5 L33.5,20 L34.2,22.5 L32,21 L29.8,22.5 L30.5,20 L28.5,18.5 L31,18.5 Z" fill="#FFFFFF" />
      <path d="M38,18 L39,20.5 L41.5,20.5 L39.5,22 L40.2,24.5 L38,23 L35.8,24.5 L36.5,22 L34.5,20.5 L37,20.5 Z" fill="#FFFFFF" />
    </>
  ),
  "Trinidad and Tobago": (
    <>
      <rect width="60" height="40" fill="#CE1126" />
      <path d="M-4,40 L28,-4 H40 L8,44 Z" fill="#FFFFFF" />
      <path d="M0,40 L30,-4 H38 L8,44 Z" fill="#000000" />
    </>
  ),
  "Antigua and Barbuda": (
    <>
      <rect width="60" height="40" fill="#CE1126" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#CE1126" />
      <path d="M60,0 L30,20 L60,40 Z" fill="#CE1126" />
      <path d="M0,0 H60 L30,20 Z" fill="#FCD116" />
      <path d="M8,20 H52 L30,40 Z" fill="#0072C6" />
      <path d="M14,26 H46 L30,40 Z" fill="#FFFFFF" />
      <path d="M20,32 H40 L30,40 Z" fill="#000000" />
      <circle cx="30" cy="12" r="5" fill="#FCD116" />
    </>
  ),
  "Grenada": (
    <>
      <rect width="60" height="40" fill="#CE1126" />
      <path d="M0,6 H60 V34 H0 Z" fill="#007A5E" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#CE1126" />
      <path d="M60,0 L30,20 L60,40 Z" fill="#CE1126" />
      <path d="M0,6 L30,20 L0,34 Z" fill="#FCD116" />
      <path d="M60,6 L30,20 L60,34 Z" fill="#FCD116" />
      <circle cx="30" cy="20" r="5" fill="#FCD116" />
    </>
  ),
  "Dominica": (
    <>
      <rect width="60" height="40" fill="#006B3F" />
      <rect y="14" width="60" height="4" fill="#FCD116" />
      <rect y="18" width="60" height="4" fill="#000000" />
      <rect y="22" width="60" height="4" fill="#FFFFFF" />
      <rect x="26" width="4" height="40" fill="#FCD116" />
      <rect x="30" width="4" height="40" fill="#000000" />
      <rect x="34" width="4" height="40" fill="#FFFFFF" />
      <circle cx="32" cy="20" r="7" fill="#C8102E" />
    </>
  ),
  "Saint Kitts and Nevis": (
    <>
      <path d="M0,0 H60 L0,40 Z" fill="#009739" />
      <path d="M60,0 V40 H0 Z" fill="#CE1126" />
      <path d="M0,28 L48,0 H60 L12,40 H0 Z" fill="#000000" />
      <path d="M0,32 L52,0 H56 L8,40 H0 Z" fill="#FCD116" />
      <path d="M22,14 L23.2,17 L26.5,17 L23.8,19 L25,22 L22,20 L19,22 L20.2,19 L17.5,17 L20.8,17 Z" fill="#FFFFFF" />
      <path d="M34,22 L35.2,25 L38.5,25 L35.8,27 L37,30 L34,28 L31,30 L32.2,27 L29.5,25 L32.8,25 Z" fill="#FFFFFF" />
    </>
  ),
  "Saint Vincent and the Grenadines": (
    <>
      <rect width="18" height="40" fill="#0072C6" />
      <rect x="18" width="24" height="40" fill="#FCD116" />
      <rect x="42" width="18" height="40" fill="#007A3D" />
      <path d="M24,12 L30,22 L24,32 L18,22 Z" fill="#007A3D" />
      <path d="M30,10 L36,20 L30,30 L24,20 Z" fill="#007A3D" />
      <path d="M36,12 L42,22 L36,32 L30,22 Z" fill="#007A3D" />
    </>
  ),
  "Guyana": (
    <>
      <rect width="60" height="40" fill="#009E49" />
      <path d="M0,0 L60,20 L0,40 Z" fill="#FFFFFF" />
      <path d="M0,3 L52,20 L0,37 Z" fill="#FCD116" />
      <path d="M0,0 L30,20 L0,40 Z" fill="#000000" />
      <path d="M0,4 L24,20 L0,36 Z" fill="#CE1126" />
    </>
  ),
  "Suriname": (
    <>
      <rect width="60" height="8" fill="#377E3F" />
      <rect y="8" width="60" height="6" fill="#FFFFFF" />
      <rect y="14" width="60" height="12" fill="#B40A2D" />
      <rect y="26" width="60" height="6" fill="#FFFFFF" />
      <rect y="32" width="60" height="8" fill="#377E3F" />
      <path d="M30,16 L31.5,20 L36,20 L32.5,22.5 L33.8,26.5 L30,24 L26.2,26.5 L27.5,22.5 L24,20 L28.5,20 Z" fill="#ECC81D" />
    </>
  ),
  "Gambia": (
    <>
      <rect width="60" height="13" fill="#CE1126" />
      <rect y="13" width="60" height="3" fill="#FFFFFF" />
      <rect y="16" width="60" height="8" fill="#0C1C8C" />
      <rect y="24" width="60" height="3" fill="#FFFFFF" />
      <rect y="27" width="60" height="13" fill="#3A7728" />
    </>
  ),
  "Malawi": (
    <>
      <rect width="60" height="13.33" fill="#000000" />
      <rect y="13.33" width="60" height="13.33" fill="#CE1126" />
      <rect y="26.67" width="60" height="13.33" fill="#339E35" />
      <circle cx="30" cy="10" r="5" fill="#CE1126" />
    </>
  ),
  "Lesotho": (
    <>
      <rect width="60" height="13.33" fill="#00209F" />
      <rect y="13.33" width="60" height="13.33" fill="#FFFFFF" />
      <rect y="26.67" width="60" height="13.33" fill="#009543" />
      <path d="M30,16 L34,24 H26 Z" fill="#000000" />
    </>
  ),
  "Eswatini": (
    <>
      <rect width="60" height="10" fill="#3E5EB9" />
      <rect y="10" width="60" height="4" fill="#FFD900" />
      <rect y="14" width="60" height="12" fill="#FF4F00" />
      <rect y="26" width="60" height="4" fill="#FFD900" />
      <rect y="30" width="60" height="10" fill="#3E5EB9" />
      <ellipse cx="30" cy="20" rx="10" ry="6" fill="#000000" />
      <ellipse cx="30" cy="20" rx="10" ry="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    </>
  ),
  "North Macedonia": (
    <>
      <rect width="60" height="40" fill="#D20000" />
      <circle cx="30" cy="20" r="7" fill="#FFE600" />
      <path d="M30,0 L34,20 L30,40 L26,20 Z M0,20 L30,16 L60,20 L30,24 Z" fill="#FFE600" />
    </>
  ),
  "Kosovo": (
    <>
      <rect width="60" height="40" fill="#244AA5" />
      <path d="M24,14 L28,12 L32,14 L36,18 L34,26 L30,30 L26,26 L22,18 Z" fill="#D0A650" />
      <path d="M18,8 L18.7,10 L21,10 L19.2,11.3 L19.9,13.3 L18,12 L16.1,13.3 L16.8,11.3 L15,10 L17.3,10 Z" fill="#FFFFFF" />
      <path d="M24,6 L24.7,8 L27,8 L25.2,9.3 L25.9,11.3 L24,10 L22.1,11.3 L22.8,9.3 L21,8 L23.3,8 Z" fill="#FFFFFF" />
      <path d="M30,5 L30.7,7 L33,7 L31.2,8.3 L31.9,10.3 L30,9 L28.1,10.3 L28.8,8.3 L27,7 L29.3,7 Z" fill="#FFFFFF" />
      <path d="M36,6 L36.7,8 L39,8 L37.2,9.3 L37.9,11.3 L36,10 L34.1,11.3 L34.8,9.3 L33,8 L35.3,8 Z" fill="#FFFFFF" />
      <path d="M42,8 L42.7,10 L45,10 L43.2,11.3 L43.9,13.3 L42,12 L40.1,13.3 L40.8,11.3 L39,10 L41.3,10 Z" fill="#FFFFFF" />
    </>
  ),
};

export function CountryFlag({
  country,
  size = 30,
}: {
  country: string;
  size?: number;
}) {
  const name = normalizeCountryName(country);
  if (!name) return null;
  return (
    <FlagShell size={size} label={name}>
      {FLAG_ART[name]}
    </FlagShell>
  );
}

export function TripCountryFlags({
  countries,
  size = 20,
}: {
  countries: string[];
  size?: number;
}) {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of countries) {
    const name = normalizeCountryName(raw);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    unique.push(name);
  }
  if (unique.length === 0) return null;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1"
      aria-label={unique.join(' and ')}
    >
      {unique.map((name) => (
        <CountryFlag key={name} country={name} size={size} />
      ))}
    </span>
  );
}

/** @deprecated Prefer CountryFlag("Thailand") */
export function ThaiFlag({ size = 30 }: { size?: number }) {
  return <CountryFlag country="Thailand" size={size} />;
}

/** @deprecated Prefer CountryFlag("Vietnam") */
export function VietnamFlag({ size = 30 }: { size?: number }) {
  return <CountryFlag country="Vietnam" size={size} />;
}
