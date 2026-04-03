import React, { useState } from 'react';
import { PlaneIcon, BuildingIcon, CheckIcon, ChevronDownIcon } from './Icons';

const PrebookingView = ({ data, itineraryKey }) => {
  const [isFlightsOpen, setIsFlightsOpen] = useState(true);
  const [isRoomsOpen, setIsRoomsOpen] = useState(true);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);

  const getInitialStatus = (category, items) => {
    const initialState = {};
    items.forEach(item => {
      if (itineraryKey !== undefined && item.id) {
        const key = `${itineraryKey}_prebook_${category}_${item.id}`;
        const saved = localStorage.getItem(key);
        if (saved !== null) {
          initialState[item.id] = saved;
        } else {
          initialState[item.id] = item.status || 'Pending';
        }
      } else {
        initialState[item.id] = item.status || 'Pending';
      }
    });
    return initialState;
  };

  const [flightStatuses, setFlightStatuses] = useState(() => getInitialStatus('flight', data?.flights || []));
  const [roomStatuses, setRoomStatuses] = useState(() => getInitialStatus('room', data?.rooms || []));
  const [activityStatuses, setActivityStatuses] = useState(() => getInitialStatus('activity', data?.activities || []));

  const toggleStatus = (category, id, currentState, setStatusState) => {
    const newStatus = currentState.toLowerCase() === 'booked' || currentState.toLowerCase() === 'done' ? 'Pending' : 'Booked';
    setStatusState(prev => ({ ...prev, [id]: newStatus }));
    
    if (itineraryKey !== undefined) {
      const key = `${itineraryKey}_prebook_${category}_${id}`;
      localStorage.setItem(key, newStatus);
    }
  };

  const renderStatusBadge = (category, id, status, setStatusState) => {
    const statusLower = status ? status.toLowerCase() : '';
    const isBooked = ['booked', 'done', 'completed'].includes(statusLower);
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}>
        <span className={`badge ${isBooked ? 'done' : 'pending'}`} style={{ margin: 0 }}>
          {status}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleStatus(category, id, status || 'Pending', setStatusState);
          }}
          title={isBooked ? "Mark as Pending" : "Mark as Booked"}
          style={{
            background: 'var(--bg-secondary)',
            border: `1px solid ${isBooked ? 'var(--border-light)' : '#22c55e'}`,
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBooked ? 'var(--text-secondary)' : '#22c55e',
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseOver={(e) => {
             e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
             e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isBooked ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          )}
        </button>
      </div>
    );
  };

  const renderLinks = (links) => {
    if (!links || links.length === 0) return null;
    return (
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div className="detail-label" style={{ marginBottom: '0.25rem' }}>Useful Links</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          {links.map((link, idx) => (
            <span key={idx}>
              <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                Link {idx + 1}
              </a>
              {idx < links.length - 1 && <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>,</span>}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="content-area">
      <div 
        className="flex justify-between items-center cursor-pointer mb-2 mt-4" 
        onClick={() => setIsFlightsOpen(!isFlightsOpen)}
        style={{ cursor: 'pointer' }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          <PlaneIcon /> Flights
        </h2>
        <span style={{ 
          transform: isFlightsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: 'var(--text-secondary)'
        }}>
          <ChevronDownIcon />
        </span>
      </div>

      {isFlightsOpen && data.flights.map(flight => (
        <div key={flight.id} className="card">
          <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
            <div>
               <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                 {flight.from} → {flight.to}
               </div>
               {flight.type && (
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                   {flight.type} Flight
                 </div>
               )}
            </div>
            {renderStatusBadge('flight', flight.id, flightStatuses[flight.id], setFlightStatuses)}
          </div>

          <div className="detail-row">
            <span className="detail-label">Date</span>
            <span className="detail-value highlight">{flight.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Airline</span>
            <span className="detail-value">{flight.airline}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span className="detail-value">{flight.departure} - {flight.arrival} ({flight.duration})</span>
          </div>

          {flight.terminal && (flight.terminal.departure || flight.terminal.arrival) && (
            <div className="detail-row">
              <span className="detail-label">Terminals</span>
              <span className="detail-value">
                Dep: {flight.terminal.departure || '-'} | Arr: {flight.terminal.arrival || '-'}
              </span>
            </div>
          )}

          {flight.baggage && (flight.baggage.cabin || flight.baggage.checkin) && (
            <div className="detail-row">
              <span className="detail-label">Baggage</span>
              <span className="detail-value">
                Cabin: {flight.baggage.cabin || '-'} | Check-in: {flight.baggage.checkin || '-'}
              </span>
            </div>
          )}

          {(flight.pnr || flight.seat) && (
            <div className="detail-row">
              <span className="detail-label">Booking Info</span>
              <span className="detail-value">
                {flight.pnr && `PNR: ${flight.pnr}`} {flight.pnr && flight.seat && '| '} {flight.seat && `Seat: ${flight.seat}`}
              </span>
            </div>
          )}

          {flight.booking && flight.booking.platform && (
            <div className="detail-row">
              <span className="detail-label">Booked Via</span>
              <span className="detail-value">
                {flight.booking.platform} {flight.booking.bookedOn && `(${flight.booking.bookedOn})`}
              </span>
            </div>
          )}

          <div className="detail-row mt-4 mb-2">
            <span className="detail-label">Price</span>
            <span className="price-tag">{flight.price}</span>
          </div>

          {(flight.timeToAirport || flight.notes) && (
            <div className="pt-2" style={{ borderTop: '1px dashed var(--border-light)' }}>
              {flight.timeToAirport && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>To Airport:</strong> {flight.timeToAirport}
                </div>
              )}
              {flight.notes && (
                <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                  {flight.notes}
                </div>
              )}
            </div>
          )}

          {flight.alerts && flight.alerts.length > 0 && (
             <div className="mt-2 pt-2" style={{ borderTop: flight.timeToAirport || flight.notes ? 'none' : '1px dashed var(--border-light)' }}>
               {flight.alerts.map((alert, idx) => (
                 <div key={idx} style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                   ⚠️ {alert}
                 </div>
               ))}
             </div>
          )}

          {renderLinks(flight.links)}
        </div>
      ))}

      <div 
        className="flex justify-between items-center cursor-pointer mb-2 mt-4" 
        onClick={() => setIsRoomsOpen(!isRoomsOpen)}
        style={{ cursor: 'pointer' }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          <BuildingIcon /> Accommodations
        </h2>
        <span style={{ 
          transform: isRoomsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: 'var(--text-secondary)'
        }}>
          <ChevronDownIcon />
        </span>
      </div>

      {isRoomsOpen && data.rooms.map(room => (
        <div key={room.id} className="card">
          <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
             <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
               {room.name}
             </div>
             {renderStatusBadge('room', room.id, roomStatuses[room.id], setRoomStatuses)}
          </div>
          <div className="detail-row">
            <span className="detail-label">Location</span>
            <span className="detail-value">{room.location}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Check-in</span>
            <span className="detail-value">{room.checkin}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Check-out</span>
            <span className="detail-value">{room.checkout}</span>
          </div>
          <div className="detail-row mt-4">
            <span className="detail-label">Price</span>
            <span className="price-tag">{room.price}</span>
          </div>
          {renderLinks(room.links)}
        </div>
      ))}

      <div 
        className="flex justify-between items-center cursor-pointer mb-2 mt-4" 
        onClick={() => setIsActivitiesOpen(!isActivitiesOpen)}
        style={{ cursor: 'pointer' }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          <CheckIcon /> Activities & Requirements
        </h2>
        <span style={{ 
          transform: isActivitiesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: 'var(--text-secondary)'
        }}>
          <ChevronDownIcon />
        </span>
      </div>

      {isActivitiesOpen && data.activities.map(activity => (
        <div key={activity.id} className="card">
          <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-light)' }}>
             <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
               {activity.name}
             </div>
             {renderStatusBadge('activity', activity.id, activityStatuses[activity.id], setActivityStatuses)}
          </div>
          {activity.duration && (
            <div className="detail-row">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{activity.duration}</span>
            </div>
          )}
          {activity.price && (
            <div className="detail-row">
              <span className="detail-label">Price</span>
              <span className="price-tag">{activity.price}</span>
            </div>
          )}
          {activity.priority && (
            <div className="detail-row">
              <span className="detail-label">Priority</span>
              <span className="detail-value">
                <span className={`badge ${activity.priority === 'high' ? 'required' : activity.priority === 'medium' ? 'pending' : 'done'}`}>
                  {activity.priority}
                </span>
              </span>
            </div>
          )}
          {activity.notes && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px dashed var(--border-light)', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.4' }}>
              {activity.notes}
            </div>
          )}
          {renderLinks(activity.links)}
        </div>
      ))}
    </div>
  );
};

export default PrebookingView;
