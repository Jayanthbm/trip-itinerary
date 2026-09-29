import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, WalletIcon, ChevronDownIcon } from './Icons';
import { parseTimeString, parseDuration } from '../utils/itineraryHelpers';
import { parseCost } from '../utils/costUtils';
import { getReviewEntry } from '../utils/reviewHelpers';
import { timelineReviewKey } from '../utils/reviewHelpers';

const DayView = ({ dayData, dayIndex, startDate, currencySymbol = '₹', onUpdateDay, review }) => {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(true);
  const [selectedPlanTitle, setSelectedPlanTitle] = useState(dayData.active_plan);

  const [now, setNow] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = startDate ? (() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayIndex);
    d.setHours(0, 0, 0, 0);
    return d;
  })() : null;

  const isToday = targetDate && today.getTime() === targetDate.getTime();

  useEffect(() => {
    if (!isToday) return;

    const timer = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(timer);
  }, [isToday, dayIndex]);

  const activeEventRef = useRef(null);

  useEffect(() => {
    if (isToday && activeEventRef.current) {
      const scrollTimeout = setTimeout(() => {
        activeEventRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
      return () => clearTimeout(scrollTimeout);
    }
  }, [isToday, selectedPlanTitle, dayIndex]);

  // Render-time adjustment (react.dev/learn/you-might-not-need-an-effect):
  // when the underlying day's active plan changes (or we switch days), reset
  // local selection state during render instead of via setState-in-effect.
  const [prevKey, setPrevKey] = useState({ dayIndex, active_plan: dayData.active_plan });
  if (prevKey.dayIndex !== dayIndex || prevKey.active_plan !== dayData.active_plan) {
    setPrevKey({ dayIndex, active_plan: dayData.active_plan });
    setSelectedPlanTitle(dayData.active_plan);
  }

  // G5: checklist tick state lives on the trip object (entry.checked) — backed
  // up with the trip, stable under reordering. No localStorage.
  const toggleChecklistItem = (idx) => {
    if (!onUpdateDay || !Array.isArray(dayData.checklist)) return;
    const entry = dayData.checklist[idx];
    if (!entry || typeof entry !== 'object') return;
    const next = dayData.checklist.map((c, i) => (i === idx ? { ...c, checked: !c.checked } : c));
    onUpdateDay({ ...dayData, checklist: next });
  };

  // Calculate date and day of week from startDate + dayIndex
  const calculateDateInfo = (start, index) => {
    if (!start) return { dateStr: '', weekDay: '' };
    const date = new Date(start);
    if (isNaN(date.getTime())) return { dateStr: '', weekDay: '' };
    date.setDate(date.getDate() + index);
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dateStr = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    return { dateStr, weekDay: weekDays[date.getDay()] };
  };
  const { dateStr, weekDay } = calculateDateInfo(startDate, dayIndex);

  const plans = dayData.plans || [];
  const currentPlan = plans.find(p => p.title === selectedPlanTitle) || plans[0] || { timeline: [], additionalBudget: [] };

  // Trip Review cross-reference (post-trip): done → green, skipped → red on
  // the timeline. Inactive until review entries exist.
  const reviewStateFor = (idx, item) => {
    const entry = getReviewEntry(review, null, timelineReviewKey(dayIndex, currentPlan.title, idx, item.itemId));
    if (!entry || (!entry.done && !entry.skipped)) return null;
    return entry.done ? 'done' : 'skipped';
  };

  // Calculate budget from timeline costs + additionalBudget.
  // Custom (unplanned) items are excluded — they are actual spend, not planned.
  const timelineItems = (currentPlan.timeline || [])
    .filter(e => e.custom !== true)
    .filter(e => e.cost !== undefined && e.cost !== null && e.cost !== '')
    .map(e => ({ title: e.title, cost: parseCost(e.cost) }));

  const additionalItems = (currentPlan.additionalBudget || [])
    .map(b => ({ title: b.title, cost: parseCost(b.cost) }));

  const allBudgetItems = [...timelineItems, ...additionalItems];
  const totalCost = allBudgetItems.reduce((sum, item) => sum + item.cost, 0);

  const parsedTimeline = (currentPlan.timeline || []).map((event, idx, arr) => {
    if (!event.time) return { ...event, isPast: false, isOngoing: false };
    
    const startTime = targetDate ? parseTimeString(event.time, targetDate) : null;
    if (!startTime) return { ...event, isPast: false, isOngoing: false };
    
    let endTime = null;
    const durationMins = event.duration ? parseDuration(event.duration) : 0;
    
    if (durationMins > 0) {
      endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);
    } else {
      let nextStartTime = null;
      for (let i = idx + 1; i < arr.length; i++) {
        if (arr[i].time) {
          nextStartTime = targetDate ? parseTimeString(arr[i].time, targetDate) : null;
          if (nextStartTime) break;
        }
      }
      if (nextStartTime && nextStartTime > startTime) {
        endTime = nextStartTime;
      } else {
        endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      }
    }
    
    const isPast = isToday && now >= endTime;
    const isOngoing = isToday && now >= startTime && now < endTime;
    
    let progressPercent = 0;
    let minutesRemaining = 0;
    if (isOngoing) {
      const elapsed = now - startTime;
      const total = endTime - startTime;
      progressPercent = total > 0 ? (elapsed / total) * 100 : 0;
      minutesRemaining = Math.max(0, Math.round((endTime - now) / (60 * 1000)));
    }
    
    return {
      ...event,
      startTime,
      endTime,
      isPast,
      isOngoing,
      progressPercent,
      minutesRemaining
    };
  });

  return (
    <div className="content-area">
      {/* Header */}
      <div className="mb-4">
        <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
          {dayData.day}: {dayData.title}
        </h2>
        {(weekDay || dateStr) && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            {weekDay}{weekDay && dateStr ? ', ' : ''}{dateStr}
          </p>
        )}
        {dayData.summary && (
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            {dayData.summary}
          </p>
        )}
      </div>

      {/* Plan Switcher */}
      {plans.length > 1 && (
        <div className="card" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', marginRight: '0.5rem' }}>PLANS:</span>
              {plans.map((p, idx) => {
                const isActive = p.title === dayData.active_plan;
                const isSelected = p.title === selectedPlanTitle;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedPlanTitle(p.title)}
                    className="tab-btn"
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.85rem',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: isSelected ? '#fff' : 'var(--text-primary)',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      margin: 0
                    }}
                  >
                    {p.title}
                    {isActive && <span style={{ color: '#fbbf24', fontSize: '0.95rem' }} title="Active Plan">★</span>}
                  </button>
                );
              })}
            </div>
            
            {selectedPlanTitle !== dayData.active_plan && (
              <button
                onClick={() => {
                  if (onUpdateDay) {
                    onUpdateDay({
                      ...dayData,
                      active_plan: selectedPlanTitle
                    });
                  }
                }}
                className="tab-btn"
                style={{
                  background: 'var(--accent-secondary)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  margin: 0,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                🎯 Make Active Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Checklist */}
      {dayData.checklist && dayData.checklist.length > 0 && (
        <div className="card">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsChecklistOpen(!isChecklistOpen)}
            style={{ cursor: 'pointer' }}
          >
            <h3 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
              <CheckIcon /> Daily Checklist
            </h3>
            <span style={{ transform: isChecklistOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
              <ChevronDownIcon />
            </span>
          </div>

          {isChecklistOpen && (
            <ul className="checklist mt-4" style={{ marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
              {dayData.checklist.map((item, idx) => {
                // G5 shape: { id, text, checked }; legacy plain strings still render.
                const text = typeof item === 'object' && item !== null ? item.text : String(item ?? '');
                const isChecked = typeof item === 'object' && item !== null ? item.checked === true : false;
                return (
                  <li
                    key={idx}
                    className="checklist-item"
                    onClick={() => toggleChecklistItem(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem',
                      padding: '0.8rem', borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                      transition: 'all 0.2s', borderRadius: '4px', margin: 0
                    }}
                    onMouseOver={(e) => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = isChecked ? 'rgba(34, 197, 94, 0.05)' : 'transparent'; }}
                  >
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: isChecked ? '2px solid #22c55e' : '2px solid var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isChecked ? '#22c55e' : 'transparent', color: '#fff',
                      flexShrink: 0, transition: 'all 0.2s'
                    }}>
                      {isChecked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <span style={{ color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)', flex: 1, transition: 'all 0.2s', fontSize: '0.95rem' }}>
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Timeline */}
      {currentPlan.timeline && currentPlan.timeline.length > 0 && (
        <>
          <h3 className="section-title mt-4">Timeline</h3>
          <div className="timeline-container">
            {parsedTimeline.map((event, idx) => {
              const rState = reviewStateFor(idx, event);
              const isDone = rState === 'done';
              const isSkipped = rState === 'skipped';
              const isCustom = event.custom === true;
              return (
              <div 
                key={idx} 
                ref={event.isOngoing ? activeEventRef : null}
                className="timeline-item"
                style={{
                  opacity: event.isPast ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                <div 
                  className="timeline-icon" 
                  style={{
                    borderColor: event.isOngoing ? '#10b981' : isDone ? '#10b981' : isSkipped ? '#ef4444' : isCustom ? '#f59e0b' : event.isPast ? 'var(--border-light)' : 'var(--accent-primary)',
                    color: event.isOngoing ? '#10b981' : isDone ? '#10b981' : isSkipped ? '#ef4444' : isCustom ? '#f59e0b' : event.isPast ? 'var(--text-secondary)' : 'var(--accent-primary)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </div>
                <div 
                  className="timeline-content"
                  style={{
                    background: event.isOngoing ? 'rgba(16, 185, 129, 0.04)' : isDone ? 'rgba(16, 185, 129, 0.05)' : isSkipped ? 'rgba(239, 68, 68, 0.05)' : isCustom ? 'rgba(245, 158, 11, 0.07)' : 'rgba(255, 255, 255, 0.01)',
                    border: event.isOngoing ? '1px solid #10b981' : isDone ? '1px solid rgba(16, 185, 129, 0.45)' : isSkipped ? '1px solid rgba(239, 68, 68, 0.45)' : isCustom ? '1px dashed rgba(245, 158, 11, 0.5)' : '1px solid var(--border-light)',
                    boxShadow: event.isOngoing ? '0 0 15px rgba(16, 185, 129, 0.15)' : 'none',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    position: 'relative',
                    borderLeft: event.isOngoing ? '4px solid #10b981' : isDone ? '4px solid #10b981' : isSkipped ? '4px solid #ef4444' : isCustom ? '4px solid #f59e0b' : undefined,
                    transition: 'all 0.3s ease',
                    opacity: isSkipped ? 0.85 : 1
                  }}
                >
                  <span className="timeline-time" style={{ color: event.isOngoing ? '#10b981' : isDone ? '#6ee7b7' : isSkipped ? '#fca5a5' : 'var(--text-secondary)', fontWeight: event.isOngoing ? 'bold' : 'normal' }}>
                    {event.time}
                    {event.isOngoing && <span style={{ marginLeft: '0.5rem', background: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', verticalAlign: 'middle' }}>Active</span>}
                    {isDone && <span style={{ marginLeft: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', verticalAlign: 'middle', border: '1px solid rgba(16, 185, 129, 0.5)' }}>✓ Done</span>}
                    {isSkipped && <span style={{ marginLeft: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', verticalAlign: 'middle', border: '1px solid rgba(239, 68, 68, 0.5)' }}>⤫ Skipped</span>}
                    {isCustom && <span style={{ marginLeft: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', verticalAlign: 'middle', border: '1px solid rgba(245, 158, 11, 0.5)' }}>✦ Custom</span>}
                  </span>
                  <h4 className="timeline-title" style={{ color: event.isOngoing ? '#fff' : isDone ? '#6ee7b7' : isSkipped ? '#fca5a5' : 'var(--text-primary)', textDecoration: isSkipped ? 'line-through' : 'none' }}>{event.title}</h4>
                  <p className="timeline-desc">{event.description}</p>

                  {event.isOngoing && (
                    <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', height: '6px', width: '100%', overflow: 'hidden' }}>
                        <div style={{ background: '#10b981', height: '100%', width: `${event.progressPercent}%`, transition: 'width 0.5s ease-out', boxShadow: '0 0 8px #10b981' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'block', fontWeight: '500' }}>
                        ⏱️ {Math.round(event.progressPercent)}% elapsed • {event.minutesRemaining} mins remaining
                      </span>
                    </div>
                  )}

                  {(event.duration || event.cost) ? (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {event.duration ? <span>⏱️ {event.duration}</span> : null}
                      {event.cost ? <span>💰 {currencySymbol}{Number(event.cost).toLocaleString('en-IN')}</span> : null}
                    </div>
                  ) : null}

                  {event.location && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
                      📍 {event.mapsLink ? (
                        <a href={event.mapsLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                          {event.location}
                        </a>
                      ) : (
                        <span>{event.location}</span>
                      )}
                    </div>
                  )}

                  {isCustom && (
                    <button
                      onClick={() => {
                        if (!onUpdateDay) return;
                        const nextTimeline = (currentPlan.timeline || []).filter((it) => it.itemId !== event.itemId);
                        const nextPlans = plans.map((p) => (p.title === currentPlan.title ? { ...p, timeline: nextTimeline } : p));
                        onUpdateDay({ ...dayData, plans: nextPlans });
                      }}
                      title="Remove this custom item"
                      style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem 0.45rem', fontSize: '0.75rem', margin: 0 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}

      {/* Budget */}
      <div className="card mt-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsBudgetOpen(!isBudgetOpen)}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            <WalletIcon /> Budget For The Day
          </h3>
          <span style={{ transform: isBudgetOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
            <ChevronDownIcon />
          </span>
        </div>

        {isBudgetOpen && (
          <table className="budget-table mt-4" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {allBudgetItems.filter(item => item?.cost > 0).map((item, idx) => (
                <tr key={idx}>
                  <td>{item.title}</td>
                  <td>{currencySymbol}{item.cost.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {allBudgetItems.length > 0 && (
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border-light)' }}>
                  <td>Total</td>
                  <td>{currencySymbol}{totalCost.toLocaleString('en-IN')}</td>
                </tr>
              )}
              {allBudgetItems.length === 0 && (
                <tr><td colSpan="2" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No budget data</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DayView;
