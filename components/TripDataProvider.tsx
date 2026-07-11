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
import {
  DEMO_CHECKLIST,
  DEMO_EXPENSES,
  DEMO_ITINERARY,
  DEMO_PROFILES,
  DEMO_SETTINGS,
  DEMO_SPLITS,
} from '@/lib/demo';
import type {
  ChecklistItem,
  CurrencyCode,
  Expense,
  ExpenseSplit,
  ItineraryItem,
  Profile,
  TripSettings,
} from '@/lib/types';

const ME_KEY = 'travel_user_profile';
const DEMO_KEY = 'travel_demo_state';

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface NewExpenseInput {
  activityId: string;
  amount: number;
  currency: CurrencyCode;
  paidById: string;
  participantIds: string[];
}

interface TripDataValue {
  ready: boolean;
  demoMode: boolean;
  me: Profile | null;
  profiles: Profile[];
  settings: TripSettings;
  itinerary: ItineraryItem[];
  expenses: Expense[];
  splits: ExpenseSplit[];
  checklist: ChecklistItem[];

  ensureProfile: (name: string, photo?: File | null) => Promise<Profile>;
  signInAs: (profile: Profile) => void;
  setMyPhoto: (file: File) => Promise<void>;
  signOut: () => void;

  addItineraryItem: (input: Omit<ItineraryItem, 'id' | 'photo_url'>) => Promise<void>;
  deleteItineraryItem: (id: string) => Promise<void>;
  setPhoto: (activityId: string, file: File) => Promise<void>;

  updateRates: (vnd: number, thb: number) => Promise<void>;
  addExpense: (input: NewExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addChecklistItem: (label: string, scope: 'group' | 'individual') => Promise<void>;
  toggleChecklist: (id: string, checked: boolean) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  // --- demo persistence -----------------------------------------------------
  const persistDemo = useRef<() => void>(() => {});
  persistDemo.current = () => {
    if (!demoMode) return;
    try {
      localStorage.setItem(
        DEMO_KEY,
        JSON.stringify({ profiles, settings, itinerary, expenses, splits, checklist })
      );
    } catch {
      /* localStorage may be full (e.g. large photo data URLs) — ignore */
    }
  };
  useEffect(() => {
    if (demoMode && ready) persistDemo.current();
  }, [demoMode, ready, profiles, settings, itinerary, expenses, splits, checklist]);

  // --- initial load ---------------------------------------------------------
  const refetchAll = useCallback(async () => {
    if (!supabase) return;
    const [p, s, it, ex, sp, cl] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('trip_settings').select('*').eq('id', 1).single(),
      supabase.from('itinerary_items').select('*').order('day_number').order('created_at'),
      supabase.from('expenses').select('*').order('created_at'),
      supabase.from('expense_splits').select('*'),
      supabase.from('checklist_items').select('*').order('created_at'),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setSettings(s.data as TripSettings);
    if (it.data) setItinerary(it.data as ItineraryItem[]);
    if (ex.data) setExpenses(ex.data as Expense[]);
    if (sp.data) setSplits(sp.data as ExpenseSplit[]);
    if (cl.data) setChecklist(cl.data as ChecklistItem[]);
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
        expenses: DEMO_EXPENSES,
        splits: DEMO_SPLITS,
        checklist: DEMO_CHECKLIST,
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
      setExpenses(state.expenses);
      setSplits(state.splits);
      setChecklist(state.checklist);
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
      const path = `avatars/${profileId}.jpg`;
      const up = await supabase.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
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
        const avatar_url = photo ? await fileToDataUrl(photo) : existing?.avatar_url ?? null;
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
        const avatar_url = await fileToDataUrl(file);
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
        setExpenses((prev) => prev.filter((e) => e.activity_id !== id));
        return;
      }
      await supabase!.from('itinerary_items').delete().eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const setPhoto = useCallback<TripDataValue['setPhoto']>(
    async (activityId, file) => {
      if (demoMode) {
        const dataUrl = await fileToDataUrl(file);
        setItinerary((prev) =>
          prev.map((i) => (i.id === activityId ? { ...i, photo_url: dataUrl } : i))
        );
        return;
      }
      // One photo per card: fixed object key, upsert overwrites the old file.
      const path = `${activityId}.jpg`;
      const up = await supabase!.storage
        .from(SUPABASE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (up.error) throw up.error;
      const { data: pub } = supabase!.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
      const url = `${pub.publicUrl}?v=${Date.now()}`; // cache-bust the overwrite
      await supabase!.from('itinerary_items').update({ photo_url: url }).eq('id', activityId);
      await refetchAll();
    },
    [demoMode, refetchAll]
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
    async ({ activityId, amount, currency, paidById, participantIds }) => {
      const baseGbp = toGbp(amount, currency, settings);
      const parts = participantIds.length ? participantIds : [paidById];
      const shares = splitEqually(baseGbp, parts.length);

      if (demoMode) {
        const expId = genId();
        setExpenses((prev) => [
          ...prev,
          {
            id: expId,
            activity_id: activityId,
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
          activity_id: activityId,
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

  const deleteExpense = useCallback<TripDataValue['deleteExpense']>(
    async (id) => {
      if (demoMode) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        setSplits((prev) => prev.filter((s) => s.expense_id !== id));
        return;
      }
      await supabase!.from('expenses').delete().eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  // --- checklist ------------------------------------------------------------
  const addChecklistItem = useCallback<TripDataValue['addChecklistItem']>(
    async (label, scope) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      const owner_id = scope === 'individual' ? me?.id ?? null : null;
      if (demoMode) {
        setChecklist((prev) => [
          ...prev,
          { id: genId(), label: trimmed, scope, owner_id, checked: false },
        ]);
        return;
      }
      await supabase!.from('checklist_items').insert({ label: trimmed, scope, owner_id });
      await refetchAll();
    },
    [demoMode, me, refetchAll]
  );

  const toggleChecklist = useCallback<TripDataValue['toggleChecklist']>(
    async (id, checked) => {
      if (demoMode) {
        setChecklist((prev) =>
          prev.map((c) => (c.id === id ? { ...c, checked } : c))
        );
        return;
      }
      await supabase!.from('checklist_items').update({ checked }).eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const deleteChecklistItem = useCallback<TripDataValue['deleteChecklistItem']>(
    async (id) => {
      if (demoMode) {
        setChecklist((prev) => prev.filter((c) => c.id !== id));
        return;
      }
      await supabase!.from('checklist_items').delete().eq('id', id);
      await refetchAll();
    },
    [demoMode, refetchAll]
  );

  const value = useMemo<TripDataValue>(
    () => ({
      ready,
      demoMode,
      me,
      profiles,
      settings,
      itinerary,
      expenses,
      splits,
      checklist,
      ensureProfile,
      signInAs,
      setMyPhoto,
      signOut,
      addItineraryItem,
      deleteItineraryItem,
      setPhoto,
      updateRates,
      addExpense,
      deleteExpense,
      addChecklistItem,
      toggleChecklist,
      deleteChecklistItem,
    }),
    [
      ready,
      demoMode,
      me,
      profiles,
      settings,
      itinerary,
      expenses,
      splits,
      checklist,
      ensureProfile,
      signInAs,
      setMyPhoto,
      signOut,
      addItineraryItem,
      deleteItineraryItem,
      setPhoto,
      updateRates,
      addExpense,
      deleteExpense,
      addChecklistItem,
      toggleChecklist,
      deleteChecklistItem,
    ]
  );

  return <TripDataContext.Provider value={value}>{children}</TripDataContext.Provider>;
}
