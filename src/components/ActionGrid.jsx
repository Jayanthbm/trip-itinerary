import React from 'react';

function ActionGrid({
  onCreateClick,
  onPasteClick,
  onFileUpload
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      <button onClick={onCreateClick} className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-secondary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
        <span style={{ fontSize: '1.2rem' }}>➕</span>
        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Create</span>
      </button>

      <label className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
        <span style={{ fontSize: '1.2rem' }}>📁</span>
        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Upload</span>
        <input type="file" accept=".json" onChange={onFileUpload} style={{ display: 'none' }} />
      </label>

      <button onClick={onPasteClick} className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
        <span style={{ fontSize: '1.2rem' }}>📋</span>
        <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Paste</span>
      </button>
    </div>
  );
}

export default ActionGrid;
