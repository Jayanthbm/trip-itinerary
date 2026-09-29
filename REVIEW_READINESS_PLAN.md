# Review-Readiness Plan — Pre-Implementation Audit

**Purpose:** Gaps in the *current* codebase that should be fixed (or consciously decided) **before** building the Trip Review feature, so the review feature lands on solid ground.
**Status:** ✅ **Phase 0 implemented** (P0-1…P0-8 complete; `npm test` 16/16, `npm run lint` 0 errors, `npm run build` green). Two pre-existing lint warnings remain in `App.jsx` (effect dependency arrays) — harmless, left untouched.
**Companion doc:** `TRIP_REVIEW_IMPLEMENTATION.md` (updated to reference this plan as **Phase 0**).
**Audited:** `src/App.jsx`, `src/utils/db.js`, `src/utils/itineraryHelpers.js`, `src/components/BudgetView.jsx`, `DayView.jsx`, `PrebookingView.jsx`, `EditDay.jsx`, `ItineraryView.jsx`, `Tabs.jsx`, `TripCard.jsx`, `DashboardView.jsx`, `vite.config.js`, `data.json`, `madikeri_2026.json`, `package.json`.

---

## 1. Findings Summary

| # | Severity | Area | Finding |
|---|---|---|---|
| G1 | 🔴 High | Cost parsing | `parseCost` exists in **4 places with divergent behaviour**; range-cost strings (real data!) parse to garbage |
| G2 | 🔴 High | Data model | `additionalBudget` items in the wild use an `item` key, not `title` — `normalizeData` **silently drops their label and cost** |
| G3 | 🟠 Medium | Data safety | `normalizeData` destroys legacy string costs permanently on first load+save (not idempotent-safe) |
| G4 | 🟠 Medium | Identity | No stable ids on timeline items; prebooking ids are positional and regenerated — review keys would be fragile |
| G5 | 🟠 Medium | State location | ✅ **Resolved.** Checklist/prebooking status now lives on the trip object (backed up); legacy localStorage state is harvested once on load |
| G6 | 🟡 Low-Med | Navigation | Open-trip flow hardcodes `setActiveTab('day-0')` in ~6 places — blocks "open directly into Review" |
| G7 | 🟡 Low-Med | UX gate | Budget tab unreachable for trips without `prebookingData` (button hidden / render guard) |
| G8 | 🟡 Low | Performance | Every keystroke in Edit mode writes the whole trip to IndexedDB; review inputs would amplify this |
| G9 | ℹ️ Info | Behaviour | `saveTrip` bumps `updatedAt` on every write → review edits will reorder "recent" on dashboard |
| G10 | 🟠 Medium | Quality | No test framework at all; review math is pure and highly testable |
| G11 | ℹ️ Info | Consistency | `currencySymbol = '₹'` default scattered in components; `getCurrencySymbol` exists |
| G12 | 🟡 Low | Robustness | `validateData` is minimal; malformed imported data could crash new views |

---

## 2. Detailed Findings

### G1 — Four cost parsers, divergent semantics (🔴 do first)

`parseCost` is duplicated, and the copies disagree:

| Location | Implementation | Behaviour |
|---|---|---|
| `BudgetView.jsx` (local) | strip non-digits/dots → parseFloat | legacy strings tolerated |
| `itineraryHelpers.calculateTotalBudget` (inline) | same as above | duplicated code |
| `PrebookingView.jsx` (local) | same as above | duplicated code |
| `DayView.jsx` | `Number(e.cost) \|\| 0` | **no string parsing at all** — `"₹500"` → `NaN` → 0 |

**Confirmed real-world data problem:** `data.json` (Vietnam sample) contains **range costs**:

```json
{ "cost": "₹600 – ₹1,000" }
```

Trace through the strip parser: `"₹600 – ₹1,000"` → keep `[\d.]` only → `"6001000"` → **₹60,01,000**. A ₹800 budget item becomes ₹60 lakh in any planned total computed from raw JSON. (After `normalizeData` it becomes `0` instead — see G3 — but either way the number is wrong, and differently wrong depending on path.)

**Prep action (P0-1):**
- Create `src/utils/costUtils.js` with the single canonical `parseCost(value)`.
- **Decide the range-string rule (now resolved, see G1-decision):** a value containing a range separator (`–`, `-`, `to`) yields the **first number**. Documented in the function and in `TRIP_REVIEW_IMPLEMENTATION.md` §13.
- Replace all four call sites; delete local copies. `DayView` inherits correct string parsing as a side effect.
- Add unit tests (see P0-5) pinning: numbers, `"₹30,000"`, `"30000"`, `"₹600 – ₹1,000"` → 600, `""`/null/undefined → 0.

### G2 — `additionalBudget` items lose label and cost on load (🔴 do first)

`data.json` uses `item` as the label key:

```json
{ "item": "Airport Travel (Cab)", "cost": "₹1000" }
```

But `normalizeData` maps only `title: item.title || ""` and `cost: typeof item.cost === "number" ? item.cost : 0`. Result for the Vietnam sample: `{ title: "", cost: 0 }` — **the entire additional-budget list silently vanishes** (labels *and* money) the first time the trip is normalized and saved. The same file also uses `item` for some daily-cost lists.

Consequences for Trip Review: planned totals understate real plans, and the review UI would render blank rows for these entries.

**Prep action (P0-2):** in `normalizeData`, map `title: item.title || item.item || ""` (all three additionalBudget/timeline normalization branches) and run costs through the new canonical `parseCost` (numbers pass through; `"₹1000"` → 1000). Also accept `item` in `BudgetView`/`DayView` display paths (`item.title || item.item`) for raw-data rendering before normalization.

### G3 — Normalization is destructive for legacy string costs (🟠)

`cost: typeof item.cost === "number" ? item.cost : 0` turns `"₹1000"` into `0`, then `saveTrip` persists that. The original string is gone from IndexedDB. Combined with G1/G2 this means: **existing saved trips may already have zeroed costs.**

**Prep action (P0-3):** normalize costs *into numbers* via `parseCost` (G2 fix) instead of `: 0`, so the best-available number is preserved. Do **not** attempt a backfill of already-zeroed trips (unrecoverable); note in the verification section that affected trips show understated planned totals, which the Review feature will surface honestly via the Actual column.

### G4 — No stable item identity (🟠 — review data depends on it)

- Timeline items have **no ids**; review keys would be `dayIndex|planTitle|itemIndex` (positional).
- Prebooking ids are `i + 1`, regenerated by `normalizeData` — positional.

Positional keys survive *most* usage but break on insert/delete/reorder, and `EditDay` lets users add/delete timeline items freely.

**Prep action (P0-4):**
- In `normalizeData`, stamp a stable `itemId` (crypto UUID, fallback counter) on every timeline item, additionalBudget item, and prebooking item. Existing trips get ids on next save — acceptable, since ids only need to be stable from that point on.
- `EditDay` add/delete paths must **preserve** `itemId` of untouched items (spread existing objects — verify no object re-creation drops it).
- Trip Review keys then prefer `itemId`, falling back to positional keys for pre-id trips (the review doc's keying section already allows snapshots for drift).

### G5 — localStorage-only UI state (🟠 — ✅ RESOLVED: migrated to the trip object)

> **Status (2026-09-29):** Implemented. Checklist ticks are now `{ id, text, checked }` entries on
> `day.checklist` (upgraded by `normalizeData`), and prebooking booking status is written to
> `item.status` on the trip object (`PrebookingView` → `onUpdateItem`). A one-time harvest
> (`migrateLegacyUiState` + `cleanupLegacyUiState` in `itineraryHelpers.js`, run from
> `loadRecentTrips`) pulls any old localStorage state into saved trips and then removes the
> legacy keys. All state is backed up with the trip; the `itineraryKey` plumbing is gone.
> Tests: `src/utils/g5Migration.test.js`.

Checklist ticks (`${itineraryKey}_day_${i}_checklist_${idx}`) and prebooking status (`${itineraryKey}_prebook_${cat}_${id}`) live in localStorage:
- **Not in backups** (export/import never touch them).
- `itineraryKey = title_startDate_endDate` → **collides** for two trips with the same title+dates; orphans when title/dates are edited.
- The Review feature must **not** follow this pattern (already decided: review state on the trip object).

**Prep action (P0-5, minimal):** no migration in this prep round (scope control). Optionally add a `// TODO(prep-G5)` note at both call sites pointing at the trip-object pattern. Actual migration of checklist/prebook state into the trip object is deferred and tracked as future work — Trip Review is unblocked without it.

### G6 — Open-trip flow is hardcoded to `day-0` (🟡)

`setActiveTab('day-0')` appears in: `App.jsx` init (×2), `fetchData`, `handleCreateNew`, `handleLoadLocalData`, and `DashboardView.jsx` (×2 card onClick paths). The Review feature needs "open trip → land on Review tab" from dashboard cards (§5 of the review doc).

**Prep action (P0-6):** add a single `openTrip(trip, tab = 'day-0')` helper in `App.jsx` (sets `appData`, `activeTab`, `active_trip_id`) and replace all scattered occurrences. Pure refactor, no behaviour change — the Review feature then just calls `openTrip(trip, 'review')`.

### G7 — Budget tab unreachable without prebooking data (🟡)

Two gates: `ItineraryView.renderContent()` requires `hasPrebooking`, and `Tabs.jsx` only renders the Budget button when `hasPrebooking`. Trips built via `handleCreateNew` *do* get empty `prebookingData`, so in practice most trips pass — but URL/JSON-loaded trips without the key can't reach Budget at all.

**Prep action (P0-7):** fix the gate in both files (button always shown; `renderContent` renders BudgetView regardless). BudgetView already skips empty sections. (This duplicates the fix already planned in review doc §6 — doing it in prep keeps the Review phases clean.)

### G8 — Keystroke-level IndexedDB writes (🟡)

`EditView`/`EditDay` onChange → `handleUpdateAppData` → `saveTrip` on **every keystroke** (full trip put + `updatedAt` bump). Works today; a review screen with dozens of inputs would multiply writes and re-renders.

**Prep action (P0-8):** add `useDebouncedSave` (300–500 ms) in `src/utils/hooks.js` and wire it into review inputs *only* (Edit-mode refactor is optional follow-up, explicitly out of scope here). Flush pending save on tab switch / close (`executeClose`, `beforeunload`) so nothing is lost.

### G9 — `updatedAt` bumps on every save (ℹ️ — accept)

`saveTrip` stamps `updatedAt: Date.now()` and `getAllTrips` sorts by it. Review edits will therefore surface recently-reviewed trips at the top of the dashboard. Arguably desirable. **Decision: accept; no change.** Documented so it doesn't surprise anyone.

### G10 — Zero test infrastructure (🟠)

No test script, no runner. The Review feature's core (totals, variance, progress, normalize guards) is pure logic — the exact code where silent math bugs are costliest.

**Prep action (P0-5):** add `vitest` (matches Vite 8 toolchain; `node --test` can't read JSX-free ESM imports from `src/samples/*.json` as easily and vitest gives watch mode) with:
- `npm test` script; tests for `costUtils.parseCost` (G1 table above).
- Fixture-based tests for `normalizeData` using `madikeri_2026.json` (clean) + a synthetic legacy fixture (string costs, `item`-keyed additionalBudget, missing fields).
- Keep it minimal — no React testing yet.

### G11 — Currency symbol defaults (ℹ️)

`currencySymbol = '₹'` default in BudgetView/DayView/PrebookingView signatures; `getCurrencySymbol(trip.currency)` exists and is already passed correctly from `ItineraryView`. **No prep change** — just a rule for Review code: always take `currencySymbol` as a prop, never default inside review components.

### G12 — Minimal `validateData` (🟡)

Only checks title/startDate/days. Imported backups with garbage `days` entries normalize defensively already (`normalizeData` defaults everything), so the risk is low — but ReviewView must never crash on malformed `review` data.

**Prep action (P0-9):** ship `normalizeReview(review)` *early* (it was planned as Phase 1 of the review doc anyway) and call it from `handleImportBackup` so review shapes are sanitized at the boundary. Cheap, and de-risks the import path before any review UI exists.

---

## 3. Prep Phase Plan (Phase 0)

Ordered, each independently verifiable. Nothing here changes product behaviour except noted fixes (G1–G3 change numbers **to be correct**).

| Step | Fixes | Files | Depends on |
|---|---|---|---|
| **P0-1** Test infra + costUtils | G1, G10 | new `src/utils/costUtils.js`, new `src/utils/costUtils.test.js`, `package.json` (+vitest, `test` script) | — |
| **P0-2** Non-destructive normalization + `item` alias | G2, G3 | `src/utils/itineraryHelpers.js` | P0-1 |
| **P0-3** Stable `itemId` on all reviewable items | G4 | `src/utils/itineraryHelpers.js`, verify `EditDay.jsx` preserves ids | P0-1 |
| **P0-4** `openTrip(trip, tab)` centralization | G6 | `src/App.jsx`, `src/components/DashboardView.jsx` | — |
| **P0-5** Budget-tab gate fix | G7 | `src/components/ItineraryView.jsx`, `src/components/Tabs.jsx` | — |
| **P0-6** `normalizeReview` early + import guard | G12 | new `src/utils/reviewHelpers.js` (partial), `src/App.jsx` (import path) | P0-1 |
| **P0-7** Debounced save hook (review-facing) | G8 | new `src/utils/hooks.js` | — |
| **P0-8** TODO notes on localStorage pattern | G5 | `src/components/DayView.jsx`, `src/components/PrebookingView.jsx` | — |

**Deliberately out of prep scope:** migrating checklist/prebook localStorage state into the trip object (G5 full fix), Edit-mode write debouncing, currency default cleanup, any review UI. These stay in/after the review doc phases.

### Verification for Phase 0

- `npm test` green (parseCost table; normalizeData fixtures incl. `madikeri_2026.json` totals unchanged, legacy fixture totals *improved* per G1/G2 rules).
- `npm run lint` and `npm run build` clean.
- Manual: load `data.json` via URL → additionalBudget rows show labels and sane costs; export → import round-trip preserves everything; trip without `prebookingData` shows Budget tab; open-trip flow unchanged (`day-0`).

### Dependency map → Trip Review phases

| Review phase (TRIP_REVIEW doc §10) | Needs prep |
|---|---|
| Phase 1 (reviewHelpers) | P0-1, P0-6 (normalizeReview already exists) |
| Phase 2 (ReviewView + wiring) | P0-3 (itemId keys), P0-4 (`openTrip(trip,'review')`), P0-7 (debounced save), P0-2/P0-1 (correct planned costs) |
| Phase 3 (Budget planned-vs-actual) | P0-1, P0-2, P0-5 (gate already fixed) |
| Phase 4 (dashboard badges) | P0-4 |
| Phase 5 (polish) | — |

---

## 4. New decisions locked by this plan

3. **Range costs** (`"₹600 – ₹1,000"`): parse to the **first number** (₹600). Predictable, documented in `costUtils`, pinned by test. *(Mirrored into `TRIP_REVIEW_IMPLEMENTATION.md` §13.)*
4. **`updatedAt` reorder on review activity:** accepted behaviour.
5. **Checklist/prebook localStorage migration:** deferred; Trip Review does not extend that pattern (trip-object state only).

## 5. Why prep before the review feature (one paragraph)

The Review feature's entire value is *trustworthy* planned-vs-actual numbers. Today, planned totals are computed by four disagreeing parsers over data that normalization partially destroys (G1–G3), keyed against items with no stable identity (G4), reachable through a navigation layer that can't deep-link to a new tab (G6), with zero tests to catch regressions (G10). Building on top would bake these bugs into the review UI and make every future fix a data-migration problem. Phase 0 is ~a day of focused work, is independently shippable, and each review phase then lands cleanly.
