import type { TripDay } from './trip';

/** Supported destination countries (create/edit trip picker + flag registry). */
export const COUNTRY_OPTIONS = [
  'France',
  'Italy',
  'Spain',
  'United Kingdom',
  'Greece',
  'Egypt',
  'Japan',
  'China',
  'India',
  'Peru',
  'Jordan',
  'Cambodia',
  'Uzbekistan',
  'Mexico',
  'Thailand',
  'Indonesia',
  'The Maldives',
  'The Philippines',
  'Fiji',
  'Mauritius',
  'Bahamas',
  'St. Lucia',
  'Croatia',
  'Seychelles',
  'Portugal',
  'Canada',
  'New Zealand',
  'South Africa',
  'Iceland',
  'Switzerland',
  'Costa Rica',
  'Norway',
  'Tanzania',
  'Nepal',
  'Argentina',
  'Colombia',
  'Kyrgyzstan',
  'Chile',
  'United States',
  'United Arab Emirates',
  'Singapore',
  'South Korea',
  'Australia',
  'Hong Kong',
  'Qatar',
  'Vietnam',
  'Turkey',
  'Morocco',
  'Albania',
  'Saudi Arabia',
] as const;

export type CountryName = (typeof COUNTRY_OPTIONS)[number];

const CANONICAL_BY_KEY = new Map<string, CountryName>(
  COUNTRY_OPTIONS.map((name) => [name.toLowerCase(), name])
);

/** Common aliases / short names → canonical list entry. */
const ALIASES: Record<string, CountryName> = {
  uk: 'United Kingdom',
  'great britain': 'United Kingdom',
  britain: 'United Kingdom',
  england: 'United Kingdom',
  usa: 'United States',
  us: 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  america: 'United States',
  uae: 'United Arab Emirates',
  emirates: 'United Arab Emirates',
  maldives: 'The Maldives',
  philippines: 'The Philippines',
  'saint lucia': 'St. Lucia',
  'st lucia': 'St. Lucia',
  korea: 'South Korea',
  'republic of korea': 'South Korea',
  'hongkong': 'Hong Kong',
  nz: 'New Zealand',
};

/** Legacy city destinations → country for flag display. */
const CITY_TO_COUNTRY: Record<string, CountryName> = {
  bangkok: 'Thailand',
  phuket: 'Thailand',
  chiangmai: 'Thailand',
  'chiang mai': 'Thailand',
  saigon: 'Vietnam',
  'ho chi minh': 'Vietnam',
  'ho chi minh city': 'Vietnam',
  'nha trang': 'Vietnam',
  hanoi: 'Vietnam',
  danang: 'Vietnam',
  'da nang': 'Vietnam',
  tokyo: 'Japan',
  osaka: 'Japan',
  kyoto: 'Japan',
  paris: 'France',
  rome: 'Italy',
  barcelona: 'Spain',
  madrid: 'Spain',
  london: 'United Kingdom',
  athens: 'Greece',
  cairo: 'Egypt',
  beijing: 'China',
  shanghai: 'China',
  delhi: 'India',
  mumbai: 'India',
  lima: 'Peru',
  amman: 'Jordan',
  'siem reap': 'Cambodia',
  'phnom penh': 'Cambodia',
  tashkent: 'Uzbekistan',
  'mexico city': 'Mexico',
  bali: 'Indonesia',
  jakarta: 'Indonesia',
  male: 'The Maldives',
  manila: 'The Philippines',
  suva: 'Fiji',
  'port louis': 'Mauritius',
  nassau: 'Bahamas',
  castries: 'St. Lucia',
  dubrovnik: 'Croatia',
  split: 'Croatia',
  victoria: 'Seychelles',
  lisbon: 'Portugal',
  toronto: 'Canada',
  vancouver: 'Canada',
  auckland: 'New Zealand',
  wellington: 'New Zealand',
  'cape town': 'South Africa',
  johannesburg: 'South Africa',
  reykjavik: 'Iceland',
  zurich: 'Switzerland',
  geneva: 'Switzerland',
  'san jose': 'Costa Rica',
  oslo: 'Norway',
  'dar es salaam': 'Tanzania',
  zanzibar: 'Tanzania',
  kathmandu: 'Nepal',
  'buenos aires': 'Argentina',
  bogota: 'Colombia',
  bishkek: 'Kyrgyzstan',
  santiago: 'Chile',
  'new york': 'United States',
  'los angeles': 'United States',
  dubai: 'United Arab Emirates',
  'abu dhabi': 'United Arab Emirates',
  singapore: 'Singapore',
  seoul: 'South Korea',
  sydney: 'Australia',
  melbourne: 'Australia',
  'hong kong': 'Hong Kong',
  doha: 'Qatar',
  istanbul: 'Turkey',
  marrakech: 'Morocco',
  tirana: 'Albania',
  riyadh: 'Saudi Arabia',
  jeddah: 'Saudi Arabia',
};

export function normalizeCountryName(raw: string): CountryName | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!key) return null;
  if (ALIASES[key]) return ALIASES[key];
  return CANONICAL_BY_KEY.get(key) ?? null;
}

export function countryFromDestinationLabel(destination: string): CountryName | null {
  const key = destination.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!key) return null;
  return CITY_TO_COUNTRY[key] ?? normalizeCountryName(destination);
}

/** Unique countries in first-seen order from trip days (country field, then city/destination fallback). */
export function uniqueCountriesFromTripDays(days: TripDay[]): CountryName[] {
  const seen = new Set<string>();
  const out: CountryName[] = [];
  for (const day of days) {
    const fromCountry = day.country ? normalizeCountryName(day.country) : null;
    const resolved =
      fromCountry ??
      (day.city ? countryFromDestinationLabel(day.city) : null) ??
      countryFromDestinationLabel(day.destination);
    if (!resolved || seen.has(resolved)) continue;
    seen.add(resolved);
    out.push(resolved);
  }
  return out;
}
