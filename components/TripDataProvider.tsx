'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_BUCKET,
} from '@/lib/supabase';
import {
  formatBaseCurrency,
  toBase,
  round2,
  splitEqually,
  localSharesToGbp,
  defaultCurrencies,
} from '@/lib/currency';
import {
  TRIP_DAYS,
  TRIP_TITLE,
  tripDayFromRow,
  type TripDay,
} from '@/lib/trip';
import { type EventType } from '@/lib/notifications/config';
import { ACTIVE_TRIP_ID } from '@/lib/activeTrip';
import { useAuth } from './AuthProvider';
import { SETTLEMENT_LABEL } from '@/lib/types';
import { compressToWebp, fileToDataUrl } from '@/lib/image';
import {
  DEMO_EXPENSES,
  DEMO_ITINERARY,
  DEMO_PHOTOS,
  DEMO_PROFILES,
  DEMO_RECEIPTS,
  DEMO_RECEIPT_ITEMS,
  DEMO_SETTINGS,
  DEMO_SPLITS,
  DEMO_STATS,
} from '@/lib/demo';
import type {
  CurrencyCode,
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Photo,
  Profile,
  Receipt,
  ReceiptItem,
  StatCategory,
  StatEntry,
  Trip,
  TripCurrency,
  CreateTripResult,
  TripSettings,
} from '@/lib/types';

const ME_KEY = 'travel_user_profile';
const DEMO_KEY = 'travel_demo_state_v2';
const ACTIVE_TRIP_KEY = 'active_trip_id';

// The built-in trip identity, used in demo mode and as a fallback before the
// multi-trip migration is applied. When Supabase returns a `trips` row (+ days
// + currencies) those take over, so nothing in lib/trip.ts stays load-bearing.
const FALLBACK_TRIP: Trip = {
  id: ACTIVE_TRIP_ID,
  name: TRIP_TITLE,
  start_date: '2026-08-28',
  end_date: '2026-09-09',
  base_currency: 'GBP',
};

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Build GBP amount_owed values for `parts`. Custom local shares win when they
// cover every participant and sum to the local total; otherwise equal split.
function resolveSharesGbp(
  parts: string[],
  localTotal: number,
  baseGbp: number,
  customSharesLocal?: { userId: string; amount: number }[]
): number[] {
  if (!customSharesLocal?.length) return splitEqually(baseGbp, parts.length);
  const byUser = new Map(customSharesLocal.map((s) => [s.userId, round2(s.amount)]));
  if (!parts.every((id) => byUser.has(id))) return splitEqually(baseGbp, parts.length);
  const localShares = parts.map((id) => byUser.get(id)!);
  const sum = round2(localShares.reduce((a, b) => a + b, 0));
  if (sum !== round2(localTotal)) return splitEqually(baseGbp, parts.length);
  return localSharesToGbp(localShares, round2(localTotal), baseGbp);
}

export interface NewExpenseInput {
  label: string;
  dayNumber: number;
  amount: number;
  currency: CurrencyCode;
  paidById: string;
  participantIds: string[];
  // Optional custom local-currency amounts (same currency as `amount`), one
  // per participant, summing to `amount`. When omitted, splits are equal.
  customSharesLocal?: { userId: string; amount: number }[];
  /** New or replacement proof-of-payment photo. */
  imageFile?: File | null;
  /** Clear any existing attached photo (ignored when imageFile is set). */
  removeImage?: boolean;
}

export interface NewReceiptInput {
  merchant: string;
  dayNumber: number;
  currency: CurrencyCode;
  total: number;
  paidById: string;
  items: {
    id?: string;
    name: string;
    quantity: number;
    price: number;
    claimed_by_id?: string | null;
  }[];
  imageFile?: File | null;
}

export interface TripDetailsInput {
  name: string;
  homeCurrency: string;
  destinations: {
    country: string;
    city: string;
    startDate: string;
    endDate: string;
    accentHex: string;
  }[];
  destinationCurrencies: string[];
}

export interface NewTripInput extends TripDetailsInput {
  ownerName: string;
}

interface TripDataValue {
  ready: boolean;
  demoMode: boolean;
  me: Profile | null;
  // Phase 3: trip identity, days and currencies sourced from the DB (or the
  // built-in fallback) rather than hard-coded constants.
  trip: Trip;
  tripDays: TripDay[];
  currencies: TripCurrency[];
  // Phase 2 (auth): the signed-in Google account has no membership on this trip
  // yet — the gate should offer to claim an existing member or join by code.
  needsMembership: boolean;
  // Link the signed-in account to an unclaimed member row (rpc claim_member).
  claimMembership: (memberId: string) => Promise<void>;
  // Join a trip via an invite code (rpc join_trip).
  joinTripByCode: (code: string) => Promise<void>;
  leaveTrip: (tripId: string) => Promise<void>;
  // Phase 4 (multi-trip; auth-on only — with auth off a single trip is pinned).
  activeTripId: string | null;
  myTrips: Trip[];
  setActiveTrip: (tripId: string | null) => void;
  createTrip: (input: NewTripInput) => Promise<CreateTripResult>;
  updateTrip: (input: TripDetailsInput) => Promise<void>;
  profiles: Profile[];
  settings: TripSettings;
  itinerary: ItineraryItem[];
  photos: Photo[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  receipts: Receipt[];
  receiptItems: ReceiptItem[];
  stats: StatEntry[];

  ensureProfile: (name: string, photo?: File | null) => Promise<Profile>;
  signInAs: (profile: Profile) => void;
  updateMyName: (name: string) => Promise<void>;
  setMyPhoto: (file: File) => Promise<void>;
  signOut: () => void;

  addItineraryItem: (input: Omit<ItineraryItem, 'id' | 'photo_url'>) => Promise<void>;
  updateItineraryItem: (
    id: string,
    input: Omit<ItineraryItem, 'id' | 'photo_url' | 'created_at'>
  ) => Promise<void>;
  deleteItineraryItem: (id: string) => Promise<void>;

  addPhotos: (activityId: string, files: File[]) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  updateCurrencyRates: (rates: Record<string, number>) => Promise<void>;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: NewExpenseInput) => Promise<void>;
  addReceiptExpense: (input: NewReceiptInput) => Promise<void>;
  updateReceiptExpense: (expenseId: string, input: NewReceiptInput) => Promise<void>;
  setItemClaim: (itemId: string, userId: string | null) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Log a peer-to-peer "Settle Up" payment: `fromId` (debtor) pays `toId`
  // (creditor) `amount` GBP. Stored as a 'settlement' expense + one split.
  settleUp: (fromId: string, toId: string, amount: number) => Promise<void>;

  setStat: (dayNumber: number, category: StatCategory, count: number) => Promise<void>;
}

const TripDataContext = createContext<TripDataValue | null>(null);

export function useTripData(): TripDataValue {
  const ctx = useContext(TripDataContext);
  if (!ctx) throw new Error('useTripData must be used within TripDataProvider');
  return ctx;
}

export default function TripDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = !isSupabaseConfigured;
  const { authEnabled, authReady, account } = useAuth();

  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<TripSettings>(DEMO_SETTINGS);
  const [trip, setTrip] = useState<Trip>(FALLBACK_TRIP);
  const [tripDays, setTripDays] = useState<TripDay[]>(TRIP_DAYS);
  const [currencies, setCurrencies] = useState<TripCurrency[]>(() =>
    defaultCurrencies(DEMO_SETTINGS)
  );
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [stats, setStats] = useState<StatEntry[]>([]);

  // Phase 4: the trip currently open. With auth off there is exactly one trip
  // (the built-in), so it is pinned; with auth on it is chosen on the My Trips
  // screen and persisted per device. A ref mirrors it so the many mutation
  // callbacks can stamp the current trip without being re-created on switch.
  const [activeTripId, setActiveTripIdState] = useState<string | null>(
    authEnabled ? null : ACTIVE_TRIP_ID
  );
  const activeTripIdRef = useRef(activeTripId);
  activeTripIdRef.current = activeTripId;
  const [myTrips, setMyTrips] = useState<Trip[]>([]);

  // --- demo persistence -----------------------------------------------------
  const persistDemo = useRef<() => void>(() => {});
  persistDemo.current = () => {
    if (!demoMode) return;
    try {
      localStorage.setItem(
        DEMO_KEY,
        JSON.stringify({
          profiles,
          settings,
          itinerary,
          photos,
          expenses,
          splits,
          receipts,
          receiptItems,
          stats,
        })
      );
    } catch {
      /* localStorage may be full (e.g. large photo data URLs) — ignore */
    }
  };
  useEffect(() => {
    if (demoMode && ready) persistDemo.current();
  }, [demoMode, ready, profiles, settings, itinerary, photos, expenses, splits, receipts, receiptItems, stats]);

  // --- initial load ---------------------------------------------------------
  const refetchAll = useCallback(async () => {
    if (!supabase) return;
    const tripId = activeTripIdRef.current;
    // No trip selected yet (auth on, still on My Trips) → nothing to load.
    if (!tripId) return;
    const [tr, td, tc, p, s, it, ph, ex, sp, rc, ri, st] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).maybeSingle(),
      supabase.from('trip_days').select('*').eq('trip_id', tripId).order('day_number'),
      supabase.from('trip_currencies').select('*').eq('trip_id', tripId),
      supabase.from('profiles').select('*').eq('trip_id', tripId).order('created_at'),
      supabase.from('trip_settings').select('*').eq('id', 1).single(),
      supabase.from('itinerary_items').select('*').eq('trip_id', tripId).order('day_number').order('created_at'),
      supabase.from('photos').select('*').eq('trip_id', tripId).order('created_at'),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at'),
      supabase.from('expense_splits').select('*').eq('trip_id', tripId),
      supabase.from('receipts').select('*').eq('trip_id', tripId),
      supabase.from('receipt_items').select('*').eq('trip_id', tripId).order('created_at'),
      supabase.from('stat_entries').select('*').eq('trip_id', tripId),
    ]);
    // Trip metadata (fall back to the built-in identity if the migration that
    // seeds these tables hasn't been applied yet).
    if (tr.data) setTrip(tr.data as Trip);
    const dayRows = (td.data ?? []) as {
      day_number: number;
      date: string;
      destination: string;
      accent_hex: string;
      country?: string;
      city?: string | null;
    }[];
    if (dayRows.length) setTripDays(dayRows.map(tripDayFromRow));
    const currencyRows = (tc.data ?? []) as TripCurrency[];
    if (currencyRows.length) {
      // Keep base currency first, then a stable order for the picker.
      const base = (tr.data as Trip | null)?.base_currency ?? 'GBP';
      setCurrencies(
        [...currencyRows].sort((a, b) =>
          a.code === base ? -1 : b.code === base ? 1 : a.code.localeCompare(b.code)
        )
      );
    } else if (s.data) {
      setCurrencies(defaultCurrencies(s.data as TripSettings));
    }
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setSettings(s.data as TripSettings);
    if (it.data) {
      setItinerary(
        (it.data as ItineraryItem[]).map((row) => ({
          ...row,
          notes: row.notes ?? null,
          end_time_label: row.end_time_label ?? null,
        }))
      );
    }
    if (ph.data) setPhotos(ph.data as Photo[]);
    if (ex.data) setExpenses(ex.data as Expense[]);
    if (sp.data) setSplits(sp.data as ExpenseSplit[]);
    if (rc.data) setReceipts(rc.data as Receipt[]);
    if (ri.data) setReceiptItems(ri.data as ReceiptItem[]);
    if (st.data) setStats(st.data as StatEntry[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Restore the signed-in profile from localStorage (the name-based login
    // bypass). With auth on, identity comes from the Supabase session instead,
    // so skip the localStorage restore and let the membership effect resolve me.
    if (!authEnabled) {
      try {
        const raw = localStorage.getItem(ME_KEY);
        if (raw) setMe(JSON.parse(raw) as Profile);
      } catch {
        /* ignore */
      }
    }

    if (demoMode) {
      let state = {
        profiles: DEMO_PROFILES,
        settings: DEMO_SETTINGS,
        itinerary: DEMO_ITINERARY,
        photos: DEMO_PHOTOS,
        expenses: DEMO_EXPENSES,
        splits: DEMO_SPLITS,
        receipts: DEMO_RECEIPTS,
        receiptItems: DEMO_RECEIPT_ITEMS,
        stats: DEMO_STATS,
      };
      try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (raw) state = { ...state, ...JSON.parse(raw) };
      } catch {
        /* ignore */
      }
      setProfiles(state.profiles);
      setSettings(state.settings);
      setCurrencies(defaultCurrencies(state.settings));
      setItinerary(state.itinerary);
      setPhotos(state.photos);
      setExpenses(state.expenses);
      setSplits(state.splits);
      setReceipts(state.receipts);
      setReceiptItems(state.receiptItems);
      setStats(state.stats);
      setReady(true);
      return;
    }

    refetchAll().finally(() => {
      if (mounted) setReady(true);
    });

    // Realtime: any change to trip tables triggers a refetch.
    const channel = supabase!
      .channel('trip-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        refetchAll();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase!.removeChannel(channel);
    };
  }, [demoMode, refetchAll]);

  // Keep `me` aligned with the live profiles list. localStorage can hold a
  // stale id (old project, deleted row, demo→live switch) that then breaks
  // FKs like photos.uploaded_by_id on insert. (Auth path resolves me by
  // account link instead — see the membership effect below.)
  useEffect(() => {
    if (authEnabled) return;
    if (!ready || !me || profiles.length === 0) return;
    const byId = profiles.find((p) => p.id === me.id);
    if (byId) {
      const sameAvatar = (byId.avatar_url ?? null) === (me.avatar_url ?? null);
      if (byId.name !== me.name || !sameAvatar) {
        setMe(byId);
        try {
          localStorage.setItem(ME_KEY, JSON.stringify(byId));
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const byName = profiles.find(
      (p) => p.name.toLowerCase() === me.name.toLowerCase()
    );
    if (byName) {
      setMe(byName);
      try {
        localStorage.setItem(ME_KEY, JSON.stringify(byName));
      } catch {
        /* ignore */
      }
      return;
    }
    // Unknown identity — send them back through the welcome gate.
    setMe(null);
    try {
      localStorage.removeItem(ME_KEY);
    } catch {
      /* ignore */
    }
  }, [ready, profiles, me]);

  // --- profile / login ------------------------------------------------------
  const persistMe = (profile: Profile | null) => {
    setMe(profile);
    try {
      if (profile) localStorage.setItem(ME_KEY, JSON.stringify(profile));
      else localStorage.removeItem(ME_KEY);
    } catch {
      /* ignore */
    }
  };

  // Phase 2 (auth on): `me` is the trip membership linked to the signed-in
  // account. Resolve it from the roster by user_id; clear it on sign-out.
  useEffect(() => {
    if (!authEnabled || !authReady) return;
    if (!account) {
      if (me) persistMe(null);
      return;
    }
    const membership =
      profiles.find((p) => p.user_id === account.id && !p.left_at) ?? null;
    if (membership?.id !== me?.id) persistMe(membership);
  }, [authEnabled, authReady, account, profiles, me]);

  // When the account resolves (auth on), load the trips it belongs to and
  // restore the last-open trip from this device (if the account is still a
  // member of it). Otherwise land on My Trips (activeTripId stays null).
  useEffect(() => {
    if (!authEnabled || !authReady) return;
    if (!account) {
      setMyTrips([]);
      setActiveTripIdState(null);
      activeTripIdRef.current = null;
      return;
    }
    void (async () => {
      // A pending invite (deep-linked /join/[code]) takes priority: join, then
      // open that trip.
      let pending: string | null = null;
      try {
        pending = localStorage.getItem('pending_join_code');
      } catch {
        /* ignore */
      }
      if (pending && supabase) {
        try {
          const { data } = await supabase.rpc('join_trip', { invite_code: pending.trim() });
          try {
            localStorage.removeItem('pending_join_code');
          } catch {
            /* ignore */
          }
          await loadMyTrips();
          if (typeof data === 'string') {
            setActiveTrip(data);
            return;
          }
        } catch {
          try {
            localStorage.removeItem('pending_join_code');
          } catch {
            /* ignore */
          }
        }
      }

      const list = await loadMyTrips();
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(ACTIVE_TRIP_KEY);
      } catch {
        /* ignore */
      }
      if (stored && list.some((t) => t.id === stored)) {
        setActiveTrip(stored);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authEnabled, authReady, account]);

  // Signed in, a trip is open, but no membership on it → offer claim/join.
  // (With no trip open we show My Trips instead, not the claim gate.)
  const needsMembership =
    authEnabled && authReady && ready && !!account && !!activeTripId && !me;

  const claimMembership = useCallback(
    async (memberId: string) => {
      if (!supabase) return;
      const { error } = await supabase.rpc('claim_member', { p_member: memberId });
      if (error) throw error;
      await refetchAll();
    },
    [refetchAll]
  );

  // --- multi-trip (Phase 4) -------------------------------------------------
  // The trips the signed-in account is a member of (auth-on only).
  const loadMyTrips = useCallback(async () => {
    if (!supabase || !account) {
      setMyTrips([]);
      return [] as Trip[];
    }
    const { data: memberships } = await supabase
      .from('profiles')
      .select('trip_id')
      .eq('user_id', account.id)
      .is('left_at', null);
    const ids = Array.from(
      new Set(((memberships ?? []) as { trip_id: string }[]).map((m) => m.trip_id))
    );
    if (ids.length === 0) {
      setMyTrips([]);
      return [] as Trip[];
    }
    const { data: trips } = await supabase.from('trips').select('*').in('id', ids);
    const list = (trips ?? []) as Trip[];
    setMyTrips(list);
    return list;
  }, [account]);

  const setActiveTrip = useCallback<TripDataValue['setActiveTrip']>((tripId) => {
    setActiveTripIdState(tripId);
    activeTripIdRef.current = tripId;
    try {
      if (tripId) localStorage.setItem(ACTIVE_TRIP_KEY, tripId);
      else localStorage.removeItem(ACTIVE_TRIP_KEY);
    } catch {
      /* ignore */
    }
    // Reset the current trip's rows; refetchAll repopulates for the new trip.
    setMe(null);
    if (tripId) void refetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinTripByCode = useCallback<TripDataValue['joinTripByCode']>(
    async (code) => {
      if (!supabase) return;
      const { data, error } = await supabase.rpc('join_trip', {
        invite_code: code.trim(),
      });
      if (error) throw error;
      await loadMyTrips();
      if (typeof data === 'string') setActiveTrip(data);
    },
    [loadMyTrips, setActiveTrip]
  );

  const leaveTrip = useCallback<TripDataValue['leaveTrip']>(
    async (tripId) => {
      if (!supabase) return;
      const { error } = await supabase.rpc('leave_trip', { p_trip: tripId });
      if (error) throw new Error(error.message);
      if (activeTripIdRef.current === tripId) setActiveTrip(null);
      await loadMyTrips();
    },
    [loadMyTrips, setActiveTrip]
  );

  const createTrip = useCallback<TripDataValue['createTrip']>(
    async (input) => {
      if (!supabase) throw new Error('Not connected.');
      const { data, error } = await supabase.rpc('create_trip_v3', {
        p_name: input.name,
        p_owner_name: input.ownerName,
        p_home_currency: input.homeCurrency,
        p_destinations: input.destinations.map((destination) => ({
          country: destination.country,
          city: destination.city,
          start_date: destination.startDate,
          end_date: destination.endDate,
          accent_hex: destination.accentHex,
        })),
        p_destination_currencies: input.destinationCurrencies,
      });
      if (error) throw new Error(error.message || 'Could not create the trip.');
      const result = data as { trip_id?: string; invite_code?: string } | null;
      if (!result?.trip_id || !result.invite_code) {
        throw new Error('Trip created without an invitation. Please try again.');
      }
      await loadMyTrips();
      return { tripId: result.trip_id, inviteCode: result.invite_code };
    },
    [loadMyTrips]
  );

  const updateTrip = useCallback<TripDataValue['updateTrip']>(
    async (input) => {
      if (!supabase || !activeTripIdRef.current) {
        throw new Error('Open a trip before editing it.');
      }
      const { error } = await supabase.rpc('update_trip_v3', {
        p_trip: activeTripIdRef.current,
        p_name: input.name,
        p_home_currency: input.homeCurrency,
        p_destinations: input.destinations.map((destination) => ({
          country: destination.country,
          city: destination.city,
          start_date: destination.startDate,
          end_date: destination.endDate,
          accent_hex: destination.accentHex,
        })),
        p_destination_currencies: input.destinationCurrencies,
      });
      if (error) throw new Error(error.message || 'Could not update the trip.');
      await Promise.all([loadMyTrips(), refetchAll()]);
    },
    [loadMyTrips, refetchAll]
  );

  // Upload an avatar photo into the shared bucket under a stable key so it
  // overwrites cleanly. Best-effort: returns null if storage/column isn't set
  // up yet so profile creation never hard-fails on the photo.
  const uploadAvatar = async (profileId: string, file: File): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const compressed = await compressToWebp(file);
      const path = `avatars/${profileId}.webp`;
      const up = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, compressed, { upsert: true, contentType: compressed.type || 'image/webp' });
      if (up.error) return null;
      const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      return `${data.publicUrl}?v=${Date.now()}`;
    } catch {
      return null;
    }
  };

  const ensureProfile = useCallback(
    async (rawName: string, photo?: File | null): Promise<Profile> => {
      const name = rawName.trim();
      if (!name) throw new Error('Please enter your name.');

      if (demoMode) {
        const existing = profiles.find(
          (p) => p.name.toLowerCase() === name.toLowerCase()
        );
        const avatar_url = photo
          ? await fileToDataUrl(await compressToWebp(photo))
          : existing?.avatar_url ?? null;
        const profile: Profile = existing
          ? { ...existing, avatar_url }
          : { id: genId(), name, avatar_url };
        setProfiles((prev) =>
          prev.some((p) => p.id === profile.id)
            ? prev.map((p) => (p.id === profile.id ? profile : p))
            : [...prev, profile]
        );
        persistMe(profile);
        return profile;
      }

      // Supabase: case-insensitive lookup, else insert.
      const { data: found } = await supabase!
        .from('profiles')
        .select('*')
        .ilike('name', name)
        .limit(1)
        .maybeSingle();
      let profile = (found as Profile) ?? null;

      if (!profile) {
        const { data: created, error } = await supabase!
          .from('profiles')
          .insert({ name, trip_id: activeTripIdRef.current! })
          .select()
          .single();
        if (error || !created) throw error ?? new Error('Could not create profile');
        profile = created as Profile;
      }

      if (photo) {
        const url = await uploadAvatar(profile.id, photo);
        if (url) {
          await supabase!.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
          profile = { ...profile, avatar_url: url };
        }
      }

      persistMe(profile);
      await refetchAll();
      return profile;
    },
    [demoMode, profiles, refetchAll]
  );

  const signInAs = useCallback((profile: Profile) => persistMe(profile), []);

  const updateMyName = useCallback<TripDataValue['updateMyName']>(
    async (rawName) => {
      if (!me) throw new Error('No traveler profile is selected.');
      const name = rawName.trim();
      if (!name) throw new Error('Enter a display name.');
      if (name === me.name) return;
      const updated = { ...me, name };
      if (demoMode) {
        setProfiles((previous) =>
          previous.map((profile) => (profile.id === me.id ? updated : profile))
        );
        persistMe(updated);
        return;
      }
      const { error } = await supabase!
        .from('profiles')
        .update({ name })
        .eq('id', me.id);
      if (error) {
        throw new Error(
          error.code === '23505'
            ? 'Someone on this trip is already using that name.'
            : error.message
        );
      }
      persistMe(updated);
      await refetchAll();
    },
    [demoMode, me, refetchAll]
  );

  const setMyPhoto = useCallback<TripDataValue['setMyPhoto']>(
    async (file) => {
      if (!me) return;
      if (demoMode) {
        const avatar_url = await fileToDataUrl(await compressToWebp(file));
        const updated = { ...me, avatar_url };
        setProfiles((prev) => prev.map((p) => (p.id === me.id ? updated : p)));
        persistMe(updated);
        return;
      }
      const url = await uploadAvatar(me.id, file);
      if (!url) return;
      await supabase!.from('profiles').update({ avatar_url: url }).eq('id', me.id);
      persistMe({ ...me, avatar_url: url });
      await refetchAll();
    },
    [demoMode, me, refetchAll]
  );

  const signOut = useCallback(() => persistMe(null), []);

  // --- activity events --------------------------------------------------
  // Best-effort log feeding batched push notifications: record the event,
  // then poke the dispatcher (which sends immediate-tier pushes and flushes
  // any batch that hit the count threshold). A logging failure must never
  // break the user's action, so everything is swallowed.
  const recordActivity = useCallback(
    async (
      eventType: EventType,
      payload: Record<string, unknown>,
      recipientId?: string
    ) => {
      if (demoMode || !me) return;
      try {
        const { data } = await supabase!
          .from('activity_events')
          .insert({
            trip_id: activeTripIdRef.current!,
            event_type: eventType,
            actor_id: me.id,
            recipient_id: recipientId ?? null,
            payload,
          })
          .select('id')
          .single();
        void fetch('/api/notifications/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: data?.id }),
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    },
    [demoMode, me]
  );

  // Opening or returning to the app marks the trip's activity as seen, so
  // already-viewed events can never trigger a push later.
  useEffect(() => {
    if (demoMode || !me) return;
    const markSeen = () => {
      supabase!
        .from('notification_state')
        .upsert(
          { profile_id: me.id, trip_id: activeTripIdRef.current!, last_seen_at: new Date().toISOString() },
          { onConflict: 'profile_id,trip_id' }
        )
        .then(() => {});
    };
    markSeen();
    const onVisible = () => {
      if (document.visibilityState === 'visible') markSeen();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [demoMode, me]);

  // --- itinerary ------------------------------------------------------------
  const addItineraryItem = useCallback<TripDataValue['addItineraryItem']>(
    async (input) => {
      if (demoMode) {
        setItinerary((prev) => [...prev, { ...input, id: genId(), photo_url: null }]);
        return;
      }
      await supabase!.from('itinerary_items').insert({ ...input, trip_id: activeTripIdRef.current! });
      void recordActivity('activity_added', {
        title: input.title,
        day_number: input.day_number,
      });
      await refetchAll();
    },
    [demoMode, recordActivity, refetchAll]
  );

  // Anyone can edit any activity (no ownership). Updates title/time/location/notes/day;
  // photos stay attached via activity_id. No notification — feed is add-only.
  const updateItineraryItem = useCallback<TripDataValue['updateItineraryItem']>(
    async (id, input) => {
      if (demoMode) {
        setItinerary((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...input } : i))
        );
        return;
      }
      await supabase!
        .from('itinerary_items')
        .update({
          day_number: input.day_number,
          time_label: input.time_label,
          end_time_label: input.end_time_label,
          title: input.title,
          location: input.location,
          notes: input.notes,
        })
        .eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const deleteItineraryItem = useCallback<TripDataValue['deleteItineraryItem']>(
    async (id) => {
      if (demoMode) {
        setItinerary((prev) => prev.filter((i) => i.id !== id));
        setPhotos((prev) => prev.filter((p) => p.activity_id !== id));
        return;
      }
      await supabase!.from('itinerary_items').delete().eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  // --- photos ---------------------------------------------------------------
  // Multiple photos per activity. Every upload is compressed to ≤1200px WebP
  // first (see lib/image.ts) and tagged with the uploader by default.
  const addPhotos = useCallback<TripDataValue['addPhotos']>(
    async (activityId, files) => {
      // Only credit an uploader when `me` resolves to a real profiles row —
      // otherwise Postgres rejects the insert (photos_uploaded_by_id_fkey).
      const uploader =
        me && profiles.some((p) => p.id === me.id) ? me : null;
      const uploaded_by_id = uploader?.id ?? null;
      const tagged = uploader ? [uploader.id] : [];

      if (demoMode) {
        const added: Photo[] = [];
        for (const file of files) {
          const url = await fileToDataUrl(await compressToWebp(file));
          added.push({
            id: genId(),
            activity_id: activityId,
            url,
            uploaded_by_id,
            tagged_user_ids: tagged,
            created_at: new Date().toISOString(),
          });
        }
        setPhotos((prev) => [...prev, ...added]);
        return;
      }

      for (const file of files) {
        const compressed = await compressToWebp(file);
        const id = genId();
        const path = `photos/${activityId}/${id}.webp`;
        const up = await supabase!.storage
          .from(SUPABASE_BUCKET)
          .upload(path, compressed, { contentType: compressed.type || 'image/webp' });
        if (up.error) throw up.error;
        const { data: pub } = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
        const ins = await supabase!.from('photos').insert({
          id,
          trip_id: activeTripIdRef.current!,
          activity_id: activityId,
          url: pub.publicUrl,
          uploaded_by_id,
          tagged_user_ids: tagged,
        });
        if (ins.error) {
          // Don't leave an orphan object if the row insert failed.
          await supabase!.storage.from(SUPABASE_BUCKET).remove([path]);
          throw ins.error;
        }
        void recordActivity('photo_added', { activity_id: activityId });
      }
      await refetchAll();
    },
    [demoMode, me, profiles, recordActivity, refetchAll]
  );

  const deletePhoto = useCallback<TripDataValue['deletePhoto']>(
    async (id) => {
      if (demoMode) {
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        return;
      }
      const photo = photos.find((p) => p.id === id);
      await supabase!.from('photos').delete().eq('id', id);
      // Best-effort storage cleanup — the row is the source of truth.
      const marker = `/object/public/${SUPABASE_BUCKET}/`;
      const idx = photo?.url.indexOf(marker) ?? -1;
      if (photo && idx >= 0) {
        const path = photo.url.slice(idx + marker.length).split('?')[0];
        await supabase!.storage.from(SUPABASE_BUCKET).remove([decodeURIComponent(path)]);
      }
      await refetchAll();
    },
    [demoMode, photos, refetchAll]
  );

  // --- finance --------------------------------------------------------------
  const updateCurrencyRates = useCallback<TripDataValue['updateCurrencyRates']>(
    async (rates) => {
      if (demoMode) {
        setCurrencies((previous) =>
          previous.map((currency) =>
            rates[currency.code] == null
              ? currency
              : { ...currency, rate_per_base: round2(rates[currency.code]) }
          )
        );
        return;
      }
      const tripId = activeTripIdRef.current;
      if (!tripId) throw new Error('Open a trip before updating rates.');
      const updates = await Promise.all(
        Object.entries(rates).map(([code, rate]) =>
          supabase!
            .from('trip_currencies')
            .update({
              rate_per_base: round2(rate),
              updated_at: new Date().toISOString(),
            })
            .eq('trip_id', tripId)
            .eq('code', code)
        )
      );
      const failed = updates.find((result) => result.error);
      if (failed?.error) throw failed.error;
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const addExpense = useCallback<TripDataValue['addExpense']>(
    async ({
      label,
      dayNumber,
      amount,
      currency,
      paidById,
      participantIds,
      customSharesLocal,
      imageFile,
    }) => {
      const baseGbp = toBase(amount, currency, currencies);
      const parts = participantIds.length ? participantIds : [paidById];
      const shares = resolveSharesGbp(parts, amount, baseGbp, customSharesLocal);

      if (demoMode) {
        const expId = genId();
        const image_url = imageFile
          ? await fileToDataUrl(await compressToWebp(imageFile))
          : null;
        setExpenses((prev) => [
          ...prev,
          {
            id: expId,
            activity_id: null,
            label,
            day_number: dayNumber,
            kind: 'manual',
            local_amount: round2(amount),
            local_currency: currency,
            base_amount_gbp: baseGbp,
            paid_by_id: paidById,
            image_url,
          },
        ]);
        setSplits((prev) => [
          ...prev,
          ...parts.map((uid, i) => ({
            id: genId(),
            expense_id: expId,
            user_id: uid,
            amount_owed: shares[i],
          })),
        ]);
        return;
      }

      const { data: exp, error } = await supabase!
        .from('expenses')
        .insert({
          trip_id: activeTripIdRef.current!,
          label,
          day_number: dayNumber,
          kind: 'manual',
          local_amount: round2(amount),
          local_currency: currency,
          base_amount_gbp: baseGbp,
          paid_by_id: paidById,
        })
        .select()
        .single();
      if (error || !exp) throw error ?? new Error('Could not save expense');

      let image_url: string | null = null;
      if (imageFile) {
        const compressed = await compressToWebp(imageFile);
        const path = `expenses/${(exp as Expense).id}.webp`;
        const up = await supabase!.storage
          .from(SUPABASE_BUCKET)
          .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
        if (up.error) throw up.error;
        image_url = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
        const { error: imgErr } = await supabase!
          .from('expenses')
          .update({ image_url })
          .eq('id', (exp as Expense).id);
        if (imgErr) throw imgErr;
      }

      await supabase!.from('expense_splits').insert(
        parts.map((uid, i) => ({
          trip_id: activeTripIdRef.current!,
          expense_id: (exp as Expense).id,
          user_id: uid,
          amount_owed: shares[i],
        }))
      );
      void recordActivity('expense_added', {
        label,
        amount_gbp: formatBaseCurrency(baseGbp, trip.base_currency, currencies),
      });
      // Immediate tier: everyone pulled into the split (except the actor,
      // filtered server-side too) gets a targeted push right away.
      parts.forEach((uid, i) => {
        if (uid === me?.id) return;
        void recordActivity(
          'expense_split_added',
          {
            label,
            amount_gbp: formatBaseCurrency(shares[i], trip.base_currency, currencies),
            actor_name: me?.name,
          },
          uid
        );
      });
      await refetchAll();
    },
    [currencies, demoMode, me, recordActivity, refetchAll, trip.base_currency]
  );

  // Edit an existing expense. Manual expenses rebuild splits from the new
  // amount/participants (equal or custom); receipt expenses keep their line
  // items (claims drive the settlement) and just sync the merchant label.
  const updateExpense = useCallback<TripDataValue['updateExpense']>(
    async (
      id,
      {
        label,
        dayNumber,
        amount,
        currency,
        paidById,
        participantIds,
        customSharesLocal,
        imageFile,
        removeImage,
      }
    ) => {
      const existing = expenses.find((e) => e.id === id);
      if (!existing) return;
      const isManual = existing.kind !== 'receipt';
      const baseGbp = toBase(amount, currency, currencies);
      const parts = participantIds.length ? participantIds : [paidById];
      const shares = resolveSharesGbp(parts, amount, baseGbp, customSharesLocal);

      let nextImageUrl = existing.image_url ?? null;
      if (imageFile) {
        if (demoMode) {
          nextImageUrl = await fileToDataUrl(await compressToWebp(imageFile));
        } else {
          const compressed = await compressToWebp(imageFile);
          const path = `expenses/${id}.webp`;
          const up = await supabase!.storage
            .from(SUPABASE_BUCKET)
            .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
          if (up.error) throw up.error;
          nextImageUrl = supabase!.storage
            .from(SUPABASE_BUCKET)
            .getPublicUrl(path).data.publicUrl;
        }
      } else if (removeImage) {
        nextImageUrl = null;
      }

      const patch = {
        label,
        day_number: dayNumber,
        local_amount: round2(amount),
        local_currency: currency,
        base_amount_gbp: baseGbp,
        paid_by_id: paidById,
        ...(isManual ? { image_url: nextImageUrl } : {}),
      };

      if (demoMode) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
        if (isManual) {
          setSplits((prev) => [
            ...prev.filter((s) => s.expense_id !== id),
            ...parts.map((uid, i) => ({
              id: genId(),
              expense_id: id,
              user_id: uid,
              amount_owed: shares[i],
            })),
          ]);
        } else {
          setReceipts((prev) =>
            prev.map((r) => (r.expense_id === id ? { ...r, merchant: label } : r))
          );
        }
        return;
      }

      const { error } = await supabase!.from('expenses').update(patch).eq('id', id);
      if (error) throw error;
      if (isManual) {
        await supabase!.from('expense_splits').delete().eq('expense_id', id);
        await supabase!.from('expense_splits').insert(
          parts.map((uid, i) => ({
            trip_id: activeTripIdRef.current!,
            expense_id: id,
            user_id: uid,
            amount_owed: shares[i],
          }))
        );
      } else {
        await supabase!.from('receipts').update({ merchant: label }).eq('expense_id', id);
      }
      await refetchAll();
    },
    [currencies, demoMode, expenses, refetchAll]
  );

  // Save a scanned/edited receipt: one expense (kind 'receipt') + a receipt
  // row + its line items. Items start unclaimed unless claimed in review.
  const addReceiptExpense = useCallback<TripDataValue['addReceiptExpense']>(
    async ({ merchant, dayNumber, currency, total, paidById, items, imageFile }) => {
      const label = merchant.trim() || 'Receipt';
      const baseGbp = toBase(total, currency, currencies);
      const cleanItems = items
        .map((i) => ({
          name: i.name.trim() || 'Item',
          quantity: Math.max(1, Math.round(i.quantity) || 1),
          local_amount: round2(i.price),
        }))
        .filter((i) => i.local_amount > 0);

      if (demoMode) {
        const expId = genId();
        const receiptId = genId();
        const imageUrl = imageFile ? await fileToDataUrl(await compressToWebp(imageFile)) : null;
        setExpenses((prev) => [
          ...prev,
          {
            id: expId,
            activity_id: null,
            label,
            day_number: dayNumber,
            kind: 'receipt',
            local_amount: round2(total),
            local_currency: currency,
            base_amount_gbp: baseGbp,
            paid_by_id: paidById,
          },
        ]);
        setReceipts((prev) => [
          ...prev,
          { id: receiptId, expense_id: expId, merchant: label, image_url: imageUrl },
        ]);
        setReceiptItems((prev) => [
          ...prev,
          ...cleanItems.map((i) => ({
            id: genId(),
            receipt_id: receiptId,
            ...i,
            claimed_by_id: null,
          })),
        ]);
        return;
      }

      const { data: exp, error } = await supabase!
        .from('expenses')
        .insert({
          trip_id: activeTripIdRef.current!,
          label,
          day_number: dayNumber,
          kind: 'receipt',
          local_amount: round2(total),
          local_currency: currency,
          base_amount_gbp: baseGbp,
          paid_by_id: paidById,
        })
        .select()
        .single();
      if (error || !exp) throw error ?? new Error('Could not save receipt');

      let image_url: string | null = null;
      if (imageFile) {
        const compressed = await compressToWebp(imageFile);
        const path = `receipts/${(exp as Expense).id}.webp`;
        const up = await supabase!.storage
          .from(SUPABASE_BUCKET)
          .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
        if (up.error) throw up.error;
        image_url = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      const { data: receipt, error: rErr } = await supabase!
        .from('receipts')
        .insert({ trip_id: activeTripIdRef.current!, expense_id: (exp as Expense).id, merchant: label, image_url })
        .select()
        .single();
      if (rErr || !receipt) throw rErr ?? new Error('Could not save receipt');

      if (cleanItems.length) {
        await supabase!.from('receipt_items').insert(
          cleanItems.map((i) => ({ trip_id: activeTripIdRef.current!, receipt_id: (receipt as Receipt).id, ...i }))
        );
      }
      void recordActivity('expense_added', {
        label,
        amount_gbp: formatBaseCurrency(baseGbp, trip.base_currency, currencies),
        kind: 'receipt',
      });
      await refetchAll();
    },
    [currencies, demoMode, recordActivity, refetchAll, trip.base_currency]
  );

  // Update an existing receipt expense + its line items. Keeps claims on
  // items that still exist (matched by id); removed lines drop their claims.
  const updateReceiptExpense = useCallback<TripDataValue['updateReceiptExpense']>(
    async (expenseId, { merchant, dayNumber, currency, total, paidById, items, imageFile }) => {
      const label = merchant.trim() || 'Receipt';
      const baseGbp = toBase(total, currency, currencies);
      const cleanItems = items
        .map((i) => ({
          id: i.id,
          name: i.name.trim() || 'Item',
          quantity: Math.max(1, Math.round(i.quantity) || 1),
          local_amount: round2(i.price),
          claimed_by_id: i.claimed_by_id ?? null,
        }))
        .filter((i) => i.local_amount > 0);

      const existingReceipt = receipts.find((r) => r.expense_id === expenseId);
      if (!existingReceipt) throw new Error('Receipt not found');

      if (demoMode) {
        setExpenses((prev) =>
          prev.map((e) =>
            e.id === expenseId
              ? {
                  ...e,
                  label,
                  day_number: dayNumber,
                  local_amount: round2(total),
                  local_currency: currency,
                  base_amount_gbp: baseGbp,
                  paid_by_id: paidById,
                }
              : e
          )
        );
        let imageUrl = existingReceipt.image_url;
        if (imageFile) {
          imageUrl = await fileToDataUrl(await compressToWebp(imageFile));
        }
        setReceipts((prev) =>
          prev.map((r) =>
            r.id === existingReceipt.id
              ? { ...r, merchant: label, image_url: imageUrl }
              : r
          )
        );
        setReceiptItems((prev) => {
          const others = prev.filter((i) => i.receipt_id !== existingReceipt.id);
          const previous = prev.filter((i) => i.receipt_id === existingReceipt.id);
          const next = cleanItems.map((i) => {
            const prior = i.id ? previous.find((p) => p.id === i.id) : undefined;
            return {
              id: prior?.id ?? genId(),
              receipt_id: existingReceipt.id,
              name: i.name,
              quantity: i.quantity,
              local_amount: i.local_amount,
              claimed_by_id: prior?.claimed_by_id ?? i.claimed_by_id ?? null,
            };
          });
          return [...others, ...next];
        });
        return;
      }

      const { error } = await supabase!
        .from('expenses')
        .update({
          label,
          day_number: dayNumber,
          local_amount: round2(total),
          local_currency: currency,
          base_amount_gbp: baseGbp,
          paid_by_id: paidById,
        })
        .eq('id', expenseId);
      if (error) throw error;

      let image_url = existingReceipt.image_url;
      if (imageFile) {
        const compressed = await compressToWebp(imageFile);
        const path = `receipts/${expenseId}.webp`;
        const up = await supabase!.storage
          .from(SUPABASE_BUCKET)
          .upload(path, compressed, { upsert: true, contentType: 'image/webp' });
        if (up.error) throw up.error;
        image_url = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      await supabase!
        .from('receipts')
        .update({ merchant: label, image_url })
        .eq('id', existingReceipt.id);

      // Replace line items while preserving claims on surviving ids.
      const previous = receiptItems.filter((i) => i.receipt_id === existingReceipt.id);
      const keepIds = cleanItems.map((i) => i.id).filter(Boolean) as string[];
      const toDelete = previous.filter((p) => !keepIds.includes(p.id)).map((p) => p.id);
      if (toDelete.length) {
        await supabase!.from('receipt_items').delete().in('id', toDelete);
      }
      for (const i of cleanItems) {
        if (i.id && previous.some((p) => p.id === i.id)) {
          await supabase!
            .from('receipt_items')
            .update({
              name: i.name,
              quantity: i.quantity,
              local_amount: i.local_amount,
            })
            .eq('id', i.id);
        } else {
          await supabase!.from('receipt_items').insert({
            trip_id: activeTripIdRef.current!,
            receipt_id: existingReceipt.id,
            name: i.name,
            quantity: i.quantity,
            local_amount: i.local_amount,
          });
        }
      }
      await refetchAll();
    },
    [currencies, demoMode, receipts, receiptItems, refetchAll]
  );

  // Claim (userId) or release (null) a receipt line item.
  const setItemClaim = useCallback<TripDataValue['setItemClaim']>(
    async (itemId, userId) => {
      // Optimistic update for a snappy claim toggle; realtime reconciles.
      setReceiptItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, claimed_by_id: userId } : i))
      );
      if (demoMode) return;
      await supabase!.from('receipt_items').update({ claimed_by_id: userId }).eq('id', itemId);
    },
    [demoMode]
  );

  const deleteExpense = useCallback<TripDataValue['deleteExpense']>(
    async (id) => {
      if (demoMode) {
        const receiptIds = receipts.filter((r) => r.expense_id === id).map((r) => r.id);
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        setSplits((prev) => prev.filter((s) => s.expense_id !== id));
        setReceipts((prev) => prev.filter((r) => r.expense_id !== id));
        setReceiptItems((prev) => prev.filter((i) => !receiptIds.includes(i.receipt_id)));
        return;
      }
      await supabase!.from('expenses').delete().eq('id', id); // cascades receipt + items
      await refetchAll();
    },
    [demoMode, receipts, refetchAll]
  );

  // Log a peer-to-peer settlement. Modeled as a GBP 'settlement' expense paid
  // by the debtor with a single split assigning the full amount to the
  // receiver, so the existing net-balance math clears both sides. No activity
  // notification — this isn't ambient group spend. Reverse it with
  // deleteExpense (cascades the split).
  const settleUp = useCallback<TripDataValue['settleUp']>(
    async (fromId, toId, amount) => {
      const value = round2(amount);
      if (value <= 0 || fromId === toId) return;

      if (demoMode) {
        const expId = genId();
        setExpenses((prev) => [
          ...prev,
          {
            id: expId,
            activity_id: null,
            label: SETTLEMENT_LABEL,
            day_number: null,
            kind: 'settlement',
            local_amount: value,
            local_currency: 'GBP',
            base_amount_gbp: value,
            paid_by_id: fromId,
            created_at: new Date().toISOString(),
          },
        ]);
        setSplits((prev) => [
          ...prev,
          { id: genId(), expense_id: expId, user_id: toId, amount_owed: value },
        ]);
        return;
      }

      const { data: exp, error } = await supabase!
        .from('expenses')
        .insert({
          trip_id: activeTripIdRef.current!,
          label: SETTLEMENT_LABEL,
          kind: 'settlement',
          local_amount: value,
          local_currency: 'GBP',
          base_amount_gbp: value,
          paid_by_id: fromId,
        })
        .select()
        .single();
      if (error || !exp) throw error ?? new Error('Could not log settlement');
      await supabase!
        .from('expense_splits')
        .insert({ trip_id: activeTripIdRef.current!, expense_id: (exp as Expense).id, user_id: toId, amount_owed: value });
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  // --- stats ------------------------------------------------------------
  // Upsert my count for one category on one day (poop/drink/mosquito/coffee).
  const setStat = useCallback<TripDataValue['setStat']>(
    async (dayNumber, category, count) => {
      if (!me) return;
      const clamped = Math.max(0, Math.round(count));
      // Optimistic local update so +/− steppers feel instant.
      setStats((prev) => {
        const existing = prev.find(
          (s) => s.user_id === me.id && s.day_number === dayNumber && s.category === category
        );
        if (existing) {
          return prev.map((s) => (s.id === existing.id ? { ...s, count: clamped } : s));
        }
        return [
          ...prev,
          { id: genId(), user_id: me.id, day_number: dayNumber, category, count: clamped },
        ];
      });
      if (demoMode) return;
      await supabase!
        .from('stat_entries')
        .upsert(
          {
            trip_id: activeTripIdRef.current!,
            user_id: me.id,
            day_number: dayNumber,
            category,
            count: clamped,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,day_number,category' }
        );
    },
    [demoMode, me]
  );

  const value = useMemo<TripDataValue>(
    () => ({
      ready,
      demoMode,
      me,
      needsMembership,
      claimMembership,
      joinTripByCode,
      leaveTrip,
      activeTripId,
      myTrips,
      setActiveTrip,
      createTrip,
      updateTrip,
      profiles,
      settings,
      trip,
      tripDays,
      currencies,
      itinerary,
      photos,
      expenses,
      splits,
      receipts,
      receiptItems,
      stats,
      ensureProfile,
      signInAs,
      updateMyName,
      setMyPhoto,
      signOut,
      addItineraryItem,
      updateItineraryItem,
      deleteItineraryItem,
      addPhotos,
      deletePhoto,
      updateCurrencyRates,
      addExpense,
      updateExpense,
      addReceiptExpense,
      updateReceiptExpense,
      setItemClaim,
      deleteExpense,
      settleUp,
      setStat,
    }),
    [
      ready,
      demoMode,
      me,
      needsMembership,
      claimMembership,
      joinTripByCode,
      leaveTrip,
      activeTripId,
      myTrips,
      setActiveTrip,
      createTrip,
      updateTrip,
      profiles,
      settings,
      trip,
      tripDays,
      currencies,
      itinerary,
      photos,
      expenses,
      splits,
      receipts,
      receiptItems,
      stats,
      ensureProfile,
      signInAs,
      updateMyName,
      setMyPhoto,
      signOut,
      addItineraryItem,
      updateItineraryItem,
      deleteItineraryItem,
      addPhotos,
      deletePhoto,
      updateCurrencyRates,
      addExpense,
      updateExpense,
      addReceiptExpense,
      updateReceiptExpense,
      setItemClaim,
      deleteExpense,
      settleUp,
      setStat,
    ]
  );

  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>;
}
