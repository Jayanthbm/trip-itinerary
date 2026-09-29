import { describe, it, expect } from 'vitest';
import {
  emptyReview,
  normalizeReview,
  getReviewableItems,
  computeReviewProgress,
  computePlannedTotals,
  computeActualTotals,
  withReviewEntry,
  isEntryReviewed,
  addTimelineItemToDay,
  updateCustomItemInDay,
  removeCustomItemFromDay,
  moveCustomItemInDay,
  stripCustomItems,
  timelineReviewKey,
  REVIEW_STATUS,
} from './reviewHelpers';

// Helper: a trip with one custom item added to Day 1's active plan.
const addCustom = (title, cost) => {
  const trip = makeTrip();
  return { ...trip, days: [addTimelineItemToDay(trip.days[0], { title, cost }), ...trip.days.slice(1)] };
};

const makeTrip = (overrides = {}) => ({
  id: 't1',
  title: 'Test Trip',
  startDate: '1 March 2026',
  currency: 'INR',
  days: [
    {
      day: 'Day 1',
      active_plan: 'Main Plan',
      plans: [
        {
          title: 'Main Plan',
          timeline: [
            { itemId: 'tl-1', title: 'Breakfast', cost: 250 },
            { itemId: 'tl-2', title: 'Museum', cost: 600 },
            { itemId: 'tl-3', title: 'Free walk', cost: 0 },
          ],
          additionalBudget: [{ itemId: 'add-1', title: 'Cab', cost: 1000 }],
        },
        {
          title: 'Rainy Plan',
          timeline: [{ itemId: 'tl-rain', title: 'Indoor museum', cost: 300 }],
          additionalBudget: [],
        },
      ],
    },
  ],
  prebookingData: {
    flights: [{ id: 1, itemId: 'fl-1', from: 'BLR', to: 'DXB', cost: 28500 }],
    trains: [],
    bus: [],
    rooms: [{ id: 1, itemId: 'rm-1', name: 'Hotel Pearl', cost: 7200 }],
    activities: [
      { id: 1, itemId: 'ac-1', name: 'Safari', cost: 3500 },
      { id: 2, itemId: 'ac-2', name: 'Visa', cost: 9000, excludeFromBudget: true },
    ],
  },
  ...overrides,
});

describe('getReviewableItems', () => {
  it('collects prebooking, timeline and additionalBudget items of the ACTIVE plan only', () => {
    const items = getReviewableItems(makeTrip());
    const keys = items.map((i) => i.key);
    expect(keys).toContain('fl-1');
    expect(keys).toContain('rm-1');
    expect(keys).toContain('ac-1');
    expect(keys).toContain('ac-2'); // reviewable but excluded from budget
    expect(keys).toContain('tl-1');
    expect(keys).toContain('add-1');
    expect(keys).not.toContain('tl-rain'); // inactive plan
    expect(items).toHaveLength(8);
  });

  it('flags excludeFromBudget activities as reviewable but excluded from totals', () => {
    const items = getReviewableItems(makeTrip());
    const visa = items.find((i) => i.key === 'ac-2');
    expect(visa.excludeFromTotals).toBe(true);
    const safari = items.find((i) => i.key === 'ac-1');
    expect(safari.excludeFromTotals).toBe(false);
  });

  it('counts unplanned spending: zero-planned item with a committed actual', () => {
    const trip = makeTrip({
      review: { timeline: { 'tl-3': { done: true, actualCost: 150 } } }, // Free walk, planned 0
    });
    const a = computeActualTotals(trip);
    expect(a.hasAny).toBe(true);
    expect(a.sections.daily).toBe(150);
    expect(a.grand).toBe(150);
    const p = computePlannedTotals(trip);
    expect(p.grand).toBe(28500 + 7200 + 3500 + 1850); // planned unchanged
  });

  it('uses positional fallback keys for items without itemId', () => {
    const trip = makeTrip();
    delete trip.days[0].plans[0].timeline[0].itemId;
    const items = getReviewableItems(trip);
    const breakfast = items.find((i) => i.label === 'Breakfast');
    expect(breakfast.key).toBe('d0|Main Plan|0');
  });

  it('marks stale entries when the stored label no longer matches', () => {
    const trip = makeTrip({
      review: { timeline: { 'tl-1': { label: 'Breakfast', done: true } } },
    });
    const items = getReviewableItems(trip);
    expect(items.find((i) => i.key === 'tl-1').stale).toBe(false);

    const edited = makeTrip({
      review: { timeline: { 'tl-1': { label: 'Old breakfast name', done: true } } },
    });
    const staleItems = getReviewableItems(edited);
    expect(staleItems.find((i) => i.key === 'tl-1').stale).toBe(true);
  });
});

describe('computeReviewProgress', () => {
  it('counts reviewed = done || skipped against all reviewable items', () => {
    const trip = makeTrip({
      review: {
        timeline: {
          'tl-1': { done: true },
          'tl-2': { skipped: true, notes: 'closed' },
          'tl-3': { done: false }, // pending, not counted
        },
        prebooking: { flights: { 'fl-1': { done: true, actualCost: 30000 } } },
      },
    });
    const p = computeReviewProgress(trip);
    expect(p.total).toBe(8);
    expect(p.reviewed).toBe(3);
    expect(p.done).toBe(2);
    expect(p.skipped).toBe(1);
  });

  it('returns zeros for an unreviewed trip', () => {
    expect(computeReviewProgress(makeTrip())).toEqual({ total: 8, reviewed: 0, done: 0, skipped: 0 });
  });
});

describe('computePlannedTotals / computeActualTotals', () => {
  it('planned totals mirror calculateTotalBudget rules', () => {
    const t = computePlannedTotals(makeTrip());
    // flights 28500 + rooms 7200 + safari 3500 (visa excluded) + daily (250+600+0+1000)
    expect(t.sections.flights).toBe(28500);
    expect(t.sections.rooms).toBe(7200);
    expect(t.sections.activities).toBe(3500);
    expect(t.sections.daily).toBe(1850);
    expect(t.grand).toBe(28500 + 7200 + 3500 + 1850);
  });

  it('actual totals count only committed entries; skipped-without-cost adds 0', () => {
    const trip = makeTrip({
      review: {
        timeline: {
          'tl-1': { done: true, actualCost: 300 },
          'tl-2': { skipped: true }, // no actualCost → contributes nothing
          'add-1': { done: true, actualCost: 900 },
        },
        prebooking: { flights: { 'fl-1': { done: true, actualCost: 31000 } } },
      },
    });
    const a = computeActualTotals(trip);
    expect(a.hasAny).toBe(true);
    expect(a.sections.daily).toBe(1200);
    expect(a.sections.flights).toBe(31000);
    expect(a.grand).toBe(32200);
  });

  it('hasAny is false when nothing is committed', () => {
    expect(computeActualTotals(makeTrip()).hasAny).toBe(false);
    expect(computeActualTotals(makeTrip({ review: { timeline: { 'tl-1': { done: true } } } })).hasAny).toBe(false);
  });
});

describe('withReviewEntry', () => {
  it('creates the review lazily and flips status to in_progress', () => {
    const trip = makeTrip();
    const review = withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: true }));
    expect(review.status).toBe(REVIEW_STATUS.IN_PROGRESS);
    expect(typeof review.startedAt).toBe('number');
    expect(review.timeline['tl-1'].done).toBe(true);
    // Original trip object untouched (immutability).
    expect(trip.review).toBeUndefined();
  });

  it('merges into existing entries without losing fields', () => {
    let trip = makeTrip();
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-2', (e) => ({ ...e, skipped: true })) };
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-2', (e) => ({ ...e, notes: 'closed for season' })) };
    expect(trip.review.timeline['tl-2']).toMatchObject({ skipped: true, notes: 'closed for season', done: false });
  });

  it('writes prebooking entries under the right section', () => {
    const trip = makeTrip();
    const review = withReviewEntry(trip, 'flights', 'fl-1', (e) => ({ ...e, actualCost: 29000 }));
    expect(review.prebooking.flights['fl-1'].actualCost).toBe(29000);
    expect(review.timeline['fl-1']).toBeUndefined();
  });

  it('deletes the entry when updater returns null', () => {
    let trip = makeTrip();
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: true })) };
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-1', () => null) };
    expect(trip.review.timeline['tl-1']).toBeUndefined();
  });

  it('keeps completed status even after further edits', () => {
    let trip = makeTrip({ review: { ...emptyReview(), status: REVIEW_STATUS.COMPLETED } });
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: true })) };
    expect(trip.review.status).toBe(REVIEW_STATUS.COMPLETED);
  });

  it('stamps label/plannedCost snapshots and overwrites them on re-review', () => {
    let trip = makeTrip();
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: true }), { label: 'Breakfast', plannedCost: 250 }) };
    expect(trip.review.timeline['tl-1'].label).toBe('Breakfast');
    expect(trip.review.timeline['tl-1'].plannedCost).toBe(250);

    // Item renamed since review → stale; re-reviewing stamps the new label
    trip = { ...trip, review: withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: false }), { label: 'Brunch', plannedCost: 250 }) };
    expect(trip.review.timeline['tl-1'].label).toBe('Brunch');
  });
});

describe('timelineReviewKey', () => {
  it('prefers itemId and falls back to the positional key', () => {
    expect(timelineReviewKey(0, 'Main Plan', 2, 'tl-9')).toBe('tl-9');
    expect(timelineReviewKey(0, 'Main Plan', 2, undefined)).toBe('d0|Main Plan|2');
  });
});

describe('addTimelineItemToDay', () => {
  it('appends a fully-shaped item to the ACTIVE plan timeline', () => {
    const day = makeTrip().days[0]; // active_plan: 'Main Plan'
    const updated = addTimelineItemToDay(day, { title: '  Night market  ', time: '9:30 PM', cost: '₹350' });
    const added = updated.plans.find((p) => p.title === 'Main Plan').timeline.at(-1);
    expect(added.title).toBe('Night market'); // trimmed
    expect(added.time).toBe('9:30 PM');
    expect(added.cost).toBe(350); // parsed via canonical parseCost
    expect(typeof added.itemId).toBe('string');
    expect(added.duration).toBe('');
    // Rainy plan untouched
    expect(updated.plans.find((p) => p.title === 'Rainy Plan').timeline).toHaveLength(1);
    // Original day object untouched (immutability)
    expect(day.plans.find((p) => p.title === 'Main Plan').timeline).toHaveLength(3);
  });

  it('works on legacy flat days (no plans array) by creating a Main Plan', () => {
    const updated = addTimelineItemToDay({ day: 'Day 1', timeline: [], additionalBudget: [] }, { title: 'Extra stop', cost: 0 });
    expect(updated.plans[0].title).toBe('Main Plan');
    expect(updated.plans[0].timeline[0]).toMatchObject({ title: 'Extra stop', cost: 0, time: '' });
  });

  it('flows through getReviewableItems and withReviewEntry like a planned item', () => {
    let day = makeTrip().days[0];
    day = addTimelineItemToDay(day, { title: 'Souvenir', cost: 500 });
    const trip = { ...makeTrip(), days: [day] };
    const added = getReviewableItems(trip).find((i) => i.label === 'Souvenir');
    expect(added).toBeDefined();
    expect(added.kind).toBe('timeline');
    expect(added.plannedCost).toBe(500);
    // Reviewing the new item by its key works
    const review = withReviewEntry(trip, null, added.key, (e) => ({ ...e, done: true, actualCost: 450 }), { label: 'Souvenir', plannedCost: 500 });
    expect(review.timeline[added.key].done).toBe(true);
    expect(review.timeline[added.key].plannedCost).toBe(500);
  });
});

describe('custom (unplanned) items — decision #6', () => {
  it('addTimelineItemToDay stamps custom: true', () => {
    const day = makeTrip().days[0];
    const updated = addTimelineItemToDay(day, { title: 'Extra', cost: 100 });
    expect(updated.plans[0].timeline.at(-1)).toMatchObject({ title: 'Extra', custom: true });
  });

  it('custom items appear in getReviewableItems but carry no entry and are excluded from planned totals', () => {
    const trip = addCustom('Snacks', 300);
    const item = getReviewableItems(trip).find((i) => i.label === 'Snacks');
    expect(item.custom).toBe(true);
    expect(item.entry).toBeNull();
    expect(computePlannedTotals(trip).grand).toBe(28500 + 7200 + 3500 + 1850); // unchanged
  });

  it('custom item costs count toward ACTUAL totals (added = done)', () => {
    const trip = addCustom('Snacks', 300);
    const a = computeActualTotals(trip);
    expect(a.hasAny).toBe(true);
    expect(a.sections.daily).toBe(300);
    expect(a.grand).toBe(300);
  });

  it('zero-cost custom items do not flip hasAny', () => {
    const a = computeActualTotals(addCustom('Free stroll', 0));
    expect(a.hasAny).toBe(false);
    expect(a.grand).toBe(0);
  });

  it('custom items are excluded from review progress', () => {
    expect(computeReviewProgress(addCustom('Snacks', 300)).total).toBe(8);
  });

  it('updateCustomItemInDay edits only that custom item', () => {
    const trip = addCustom('Snacks', 300);
    const itemId = trip.days[0].plans[0].timeline.at(-1).itemId;
    const updated = updateCustomItemInDay(trip.days[0], itemId, { cost: 450 });
    const tl = updated.plans[0].timeline;
    expect(tl.at(-1)).toMatchObject({ title: 'Snacks', cost: 450, custom: true });
    expect(tl[0].cost).toBe(250); // planned item untouched
  });

  it('removeCustomItemFromDay deletes only that item', () => {
    const trip = addCustom('Snacks', 300);
    const itemId = trip.days[0].plans[0].timeline.at(-1).itemId;
    const tl = removeCustomItemFromDay(trip.days[0], itemId).plans[0].timeline;
    expect(tl).toHaveLength(3);
    expect(tl.some((i) => i.title === 'Snacks')).toBe(false);
  });

  it('moveCustomItemInDay repositions using the displayed (pre-removal) target index', () => {
    let trip = addCustom('Snacks', 300);
    const itemId = trip.days[0].plans[0].timeline.at(-1).itemId;
    // Display order (pre-move): Breakfast(0) Museum(1) Free walk(2) Snacks(3)
    // Drop Snacks onto index 0 → takes Breakfast's place, shifting it down
    let day = moveCustomItemInDay(trip.days[0], itemId, 0);
    expect(day.plans[0].timeline.map((i) => i.title)).toEqual(['Snacks', 'Breakfast', 'Museum', 'Free walk']);
    // Drop Snacks (now at 0) onto displayed index 2 (Museum) → lands in
    // Museum's place, shifting it (and Free walk) down
    day = moveCustomItemInDay(day, itemId, 2);
    expect(day.plans[0].timeline.map((i) => i.title)).toEqual(['Breakfast', 'Snacks', 'Museum', 'Free walk']);
  });

  it('stripCustomItems removes custom items from ALL plans/days', () => {
    const trip = addCustom('Snacks', 300);
    trip.days[0].plans[1].timeline.push({ itemId: 'c2', title: 'Rainy extra', cost: 50, custom: true });
    const stripped = stripCustomItems(trip);
    expect(stripped.days[0].plans[0].timeline.some((i) => i.custom)).toBe(false);
    expect(stripped.days[0].plans[1].timeline.some((i) => i.custom)).toBe(false);
    expect(stripped.days[0].plans[0].timeline).toHaveLength(3); // planned intact
  });

  it('non-custom items keep planned/actual behaviour unchanged', () => {
    const trip = addCustom('Snacks', 300);
    const withReview = { ...trip, review: withReviewEntry(trip, null, 'tl-1', (e) => ({ ...e, done: true, actualCost: 300 })) };
    const a = computeActualTotals(withReview);
    expect(a.grand).toBe(600); // 300 planned-item actual + 300 custom
    expect(computePlannedTotals(withReview).grand).toBe(28500 + 7200 + 3500 + 1850);
  });
});

describe('normalizeReview tolerance', () => {
  it('degrades garbage to emptyReview without throwing', () => {
    expect(normalizeReview(null)).toEqual(emptyReview());
    expect(normalizeReview('nope')).toEqual(emptyReview());
    expect(normalizeReview([1, 2]).status).toBe(REVIEW_STATUS.NOT_STARTED);
  });

  it('clamps rating and coerces entry fields', () => {
    const r = normalizeReview({ status: 'bogus', rating: 99, timeline: { x: { actualCost: '₹1,200', done: 'yes' } } });
    expect(r.rating).toBe(5);
    expect(r.status).toBe(REVIEW_STATUS.NOT_STARTED);
    expect(r.timeline.x.actualCost).toBe(1200);
    expect(r.timeline.x.done).toBe(false);
  });

  it('isEntryReviewed requires explicit done or skipped', () => {
    expect(isEntryReviewed({ done: true })).toBe(true);
    expect(isEntryReviewed({ skipped: true })).toBe(true);
    expect(isEntryReviewed({ done: false, skipped: false })).toBe(false);
    expect(isEntryReviewed(null)).toBe(false);
  });
});
