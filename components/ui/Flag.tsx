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
  )
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
