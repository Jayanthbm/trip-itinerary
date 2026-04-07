import React, { useState, useEffect, useRef } from 'react';
import { PlaneIcon, TrainIcon, BusIcon, BuildingIcon, CheckIcon, TrashIcon, PlusIcon } from './Icons';
import ConfirmPopover from './ConfirmPopover';

const EditPrebooking = ({ data, onSave, currencySymbol }) => {
  const [activeSubTab, setActiveSubTab] = useState('flights');
  const [confirmDelete, setConfirmDelete] = useState({ show: false, itemId: null });
  const lastItemRef = useRef(null);
  const items = data[activeSubTab] || [];
  const prevCountRef = useRef(items.length);

  useEffect(() => {
    if (items.length > prevCountRef.current && lastItemRef.current) {
      lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  const categories = [
    { id: 'flights', label: 'Flights', icon: <PlaneIcon size={18} /> },
    { id: 'trains', label: 'Trains', icon: <TrainIcon size={18} /> },
    { id: 'bus', label: 'Bus', icon: <BusIcon size={18} /> },
    { id: 'rooms', label: 'Rooms', icon: <BuildingIcon size={18} /> },
    { id: 'activities', label: 'Activities', icon: <CheckIcon size={18} /> },
  ];

  const handleAddItem = () => {
    const newItem = { id: Date.now(), status: 'Pending' };
    if (activeSubTab === 'flights') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", airline: "", durationMinutes: 0, cost: 0, terminal: { departure: "", arrival: "" } });
    } else if (activeSubTab === 'trains') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", name: "", durationMinutes: 0, cost: 0 });
    } else if (activeSubTab === 'bus') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", provider: "", durationMinutes: 0, cost: 0, points: { pickup: "", drop: "" } });
    } else if (activeSubTab === 'rooms') {
      Object.assign(newItem, { name: "", checkin: "", checkout: "", cost: 0, location: "", mapsLink: "" });
    } else if (activeSubTab === 'activities') {
      Object.assign(newItem, { name: "", cost: 0, notes: "", excludeFromBudget: false });
    }

    const updated = {
      ...data,
      [activeSubTab]: [...(data[activeSubTab] || []), newItem]
    };
    onSave(updated);
  };

  const handleRemoveItem = (id) => {
    setConfirmDelete({ show: true, itemId: id });
  };

  const executeDelete = () => {
    const { itemId } = confirmDelete;
    const updated = {
      ...data,
      [activeSubTab]: data[activeSubTab].filter(item => item.id !== itemId)
    };
    onSave(updated);
    setConfirmDelete({ show: false, itemId: null });
  };

  const handleUpdateItem = (id, updates) => {
    const updated = {
      ...data,
      [activeSubTab]: data[activeSubTab].map(item => item.id === id ? { ...item, ...updates } : item)
    };
    onSave(updated);
  };

  const renderField = (item, field, label, type = "text", placeholder = "") => {
    const value = field.includes('.')
      ? field.split('.').reduce((obj, key) => obj?.[key], item)
      : item[field];

    const onChange = (e) => {
      const val = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        handleUpdateItem(item.id, { [parent]: { ...item[parent], [child]: val } });
      } else {
        handleUpdateItem(item.id, { [field]: val });
      }
    };

    return (
      <div className="form-group flex-1" style={{ minWidth: '120px' }}>
        <label style={{ fontSize: '0.75rem' }}>{label}</label>
        <input
          type={type}
          className="form-input"
          style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
          value={value || ""}
          placeholder={placeholder}
          onChange={onChange}
        />
      </div>
    );
  };

  const renderDurationFields = (item) => {
    const totalMin = item.durationMinutes || 0;
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;

    const updateDuration = (unit, val) => {
      const v = parseInt(val) || 0;
      let newD = d, newH = h, newM = m;
      if (unit === 'd') newD = v;
      if (unit === 'h') newH = v;
      if (unit === 'm') newM = v;

      const newTotal = (newD * 1440) + (newH * 60) + newM;
      handleUpdateItem(item.id, { durationMinutes: newTotal });
    };

    return (
      <div className="form-group flex-1" style={{ minWidth: '160px' }}>
        <label style={{ fontSize: '0.75rem' }}>Duration (D:H:M)</label>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <input type="number" className="form-input" style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '45px' }} value={d} onChange={(e) => updateDuration('d', e.target.value)} title="Days" />
          <span>:</span>
          <input type="number" className="form-input" style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '45px' }} value={h} onChange={(e) => updateDuration('h', e.target.value)} title="Hours" />
          <span>:</span>
          <input type="number" className="form-input" style={{ padding: '0.4rem 0.2rem', textAlign: 'center', width: '45px' }} value={m} onChange={(e) => updateDuration('m', e.target.value)} title="Minutes" />
        </div>
      </div>
    );
  };



  return (
    <div className="edit-container" style={{ padding: '1rem' }}>
      {confirmDelete.show && (
        <ConfirmPopover 
          message="Are you sure you want to remove this item?"
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete({ show: false, itemId: null })}
        />
      )}
      <div className="category-grid mb-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            className={`category-toggle ${activeSubTab === cat.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(cat.id)}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ textTransform: 'capitalize' }}>{activeSubTab} List</h3>
        <button className="tab-btn" onClick={handleAddItem} style={{ background: 'var(--accent-secondary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <PlusIcon size={16} /> Add {activeSubTab.slice(0, -1)}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            No {activeSubTab} added yet.
          </div>
        ) : (
          items.map((item, index) => (
            <div key={item.id} ref={index === items.length - 1 ? lastItemRef : null} className="card" style={{ marginBottom: 0, padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>ID: {item.id.toString().slice(-4)}</span>
                  <select
                    className="form-input"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                    value={item.status}
                    onChange={(e) => handleUpdateItem(item.id, { status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>
                <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                  <TrashIcon size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {activeSubTab === 'flights' && (
                  <>
                    {renderField(item, 'date', 'Date')}
                    {renderField(item, 'airline', 'Airline')}
                    {renderField(item, 'from', 'From')}
                    {renderField(item, 'to', 'To')}
                    {renderField(item, 'departure', 'Departure')}
                    {renderField(item, 'arrival', 'Arrival')}
                    {renderDurationFields(item)}
                    {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                    {renderField(item, 'terminal.departure', 'Dep. Terminal')}
                    {renderField(item, 'terminal.arrival', 'Arr. Terminal')}
                  </>
                )}
                {activeSubTab === 'trains' && (
                  <>
                    {renderField(item, 'date', 'Date')}
                    {renderField(item, 'name', 'Train Name')}
                    {renderField(item, 'from', 'From')}
                    {renderField(item, 'to', 'To')}
                    {renderField(item, 'departure', 'Departure')}
                    {renderField(item, 'arrival', 'Arrival')}
                    {renderDurationFields(item)}
                    {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                  </>
                )}
                {activeSubTab === 'bus' && (
                  <>
                    {renderField(item, 'date', 'Date')}
                    {renderField(item, 'provider', 'Provider')}
                    {renderField(item, 'from', 'From')}
                    {renderField(item, 'to', 'To')}
                    {renderField(item, 'departure', 'Departure')}
                    {renderField(item, 'arrival', 'Arrival')}
                    {renderField(item, 'points.pickup', 'Pickup point')}
                    {renderField(item, 'points.drop', 'Drop point')}
                    {renderDurationFields(item)}
                    {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                  </>
                )}
                {activeSubTab === 'rooms' && (
                  <>
                    {renderField(item, 'name', 'Hotel Name')}
                    {renderField(item, 'checkin', 'Check-in (YYYY-MM-DD HH:mm)')}
                    {renderField(item, 'checkout', 'Check-out')}
                    {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                    {renderField(item, 'location', 'Location')}
                    {renderField(item, 'mapsLink', 'Maps URL')}
                  </>
                )}
                {activeSubTab === 'activities' && (
                  <>
                    {renderField(item, 'name', 'Activity Name')}
                    {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                    <div className="form-group flex-1" style={{ minWidth: '100%', gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.75rem' }}>Notes</label>
                      <textarea
                        className="form-input"
                        style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', minHeight: '60px' }}
                        value={item.notes || ""}
                        onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EditPrebooking;
