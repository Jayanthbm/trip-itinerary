import React, { useState } from 'react';
import { getIconElement, CheckIcon, WalletIcon, ChevronDownIcon, getEmoji } from './Icons';

const DayView = ({ dayData }) => {
  // defaults based on user feedback
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(true);

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

        {isChecklistOpen && (
          <ul className="checklist mt-4" style={{ marginBottom: 0 }}>
            {dayData.checklist.map((item, idx) => (
              <li key={idx} className="checklist-item">
                <span className="checklist-icon"><CheckIcon /></span>
                {item}
              </li>
            ))}
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
