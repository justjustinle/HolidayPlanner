'use client';

import { useState } from 'react';
import { Plus, Check, Trash2, Users, User, MapPin } from 'lucide-react';
import { useTripData } from '../TripDataProvider';
import TabHeader from '../ui/TabHeader';
import { REFERENCE, PHRASES } from '@/lib/logistics';
import type { ChecklistItem } from '@/lib/types';

function CheckRow({ item }: { item: ChecklistItem }) {
  const { toggleChecklist, deleteChecklistItem } = useTripData();
  return (
    <div className="flex items-center gap-3 py-2">
      <button
        onClick={() => toggleChecklist(item.id, !item.checked)}
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border ${
          item.checked ? 'border-nhatrang bg-nhatrang text-white' : 'border-black/25'
        }`}
        aria-label={item.checked ? 'Uncheck' : 'Check'}
      >
        {item.checked && <Check size={13} strokeWidth={3} />}
      </button>
      <span className={`flex-1 text-[14px] ${item.checked ? 'text-muted line-through' : 'text-ink'}`}>
        {item.label}
      </span>
      <button
        onClick={() => deleteChecklistItem(item.id)}
        className="text-muted/50 hover:text-saigon"
        aria-label="Delete item"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function AddRow({ scope }: { scope: 'group' | 'individual' }) {
  const { addChecklistItem } = useTripData();
  const [label, setLabel] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await addChecklistItem(label, scope);
    setLabel('');
  };
  return (
    <form onSubmit={submit} className="mt-1 flex items-center gap-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Add an item…"
        className="flex-1 rounded-lg border border-black/10 bg-cream-card px-3 py-2 text-[14px] text-ink outline-none focus:border-ink"
      />
      <button
        type="submit"
        disabled={!label.trim()}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-ink text-white disabled:opacity-40"
        aria-label="Add"
      >
        <Plus size={18} />
      </button>
    </form>
  );
}

export default function LogisticsTab() {
  const { checklist, me } = useTripData();

  const group = checklist.filter((c) => c.scope === 'group');
  const mine = checklist.filter(
    (c) => c.scope === 'individual' && (c.owner_id === me?.id || c.owner_id == null)
  );

  return (
    <div>
      <TabHeader eyebrow="Packing & references" title="Logistics" />

      <div className="space-y-7 px-5 pt-2">
        {/* Group essentials */}
        <section>
          <h2 className="mb-1 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            <Users size={15} /> Group essentials
          </h2>
          <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-cream-card px-4 py-1">
            {group.length === 0 && <p className="py-3 text-[13px] text-muted">Nothing yet.</p>}
            {group.map((item) => (
              <CheckRow key={item.id} item={item} />
            ))}
          </div>
          <AddRow scope="group" />
        </section>

        {/* Individual packing */}
        <section>
          <h2 className="mb-1 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            <User size={15} /> My packing
          </h2>
          <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-cream-card px-4 py-1">
            {mine.length === 0 && <p className="py-3 text-[13px] text-muted">Nothing yet.</p>}
            {mine.map((item) => (
              <CheckRow key={item.id} item={item} />
            ))}
          </div>
          <AddRow scope="individual" />
        </section>

        {/* Transit & hotels */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            <MapPin size={15} /> Transit &amp; hotels
          </h2>
          <div className="space-y-2">
            {REFERENCE.map((stop) => (
              <div key={stop.destination} className="rounded-2xl border border-black/5 bg-cream-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: stop.accentHex }} />
                  <span className="font-serif text-[16px] text-ink">{stop.destination}</span>
                </div>
                <dl className="space-y-1">
                  {stop.lines.map((l) => (
                    <div key={l.label} className="flex gap-3 text-[13px]">
                      <dt className="w-16 flex-none text-muted">{l.label}</dt>
                      <dd className="text-ink">{l.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Phrasebook */}
        <section className="pb-4">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
            Handy phrases
          </h2>
          <div className="space-y-3">
            {PHRASES.map((group) => (
              <div key={group.lang} className="rounded-2xl border border-black/5 bg-cream-card p-4">
                <div className="mb-2 font-serif text-[16px] text-ink">{group.lang}</div>
                <div className="space-y-1.5">
                  {group.items.map((p) => (
                    <div key={p.en} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-muted">{p.en}</span>
                      <span className="text-right text-ink">
                        {p.local} <span className="text-muted">· {p.say}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
