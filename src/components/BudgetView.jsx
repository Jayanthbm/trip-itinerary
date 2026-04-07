import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

const parseCost = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // Handle legacy string formats like "₹30,000" or "₹30000" or "30000"
  const numStr = String(val).replace(/[^\d.]/g, '');
  return parseFloat(numStr) || 0;
};

const BudgetView = ({ prebookingData, daysData, currencySymbol = '₹' }) => {
  const [expandedDays, setExpandedDays] = useState({});
  const toggleDay = (idx) => setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));

  let grandTotal = 0;

  // ---- Flights ----
  const flights = prebookingData?.flights || [];
  const flightItems = flights.map(f => ({ label: `${f.from} → ${f.to} (${f.airline || ''})`, cost: parseCost(f.cost) }));
  const flightsTotal = flightItems.reduce((s, f) => s + f.cost, 0);
  grandTotal += flightsTotal;

  // ---- Trains ----
  const trains = prebookingData?.trains || [];
  const trainItems = trains.map(t => ({ label: `${t.from} → ${t.to}`, cost: parseCost(t.cost) }));
  const trainsTotal = trainItems.reduce((s, t) => s + t.cost, 0);
  grandTotal += trainsTotal;

  // ---- Bus ----
  const buses = prebookingData?.bus || [];
  const busItems = buses.map(b => ({ label: `${b.from} → ${b.to}`, cost: parseCost(b.cost) }));
  const busTotal = busItems.reduce((s, b) => s + b.cost, 0);
  grandTotal += busTotal;

  // ---- Rooms ----
  const rooms = prebookingData?.rooms || [];
  const roomItems = rooms.map(r => ({ label: r.name, cost: parseCost(r.cost) }));
  const roomsTotal = roomItems.reduce((s, r) => s + r.cost, 0);
  grandTotal += roomsTotal;

  // ---- Activities (exclude excludeFromBudget === true) ----
  const activities = (prebookingData?.activities || []).filter(a => a.excludeFromBudget !== true);
  const activityItems = activities.map(a => ({ label: a.name, cost: parseCost(a.cost) }));
  const activitiesTotal = activityItems.reduce((s, a) => s + a.cost, 0);
  grandTotal += activitiesTotal;

  // ---- Daily Costs ----
  const daysCostData = (daysData || []).map((day) => {
    const timelineItems = (day.timeline || [])
      .filter(e => e.cost !== undefined && e.cost !== null && e.cost !== '' && e.cost > 0)
      .map(e => ({ title: e.title, cost: parseCost(e.cost) }));
    const additionalItems = (day.additionalBudget || [])
      .map(b => ({ title: b.title, cost: parseCost(b.cost) }));
    const allItems = [...timelineItems, ...additionalItems];
    const total = allItems.reduce((s, i) => s + i.cost, 0);
    return { label: day.day || day.title, allItems, total };
  });
  const daysTotal = daysCostData.reduce((s, d) => s + d.total, 0);
  grandTotal += daysTotal;

  const renderSection = (title, emoji, items, subtotal) => {
    if (items.length === 0) return null;
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>
          {emoji} {title}
        </h3>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--text-secondary)', flex: 1, paddingRight: '1rem' }}>{item.label}</span>
            <span style={{ fontWeight: 600 }}>{currencySymbol}{item.cost.toLocaleString('en-IN')}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
          <span>Subtotal</span>
          <span>{currencySymbol}{subtotal.toLocaleString('en-IN')}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="content-area">
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Trip Budget Breakdown</h2>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {renderSection('Flights', '✈️', flightItems, flightsTotal)}
          {renderSection('Trains', '🚂', trainItems, trainsTotal)}
          {renderSection('Bus', '🚌', busItems, busTotal)}
          {renderSection('Accommodations', '🏨', roomItems, roomsTotal)}
          {renderSection('Activities & Requirements', '🎯', activityItems, activitiesTotal)}

          {/* Daily Costs - expandable */}
          {daysCostData.some(d => d.allItems.length > 0) && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>
                📅 Daily Costs (Food, Travel, Activities)
              </h3>
              {daysCostData.map((day, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
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
                      {day.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{currencySymbol}{day.total.toLocaleString('en-IN')}</span>
                  </div>
                  {expandedDays[idx] && day.allItems.length > 0 && (
                    <div style={{ paddingLeft: '1.5rem', paddingBottom: '0.25rem' }}>
                      {day.allItems.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                          <span>{item.title}</span>
                          <span>{currencySymbol}{item.cost.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
                <span>Subtotal</span>
                <span>{currencySymbol}{daysTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Grand Total</span>
            <span className="price-tag" style={{ fontSize: '1.5rem' }}>{currencySymbol}{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
