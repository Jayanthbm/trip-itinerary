import React, { useState } from 'react';

function LoadFromUrl({
  onFetchData,
  isLoading
}) {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlLoad = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    await onFetchData(urlInput.trim());
  };

  return (
    <div className="card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', margin: 0 }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Load from URL</h3>
      <form onSubmit={handleUrlLoad} style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
        <input
          type="url"
          placeholder="https://example.com/itinerary.json"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          style={{ flex: '1 1 200px', minWidth: '0', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
        />
        <button type="submit" disabled={isLoading} className="tab-btn" style={{ flex: '0 0 auto', margin: 0, padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, fontSize: '1rem', borderRadius: '6px' }}>
          {isLoading ? 'Loading...' : 'Load'}
        </button>
      </form>
    </div>
  );
}

export default LoadFromUrl;
