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
import { toGbp, round2, splitEqually } from '@/lib/currency';
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
  TripSettings,
} from '@/lib/types';

const ME_KEY = 'travel_user_profile';
const DEMO_KEY = 'travel_demo_state_v2';

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface NewExpenseInput {
  label: string;
  dayNumber: number;
  amount: number;
  currency: CurrencyCode;
  paidById: string;
  participantIds: string[];
}

export interface NewReceiptInput {
  merchant: string;
  dayNumber: number;
  currency: CurrencyCode;
  total: number;
  paidById: string;
  items: { name: string; quantity: number; price: number }[];
  imageFile?: File | null;
}

interface TripDataValue {
  ready: boolean;
  demoMode: boolean;
  me: Profile | null;
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
  setMyPhoto: (file: File) => Promise<void>;
  signOut: () => void;

  addItineraryItem: (input: Omit<ItineraryItem, 'id' | 'photo_url'>) => Promise<void>;
  deleteItineraryItem: (id: string) => Promise<void>;

  addPhotos: (activityId: string, files: File[]) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  updateRates: (vnd: number, thb: number) => Promise<void>;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  addReceiptExpense: (input: NewReceiptInput) => Promise<void>;
  setItemClaim: (itemId: string, userId: string | null) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

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

  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<TripSettings>(DEMO_SETTINGS);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [stats, setStats] = useState<StatEntry[]>([]);

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
    const [p, s, it, ph, ex, sp, rc, ri, st] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('trip_settings').select('*').eq('id', 1).single(),
      supabase.from('itinerary_items').select('*').order('day_number').order('created_at'),
      supabase.from('photos').select('*').order('created_at'),
      supabase.from('expenses').select('*').order('created_at'),
      supabase.from('expense_splits').select('*'),
      supabase.from('receipts').select('*'),
      supabase.from('receipt_items').select('*').order('created_at'),
      supabase.from('stat_entries').select('*'),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setSettings(s.data as TripSettings);
    if (it.data) setItinerary(it.data as ItineraryItem[]);
    if (ph.data) setPhotos(ph.data as Photo[]);
    if (ex.data) setExpenses(ex.data as Expense[]);
    if (sp.data) setSplits(sp.data as ExpenseSplit[]);
    if (rc.data) setReceipts(rc.data as Receipt[]);
    if (ri.data) setReceiptItems(ri.data as ReceiptItem[]);
    if (st.data) setStats(st.data as StatEntry[]);
  }, []);

  useEffect(() => {
    let mounted = true;

    // Restore the signed-in profile from localStorage (the login bypass).
    try {
      const raw = localStorage.getItem(ME_KEY);
      if (raw) setMe(JSON.parse(raw) as Profile);
    } catch {
      /* ignore */
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
          .insert({ name })
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

  // --- itinerary ------------------------------------------------------------
  const addItineraryItem = useCallback<TripDataValue['addItineraryItem']>(
    async (input) => {
      if (demoMode) {
        setItinerary((prev) => [...prev, { ...input, id: genId(), photo_url: null }]);
        return;
      }
      await supabase!.from('itinerary_items').insert(input);
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
      const tagged = me ? [me.id] : [];
      if (demoMode) {
        const added: Photo[] = [];
        for (const file of files) {
          const url = await fileToDataUrl(await compressToWebp(file));
          added.push({
            id: genId(),
            activity_id: activityId,
            url,
            uploaded_by_id: me?.id ?? null,
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
        await supabase!.from('photos').insert({
          id,
          activity_id: activityId,
          url: pub.publicUrl,
          uploaded_by_id: me?.id ?? null,
          tagged_user_ids: tagged,
        });
      }
      await refetchAll();
    },
    [demoMode, me, refetchAll]
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
  const updateRates = useCallback<TripDataValue['updateRates']>(
    async (vnd, thb) => {
      const next = { id: 1 as const, vnd_per_gbp: round2(vnd), thb_per_gbp: round2(thb) };
      if (demoMode) {
        setSettings(next);
        return;
      }
      await supabase!
        .from('trip_settings')
        .update({ vnd_per_gbp: next.vnd_per_gbp, thb_per_gbp: next.thb_per_gbp, updated_at: new Date().toISOString() })
        .eq('id', 1);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const addExpense = useCallback<TripDataValue['addExpense']>(
    async ({ label, dayNumber, amount, currency, paidById, participantIds }) => {
      const baseGbp = toGbp(amount, currency, settings);
      const parts = participantIds.length ? participantIds : [paidById];
      const shares = splitEqually(baseGbp, parts.length);

      if (demoMode) {
        const expId = genId();
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
      await supabase!.from('expense_splits').insert(
        parts.map((uid, i) => ({
          expense_id: (exp as Expense).id,
          user_id: uid,
          amount_owed: shares[i],
        }))
      );
      await refetchAll();
    },
    [demoMode, refetchAll, settings]
  );

  // Save a scanned/edited receipt: one expense (kind 'receipt') + a receipt
  // row + its line items. Items start unclaimed unless claimed in review.
  const addReceiptExpense = useCallback<TripDataValue['addReceiptExpense']>(
    async ({ merchant, dayNumber, currency, total, paidById, items, imageFile }) => {
      const label = merchant.trim() || 'Receipt';
      const baseGbp = toGbp(total, currency, settings);
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
        if (!up.error) {
          image_url = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path).data.publicUrl;
        }
      }

      const { data: receipt, error: rErr } = await supabase!
        .from('receipts')
        .insert({ expense_id: (exp as Expense).id, merchant: label, image_url })
        .select()
        .single();
      if (rErr || !receipt) throw rErr ?? new Error('Could not save receipt');

      if (cleanItems.length) {
        await supabase!.from('receipt_items').insert(
          cleanItems.map((i) => ({ receipt_id: (receipt as Receipt).id, ...i }))
        );
      }
      await refetchAll();
    },
    [demoMode, refetchAll, settings]
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
      profiles,
      settings,
      itinerary,
      photos,
      expenses,
      splits,
      receipts,
      receiptItems,
      stats,
      ensureProfile,
      signInAs,
      setMyPhoto,
      signOut,
      addItineraryItem,
      deleteItineraryItem,
      addPhotos,
      deletePhoto,
      updateRates,
      addExpense,
      addReceiptExpense,
      setItemClaim,
      deleteExpense,
      setStat,
    }),
    [
      ready,
      demoMode,
      me,
      profiles,
      settings,
      itinerary,
      photos,
      expenses,
      splits,
      receipts,
      receiptItems,
      stats,
      ensureProfile,
      signInAs,
      setMyPhoto,
      signOut,
      addItineraryItem,
      deleteItineraryItem,
      addPhotos,
      deletePhoto,
      updateRates,
      addExpense,
      addReceiptExpense,
      setItemClaim,
      deleteExpense,
      setStat,
    ]
  );

  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>;
}
