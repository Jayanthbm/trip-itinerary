import React, { useState } from 'react';
import { CheckIcon, ChevronDownIcon, PlaneIcon, TrainIcon, BusIcon, BuildingIcon, WalletIcon, PlusIcon } from './Icons';
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

// Inline form to add an unplanned item (something done on the trip that was
// never in the plan) to a day's active-plan timeline. It lands in the day
// timeline, both budget totals and this list immediately.
const AddItemForm = ({ sym, onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [cost, setCost] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onAdd({ title, time, cost: cost.trim() ? parseFloat(cost.replace(/[^\d.]/g, '')) || 0 : 0 });
    setTitle('');
    setTime('');
    setCost('');
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.45rem 0.25rem' }}>
      <input
        type="text"
        className="form-input"
        style={{ flex: 2, minWidth: '120px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
        placeholder="Item name (e.g. Late-night street food)"
        value={title}
        autoFocus
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
      />
      <input
        type="text"
        className="form-input"
        style={{ flex: 1, minWidth: '90px', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
        placeholder="Time (optional)"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sym}</span>
        <input
          type="text"
          inputMode="decimal"
          className="form-input"
          style={{ width: '80px', padding: '0.3rem 0.5rem', fontSize: '0.85rem', textAlign: 'right' }}
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onCancel(); }}
        />
      </div>
      <button
        className="tab-btn"
        onClick={submit}
        title="Add to the day's timeline and review"
        style={{ margin: 0, padding: '0.35rem 0.7rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}
      >
        <PlusIcon size={13} /> Add
      </button>
      <button
        className="tab-btn"
        onClick={onCancel}
        style={{ margin: 0, padding: '0.35rem 0.7rem', flexShrink: 0 }}
      >
        Cancel
      </button>
    </div>
  );
};

const ReviewItemRow = ({ item, sym, onEntry, dropHandlers, isDropTarget }) => {
  const entry = item.entry || { actualCost: null, done: false, skipped: false, notes: '' };
  const showNotes = entry.skipped || (entry.notes && entry.notes.length > 0);

  const update = (updater) => onEntry(item, updater);

  return (
    <div
      {...(dropHandlers ? dropHandlers(item.timelineIndex) : {})}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.25rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexWrap: 'wrap',
        opacity: entry.skipped ? 0.65 : 1,
        boxShadow: isDropTarget ? 'inset 0 2px 0 0 var(--accent-primary)' : 'none',
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

// Custom (unplanned) item row — decision #6: added = done (no state
// checkboxes, no reason), its cost IS the actual spend, ⤫ removes it, and it
// can be dragged to any position in the day's timeline (Review tab only).
const CustomItemRow = ({ item, sym, onUpdateCost, onRemove, dragHandlers, dropHandlers, isDragging, isDropTarget }) => (
  <div
    draggable
    onDragStart={(e) => dragHandlers.onDragStart(e, item)}
    onDragEnd={dragHandlers.onDragEnd}
    {...dropHandlers(item.timelineIndex)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.45rem 0.25rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      flexWrap: 'wrap',
      background: 'rgba(245, 158, 11, 0.06)',
      borderRadius: '6px',
      opacity: isDragging ? 0.4 : 1,
      boxShadow: isDropTarget ? 'inset 0 2px 0 0 #f59e0b' : 'none',
      cursor: 'grab',
    }}
  >
    {/* Drag handle */}
    <span title="Drag to reposition in the day timeline" style={{ color: '#f59e0b', fontSize: '0.9rem', flexShrink: 0, userSelect: 'none', letterSpacing: '-2px' }}>⠿</span>

    {/* Label + time */}
    <div style={{ flex: 1, minWidth: '140px' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        {item.time && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>{item.time}</span>}
        <span>{item.label}</span>
        <span className="badge pending" title="Unplanned — added during review. Counts toward actual spend, not planned budget." style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>✦ custom</span>
      </div>
    </div>

    {/* Planned: none (excluded from planned budget) */}
    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0 }} title="Not in planned budget">
      —
    </span>

    {/* Actual = its cost (editable) */}
    <CostInput
      sym={sym}
      value={item.plannedCost}
      placeholder="0"
      onCommit={(num) => onUpdateCost(num ?? 0)}
    />

    {/* Remove */}
    <button
      onClick={onRemove}
      title="Remove this custom item"
      style={{
        width: '26px', height: '26px', borderRadius: '6px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: 0, padding: 0,
        background: 'transparent', border: '1px solid var(--border-light)',
        color: 'var(--text-muted)', fontSize: '0.75rem',
      }}
    >
      ⤫
    </button>
  </div>
);

const ReviewView = ({
  appData,
  onUpdateReview,
  onAddItem,
  onUpdateCustomItem,
  onDeleteCustomItem,
  onMoveCustomItem,
  onClearReview,
  currencySymbol: sym = '₹',
}) => {
  const [openDays, setOpenDays] = useState({});
  const [openSections, setOpenSections] = useState({});
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [addingDay, setAddingDay] = useState(null);
  const [dragItem, setDragItem] = useState(null); // { dayIndex, itemId }
  const [dropIndex, setDropIndex] = useState(null);

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
    onUpdateReview(withReviewEntry(
      appData,
      item.kind === 'prebooking' ? item.section : null,
      item.key,
      updater,
      // Stamp what the user reviewed so later plan edits show as stale (⚠).
      { label: item.label, plannedCost: item.plannedCost }
    ));
  };

  const markComplete = () => {
    onUpdateReview({ ...review, status: REVIEW_STATUS.COMPLETED, completedAt: Date.now() });
    setShowCompleteConfirm(false);
  };

  const clearReview = () => {
    onClearReview(); // also deletes custom items (decision: Clear resets everything)
    setShowClearConfirm(false);
  };

  // Drag & drop (Review tab only): custom items are draggable, every row in
  // the same day is a drop target. HTML5 dnd — desktop browsers.
  const dragHandlers = {
    onDragStart: (e, item) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.key);
      setDragItem({ dayIndex: item.dayIndex, itemId: item.key });
    },
    onDragEnd: () => {
      setDragItem(null);
      setDropIndex(null);
    },
  };
  const dropHandlers = (dayIndex) => (index) => ({
    onDragOver: (e) => {
      if (!dragItem || dragItem.dayIndex !== dayIndex) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropIndex(index);
    },
    onDrop: (e) => {
      e.preventDefault();
      if (dragItem && dragItem.dayIndex === dayIndex) {
        onMoveCustomItem(dayIndex, dragItem.itemId, index);
      }
      setDragItem(null);
      setDropIndex(null);
    },
  });

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

  const renderRows = (rows, dayIndex) =>
    rows.map((item) =>
      item.custom ? (
        <CustomItemRow
          key={item.key}
          item={item}
          sym={sym}
          onUpdateCost={(num) => onUpdateCustomItem(item.dayIndex, item.key, { cost: num })}
          onRemove={() => onDeleteCustomItem(item.dayIndex, item.key)}
          dragHandlers={dragHandlers}
          dropHandlers={dropHandlers(item.dayIndex)}
          isDragging={dragItem?.itemId === item.key}
          isDropTarget={dropIndex === item.timelineIndex && dragItem?.dayIndex === item.dayIndex && dragItem?.itemId !== item.key}
        />
      ) : (
        <ReviewItemRow
          key={item.key}
          item={item}
          sym={sym}
          onEntry={onEntry}
          dropHandlers={dayIndex !== undefined ? dropHandlers(dayIndex) : undefined}
          isDropTarget={dayIndex !== undefined && dropIndex === item.timelineIndex && dragItem?.dayIndex === dayIndex && dragItem?.itemId !== item.key}
        />
      )
    );

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
                {isOpen && (
                  <>
                    {renderRows(day.items, day.dayIndex)}
                    {onAddItem && (
                      <div style={{ marginTop: '0.35rem' }}>
                        {addingDay === day.dayIndex ? (
                          <AddItemForm
                            sym={sym}
                            onAdd={(fields) => { onAddItem(day.dayIndex, fields); setAddingDay(null); }}
                            onCancel={() => setAddingDay(null)}
                          />
                        ) : (
                          <button
                            className="tab-btn"
                            onClick={() => setAddingDay(day.dayIndex)}
                            title="Something you did that wasn't planned — add it to this day's timeline and review it"
                            style={{ margin: 0, padding: '0.3rem 0.7rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', background: 'transparent', border: '1px dashed var(--border-light)', borderRadius: '6px', cursor: 'pointer' }}
                          >
                            <PlusIcon size={13} /> Add item
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
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
          message="This resets the entire review (costs, checkboxes, notes, rating) and removes any custom items added during the review. Continue?"
          confirmText="Clear Review"
          onConfirm={clearReview}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
};

export default ReviewView;
