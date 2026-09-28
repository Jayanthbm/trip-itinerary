import { describe, it, expect, vi } from 'vitest';
import { normalizeData, calculateTotalBudget } from './itineraryHelpers';
import madikeriSample from '../../madikeri_2026.json';

// Legacy fixture mirroring real-world data.json patterns (G1/G2/G3):
// string costs incl. a range, `item`-keyed additionalBudget, legacy flat day.
const legacyTrip = {
  title: 'Legacy Cost Trip',
  startDate: '1 March 2026',
  currency: 'INR',
  days: [
    {
      day: 'Day 1',
      title: 'Old format day',
      summary: 'Uses item-keyed additionalBudget and string costs',
      checklist: [],
      timeline: [
        { time: '9:00 AM', title: 'Breakfast', cost: '₹250' },
        { time: '11:00 AM', title: 'Museum', cost: '₹600 – ₹1,000' },
        { time: '2:00 PM', title: 'Free walk', cost: null },
      ],
      additionalBudget: [
        { item: 'Airport Travel (Cab)', cost: '₹1000' },
        { item: 'Snacks / Water', cost: '₹400' },
      ],
    },
    {
      day: 'Day 2',
      title: 'Plans format day',
      plans: [
        {
          title: 'Main Plan',
          timeline: [{ time: '10:00 AM', title: 'Temple', cost: 0 }],
          additionalBudget: [{ title: 'Tips', cost: 100 }],
        },
      ],
    },
  ],
  prebookingData: {
    flights: [
      { from: 'BLR', to: 'DXB', airline: 'Emirates', cost: '₹28,500', date: '1 March 2026' },
    ],
    trains: [],
    bus: [],
    rooms: [{ name: 'Hotel Pearl', checkin: '1 March', checkout: '3 March', cost: 7200 }],
    activities: [
      { name: 'Desert Safari', cost: 3500 },
      { name: 'Visa fee', cost: 9000, excludeFromBudget: true },
    ],
  },
};

describe('normalizeData — non-destructive costs & item alias (P0-2/P0-3)', () => {
  it('converts string costs to numbers via canonical parseCost', () => {
    const day1 = normalizeData(legacyTrip).days[0];
    const plan = day1.plans[0];
    expect(plan.timeline[0].cost).toBe(250); // "₹250"
    expect(plan.timeline[1].cost).toBe(600); // range → first number
    expect(plan.timeline[2].cost).toBe(0); // null
  });

  it('accepts `item` as label alias for additionalBudget (G2 fix)', () => {
    const day1 = normalizeData(legacyTrip).days[0];
    const add = day1.plans[0].additionalBudget;
    expect(add[0].title).toBe('Airport Travel (Cab)');
    expect(add[0].cost).toBe(1000); // "₹1000" parsed, not dropped
    expect(add[1].title).toBe('Snacks / Water');
    expect(add[1].cost).toBe(400);
  });

  it('accepts `item` alias in the legacy flat-day branch too', () => {
    const trip = {
      title: 'Flat', startDate: '1 March 2026',
      days: [{ day: 'Day 1', additionalBudget: [{ item: 'SIM', cost: '₹400' }] }],
    };
    const add = normalizeData(trip).days[0].plans[0].additionalBudget;
    expect(add[0].title).toBe('SIM');
    expect(add[0].cost).toBe(400);
  });

  it('stamps stable itemIds on all reviewable items and preserves existing ones', () => {
    const norm = normalizeData(legacyTrip);
    const d1 = norm.days[0].plans[0];
    // Prebooking ids (positional) unchanged, but every item has a stable itemId
    expect(norm.prebookingData.flights[0].cost).toBe(28500);
    expect(typeof norm.prebookingData.flights[0].itemId).toBe('string');
    expect(typeof norm.prebookingData.rooms[0].itemId).toBe('string');
    expect(typeof d1.timeline[0].itemId).toBe('string');
    expect(typeof d1.additionalBudget[0].itemId).toBe('string');

    // Re-normalizing the already-normalized output keeps the SAME itemIds
    const again = normalizeData(norm);
    expect(again.days[0].plans[0].timeline[0].itemId).toBe(d1.timeline[0].itemId);
    expect(again.days[0].plans[0].additionalBudget[0].itemId).toBe(d1.additionalBudget[0].itemId);
    expect(again.prebookingData.flights[0].itemId).toBe(norm.prebookingData.flights[0].itemId);
  });

  it('excludeFromBudget activities stay excluded from totals', () => {
    const norm = normalizeData(legacyTrip);
    // flights 28500 + rooms 7200 + activities (3500, visa excluded) + day totals
    // day1: 250 + 600 + 1000 + 400 = 2250; day2: 0 + 100 = 100
    expect(calculateTotalBudget(norm)).toBe(28500 + 7200 + 3500 + 2250 + 100);
  });

  it('clean modern sample normalizes without changing its budget', () => {
    const norm = normalizeData(madikeriSample);
    const before = calculateTotalBudget(madikeriSample);
    const after = calculateTotalBudget(norm);
    // Numbers pass through parseCost unchanged, so totals must match exactly.
    expect(after).toBe(before);
    expect(after).toBeGreaterThan(0);
  });

  it('generates an id when missing (existing behaviour intact)', () => {
    const norm = normalizeData({ title: 'T', startDate: '1 March 2026', days: [] });
    expect(typeof norm.id).toBe('string');
  });

  it('does not invoke crypto when all items already have itemIds', () => {
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID');
    const norm = normalizeData(legacyTrip);
    const again = normalizeData(norm);
    expect(again.days[1].plans[0].timeline[0].itemId).toBeTruthy();
    spy.mockRestore();
  });
});
