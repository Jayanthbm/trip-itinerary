import { describe, it, expect } from 'vitest';
import {
  normalizeData,
  migrateLegacyUiState,
  cleanupLegacyUiState,
} from './itineraryHelpers';

// Fake localStorage with the same surface the helpers use (tests run in node,
// where real localStorage does not exist).
const makeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    key: (i) => Object.keys(data)[i] ?? null,
    get length() { return Object.keys(data).length; },
  };
};

const makeTrip = (overrides = {}) => ({
  id: 't1',
  title: 'Hill Trip',
  startDate: '1 March 2026', // 2-day trip → end 2 March 2026
  currency: 'INR',
  days: [
    {
      day: 'Day 1',
      title: 'Explore',
      checklist: ['Pack bags', 'Book cab'],
      plans: [{ title: 'Main Plan', timeline: [], additionalBudget: [] }],
    },
    {
      day: 'Day 2',
      title: 'Relax',
      checklist: [],
      plans: [{ title: 'Main Plan', timeline: [], additionalBudget: [] }],
    },
  ],
  prebookingData: {
    flights: [{ id: 1, itemId: 'fl-1', from: 'BLR', to: 'DXB', cost: 5000 }],
    trains: [],
    bus: [],
    rooms: [{ id: 1, itemId: 'rm-1', name: 'Hotel', cost: 2000 }],
    activities: [],
  },
  ...overrides,
});

describe('normalizeData — checklist object shape (G5)', () => {
  it('upgrades legacy string checklists to { id, text, checked: false }', () => {
    const norm = normalizeData(makeTrip());
    expect(norm.days[0].checklist).toEqual([
      { id: expect.any(String), text: 'Pack bags', checked: false },
      { id: expect.any(String), text: 'Book cab', checked: false },
    ]);
  });

  it('preserves existing checked state and ids on re-normalization', () => {
    const trip = makeTrip();
    trip.days[0].checklist = [{ id: 'c1', text: 'Pack bags', checked: true }];
    const again = normalizeData(normalizeData(trip));
    expect(again.days[0].checklist).toEqual([{ id: 'c1', text: 'Pack bags', checked: true }]);
  });

  it('handles null/odd checklist entries without throwing', () => {
    const trip = makeTrip();
    trip.days[0].checklist = [null, 42, 'Real item'];
    const norm = normalizeData(trip);
    expect(norm.days[0].checklist[2]).toMatchObject({ text: 'Real item', checked: false });
    expect(norm.days[0].checklist).toHaveLength(3);
  });
});

// Legacy keys were written as `${title}_${start}_${end}` with ALL whitespace
// replaced by underscores (ItineraryView's itineraryKey) — mirror that here.
const BASE = 'Hill_Trip_1_March_2026_2_March_2026';

describe('migrateLegacyUiState (G5 harvest)', () => {
  it('harvests checked ticks and prebook statuses from legacy localStorage keys', () => {
    const ls = makeStorage({
      [`${BASE}_day_0_checklist_0`]: 'true',
      [`${BASE}_prebook_flight_1`]: 'Booked',
      [`${BASE}_prebook_room_1`]: 'Booked',
    });
    const migrated = migrateLegacyUiState(makeTrip(), ls);
    expect(migrated).not.toBe(makeTrip()); // returns a new object when changed
    expect(migrated.days[0].checklist[0]).toMatchObject({ text: 'Pack bags', checked: true });
    expect(migrated.days[0].checklist[1]).toBe('Book cab'); // unticked legacy string untouched
    expect(migrated.prebookingData.flights[0].status).toBe('Booked');
    expect(migrated.prebookingData.rooms[0].status).toBe('Booked');
  });

  it('never overwrites an explicit non-Pending status already on the item', () => {
    const ls = makeStorage({
      [`${BASE}_prebook_flight_1`]: 'Booked',
    });
    const trip = makeTrip();
    trip.prebookingData.flights[0].status = 'Cancelled';
    const migrated = migrateLegacyUiState(trip, ls);
    expect(migrated.prebookingData.flights[0].status).toBe('Cancelled');
  });

  it('returns the same object untouched when storage has no legacy keys', () => {
    const trip = makeTrip();
    expect(migrateLegacyUiState(trip, makeStorage())).toBe(trip);
  });

  it('materializes a ticked legacy string row into the object shape', () => {
    const ls = makeStorage({
      [`${BASE}_day_0_checklist_1`]: 'true',
    });
    const trip = makeTrip();
    delete trip.prebookingData; // also proves prebookingData is optional
    const migrated = migrateLegacyUiState(trip, ls);
    expect(migrated.days[0].checklist[1]).toMatchObject({ text: 'Book cab', checked: true });
    expect(migrated.days[0].checklist[0]).toBe('Pack bags'); // unticked string untouched
  });
});

describe('cleanupLegacyUiState (G5)', () => {
  it('removes only this trip’s legacy keys', () => {
    const ls = makeStorage({
      [`${BASE}_day_0_checklist_0`]: 'true',
      [`${BASE}_prebook_flight_1`]: 'Booked',
      'Other_Trip_day_0_checklist_0': 'true',
      'unrelated_key': 'keep',
    });
    cleanupLegacyUiState(makeTrip(), ls);
    expect(ls.getItem(`${BASE}_day_0_checklist_0`)).toBeNull();
    expect(ls.getItem(`${BASE}_prebook_flight_1`)).toBeNull();
    expect(ls.getItem('Other_Trip_day_0_checklist_0')).toBe('true');
    expect(ls.getItem('unrelated_key')).toBe('keep');
  });
});
