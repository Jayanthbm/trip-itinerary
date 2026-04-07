import React, { useState } from 'react';
import { PlaneIcon, TrainIcon, BusIcon, BuildingIcon, CheckIcon, ChevronDownIcon } from './Icons';

const parseCost = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // Handle strings like "₹30,000", "30000", etc.
  const numStr = String(val).replace(/[^\d.]/g, '');
  return parseFloat(numStr) || 0;
};

const PrebookingView = ({ data, itineraryKey, currencySymbol = '₹' }) => {
  const [openSections, setOpenSections] = useState({
    flights: true, trains: true, bus: true, rooms: true, activities: true
  });

  const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const getInitialStatus = (category, items) => {
    const initialState = {};
    items.forEach(item => {
      if (itineraryKey !== undefined && item.id) {
        const key = `${itineraryKey}_prebook_${category}_${item.id}`;
        const saved = localStorage.getItem(key);
        initialState[item.id] = saved !== null ? saved : (item.status || 'Pending');
      } else {
        initialState[item.id] = item.status || 'Pending';
      }
    });
    return initialState;
  };

  const [flightStatuses, setFlightStatuses] = useState(() => getInitialStatus('flight', data?.flights || []));
  const [trainStatuses, setTrainStatuses] = useState(() => getInitialStatus('train', data?.trains || []));
  const [busStatuses, setBusStatuses] = useState(() => getInitialStatus('bus', data?.bus || []));
  const [roomStatuses, setRoomStatuses] = useState(() => getInitialStatus('room', data?.rooms || []));
  const [activityStatuses, setActivityStatuses] = useState(() => getInitialStatus('activity', data?.activities || []));

  const toggleStatus = (category, id, currentState, setStatusState) => {
    const isBooked = ['booked', 'done', 'completed'].includes(currentState?.toLowerCase());
    const newStatus = isBooked ? 'Pending' : 'Booked';
    setStatusState(prev => ({ ...prev, [id]: newStatus }));
    if (itineraryKey !== undefined) {
      localStorage.setItem(`${itineraryKey}_prebook_${category}_${id}`, newStatus);
    }
  };

  const renderStatusBadge = (category, id, status, setStatusState) => {
    const isBooked = ['booked', 'done', 'completed'].includes(status?.toLowerCase());
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <span className={`badge ${isBooked ? 'done' : 'pending'}`} style={{ margin: 0 }}>
          {status}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); toggleStatus(category, id, status, setStatusState); }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
          title="Toggle status"
        >
          ↻
        </button>
      </div>
    );
  };

  const renderSectionHeader = (title, icon, sectionKey, count) => {
    const isOpen = openSections[sectionKey];
    return (
      <div
        onClick={() => toggleSection(sectionKey)}
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', marginTop: '1.5rem' }}
      >
        <h2 className="section-title" style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon} {title}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({count})</span>
        </h2>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
          <ChevronDownIcon />
        </span>
      </div>
    );
  };

  const renderLinks = (links) => {
    if (!links || links.length === 0) return null;
    const validLinks = links.filter(l => l && l.trim());
    if (validLinks.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        {validLinks.map((link, i) => (
          <a key={i} href={link} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'none', border: '1px solid var(--accent-primary)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
            Link {i + 1} ↗
          </a>
        ))}
      </div>
    );
  };

  const formatMinutes = (mins) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}`.trim() : `${m}m`;
  };

  const formatTime12h = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return timeStr;
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(.*)$/);
    if (!timeMatch) return timeStr;

    let [_, hoursStr, minutes, suffix] = timeMatch;
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}${suffix || ''}`;
  };

  const renderRouteCard = ({ id, emoji, headerTitle, date, from, to, departure, arrival, terminalFrom, terminalTo, durationMinutes, cost, links, statusBadge, extraInfo }) => (
    <div key={id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '1.25rem' }}>
      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {emoji} {headerTitle}
          {date && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>— {date}</span>}
        </div>
        {statusBadge}
      </div>

      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '0.05em' }}>{from}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatTime12h(departure)}</div>
            {terminalFrom && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{terminalFrom}</div>}
          </div>

          <div style={{ flex: 1, textAlign: 'center', padding: '0 1rem' }}>
            <div style={{ position: 'relative', margin: '0.5rem 0' }}>
              <div style={{ borderTop: '1px dashed var(--border-light)' }} />
              <span style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'var(--bg-color)',
                padding: '0 8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1
              }}>
                {emoji}
              </span>
            </div>
            {durationMinutes && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.4rem' }}>
                {formatMinutes(durationMinutes)}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', minWidth: '70px' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', letterSpacing: '0.05em' }}>{to}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatTime12h(arrival)}</div>
            {terminalTo && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{terminalTo}</div>}
          </div>
        </div>


        {cost && (
          <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            <span className="price-tag" style={{ fontSize: '1.2rem' }}>
              {currencySymbol}{parseCost(cost).toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {extraInfo}
        {renderLinks(links)}
      </div>
    </div>
  );

  const renderFlights = () => {
    const flights = data?.flights || [];
    if (flights.length === 0) return null;
    return (
      <div>
        {renderSectionHeader('Flights', <PlaneIcon size={18} />, 'flights', flights.length)}
        {openSections.flights && flights.map(f => renderRouteCard({
          id: f.id,
          emoji: <PlaneIcon size={16} />,
          headerTitle: f.airline,
          date: f.date,
          from: f.from,
          to: f.to,
          departure: f.departure,
          arrival: f.arrival,
          terminalFrom: f.terminal?.departure,
          terminalTo: f.terminal?.arrival,
          durationMinutes: f.durationMinutes,
          cost: f.cost,
          links: f.links,
          statusBadge: renderStatusBadge('flight', f.id, flightStatuses[f.id], setFlightStatuses)
        }))}
      </div>
    );
  };

  const renderTrains = () => {
    const trains = data?.trains || [];
    if (trains.length === 0) return null;
    return (
      <div>
        {renderSectionHeader('Trains', <TrainIcon size={18} />, 'trains', trains.length)}
        {openSections.trains && trains.map(t => renderRouteCard({
          id: t.id,
          emoji: <TrainIcon size={16} />,
          headerTitle: t.name || `Train ${t.id}`,
          date: t.date,
          from: t.from,
          to: t.to,
          departure: t.departure,
          arrival: t.arrival,
          durationMinutes: t.durationMinutes,
          cost: t.cost,
          links: t.links,
          statusBadge: renderStatusBadge('train', t.id, trainStatuses[t.id], setTrainStatuses)
        }))}
      </div>
    );
  };

  const renderBus = () => {
    const buses = data?.bus || [];
    if (buses.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        {renderSectionHeader('Bus', <BusIcon size={18} />, 'bus', buses.length)}
        {openSections.bus && buses.map(b => renderRouteCard({
          id: b.id,
          emoji: <BusIcon size={16} />,
          headerTitle: b.provider || `Bus ${b.id}`,
          date: b.date,
          from: b.from,
          to: b.to,
          departure: b.departure,
          arrival: b.arrival,
          terminalFrom: b.points?.pickup,
          terminalTo: b.points?.drop,
          durationMinutes: b.durationMinutes,
          cost: b.cost,
          links: b.links,
          statusBadge: renderStatusBadge('bus', b.id, busStatuses[b.id], setBusStatuses)
        }))}
      </div>
    );
  };

  const renderRooms = () => {
    const rooms = data?.rooms || [];
    if (rooms.length === 0) return null;
    return (
      <div>
        {renderSectionHeader('Accommodations', <BuildingIcon size={18} />, 'rooms', rooms.length)}
        {openSections.rooms && rooms.map(room => (
          <div key={room.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BuildingIcon size={18} /> {room.name}
              </div>
              {renderStatusBadge('room', room.id, roomStatuses[room.id], setRoomStatuses)}
            </div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
                {room.checkin && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Check-in</div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{formatTime12h(room.checkin)}</div>
                  </div>
                )}
                {room.checkout && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Check-out</div>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{formatTime12h(room.checkout)}</div>
                  </div>
                )}
                {room.cost && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Cost</div>
                    <div className="price-tag">{currencySymbol}{parseCost(room.cost).toLocaleString('en-IN')}</div>
                  </div>
                )}
              </div>
              {room.location && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  📍 {room.mapsLink ? (
                    <a href={room.mapsLink} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>{room.location} ↗</a>
                  ) : room.location}
                </div>
              )}
              {renderLinks(room.links)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderActivities = () => {
    const activities = data?.activities || [];
    if (activities.length === 0) return null;
    return (
      <div>
        {renderSectionHeader('Activities & Requirements', <CheckIcon size={18} />, 'activities', activities.length)}
        {openSections.activities && activities.map(activity => (
          <div key={activity.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckIcon size={18} /> {activity.name}
              </div>
              {renderStatusBadge('activity', activity.id, activityStatuses[activity.id], setActivityStatuses)}
            </div>
            <div style={{ padding: '1.25rem' }}>
              {activity.cost !== undefined && (
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <span className="price-tag" style={{ fontSize: '1.1rem' }}>
                    {currencySymbol}{parseCost(activity.cost).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              {activity.notes && (
                <blockquote style={{
                  margin: '0 0 0.5rem 0',
                  padding: '0.6rem 1rem',
                  borderLeft: '3px solid var(--accent-primary)',
                  background: 'rgba(99, 102, 241, 0.07)',
                  borderRadius: '0 6px 6px 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontStyle: 'italic',
                  lineHeight: '1.6'
                }}>
                  {activity.notes}
                </blockquote>
              )}
              {renderLinks(activity.links)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="content-area">
      {renderFlights()}
      {renderTrains()}
      {renderBus()}
      {renderRooms()}
      {renderActivities()}
    </div>
  );
};

export default PrebookingView;
