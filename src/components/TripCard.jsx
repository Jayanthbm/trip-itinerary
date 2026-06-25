import React from 'react';
import {
  formatDate,
  calculateEndDate,
  getCurrencySymbol,
  calculateTotalBudget,
  getTripCountdown,
  statusStyles,
  isTripInPast
} from '../utils/itineraryHelpers';

function TripCard({
  trip,
  status,
  onSelect,
  onTogglePin,
  onToggleArchive,
  onDelete
}) {
  const daysCount = trip.days ? trip.days.length : 0;
  const endDate = calculateEndDate(trip.startDate, daysCount);
  const curSymbol = getCurrencySymbol(trip.currency);
  const isPinned = !!trip.pinned;
  const isActive = status === 'active';
  const isPast = !isActive && isTripInPast(trip.startDate, daysCount);
  const countdown = getTripCountdown(trip.startDate, daysCount);

  const cardStyle = {
    padding: '1.25rem',
    background: isActive ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
    border: isActive && isPinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
    boxShadow: isActive && isPinned ? '0 0 10px rgba(37, 99, 235, 0.15)' : 'none',
    borderRadius: '12px',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.75rem',
    transition: 'border-color 0.2s, transform 0.2s, opacity 0.2s',
    margin: 0,
    position: 'relative',
    opacity: isActive ? 1 : 0.8
  };

  const handleMouseOver = (e) => {
    e.currentTarget.style.borderColor = 'var(--accent-primary)';
    e.currentTarget.style.transform = 'translateY(-2px)';
    if (!isActive) e.currentTarget.style.opacity = '1';
  };

  const handleMouseOut = (e) => {
    e.currentTarget.style.borderColor = isActive && isPinned ? 'var(--accent-primary)' : 'var(--border-light)';
    e.currentTarget.style.transform = 'none';
    if (!isActive) e.currentTarget.style.opacity = '0.8';
  };

  return (
    <div
      className="card"
      style={cardStyle}
      onClick={onSelect}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <div style={{ paddingRight: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: isActive ? '#fff' : '#ccc', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {trip.title}
          {isActive && isPinned && <span style={{ fontSize: '0.85rem' }} title="Pinned">📌</span>}
        </h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {formatDate(trip.startDate)} {endDate ? `- ${endDate}` : ''}
        </p>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem' }}>
          <span>📅 {daysCount} Days</span>
          <span>💰 {curSymbol}{calculateTotalBudget(trip).toLocaleString('en-IN')}</span>
        </p>
        {countdown.text && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '500',
            marginTop: '0.1rem',
            width: 'fit-content',
            background: statusStyles[countdown.status]?.bg || 'rgba(255,255,255,0.05)',
            border: `1px solid ${statusStyles[countdown.status]?.border || 'var(--border-light)'}`,
            color: statusStyles[countdown.status]?.color || 'var(--text-secondary)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}>
            {countdown.text}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isActive ? (
          <>
            <button
              onClick={(e) => onTogglePin(trip, e)}
              className="tab-btn"
              style={{
                margin: 0,
                padding: '0.2rem 0.35rem',
                fontSize: '0.75rem',
                background: isPinned ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: isPinned ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                color: isPinned ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title={isPinned ? "Unpin Trip" : "Pin Trip"}
            >
              📌
            </button>
            <button
              onClick={(e) => onToggleArchive(trip, e)}
              className="tab-btn"
              style={{
                margin: 0,
                padding: '0.2rem 0.35rem',
                fontSize: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-secondary)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Archive Trip"
            >
              📥
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip);
              }}
              className="tab-btn"
              style={{
                margin: 0,
                padding: '0.2rem 0.35rem',
                fontSize: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Delete Trip"
            >
              🗑️
            </button>
          </>
        ) : (
          <>
            {!isPast && (
              <button
                onClick={(e) => onToggleArchive(trip, e)}
                className="tab-btn"
                style={{
                  margin: 0,
                  padding: '0.25rem 0.4rem',
                  fontSize: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                title="Unarchive Trip"
              >
                📤
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip);
              }}
              className="tab-btn"
              style={{
                margin: 0,
                padding: '0.25rem 0.4rem',
                fontSize: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Delete Trip"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TripCard;
