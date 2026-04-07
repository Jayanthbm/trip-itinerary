import React, { useState } from 'react';
import { CheckIcon, WalletIcon, ChevronDownIcon } from './Icons';

const DayView = ({ dayData, itineraryKey, dayIndex, startDate, currencySymbol = '₹' }) => {
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(true);

  const [checkedItems, setCheckedItems] = useState(() => {
    const initialState = {};
    dayData?.checklist?.forEach((_, idx) => {
      if (itineraryKey !== undefined && dayIndex !== undefined) {
        const key = `${itineraryKey}_day_${dayIndex}_checklist_${idx}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) initialState[idx] = saved === 'true';
      }
    });
    return initialState;
  });

  const toggleChecklistItem = (idx) => {
    const newState = !checkedItems[idx];
    setCheckedItems(prev => ({ ...prev, [idx]: newState }));
    if (itineraryKey !== undefined && dayIndex !== undefined) {
      localStorage.setItem(`${itineraryKey}_day_${dayIndex}_checklist_${idx}`, newState.toString());
    }
  };

  // Calculate date and day of week from startDate + dayIndex
  const calculateDateInfo = (start, index) => {
    if (!start) return { dateStr: '', weekDay: '' };
    const date = new Date(start);
    if (isNaN(date.getTime())) return { dateStr: '', weekDay: '' };
    date.setDate(date.getDate() + index);
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return { dateStr: `${yyyy}-${mm}-${dd}`, weekDay: weekDays[date.getDay()] };
  };
  const { dateStr, weekDay } = calculateDateInfo(startDate, dayIndex);

  // Calculate budget from timeline costs + additionalBudget
  const timelineItems = (dayData.timeline || [])
    .filter(e => e.cost !== undefined && e.cost !== null && e.cost !== '')
    .map(e => ({ title: e.title, cost: Number(e.cost) || 0 }));

  const additionalItems = (dayData.additionalBudget || [])
    .map(b => ({ title: b.title, cost: Number(b.cost) || 0 }));

  const allBudgetItems = [...timelineItems, ...additionalItems];
  const totalCost = allBudgetItems.reduce((sum, item) => sum + item.cost, 0);

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
                const isChecked = checkedItems[idx] || false;
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
                      {item}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Timeline */}
      {dayData.timeline && dayData.timeline.length > 0 && (
        <>
          <h3 className="section-title mt-4">Timeline</h3>
          <div className="timeline-container">
            {dayData.timeline.map((event, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                </div>
                <div className="timeline-content">
                  <span className="timeline-time">{event.time}</span>
                  <h4 className="timeline-title">{event.title}</h4>
                  <p className="timeline-desc">{event.description}</p>

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
                </div>
              </div>
            ))}
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
