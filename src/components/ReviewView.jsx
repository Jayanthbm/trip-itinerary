import React, { useState } from 'react';
import { CheckIcon, ChevronDownIcon, PlaneIcon, TrainIcon, BusIcon, BuildingIcon, WalletIcon } from './Icons';
import ConfirmPopover from './ConfirmPopover';
import {
  REVIEW_STATUS,
  getReviewableItems,
  computeReviewProgress,
  computePlannedTotals,
  computeActualTotals,
  withReviewEntry,
  emptyReview,
} from '../utils/reviewHelpers';

const SECTION_META = [
  { key: 'flights', title: 'Flights', icon: <PlaneIcon size={16} /> },
  { key: 'trains', title: 'Trains', icon: <TrainIcon size={16} /> },
  { key: 'bus', title: 'Bus', icon: <BusIcon size={16} /> },
  { key: 'rooms', title: 'Rooms', icon: <BuildingIcon size={16} /> },
  { key: 'activities', title: 'Activities', icon: <CheckIcon size={16} /> },
];

const fmt = (n, sym) => `${sym}${(n || 0).toLocaleString('en-IN')}`;

// Actual-cost input: shows the planned cost as a placeholder (greyed) so
// "same as planned" is one keystroke, but actualCost stays null until the
// user commits a value (TRIP_REVIEW_IMPLEMENTATION.md §5 prefill rule).
const CostInput = ({ value, placeholder, onCommit, sym }) => {
  const [text, setText] = useState(value === null || value === undefined ? '' : String(value));

  const commit = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onCommit(null);
      return;
    }
    const num = parseFloat(trimmed.replace(/[^\d.]/g, ''));
    onCommit(Number.isFinite(num) ? num : null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sym}</span>
      <input
        type="text"
        inputMode="decimal"
        className="form-input"
        style={{ width: '90px', padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'right' }}
        value={text}
        placeholder={placeholder}
        title={`Planned: ${placeholder}`}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setText(value === null || value === undefined ? '' : String(value));
            e.currentTarget.blur();
          }
        }}
        onBlur={(e) => {
          commit(e.target.value);
          const parsed = e.target.value.trim() ? parseFloat(e.target.value.replace(/[^\d.]/g, '')) : null;
          setText(parsed === null ? '' : String(parsed));
        }}
      />
    </div>
  );
};

const ReviewItemRow = ({ item, sym, onEntry }) => {
  const entry = item.entry || { actualCost: null, done: false, skipped: false, notes: '' };
  const showNotes = entry.skipped || (entry.notes && entry.notes.length > 0);

  const update = (updater) => onEntry(item, updater);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap',
        opacity: entry.skipped ? 0.65 : 1,
      }}
    >
      {/* Done checkbox */}
      <button
        onClick={() => update((e) => ({ ...e, done: !e.done, skipped: e.done ? e.skipped : false }))}
        title={entry.done ? 'Mark as not done' : 'Mark as done / visited'}
        style={{
          width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0,
          background: entry.done ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
          border: entry.done ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-light)',
          color: entry.done ? '#6ee7b7' : 'var(--text-muted)',
        }}
      >
        {entry.done ? <CheckIcon size={14} /> : ''}
      </button>

      {/* Skipped checkbox */}
      <button
        onClick={() => update((e) => ({ ...e, skipped: !e.skipped, done: e.skipped ? e.done : false }))}
        title={entry.skipped ? 'Un-mark skipped' : 'Mark as skipped (did not do)'}
        style={{
          width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0,
          background: entry.skipped ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
          border: entry.skipped ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-light)',
          color: entry.skipped ? '#fca5a5' : 'var(--text-muted)',
          fontSize: '0.75rem',
        }}
      >
        ⤫
      </button>

      {/* Label + time */}
      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {item.time && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.time}</span>}
          <span style={{ textDecoration: entry.skipped ? 'line-through' : 'none' }}>{item.label}</span>
          {item.stale && (
            <span className="badge pending" title="This item changed since it was reviewed. Un-tick and re-review.">⚠ changed</span>
          )}
          {item.excludeFromTotals && <span className="badge pending" title="Excluded from budget totals">not in budget</span>}
        </div>
        {showNotes && (
          <input
            type="text"
            className="form-input"
            style={{ marginTop: '0.3rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: '100%' }}
            placeholder="Reason (optional) — closed, too expensive, changed plans…"
            value={entry.notes || ''}
            onChange={(e) => update((en) => ({ ...en, notes: e.target.value }))}
          />
        )}
      </div>

      {/* Planned */}
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0 }} title="Planned cost">
        {fmt(item.plannedCost, sym)}
      </span>

      {/* Actual */}
      <CostInput
        sym={sym}
        value={entry.actualCost}
        placeholder={item.plannedCost > 0 ? String(item.plannedCost) : '—'}
        onCommit={(num) => update((e) => ({ ...e, actualCost: num }))}
      />
    </div>
  );
};

const ReviewView = ({ appData, onUpdateReview, currencySymbol: sym = '₹' }) => {
  const [openDays, setOpenDays] = useState({});
  const [openSections, setOpenSections] = useState({});
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const items = getReviewableItems(appData);
  const progress = computeReviewProgress(appData);
  const planned = computePlannedTotals(appData);
  const actual = computeActualTotals(appData);
  const review = appData.review || emptyReview();
  const variance = actual.grand - planned.grand;
  const pct = progress.total > 0 ? Math.round((progress.reviewed / progress.total) * 100) : 0;

  if (items.length === 0) {
    return (
      <div className="content-area">
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <h2 style={{ marginTop: 0 }}>Trip Review</h2>
          <p>Nothing to review — add costs or schedule items to your itinerary first.</p>
        </div>
      </div>
    );
  }

  const onEntry = (item, updater) => {
    onUpdateReview(withReviewEntry(appData, item.kind === 'prebooking' ? item.section : null, item.key, updater));
  };

  const markComplete = () => {
    onUpdateReview({ ...review, status: REVIEW_STATUS.COMPLETED, completedAt: Date.now() });
    setShowCompleteConfirm(false);
  };

  const clearReview = () => {
    onUpdateReview(emptyReview());
    setShowClearConfirm(false);
  };

  const prebookingBySection = SECTION_META.map((meta) => ({
    ...meta,
    items: items.filter((i) => i.kind === 'prebooking' && i.section === meta.key),
  })).filter((s) => s.items.length > 0);

  const dayBuckets = [];
  items.filter((i) => i.kind !== 'prebooking').forEach((item) => {
    let bucket = dayBuckets.find((d) => d.dayIndex === item.dayIndex);
    if (!bucket) {
      bucket = { dayIndex: item.dayIndex, dayLabel: item.dayLabel, items: [] };
      dayBuckets.push(bucket);
    }
    bucket.items.push(item);
  });

  const renderRows = (rows) => rows.map((item) => <ReviewItemRow key={item.key} item={item} sym={sym} onEntry={onEntry} />);

  const sectionHeader = (title, icon, count, isOpen, onToggle) => (
    <div
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0.25rem', userSelect: 'none' }}
    >
      <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-flex' }}>
        <ChevronDownIcon size={14} />
      </span>
      {icon}
      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-primary)', flex: 1 }}>{title}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{count}</span>
    </div>
  );

  return (
    <div className="content-area">
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Trip Review</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="tab-btn" onClick={() => setShowCompleteConfirm(true)} style={{ margin: 0, background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '0.4rem 1rem' }}>
                {review.status === REVIEW_STATUS.COMPLETED ? '✓ Completed' : 'Mark Complete'}
              </button>
              <button className="tab-btn" onClick={() => setShowClearConfirm(true)} title="Reset the entire review" style={{ margin: 0, padding: '0.4rem 0.8rem' }}>
                Clear
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
            <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
              {progress.reviewed} / {progress.total} reviewed
              {progress.skipped > 0 && ` · ${progress.skipped} skipped`}
            </span>
          </div>

          {/* Overall money line */}
          <div style={{ marginTop: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>Planned: <strong style={{ color: 'var(--text-primary)' }}>{fmt(planned.grand, sym)}</strong></span>
            <span>Actual: <strong style={{ color: actual.hasAny ? 'var(--text-primary)' : 'var(--text-muted)' }}>{actual.hasAny ? fmt(actual.grand, sym) : '—'}</strong></span>
            {actual.hasAny && (
              <span style={{ color: variance > 0 ? '#f87171' : variance < 0 ? '#6ee7b7' : 'var(--text-muted)' }}>
                {variance > 0 ? '🔴' : variance < 0 ? '🟢' : '⚪'} {variance > 0 ? '+' : ''}{fmt(variance, sym)}
              </span>
            )}
          </div>
        </div>

        {/* Prebooking sections */}
        <div style={{ padding: '1.5rem' }}>
          {prebookingBySection.map((section) => {
            const isOpen = openSections[section.key] !== false;
            return (
              <div key={section.key} style={{ marginBottom: '1rem' }}>
                {sectionHeader(section.title, section.icon, section.items.length, isOpen, () => setOpenSections((p) => ({ ...p, [section.key]: !isOpen })))}
                {isOpen && renderRows(section.items)}
              </div>
            );
          })}

          {/* Days */}
          {dayBuckets.map((day) => {
            const isOpen = openDays[day.dayIndex] !== false;
            return (
              <div key={day.dayIndex} style={{ marginBottom: '1rem' }}>
                {sectionHeader(`📅 ${day.dayLabel}`, <WalletIcon size={16} />, day.items.length, isOpen, () => setOpenDays((p) => ({ ...p, [day.dayIndex]: !isOpen })))}
                {isOpen && renderRows(day.items)}
              </div>
            );
          })}
        </div>

        {/* Summary: notes & rating */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>How was the trip?</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => onUpdateReview({ ...review, rating: review.rating === n ? 0 : n })}
                  title={`${n} star${n > 1 ? 's' : ''}`}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', margin: 0, padding: '0 0.15rem',
                    fontSize: '1.2rem', color: n <= review.rating ? '#fbbf24' : 'var(--text-muted)',
                  }}
                >
                  {n <= review.rating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <textarea
            className="form-input"
            style={{ minHeight: '70px', fontSize: '0.9rem' }}
            placeholder="Overall notes — what would you do differently next time?"
            value={review.notes || ''}
            onChange={(e) => onUpdateReview({ ...review, notes: e.target.value })}
          />
        </div>
      </div>

      {showCompleteConfirm && (
        <ConfirmPopover
          message={
            progress.reviewed < progress.total
              ? `${progress.total - progress.reviewed} items are not reviewed yet. Mark the review complete anyway?`
              : 'Mark this trip review as complete?'
          }
          confirmText="Mark Complete"
          onConfirm={markComplete}
          onCancel={() => setShowCompleteConfirm(false)}
        />
      )}
      {showClearConfirm && (
        <ConfirmPopover
          message="This resets the entire review (costs, checkboxes, notes and rating) for this trip. Continue?"
          confirmText="Clear Review"
          onConfirm={clearReview}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default ReviewView;
