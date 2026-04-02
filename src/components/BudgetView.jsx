import React from 'react';

const parseCurrency = (str) => {
  if (!str) return 0;
  const numStr = String(str).replace(/[^\d]/g, '');
  return parseInt(numStr, 10) || 0;
};

const BudgetView = ({ prebookingData, daysData }) => {
  let grandTotal = 0;
  let flightsTotal = 0;
  let roomsTotal = 0;
  let daysTotal = 0;

  const flightsList = prebookingData.flights.map(f => {
    const cost = parseCurrency(f.price);
    flightsTotal += cost;
    grandTotal += cost;
    return { label: `${f.from} → ${f.to}`, price: f.price };
  });

  const roomsList = prebookingData.rooms.map(r => {
    const cost = parseCurrency(r.price);
    roomsTotal += cost;
    grandTotal += cost;
    return { label: r.name, price: r.price };
  });

  const daysList = daysData.map(d => {
    const totalItem = d.budget.find(b => b.item && b.item.toLowerCase() === "total");
    const costStr = totalItem ? totalItem.cost : "₹0";
    const cost = parseCurrency(costStr);
    daysTotal += cost;
    grandTotal += cost;
    return { label: d.day, price: costStr };
  });

  return (
    <div className="content-area">
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Trip Budget Breakdown</h2>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>Flights</h3>
            {flightsList.map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                <span style={{ fontWeight: 600 }}>{f.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <span>Subtotal</span>
              <span>₹{flightsTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>Accommodations</h3>
            {roomsList.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)', flex: 1, paddingRight: '1rem' }}>{r.label}</span>
                <span style={{ fontWeight: 600 }}>{r.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <span>Subtotal</span>
              <span>₹{roomsTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', borderBottom: '1px dashed var(--border-light)', paddingBottom: '0.25rem' }}>Daily Costs (Food, Travel, Activities)</h3>
            {daysList.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                <span style={{ fontWeight: 600 }}>{d.price}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem', fontWeight: 'bold' }}>
              <span>Subtotal</span>
              <span>₹{daysTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: 'var(--bg-secondary)' }}>
          <div style={{ padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Grand Total</span>
            <span className="price-tag" style={{ fontSize: '1.5rem' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
