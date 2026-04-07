import React, { useState, useEffect, useRef } from 'react';
import { PlaneIcon, TrainIcon, BusIcon, BuildingIcon, CheckIcon, TrashIcon, PlusIcon } from './Icons';
import ConfirmPopover from './ConfirmPopover';

const EditPrebooking = ({ data, onSave, currencySymbol }) => {
  const [activeSubTab, setActiveSubTab] = useState('flight');
  const [confirmDelete, setConfirmDelete] = useState({ show: false, itemId: null });
  const lastItemRef = useRef(null);

  // Normalized singular IDs for consistency and proper "Add [Type]" labels
  const categories = [
    { id: 'flight', label: 'Flights', icon: <PlaneIcon size={18} /> },
    { id: 'train', label: 'Trains', icon: <TrainIcon size={18} /> },
    { id: 'bus', label: 'Bus', icon: <BusIcon size={18} /> },
    { id: 'room', label: 'Rooms', icon: <BuildingIcon size={18} /> },
    { id: 'activity', label: 'Activities', icon: <CheckIcon size={18} /> },
  ];

  // Map singular IDs back to data plural keys if necessary (or update data keys)
  // The data currently uses plural keys: flights, trains, bus, rooms, activities
  const getPluralKey = (id) => {
    if (id === 'flight') return 'flights';
    if (id === 'train') return 'trains';
    if (id === 'bus') return 'bus';
    if (id === 'room') return 'rooms';
    if (id === 'activity') return 'activities';
    return id;
  };

  const pluralKey = getPluralKey(activeSubTab);
  const items = data[pluralKey] || [];
  const prevCountRef = useRef(items.length);

  useEffect(() => {
    if (items.length > prevCountRef.current && lastItemRef.current) {
      lastItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  const handleAddItem = () => {
    const newItem = { id: Date.now(), status: 'Pending' };
    if (activeSubTab === 'flight') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", airline: "", durationMinutes: 0, cost: 0, terminal: { departure: "", arrival: "" } });
    } else if (activeSubTab === 'train') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", name: "", durationMinutes: 0, cost: 0 });
    } else if (activeSubTab === 'bus') {
      Object.assign(newItem, { date: "", from: "", to: "", departure: "", arrival: "", provider: "", durationMinutes: 0, cost: 0, points: { pickup: "", drop: "" } });
    } else if (activeSubTab === 'room') {
      Object.assign(newItem, { name: "", checkin: "", checkout: "", cost: 0, location: "", mapsLink: "" });
    } else if (activeSubTab === 'activity') {
      Object.assign(newItem, { name: "", cost: 0, notes: "", excludeFromBudget: false });
    }

    const updated = {
      ...data,
      [pluralKey]: [...(data[pluralKey] || []), newItem]
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
      [pluralKey]: data[pluralKey].filter(item => item.id !== itemId)
    };
    onSave(updated);
    setConfirmDelete({ show: false, itemId: null });
  };

  const handleUpdateItem = (id, updates) => {
    const updated = {
      ...data,
      [pluralKey]: data[pluralKey].map(item => item.id === id ? { ...item, ...updates } : item)
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

  // Condition for showing the Add button at the bottom
  const showBottomAdd = () => {
    const count = items.length;
    if (['flight', 'train'].includes(activeSubTab)) return count >= 2;
    return count >= 3;
  };

  const addLabel = `Add ${activeSubTab}`;

  return (
    <div className="edit-container" style={{ padding: '1rem', paddingBottom: '2rem' }}>
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
        <h3 style={{ textTransform: 'capitalize' }}>{pluralKey} List</h3>
        <button className="tab-btn" onClick={handleAddItem} style={{ background: 'var(--accent-secondary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <PlusIcon size={16} /> {addLabel}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            No {pluralKey} added yet.
          </div>
        ) : (
          <>
            {items.map((item, index) => (
              <div key={item.id} ref={index === items.length - 1 ? lastItemRef : null} className="card" style={{ marginBottom: 0, padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>ID: {item?.id?.toString().slice(-4)}</span>
                    <select
                      className="form-input"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', width: 'auto', height: '28px' }}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeSubTab === 'flight' && (
                    <>
                      {/* Row 1: Date, Airline */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'date', 'Date', 'date')}
                        {renderField(item, 'airline', 'Airline')}
                      </div>
                      {/* Row 2: From, To */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'from', 'From')}
                        {renderField(item, 'to', 'To')}
                      </div>
                      {/* Row 3: Departure, Arrival */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'departure', 'Departure', 'time')}
                        {renderField(item, 'arrival', 'Arrival', 'time')}
                      </div>
                      {/* Row 4: Duration, Cost */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderDurationFields(item)}
                        {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                      </div>
                      {/* Row 5: Dep Terminal, Arr Terminal */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'terminal.departure', 'Dep. Terminal')}
                        {renderField(item, 'terminal.arrival', 'Arr. Terminal')}
                      </div>
                    </>
                  )}

                  {activeSubTab === 'train' && (
                    <>
                      {/* Row 1: Date, Train Name */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'date', 'Date', 'date')}
                        {renderField(item, 'name', 'Train Name')}
                      </div>
                      {/* Row 2: From, To */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'from', 'From')}
                        {renderField(item, 'to', 'To')}
                      </div>
                      {/* Row 3: Departure, Arrival */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'departure', 'Departure', 'time')}
                        {renderField(item, 'arrival', 'Arrival', 'time')}
                      </div>
                      {/* Row 4: Duration, Cost */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderDurationFields(item)}
                        {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                      </div>
                    </>
                  )}

                  {activeSubTab === 'bus' && (
                    <>
                      {/* Row 1: Date, Provider */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'date', 'Date', 'date')}
                        {renderField(item, 'provider', 'Provider')}
                      </div>
                      {/* Row 2: From, To */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'from', 'From')}
                        {renderField(item, 'to', 'To')}
                      </div>
                      {/* Row 3: Departure, Arrival */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'departure', 'Departure', 'time')}
                        {renderField(item, 'arrival', 'Arrival', 'time')}
                      </div>
                      {/* Row 4: Pickup Point, Drop Point */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'points.pickup', 'Pickup point')}
                        {renderField(item, 'points.drop', 'Drop point')}
                      </div>
                      {/* Row 5: Duration, Cost */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderDurationFields(item)}
                        {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                      </div>
                    </>
                  )}

                  {activeSubTab === 'room' && (
                    <>
                      {/* Row 1: Hotel Name, Cost */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'name', 'Hotel Name')}
                        {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                      </div>

                      {/* Row 2: Check-in Date, Time */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group flex-1">
                          <label style={{ fontSize: '0.75rem' }}>Check-in Date</label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                            value={item.checkin?.split(' ')[0] || ""}
                            onChange={(e) => {
                              const time = item.checkin?.split(' ')[1] || "00:00";
                              handleUpdateItem(item.id, { checkin: `${e.target.value} ${time}` });
                            }}
                          />
                        </div>
                        <div className="form-group flex-1">
                          <label style={{ fontSize: '0.75rem' }}>Check-in Time</label>
                          <input
                            type="time"
                            className="form-input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                            value={item.checkin?.split(' ')[1] || ""}
                            onChange={(e) => {
                              const date = item.checkin?.split(' ')[0] || new Date().toISOString().split('T')[0];
                              handleUpdateItem(item.id, { checkin: `${date} ${e.target.value}` });
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 3: Check-out Date, Time */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-group flex-1">
                          <label style={{ fontSize: '0.75rem' }}>Check-out Date</label>
                          <input
                            type="date"
                            className="form-input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                            value={item.checkout?.split(' ')[0] || ""}
                            onChange={(e) => {
                              const time = item.checkout?.split(' ')[1] || "00:00";
                              handleUpdateItem(item.id, { checkout: `${e.target.value} ${time}` });
                            }}
                          />
                        </div>
                        <div className="form-group flex-1">
                          <label style={{ fontSize: '0.75rem' }}>Check-out Time</label>
                          <input
                            type="time"
                            className="form-input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                            value={item.checkout?.split(' ')[1] || ""}
                            onChange={(e) => {
                              const date = item.checkout?.split(' ')[0] || new Date().toISOString().split('T')[0];
                              handleUpdateItem(item.id, { checkout: `${date} ${e.target.value}` });
                            }}
                          />
                        </div>
                      </div>

                      {/* Row 4: Location, Maps URL */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'location', 'Location')}
                        {renderField(item, 'mapsLink', 'Maps URL')}
                      </div>
                    </>
                  )}

                  {activeSubTab === 'activity' && (
                    <>
                      {/* Row 1: Name, Cost */}
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {renderField(item, 'name', 'Activity Name')}
                        {renderField(item, 'cost', `Cost (${currencySymbol})`, 'number')}
                      </div>
                      {/* Row 2: Notes */}
                      <div className="form-group" style={{ width: '100%' }}>
                        <label style={{ fontSize: '0.75rem' }}>Notes</label>
                        <textarea
                          className="form-input"
                          style={{ minHeight: '80px', padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                          value={item.notes || ""}
                          onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                          placeholder="Activity details/notes..."
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {showBottomAdd() && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <button className="tab-btn" onClick={handleAddItem} style={{ background: 'var(--accent-secondary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem' }}>
                  <PlusIcon size={16} /> {addLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EditPrebooking;
