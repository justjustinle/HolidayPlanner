'use client';

import { useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useTripData } from '../TripDataProvider';
import type { ChecklistItem } from '@/lib/types';

export function ChecklistStrip({ onOpen }: { onOpen: () => void }) {
  const { checklistItems } = useTripData();
  const total = checklistItems.length;
  const done = useMemo(
    () => checklistItems.filter((i) => i.is_done).length,
    [checklistItems]
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-3 flex w-full items-center gap-2.5 rounded-xl border border-black/5 bg-cream-card px-3 py-2.5 text-left shadow-card"
      aria-label={
        total === 0
          ? 'Open checklist — add your first item'
          : `Open checklist — ${done} of ${total} done`
      }
    >
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${
          total > 0 && done === total
            ? 'bg-nhatrang/15 text-nhatrang'
            : 'bg-black/[.04] text-muted'
        }`}
      >
        <Check size={15} strokeWidth={2.4} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">
          {total === 0 ? 'Checklist' : `Checklist · ${done}/${total}`}
        </span>
        <span className="block text-[11px] text-muted">
          {total === 0
            ? 'Add vaccines, passports, adapters…'
            : done === total
              ? 'All set'
              : `${total - done} left`}
        </span>
      </span>
      <Plus size={16} className="flex-none text-muted" />
    </button>
  );
}

export default function ChecklistSheet({ onClose }: { onClose: () => void }) {
  const {
    checklistItems,
    profiles,
    addChecklistItem,
    updateChecklistItem,
    setChecklistItemDone,
    deleteChecklistItem,
  } = useTripData();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<ChecklistItem | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleting, setDeleting] = useState<ChecklistItem | null>(null);
  const [busy, setBusy] = useState(false);

  const ordered = useMemo(
    () =>
      [...checklistItems].sort(
        (a, b) =>
          a.sort_order - b.sort_order ||
          (a.created_at ?? '').localeCompare(b.created_at ?? '')
      ),
    [checklistItems]
  );

  const profileOf = (id: string | null) =>
    id ? profiles.find((p) => p.id === id) : undefined;

  const add = async () => {
    const label = draft.trim();
    if (!label || busy) return;
    setBusy(true);
    try {
      await addChecklistItem(label);
      setDraft('');
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    const label = editLabel.trim();
    if (!label || busy) return;
    setBusy(true);
    try {
      await updateChecklistItem(editing.id, label);
      setEditing(null);
      setEditLabel('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet title="Trip checklist" onClose={onClose}>
        <p className="mb-4 text-[13px] leading-relaxed text-muted">
          Shared prep for the whole trip — vaccines, passports, adapters, and
          anything else that isn&apos;t tied to a single day.
        </p>

        <div className="mb-4 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void add();
              }
            }}
            placeholder="Add an item…"
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => void add()}
            disabled={!draft.trim() || busy}
            aria-label="Add checklist item"
            className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-ink text-white disabled:opacity-40"
          >
            <Plus size={18} />
          </button>
        </div>

        {ordered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black/10 px-4 py-8 text-center text-[13px] text-muted">
            Nothing here yet. Add your first checklist item above.
          </div>
        ) : (
          <ul className="space-y-2">
            {ordered.map((item) => {
              const completer = profileOf(item.completed_by_id);
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-2xl border border-black/5 bg-cream-card px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => void setChecklistItemDone(item.id, !item.is_done)}
                    aria-label={item.is_done ? 'Mark not done' : 'Mark done'}
                    aria-pressed={item.is_done}
                    className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border ${
                      item.is_done
                        ? 'border-nhatrang bg-nhatrang text-white'
                        : 'border-black/20 bg-cream text-transparent'
                    }`}
                  >
                    <Check size={14} strokeWidth={2.6} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[15px] leading-snug ${
                        item.is_done ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {item.label}
                    </div>
                    {item.is_done && completer && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                        <Avatar
                          name={completer.name}
                          src={completer.avatar_url}
                          size={14}
                        />
                        Checked by {completer.name}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(item);
                      setEditLabel(item.label);
                    }}
                    aria-label="Edit item"
                    className="mt-0.5 text-muted/70 hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(item)}
                    aria-label="Delete item"
                    className="mt-0.5 text-muted/70 hover:text-saigon"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Sheet>

      {editing && (
        <Sheet title="Edit item" onClose={() => setEditing(null)}>
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            autoFocus
            className="mb-4 w-full rounded-xl border border-black/10 bg-cream-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => void saveEdit()}
            disabled={!editLabel.trim() || busy}
            className="w-full rounded-xl bg-ink py-3 text-[15px] font-medium text-white disabled:opacity-40"
          >
            Save
          </button>
        </Sheet>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete checklist item?"
          message={`“${deleting.label}” will be removed for everyone on this trip.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const id = deleting.id;
            setDeleting(null);
            void deleteChecklistItem(id);
          }}
        />
      )}
    </>
  );
}
