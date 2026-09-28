// Trip Review helpers (REVIEW_READINESS_PLAN.md P0-6; completed in Phase 1 of
// TRIP_REVIEW_IMPLEMENTATION.md). normalizeReview ships early so backup import
// can sanitize review data at the boundary before any review UI exists.
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
