import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';
import {
  REVIEW_STATUS,
  getReviewableItems,
  computePlannedTotals,
  computeActualTotals,
} from '../utils/reviewHelpers';

const fmt = (n, sym) => `${sym}${(n || 0).toLocaleString('en-IN')}`;

const varianceColor = (v) => (v > 0 ? '#f87171' : v < 0 ? '#6ee7b7' : 'var(--text-muted)');

const BudgetView = ({ appData, currencySymbol = '₹', onStartReview, reviewStatus }) => {
  const [expandedDays, setExpandedDays] = useState({});
  const toggleDay = (idx) => setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));

  const reviewItems = getReviewableItems(appData);
  const hasReviewData = reviewItems.some((i) => i.entry);

  // ---- Planned sections (mirrors calculateTotalBudget; shared via reviewHelpers) ----
  const sectionOf = (item) => (item.kind === 'prebooking' ? item.section : 'daily');

  const plannedTotals = computePlannedTotals(appData);
  const actualTotals = computeActualTotals(appData);

  const SECTION_ORDER = [
    { key: 'flights', title: 'Flights', emoji: '✈️' },
    { key: 'trains', title: 'Trains', emoji: '🚂' },
    { key: 'bus', title: 'Bus', emoji: '🚌' },
    { key: 'rooms', title: 'Accommodations', emoji: '🏨' },
    { key: 'activities', title: 'Activities & Requirements', emoji: '🎯' },
    { key: 'daily', title: 'Daily Costs (Food, Travel, Activities)', emoji: '📅' },
  ];

  const renderSection = (sectionKey, title, emoji) => {
    const items = reviewItems.filter((i) => sectionOf(i) === sectionKey);
    if (items.length === 0) return null;

    const plannedSubtotal = plannedTotals.sections[sectionKey] || 0;
    const actualSubtotal = actualTotals.sections[sectionKey];
    const subtotalVariance = actualSubtotal === undefined ? null : actualSubtotal - plannedSubtotal;

    const dayItems = sectionKey === 'daily'
      ? [...new Set(items.map((i) => i.dayIndex))].sort((a, b) => a - b).map((dayIndex) => ({
          dayIndex,
          dayLabel: items.find((i) => i.dayIndex === dayIndex).dayLabel,
          items: items.filter((i) => i.dayIndex === dayIndex),
        }))
      : null;

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>
          {emoji} {title}
        </h3>

        {/* Column header (only when review data exists) */}
        {hasReviewData && (
          <div style={{ display: 'flex', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <span style={{ flex: 1, paddingRight: '1rem' }} />
            <span style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>Planned</span>
            <span style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>Actual</span>
            <span style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>Δ</span>
          </div>
        )}

        {sectionKey === 'daily'
          ? dayItems.map((day, idx) => (
              <div key={day.dayIndex} style={{ marginBottom: '0.25rem' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '0.5rem 0.25rem', borderRadius: '4px' }}
                  onClick={() => toggleDay(idx)}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ transform: expandedDays[idx] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>
                      <ChevronDownIcon size={14} />
                    </span>
                    {day.dayLabel}
                  </span>
                  <span style={{ display: 'flex', flexShrink: 0, fontWeight: 600, fontSize: '0.9rem' }}>
                    <span style={{ width: '90px', textAlign: 'right' }}>{fmt(day.items.filter((i) => !i.custom).reduce((s, i) => s + i.plannedCost, 0), currencySymbol)}</span>
                    <span style={{ width: '90px', textAlign: 'right', color: day.items.some((i) => (i.custom ? i.plannedCost > 0 : i.entry?.actualCost !== null && i.entry?.actualCost !== undefined)) ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {day.items.some((i) => (i.custom ? i.plannedCost > 0 : i.entry?.actualCost !== null && i.entry?.actualCost !== undefined))
                        ? fmt(day.items.reduce((s, i) => s + (i.custom ? i.plannedCost : (i.entry?.actualCost ?? 0)), 0), currencySymbol)
                        : '—'}
                    </span>
                    <span style={{ width: '90px', textAlign: 'right' }} />
                  </span>
                </div>
                {expandedDays[idx] && (
                  <div style={{ paddingLeft: '1.5rem', paddingBottom: '0.25rem' }}>
                    {renderItemRows(day.items)}
                  </div>
                )}
              </div>
            ))
          : renderItemRows(items)}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
          <span>Subtotal</span>
          <span style={{ display: 'flex', flexShrink: 0, fontWeight: 'bold', fontSize: '0.95rem' }}>
            <span style={{ width: '90px', textAlign: 'right' }}>{fmt(plannedSubtotal, currencySymbol)}</span>
            <span style={{ width: '90px', textAlign: 'right', color: actualSubtotal === undefined ? 'var(--text-muted)' : 'var(--text-primary)' }}>
              {actualSubtotal === undefined ? '—' : fmt(actualSubtotal, currencySymbol)}
            </span>
            <span style={{ width: '90px', textAlign: 'right', color: subtotalVariance === null ? 'var(--text-muted)' : varianceColor(subtotalVariance) }}>
              {subtotalVariance === null ? '—' : `${subtotalVariance > 0 ? '+' : ''}${fmt(subtotalVariance, currencySymbol)}`}
            </span>
          </span>
        </div>
      </div>
    );
  };

  const renderItemRows = (items) =>
    items.map((item) => {
      // Custom (unplanned) items: their cost IS the actual spend — no planned
      // column, no variance (decision #6).
      if (item.custom) {
        return (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)', flex: 1, paddingRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
              {item.kind !== 'prebooking' && item.time && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.time}</span>}
              <span style={{ color: '#fbbf24' }}>{item.label}</span>
              <span className="badge pending" title="Unplanned — added during review; counts toward actual spend only" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}>✦</span>
            </span>
            <span style={{ display: 'flex', flexShrink: 0 }}>
              <span style={{ width: '90px', textAlign: 'right', color: 'var(--text-muted)' }}>—</span>
              <span style={{ width: '90px', textAlign: 'right', color: item.plannedCost > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {item.plannedCost > 0 ? fmt(item.plannedCost, currencySymbol) : '—'}
              </span>
              <span style={{ width: '90px', textAlign: 'right', color: 'var(--text-muted)' }}>—</span>
            </span>
          </div>
        );
      }
      const actual = item.entry?.actualCost;
      const hasActual = actual !== null && actual !== undefined;
      const variance = hasActual ? actual - item.plannedCost : null;
      return (
        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-secondary)', flex: 1, paddingRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
            {item.kind !== 'prebooking' && item.time && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.time}</span>}
            <span style={item.entry?.skipped ? { textDecoration: 'line-through', opacity: 0.65 } : undefined}>{item.label}</span>
            {item.stale && <span className="badge pending" title="Item changed since review">⚠</span>}
          </span>
          <span style={{ display: 'flex', flexShrink: 0 }}>
            <span style={{ width: '90px', textAlign: 'right' }}>{fmt(item.plannedCost, currencySymbol)}</span>
            <span style={{ width: '90px', textAlign: 'right', color: hasActual ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {hasActual ? fmt(actual, currencySymbol) : '—'}
            </span>
            <span style={{ width: '90px', textAlign: 'right', color: variance === null ? 'var(--text-muted)' : varianceColor(variance) }}>
              {variance === null ? '—' : `${variance > 0 ? '+' : ''}${fmt(variance, currencySymbol)}`}
            </span>
          </span>
        </div>
      );
    });

  return (
    <div className="content-area">
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Trip Budget Breakdown</h2>
        </div>

        {/* Start-review banner for completed-but-unreviewed trips */}
        {onStartReview && !hasReviewData && reviewStatus === REVIEW_STATUS.NOT_STARTED && (
          <div
            onClick={onStartReview}
            style={{
              margin: '1.5rem 1.5rem 0',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              color: '#93c5fd',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span>Trip completed — start a review to compare planned vs actual costs.</span>
            <strong style={{ flexShrink: 0 }}>Start Review →</strong>
          </div>
        )}

        <div style={{ padding: '1.5rem' }}>
          {SECTION_ORDER.map((s) => renderSection(s.key, s.title, s.emoji))}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderRadius: '8px', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: actualTotals.hasAny ? '0.5rem' : 0 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Grand Total</span>
              <span style={{ display: 'flex', flexShrink: 0, alignItems: 'baseline' }}>
                <span style={{ width: '90px', textAlign: 'right', fontSize: '1.15rem', fontWeight: 700 }}>
                  {fmt(plannedTotals.grand, currencySymbol)}
                </span>
                <span style={{ width: '90px', textAlign: 'right', fontSize: '1.15rem', fontWeight: 700, color: actualTotals.hasAny ? '#fff' : 'var(--text-muted)' }}>
                  {actualTotals.hasAny ? fmt(actualTotals.grand, currencySymbol) : '—'}
                </span>
                <span style={{ width: '90px', textAlign: 'right', fontSize: '1.15rem', fontWeight: 700, color: actualTotals.hasAny ? varianceColor(actualTotals.grand - plannedTotals.grand) : 'var(--text-muted)' }}>
                  {actualTotals.hasAny ? `${actualTotals.grand - plannedTotals.grand > 0 ? '+' : ''}${fmt(actualTotals.grand - plannedTotals.grand, currencySymbol)}` : '—'}
                </span>
              </span>
            </div>
            {actualTotals.hasAny && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span style={{ width: '90px', textAlign: 'right' }}>Planned</span>
                <span style={{ width: '90px', textAlign: 'right' }}>Actual</span>
                <span style={{ width: '90px', textAlign: 'right' }}>Variance</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
