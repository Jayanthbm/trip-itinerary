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
    <div className="modal-overlay">
      <div className="modal-content glass" style={{ maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>Create New Itinerary</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label>Trip Title *</label>
            <input 
              type="text" 
              name="title" 
              className="form-input" 
              placeholder="e.g., Vietnam Adventure 2026"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group flex-1">
              <label>Start Date *</label>
              <input 
                type="date" 
                name="startDate" 
                className="form-input" 
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group flex-1">
              <label>End Date *</label>
              <input 
                type="date" 
                name="endDate" 
                className="form-input" 
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Currency</label>
            <select 
              name="currency" 
              className="form-input" 
              value={formData.currency}
              onChange={handleChange}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="submit" 
              className="tab-btn" 
              style={{ flex: 1, background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '0.8rem 1rem', fontSize: '1rem' }}
            >
              Create Itinerary
            </button>
            <button 
              type="button" 
              onClick={onCancel}
              className="tab-btn" 
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '0.8rem 1rem', fontSize: '1rem' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItineraryModal;
