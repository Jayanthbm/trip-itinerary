// Canonical cost parser — single source of truth (REVIEW_READINESS_PLAN.md P0-1).
// Replaces the four divergent copies that existed in BudgetView.jsx,
// PrebookingView.jsx, itineraryHelpers.calculateTotalBudget and DayView.jsx.
//
// Rules (decision #3, TRIP_REVIEW_IMPLEMENTATION.md §13):
// - Numbers pass through unchanged (non-finite → 0).
// - Strings are stripped of non-numeric characters ("₹30,000" → 30000).
// - Range strings like "₹600 – ₹1,000" take the FIRST number (600),
//   instead of the old behaviour of concatenating digits (6001000).
// - Anything unparseable (empty, "free", objects) → 0.

const RANGE_SEPARATOR = /\s*(?:–|—|-|to)\s*/i;

export const parseCost = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (typeof val !== 'string') return 0;

  let str = val.trim();
  if (!str) return 0;

  if (RANGE_SEPARATOR.test(str)) {
    str = str.split(RANGE_SEPARATOR)[0];
  }

  const num = parseFloat(str.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? num : 0;
};
