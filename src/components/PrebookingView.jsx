import React, { useState } from 'react';
import { PlaneIcon, BuildingIcon, CheckIcon, ChevronDownIcon } from './Icons';

const PrebookingView = ({ data }) => {
  const [isFlightsOpen, setIsFlightsOpen] = useState(true);
  const [isRoomsOpen, setIsRoomsOpen] = useState(true);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);

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
            {flight.status && (
              <span className={`badge ${flight.status === 'booked' ? 'done' : 'pending'}`} style={{ alignSelf: 'flex-start' }}>
                {flight.status}
              </span>
            )}
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
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value highlight">{room.name}</span>
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
          <div className="detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value highlight">{activity.name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              <span className={`badge ${activity.status === 'Required' ? 'required' : ['Done', 'Recommended'].includes(activity.status) ? 'done' : 'pending'}`}>
                {activity.status}
              </span>
            </span>
          </div>
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
          {activity.duration && (
            <div className="detail-row">
              <span className="detail-label">Duration</span>
              <span className="detail-value">{activity.duration}</span>
            </div>
          )}
          <div className="detail-row mt-4">
            <span className="detail-label">Price</span>
            <span className="price-tag">{activity.price}</span>
          </div>
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
