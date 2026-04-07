import React from 'react';

const ConfirmPopover = ({ message, onConfirm, onCancel, confirmText = "Yes, Delete", cancelText = "Cancel" }) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 3000, background: 'rgba(0,0,0,0.4)' }} onClick={onCancel}>
      <div 
        className="modal-content glass" 
        style={{ 
          maxWidth: '320px', 
          padding: '1.5rem', 
          textAlign: 'center',
          animation: 'modalEnter 0.2s ease-out'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-primary)' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={onCancel}
            className="tab-btn" 
            style={{ 
              flex: 1, 
              margin: 0, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--border-light)', 
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              padding: '0.5rem'
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="tab-btn" 
            style={{ 
              flex: 1, 
              margin: 0, 
              background: 'var(--accent-danger)', 
              border: 'none', 
              color: '#fff',
              fontSize: '0.85rem',
              padding: '0.5rem'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopover;
