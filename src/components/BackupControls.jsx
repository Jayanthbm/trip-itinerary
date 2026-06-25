import React from 'react';

function BackupControls({
  recentTrips,
  handleExportBackup,
  handleImportBackup
}) {
  return (
    <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', margin: 0 }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Library Backup</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleExportBackup} 
          disabled={recentTrips.length === 0} 
          className="tab-btn" 
          style={{ 
            flex: '1 1 180px', 
            margin: 0, 
            padding: '0.8rem 1rem', 
            background: 'var(--accent-primary)', 
            border: 'none', 
            color: '#fff', 
            opacity: recentTrips.length === 0 ? 0.5 : 1,
            cursor: recentTrips.length === 0 ? 'default' : 'pointer'
          }}
        >
          📥 Export Backup ({recentTrips.length} Trips)
        </button>
        <label 
          className="tab-btn" 
          style={{ 
            flex: '1 1 180px', 
            margin: 0, 
            padding: '0.8rem 1rem', 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid var(--border-light)', 
            color: 'var(--text-primary)', 
            textAlign: 'center', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          📤 Import Backup
          <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}

export default BackupControls;
