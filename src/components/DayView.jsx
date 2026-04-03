import React, { useState } from 'react';
import { getIconElement, CheckIcon, WalletIcon, ChevronDownIcon, getEmoji } from './Icons';

const DayView = ({ dayData, itineraryKey, dayIndex }) => {
  // defaults based on user feedback
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(true);

  const [checkedItems, setCheckedItems] = useState(() => {
    const initialState = {};
    dayData?.checklist?.forEach((_, idx) => {
      if (itineraryKey !== undefined && dayIndex !== undefined) {
        const key = `${itineraryKey}_day_${dayIndex}_checklist_${idx}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          initialState[idx] = saved === 'true';
        }
      }
    });
    return initialState;
  });

  const toggleChecklistItem = (idx) => {
    const newState = !checkedItems[idx];
    setCheckedItems(prev => ({ ...prev, [idx]: newState }));
    
    if (itineraryKey !== undefined && dayIndex !== undefined) {
      const key = `${itineraryKey}_day_${dayIndex}_checklist_${idx}`;
      localStorage.setItem(key, newState.toString());
    }
  };

  return (
    <div className="content-area">
      <div className="mb-4">
        <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          {dayData.day}: {dayData.title}
        </h2>
        {(dayData.date || dayData.week || dayData.city) && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '-0.25rem' }}>
            {dayData.week}{dayData.week && dayData.date ? ', ' : ''}{dayData.date}
            {dayData.city && ` | ${dayData.city}, ${dayData.country}`}
          </p>
        )}
        {dayData.summary && (
          <p style={{ fontStyle: 'italic', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {dayData.summary}
          </p>
        )}
      </div>

      <div className="card">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsChecklistOpen(!isChecklistOpen)}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="section-title" style={{ fontSize: '1rem', margin: 0 }}>
            <CheckIcon /> Daily Checklist
          </h3>
          <span style={{
            transform: isChecklistOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            <ChevronDownIcon />
          </span>
        </div>

        {isChecklistOpen && dayData.checklist && (
          <ul className="checklist mt-4" style={{ marginBottom: 0, paddingLeft: 0, listStyle: 'none' }}>
            {dayData.checklist.map((item, idx) => {
              const isChecked = checkedItems[idx] || false;
              return (
                <li 
                  key={idx} 
                  className="checklist-item" 
                  onClick={() => toggleChecklistItem(idx)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.8rem', 
                    padding: '0.8rem', 
                    borderBottom: '1px solid var(--border-light)', 
                    cursor: 'pointer',
                    background: isChecked ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                    transition: 'all 0.2s',
                    borderRadius: '4px',
                    margin: 0
                  }}
                  onMouseOver={(e) => {
                    if (!isChecked) e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = isChecked ? 'rgba(34, 197, 94, 0.05)' : 'transparent';
                  }}
                >
                  <div style={{
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    border: isChecked ? '2px solid #22c55e' : '2px solid var(--text-secondary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: isChecked ? '#22c55e' : 'transparent',
                    color: '#fff',
                    flexShrink: 0,
                    transition: 'all 0.2s'
                  }}>
                    {isChecked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span style={{ 
                    color: isChecked ? 'var(--text-secondary)' : 'var(--text-primary)',
                    textDecoration: 'none',
                    flex: 1,
                    transition: 'all 0.2s',
                    fontSize: '0.95rem'
                  }}>
                    {item}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <h3 className="section-title mt-4">Timeline</h3>
      <div className="timeline-container">
        {dayData.timeline.map((event, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-icon">
              {getIconElement(event.icon)}
            </div>
            <div className="timeline-content">
              <span className="timeline-time">{event.time}</span>
              <h4 className="timeline-title">{event.title}</h4>
              <p className="timeline-desc">{event.description}</p>

              {(event.duration || event.transport || event.cost) && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {event.duration && (
                    <span>⏱️ {event.duration}</span>
                  )}
                  {event.transport && (
                    <span style={{ textTransform: 'capitalize' }}>{getEmoji(event.transport)} {event.transport}</span>
                  )}
                  {event.cost && (
                    <span>💰 {event.cost}</span>
                  )}
                </div>
              )}

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

      <div className="card mt-4">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setIsBudgetOpen(!isBudgetOpen)}
          style={{ cursor: 'pointer' }}
        >
          <h3 className="section-title" style={{ margin: 0 }}>
            <WalletIcon /> Budget For The Day
          </h3>
          <span style={{
            transform: isBudgetOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
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
              {dayData?.budget?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.item}</td>
                  <td>{item.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DayView;
