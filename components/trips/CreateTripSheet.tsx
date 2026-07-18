'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, Plus, Share2, Trash2 } from 'lucide-react';
import Sheet from '../ui/Sheet';
import { useTripData } from '../TripDataProvider';
import { useAuth } from '../AuthProvider';
import type { CreateTripResult } from '@/lib/types';
import type { TripDay } from '@/lib/trip';

const ACCENTS = ['#c9992e', '#2f97a6', '#b0472f', '#3f9b8a', '#7a5cc9', '#4f7fd6'];

interface Destination {
  id: string;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  accentHex: string;
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function addDays(date: string, amount: number): string {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + amount));
  return value.toISOString().slice(0, 10);
}

function inclusiveDays(start: string, end: string): number {
  if (!start || !end || end < start) return 0;
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  return Math.round((endMs - startMs) / 86_400_000) + 1;
}

function dateLabel(date: string): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

function destinationsFromTrip(startDate: string, days: TripDay[]): Destination[] {
  const groups: Destination[] = [];
  days.forEach((day, index) => {
    const date = addDays(startDate, index);
    const previous = groups[groups.length - 1];
    if (
      previous &&
      previous.country === (day.country ?? day.destination) &&
      previous.city === (day.city ?? '') &&
      previous.accentHex === day.accentHex
    ) {
      previous.endDate = date;
      return;
    }
    groups.push({
      id: newId(),
      country: day.country ?? day.destination,
      city: day.city ?? '',
      startDate: date,
      endDate: date,
      accentHex: day.accentHex,
    });
  });
  return groups.length
    ? groups
    : [
        {
          id: newId(),
          country: '',
          city: '',
          startDate: '',
          endDate: '',
          accentHex: ACCENTS[0],
        },
      ];
}

const inputClass =
  'w-full rounded-xl border border-black/10 bg-cream-card px-3 py-2.5 text-[16px] text-ink outline-none focus:border-ink';

export default function CreateTripSheet({
  onClose,
  mode = 'create',
}: {
  onClose: () => void;
  mode?: 'create' | 'edit';
}) {
  const editing = mode === 'edit';
  const { createTrip, updateTrip, setActiveTrip, trip, tripDays, currencies } =
    useTripData();
  const { account } = useAuth();
  const [name, setName] = useState(editing ? trip.name : '');
  const [homeCurrency, setHomeCurrency] = useState(
    editing ? trip.base_currency : 'GBP'
  );
  const [destinations, setDestinations] = useState<Destination[]>(() =>
    editing
      ? destinationsFromTrip(trip.start_date, tripDays)
      : [
          {
            id: newId(),
            country: '',
            city: '',
            startDate: '',
            endDate: '',
            accentHex: ACCENTS[0],
          },
        ]
  );
  const [destinationCurrencies, setDestinationCurrencies] = useState<string[]>(
    () =>
      editing
        ? currencies
            .filter((currency) => currency.code !== trip.base_currency)
            .map((currency) => currency.code)
        : []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateTripResult | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const tripStart = destinations[0]?.startDate ?? '';
  const tripEnd = destinations[destinations.length - 1]?.endDate ?? '';
  const totalDays = inclusiveDays(tripStart, tripEnd);
  const inviteLink = created && origin ? `${origin}/join/${created.inviteCode}` : '';

  const updateDestination = (id: string, patch: Partial<Destination>) => {
    setDestinations((previous) =>
      previous.map((destination) =>
        destination.id === id ? { ...destination, ...patch } : destination
      )
    );
  };

  const addDestination = () => {
    setDestinations((previous) => {
      const prior = previous[previous.length - 1];
      const nextDate = prior?.endDate ? addDays(prior.endDate, 1) : '';
      return [
        ...previous,
        {
          id: newId(),
          country: '',
          city: '',
          startDate: nextDate,
          endDate: nextDate,
          accentHex: ACCENTS[previous.length % ACCENTS.length],
        },
      ];
    });
  };

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Give the trip a name.';
    if (!/^[A-Za-z]{3}$/.test(homeCurrency.trim())) {
      return 'Home currency must be a three-letter code.';
    }
    for (let index = 0; index < destinations.length; index += 1) {
      const destination = destinations[index];
      if (!destination.country.trim()) {
        return `Add a country for destination ${index + 1}.`;
      }
      if (!destination.startDate || !destination.endDate) {
        return `Add both dates for ${destination.city.trim() || destination.country.trim()}.`;
      }
      if (destination.endDate < destination.startDate) {
        return `${destination.city.trim() || destination.country.trim()}'s end date must be after its start date.`;
      }
      if (index > 0) {
        const expectedStart = addDays(destinations[index - 1].endDate, 1);
        if (destination.startDate !== expectedStart) {
          return 'Destination dates must follow one another without gaps or overlaps.';
        }
      }
    }
    const codes = destinationCurrencies.map((code) => code.trim().toUpperCase());
    if (codes.some((code) => !/^[A-Z]{3}$/.test(code))) {
      return 'Destination currencies must use three-letter codes.';
    }
    if (new Set(codes).size !== codes.length) return 'Remove duplicate destination currencies.';
    if (codes.includes(homeCurrency.trim().toUpperCase())) {
      return 'Home currency does not need to be added again.';
    }
    return null;
  }, [destinationCurrencies, destinations, homeCurrency, name]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const details = {
        name: name.trim(),
        homeCurrency: homeCurrency.trim().toUpperCase(),
        destinations: destinations.map((destination) => ({
          country: destination.country.trim(),
          city: destination.city.trim(),
          startDate: destination.startDate,
          endDate: destination.endDate,
          accentHex: destination.accentHex,
        })),
        destinationCurrencies: destinationCurrencies.map((code) =>
          code.trim().toUpperCase()
        ),
      };
      if (editing) {
        await updateTrip(details);
        onClose();
        return;
      }
      const result = await createTrip({
        ...details,
        ownerName:
          account?.name?.trim() ||
          account?.email?.split('@')[0] ||
          'Me',
      });
      setCreated(result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : editing
            ? 'Could not update the trip.'
            : 'Could not create the trip.'
      );
    } finally {
      setBusy(false);
    }
  };

  const copy = async (value: string, kind: 'code' | 'link') => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  };

  if (created && !editing) {
    return (
      <Sheet title="Invite your group" onClose={onClose}>
        <div className="rounded-2xl bg-cream-card p-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-nhatrang/15 text-nhatrang">
            <Check size={21} />
          </div>
          <h3 className="mt-3 font-serif text-[22px] font-semibold text-ink">{name}</h3>
          <p className="mt-1 text-[13px] text-muted">
            {dateLabel(tripStart)} – {dateLabel(tripEnd)} · {totalDays} days
          </p>
        </div>

        <p className="mb-3 mt-5 text-[14px] leading-relaxed text-muted">
          Your trip is ready. Share this private link so your group can sign in to Yarn
          and join the holiday.
        </p>

        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">Invite code</p>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-cream-card px-3 py-2.5">
              <code className="min-w-0 flex-1 text-[15px] font-semibold text-ink">
                {created.inviteCode}
              </code>
              <button
                type="button"
                onClick={() => copy(created.inviteCode, 'code')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/5"
                aria-label="Copy invite code"
              >
                {copied === 'code' ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">Invite link</p>
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-cream-card px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{inviteLink}</span>
              <button
                type="button"
                onClick={() => copy(inviteLink, 'link')}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/5"
                aria-label="Copy invite link"
              >
                {copied === 'link' ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
          </div>
        </div>

        {origin && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={() => navigator.share({ title: `Join ${name} on Yarn`, url: inviteLink })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-black/15 bg-cream-card py-3 text-[14px] font-medium text-ink"
          >
            <Share2 size={17} /> Share invite
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setActiveTrip(created.tripId);
            onClose();
          }}
          className="mt-3 w-full rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white"
        >
          Open trip
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? `${copied} copied` : ''}
        </span>
      </Sheet>
    );
  }

  return (
    <Sheet title={editing ? 'Edit trip' : 'Create a trip'} onClose={onClose}>
      <form onSubmit={submit}>
        <label htmlFor="trip-name" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Trip name
        </label>
        <input
          id="trip-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Japan 2027"
          className={`${inputClass} mb-3`}
          autoFocus
        />

        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-muted">Destinations</p>
          {totalDays > 0 && (
            <span className="text-[12px] text-muted" aria-live="polite">
              {totalDays} day{totalDays === 1 ? '' : 's'} total
            </span>
          )}
        </div>

        <div className="space-y-3">
          {destinations.map((destination, index) => (
            <fieldset
              key={destination.id}
              className="rounded-2xl border border-black/10 bg-cream-card/60 p-3"
            >
              <legend className="px-1 text-[12px] font-medium text-muted">
                Destination {index + 1}
              </legend>
              <div className="flex items-start gap-2">
                <label className="min-w-0 flex-1">
                  <span className="mb-1 block text-xs text-muted">Country</span>
                  <input
                    type="text"
                    value={destination.country}
                    onChange={(event) =>
                      updateDestination(destination.id, { country: event.target.value })
                    }
                    placeholder="e.g. Japan"
                    className={inputClass}
                    required
                  />
                </label>
                {destinations.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDestinations((previous) =>
                        previous.filter((item) => item.id !== destination.id)
                      )
                    }
                    className="mt-6 flex h-11 w-11 flex-none items-center justify-center rounded-xl text-muted hover:bg-saigon/10 hover:text-saigon"
                    aria-label={`Remove ${
                      destination.city ||
                      destination.country ||
                      `destination ${index + 1}`
                    }`}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>

              <label className="mt-2 block">
                <span className="mb-1 block text-xs text-muted">City (optional)</span>
                <input
                  type="text"
                  value={destination.city}
                  onChange={(event) =>
                    updateDestination(destination.id, { city: event.target.value })
                  }
                  placeholder="e.g. Tokyo"
                  className={inputClass}
                />
              </label>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label>
                  <span className="mb-1 block text-xs text-muted">Start date</span>
                  <input
                    type="date"
                    value={destination.startDate}
                    onChange={(event) =>
                      updateDestination(destination.id, { startDate: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-muted">End date</span>
                  <input
                    type="date"
                    min={destination.startDate || undefined}
                    value={destination.endDate}
                    onChange={(event) =>
                      updateDestination(destination.id, { endDate: event.target.value })
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div
                className="mt-3 flex items-center justify-between gap-3"
                role="group"
                aria-label={`Colour for ${
                  destination.city ||
                  destination.country ||
                  `destination ${index + 1}`
                }`}
              >
                <span className="text-xs text-muted">Colour</span>
                <div className="flex gap-2">
                  {ACCENTS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateDestination(destination.id, { accentHex: hex })}
                      aria-label={`Use colour ${hex}`}
                      aria-pressed={destination.accentHex === hex}
                      className={`h-7 w-7 rounded-full ${
                        destination.accentHex === hex ? 'ring-2 ring-ink ring-offset-2' : ''
                      }`}
                      style={{ background: hex }}
                    />
                  ))}
                </div>
              </div>
            </fieldset>
          ))}
        </div>

        <button
          type="button"
          onClick={addDestination}
          className="mb-5 mt-3 flex items-center gap-1 text-[13px] font-medium text-ink"
        >
          <Plus size={15} /> Add destination
        </button>

        <label htmlFor="home-currency" className="mb-1 block text-xs uppercase tracking-wide text-muted">
          Home currency
        </label>
        <input
          id="home-currency"
          value={homeCurrency}
          onChange={(event) =>
            setHomeCurrency(event.target.value.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase())
          }
          inputMode="text"
          autoCapitalize="characters"
          className={`${inputClass} mb-3 max-w-32`}
        />

        {destinationCurrencies.length > 0 && (
          <div className="mb-2 space-y-2">
            {destinationCurrencies.map((currency, index) => (
              <div key={index} className="flex items-center gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Destination currency {index + 1}</span>
                  <input
                    value={currency}
                    onChange={(event) =>
                      setDestinationCurrencies((previous) =>
                        previous.map((code, itemIndex) =>
                          itemIndex === index
                            ? event.target.value
                                .replace(/[^a-z]/gi, '')
                                .slice(0, 3)
                                .toUpperCase()
                            : code
                        )
                      )
                    }
                    placeholder="e.g. JPY"
                    autoCapitalize="characters"
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setDestinationCurrencies((previous) =>
                      previous.filter((_, itemIndex) => itemIndex !== index)
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-saigon/10 hover:text-saigon"
                  aria-label={`Remove destination currency ${index + 1}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDestinationCurrencies((previous) => [...previous, ''])}
          className="mb-5 flex items-center gap-1 text-[13px] font-medium text-ink"
        >
          <Plus size={15} /> Add destination currencies
        </button>

        {error && (
          <p className="mb-3 text-center text-[13px] text-saigon" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {editing ? 'Save changes' : 'Create trip'}
        </button>
      </form>
    </Sheet>
  );
}
