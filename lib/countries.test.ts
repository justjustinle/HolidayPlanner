import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  normalizeCountryName,
  uniqueCountriesFromTripDays,
} from './countries';
import type { TripDay } from './trip';

function day(partial: Partial<TripDay> & Pick<TripDay, 'dayNumber' | 'destination'>): TripDay {
  return {
    label: `Day ${partial.dayNumber}`,
    dateLabel: 'Mon 1st Jan',
    accentHex: '#c9992e',
    ...partial,
  };
}

test('normalizeCountryName maps aliases to canonical names', () => {
  assert.equal(normalizeCountryName('japan'), 'Japan');
  assert.equal(normalizeCountryName('UK'), 'United Kingdom');
  assert.equal(normalizeCountryName('Maldives'), 'The Maldives');
  assert.equal(normalizeCountryName('Philippines'), 'The Philippines');
  assert.equal(normalizeCountryName('Atlantis'), null);
});

test('uniqueCountriesFromTripDays collates first-seen unique countries', () => {
  const days = [
    day({ dayNumber: 1, destination: 'Tokyo', country: 'Japan', city: 'Tokyo' }),
    day({ dayNumber: 2, destination: 'Kyoto', country: 'Japan', city: 'Kyoto' }),
    day({ dayNumber: 3, destination: 'Paris', country: 'France', city: 'Paris' }),
    day({ dayNumber: 4, destination: 'Seoul', country: 'South Korea', city: 'Seoul' }),
  ];
  assert.deepEqual(uniqueCountriesFromTripDays(days), [
    'Japan',
    'France',
    'South Korea',
  ]);
});

test('uniqueCountriesFromTripDays infers countries from legacy city destinations', () => {
  const days = [
    day({ dayNumber: 1, destination: 'Bangkok' }),
    day({ dayNumber: 2, destination: 'Phuket' }),
    day({ dayNumber: 3, destination: 'Saigon' }),
    day({ dayNumber: 4, destination: 'Nha Trang' }),
  ];
  assert.deepEqual(uniqueCountriesFromTripDays(days), ['Thailand', 'Vietnam']);
});
