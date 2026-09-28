// Trip Review helpers (REVIEW_READINESS_PLAN.md P0-6; completed in Phase 1 of
// TRIP_REVIEW_IMPLEMENTATION.md). normalizeReview ships early so backup import
// can sanitize review data at the boundary before any review UI exists.
// ---------------------------------------------------------------------------
// Phase 1 computers — shared by ReviewView, BudgetView and TripCard so planned
// totals, actual totals and review progress have exactly one source of truth.
// All functions are pure and tolerate malformed/partial input.
// ---------------------------------------------------------------------------

import { parseCost } from './costUtils';

export const REVIEW_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const PREBOOKING_SECTIONS = ['flights', 'trains', 'bus', 'rooms', 'activities'];

// Sparse review entry shape (TRIP_REVIEW_IMPLEMENTATION.md §3):
// { actualCost, done, skipped, notes } + optional label/plannedCost snapshots
// used for drift detection when the underlying plan item changes.
const normalizeEntry = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const entry = {
    actualCost: raw.actualCost === null || raw.actualCost === undefined ? null : parseCost(raw.actualCost),
    done: raw.done === true,
    skipped: raw.skipped === true,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
  };
  if (raw.label !== undefined && raw.label !== null) entry.label = String(raw.label);
  if (raw.plannedCost !== undefined && raw.plannedCost !== null) entry.plannedCost = parseCost(raw.plannedCost);
  return entry;
};

const normalizeEntryMap = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const entry = normalizeEntry(value);
    if (entry) out[String(key)] = entry;
  }
  return out;
};

const normalizePrebookingReview = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const section of PREBOOKING_SECTIONS) {
    if (raw[section] !== undefined) out[section] = normalizeEntryMap(raw[section]);
  }
  return out;
};

const asTimestampOrNull = (val) => (typeof val === 'number' && Number.isFinite(val) ? val : null);

export const emptyReview = () => ({
  version: 1,
  status: REVIEW_STATUS.NOT_STARTED,
  startedAt: null,
  completedAt: null,
  notes: '',
  rating: 0,
  prebooking: {},
  timeline: {},
});

// Sanitizes an untrusted review object (from an imported backup or an old trip)
// into a well-formed shape. Malformed input degrades to emptyReview, never throws.
export const normalizeReview = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyReview();

  const status = Object.values(REVIEW_STATUS).includes(raw.status)
    ? raw.status
    : REVIEW_STATUS.NOT_STARTED;

  let rating = typeof raw.rating === 'number' && Number.isFinite(raw.rating) ? Math.round(raw.rating) : 0;
  rating = Math.min(5, Math.max(0, rating));

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    status,
    startedAt: asTimestampOrNull(raw.startedAt),
    completedAt: asTimestampOrNull(raw.completedAt),
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    rating,
    prebooking: normalizePrebookingReview(raw.prebooking),
    timeline: normalizeEntryMap(raw.timeline),
  };
};

// Returns the review entry for a key, or a neutral default (never undefined).
export const getReviewEntry = (review, section, key) => {
  if (!review || typeof review !== 'object') return null;
  const bucket = section ? review.prebooking?.[section] : review.timeline;
  const entry = bucket?.[String(key)];
  return entry && typeof entry === 'object' ? entry : null;
};

// Drift detection: a stored snapshot label no longer matches the live item.
export const isEntryStale = (entry, liveLabel) =>
  !!entry && entry.label !== undefined && entry.label !== null && entry.label !== liveLabel;

// A review entry counts as "reviewed" when the user explicitly marked it
// done or skipped (decision: progress = reviewed / total reviewable items).
export const isEntryReviewed = (entry) =>
  !!entry && (entry.done === true || entry.skipped === true);

// Walks a trip and returns every reviewable item with its review key.
// Rules mirror calculateTotalBudget exactly: active plan only,
// excludeFromBudget activities excluded from totals (but still reviewable —
// flagged with inBudget: false).
export const getReviewableItems = (trip) => {
  const items = [];
  if (!trip) return items;

  const review = trip.review || emptyReview();

  // Prebooking sections
  const prebooking = trip.prebookingData || {};
  for (const section of PREBOOKING_SECTIONS) {
    (prebooking[section] || []).forEach((item) => {
      const key = String(item.itemId ?? item.id);
      const liveLabel = item.name
        || (section === 'flights'
          ? `${item.from || ''} → ${item.to || ''}${item.airline ? ` (${item.airline})` : ''}`.trim()
          : `${item.from || ''} → ${item.to || ''}`.trim());
      const entry = getReviewEntry(review, section, key);
      items.push({
        kind: 'prebooking',
        section,
        key,
        label: liveLabel || `Item ${item.id}`,
        plannedCost: parseCost(item.cost),
        excludeFromTotals: section === 'activities' && item.excludeFromBudget === true,
        entry,
        stale: isEntryStale(entry, liveLabel),
      });
    });
  }

  // Timeline + additionalBudget of each day's ACTIVE plan only
  (trip.days || []).forEach((day, dayIndex) => {
    const activePlanTitle = day.active_plan || 'Main Plan';
    const plan = (day.plans || []).find((p) => p.title === activePlanTitle) || day.plans?.[0];
    if (!plan) return;

    (plan.timeline || []).forEach((item, itemIndex) => {
      const key = String(item.itemId ?? `d${dayIndex}|${plan.title}|${itemIndex}`);
      const liveLabel = item.title || '';
      const entry = getReviewEntry(review, null, key);
      items.push({
        kind: 'timeline',
        dayIndex,
        dayLabel: day.day || `Day ${dayIndex + 1}`,
        planTitle: plan.title,
        key,
        label: liveLabel || `Item ${itemIndex + 1}`,
        time: item.time || '',
        plannedCost: parseCost(item.cost),
        excludeFromTotals: false,
        entry,
        stale: isEntryStale(entry, liveLabel),
      });
    });

    (plan.additionalBudget || []).forEach((item, itemIndex) => {
      const key = String(item.itemId ?? `d${dayIndex}|${plan.title}|add|${itemIndex}`);
      const liveLabel = item.title || item.item || '';
      const entry = getReviewEntry(review, null, key);
      items.push({
        kind: 'additional',
        dayIndex,
        dayLabel: day.day || `Day ${dayIndex + 1}`,
        planTitle: plan.title,
        key,
        label: liveLabel || `Extra ${itemIndex + 1}`,
        time: '',
        plannedCost: parseCost(item.cost),
        excludeFromTotals: false,
        entry,
        stale: isEntryStale(entry, liveLabel),
      });
    });
  });

  return items;
};

// { total, reviewed, done, skipped } — "reviewed" = done || skipped.
export const computeReviewProgress = (trip) => {
  const items = getReviewableItems(trip);
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      if (isEntryReviewed(item.entry)) {
        acc.reviewed += 1;
        if (item.entry.done === true) acc.done += 1;
        else acc.skipped += 1;
      }
      return acc;
    },
    { total: 0, reviewed: 0, done: 0, skipped: 0 }
  );
};

// Planned totals per section + grand total (mirrors calculateTotalBudget).
export const computePlannedTotals = (trip) => {
  const totals = { sections: {}, grand: 0 };
  for (const item of getReviewableItems(trip)) {
    if (item.excludeFromTotals) continue;
    totals.sections[item.kind === 'prebooking' ? item.section : 'daily'] =
      (totals.sections[item.kind === 'prebooking' ? item.section : 'daily'] || 0) + item.plannedCost;
    totals.grand += item.plannedCost;
  }
  return totals;
};

// Actual totals: only committed entries count (actualCost !== null). Items
// skipped without an actual cost contribute 0 (money deliberately not spent);
// zero-planned items WITH a committed actual count (unplanned spending).
export const computeActualTotals = (trip) => {
  const totals = { sections: {}, grand: 0, hasAny: false };
  for (const item of getReviewableItems(trip)) {
    if (item.excludeFromTotals || !item.entry) continue;
    const actual = item.entry.actualCost;
    if (actual === null || actual === undefined) continue;
    totals.hasAny = true;
    const bucket = item.kind === 'prebooking' ? item.section : 'daily';
    totals.sections[bucket] = (totals.sections[bucket] || 0) + actual;
    totals.grand += actual;
  }
  return totals;
};

// Immutable update helper: sets/merges a review entry, lazily creating the
// review object and flipping status to in_progress on first write.
// `snapshot` ({ label, plannedCost }) stamps what the user reviewed: isEntryStale
// compares it against the live item later, and any new write re-confirms it.
export const withReviewEntry = (trip, section, key, updater, snapshot) => {
  const review = trip?.review ? normalizeReview(trip.review) : emptyReview();
  if (section && !review.prebooking[section]) review.prebooking[section] = {};
  const bucket = section ? review.prebooking[section] : review.timeline;
  const k = String(key);
  const current = bucket[k] || { actualCost: null, done: false, skipped: false, notes: '' };
  const updated = typeof updater === 'function' ? updater({ ...current }) : { ...current, ...updater };
  const next = updated === null || updated === undefined ? null : {
    ...updated,
    ...(snapshot ? { label: String(snapshot.label ?? ''), plannedCost: parseCost(snapshot.plannedCost) } : {}),
  };
  if (next === null) {
    delete bucket[k];
  } else {
    bucket[k] = next;
  }
  const hasAny = Object.keys(review.timeline).length > 0 ||
    PREBOOKING_SECTIONS.some((s) => Object.keys(review.prebooking[s] || {}).length > 0);
  return {
    ...review,
    status: review.status === REVIEW_STATUS.COMPLETED
      ? REVIEW_STATUS.COMPLETED
      : hasAny
        ? REVIEW_STATUS.IN_PROGRESS
        : review.status,
    startedAt: review.startedAt ?? (hasAny ? Date.now() : null),
  };
};
