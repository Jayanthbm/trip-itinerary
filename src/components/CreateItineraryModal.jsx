import React, { useState } from 'react';
import { PlaneIcon, TrainIcon, BusIcon, BuildingIcon, CheckIcon } from './Icons';

const CreateItineraryModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
    currency: 'INR'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert("Please fill in all required fields (Title, Start Date, End Date)");
      return;
    }
    
    // Validate dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) {
      alert("End date cannot be before start date");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="create-itinerary-view animation-fade-in" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button 
          onClick={onCancel}
          className="tab-btn"
          style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '50%', width: '2.5rem', height: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          title="Back"
        >
          <span style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>←</span>
        </button>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Create New Itinerary</h2>
      </div>
      
      <div className="glass" style={{ padding: '2rem', borderRadius: '12px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Trip Title *</label>
            <input 
              type="text" 
              name="title" 
              className="form-input" 
              placeholder="e.g., Vietnam Adventure 2026"
              value={formData.title}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Start Date *</label>
              <input 
                type="date" 
                name="startDate" 
                className="form-input" 
                value={formData.startDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '1rem' }}
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>End Date *</label>
              <input 
                type="date" 
                name="endDate" 
                className="form-input" 
                value={formData.endDate}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '1rem' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Currency</label>
            <select 
              name="currency" 
              className="form-input" 
              value={formData.currency}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '1rem' }}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="tab-btn" 
              style={{ width: '100%', background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Planning Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default CreateItineraryModal;
