import React, { useState, useEffect } from 'react';
import CreateItineraryModal from './CreateItineraryModal';
import PromptGenerator from './PromptGenerator';
import ConfirmPopover from './ConfirmPopover';
import TripCard from './TripCard';
import ActionGrid from './ActionGrid';
import LoadFromUrl from './LoadFromUrl';
import BackupControls from './BackupControls';
import { sampleItinerary, validateData } from '../utils/itineraryHelpers';

function DashboardView({
  recentTrips,
  setAppData,
  setActiveTab,
  handleTogglePin,
  handleToggleArchive,
  onDeleteTrip,
  onSaveNewTrip,
  onLoadLocalData,
  onFetchData,
  isLoading,
  handleExportBackup,
  handleImportBackup,
  onSetError
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('modified');
  const [activeTripsPage, setActiveTripsPage] = useState(1);
  const [archivedTripsPage, setArchivedTripsPage] = useState(1);
  const [sampleTripsPage, setSampleTripsPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromptGen, setShowPromptGen] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [tripToDelete, setTripToDelete] = useState(null);

  useEffect(() => {
    if (recentTrips.length <= 3) {
      setSearchQuery('');
    }
  }, [recentTrips]);

  useEffect(() => {
    setActiveTripsPage(1);
    setArchivedTripsPage(1);
  }, [searchQuery, sortBy]);

  const handleCreateNew = async (formData) => {
    const success = await onSaveNewTrip(formData);
    if (success) {
      setShowCreateModal(false);
    }
  };

  const handlePasteLoad = async () => {
    if (!pasteValue.trim()) return;
    try {
      const parsed = JSON.parse(pasteValue);
      const errorMsg = validateData(parsed);
      if (errorMsg) {
        onSetError(errorMsg);
        return;
      }
      const success = await onLoadLocalData(parsed);
      if (success) {
        setShowPasteModal(false);
        setPasteValue('');
      }
    } catch (err) {
      onSetError("Invalid JSON: " + err.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const errorMsg = validateData(parsed);
        if (errorMsg) throw new Error(errorMsg);
        await onLoadLocalData(parsed);
      } catch (err) {
        onSetError("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;
    const success = await onDeleteTrip(tripToDelete.id);
    if (success) {
      setTripToDelete(null);
    }
  };

  const filterTrips = (tripsList) => {
    if (recentTrips.length <= 3 || !searchQuery.trim()) return tripsList;
    const query = searchQuery.toLowerCase().trim();
    return tripsList.filter(trip => 
      trip.title && trip.title.toLowerCase().includes(query)
    );
  };

  const filteredActiveTrips = filterTrips(recentTrips.filter(t => !t.archived));
  const filteredArchivedTrips = filterTrips(recentTrips.filter(t => t.archived));

  const sortTrips = (tripsList) => {
    return [...tripsList].sort((a, b) => {
      if (sortBy === 'name') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'date') {
        const dateA = new Date(a.startDate || 0);
        const dateB = new Date(b.startDate || 0);
        return dateA - dateB;
      } else {
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }
    });
  };

  const pinnedActive = filteredActiveTrips.filter(t => t.pinned);
  const unpinnedActive = filteredActiveTrips.filter(t => !t.pinned);
  const sortedActiveTrips = [
    ...sortTrips(pinnedActive),
    ...sortTrips(unpinnedActive)
  ];

  const sortedArchivedTrips = sortTrips(filteredArchivedTrips);

  const itemsPerPage = 3;
  const totalActivePages = Math.ceil(sortedActiveTrips.length / itemsPerPage);
  const currentActivePage = Math.min(activeTripsPage, totalActivePages || 1);
  const paginatedActiveTrips = sortedActiveTrips.slice((currentActivePage - 1) * itemsPerPage, currentActivePage * itemsPerPage);

  const totalArchivedPages = Math.ceil(sortedArchivedTrips.length / itemsPerPage);
  const currentArchivedPage = Math.min(archivedTripsPage, totalArchivedPages || 1);
  const paginatedArchivedTrips = sortedArchivedTrips.slice((currentArchivedPage - 1) * itemsPerPage, currentArchivedPage * itemsPerPage);

  return (
    <div className="app-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--bg-primary)' }}>
          <CreateItineraryModal onSave={handleCreateNew} onCancel={() => setShowCreateModal(false)} />
        </div>
      )}

      {showPromptGen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'var(--bg-primary)', padding: '1rem', overflowY: 'auto' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <PromptGenerator
              onCancel={() => setShowPromptGen(false)}
              onPaste={() => {
                setShowPromptGen(false);
                setShowPasteModal(true);
              }}
            />
          </div>
        </div>
      )}

      {showPasteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ background: 'var(--bg-secondary)', padding: '2rem', maxWidth: '600px', width: '100%', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>Paste Itinerary JSON</h2>
            <textarea
              className="form-input"
              style={{ minHeight: '300px', width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1.5rem', resize: 'vertical' }}
              placeholder='Paste your JSON code here...'
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowPasteModal(false)} className="tab-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>Cancel</button>
              <button onClick={handlePasteLoad} className="tab-btn active" style={{ flex: 2, background: 'var(--accent-primary)', border: 'none', color: '#fff' }}>Load JSON</button>
            </div>
          </div>
        </div>
      )}

      {tripToDelete && (
        <ConfirmPopover
          message={`Are you sure you want to delete the trip "${tripToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setTripToDelete(null)}
        />
      )}

      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.2rem' }}>J-itinerary</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
        
        {/* 1. Generate with AI */}
        <div
          onClick={() => setShowPromptGen(true)}
          className="card"
          style={{
            padding: '1rem 1rem',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e40af 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            margin: 0,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 99, 235, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 99, 235, 0.2)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>✨</span>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.02em' }}>Generate with AI</h3>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>Let AI help you get started.</p>
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '1px solid var(--border-light)', margin: '0.1rem 0' }}></div>

        {/* 2. Recent Trips / Sample Itineraries */}
        {recentTrips.length > 0 && (
          <>
            {recentTrips.length > 3 && (
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem', pointerEvents: 'none' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Search trips by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 2.2rem 0.6rem 2.2rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.15)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '0.75rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 1 auto' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '0.6rem 1.75rem 0.6rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      fontFamily: 'inherit',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394a3b8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1em'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent-primary)';
                      e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.15)';
                      e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--border-light)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                  >
                    <option value="modified">Last Updated</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="date">Start Date (Earliest)</option>
                  </select>
                </div>
              </div>
            )}

            {paginatedActiveTrips.length > 0 && (
              <>
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.1rem', fontSize: '1rem' }}>
                  {searchQuery.trim() ? 'Matching Trips' : 'Recent Trips'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
                  {paginatedActiveTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      status="active"
                      onSelect={() => {
                        setAppData(trip);
                        setActiveTab('day-0');
                        localStorage.setItem('active_trip_id', trip.id);
                      }}
                      onTogglePin={handleTogglePin}
                      onToggleArchive={handleToggleArchive}
                      onDelete={setTripToDelete}
                    />
                  ))}
                </div>

                {totalActivePages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                    <button
                      disabled={currentActivePage === 1}
                      onClick={() => setActiveTripsPage(currentActivePage - 1)}
                      className="tab-btn"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentActivePage === 1 ? 0.5 : 1, cursor: currentActivePage === 1 ? 'default' : 'pointer', margin: 0 }}
                    >
                      ◀ Prev
                    </button>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Page {currentActivePage} of {totalActivePages}
                    </span>
                    <button
                      disabled={currentActivePage === totalActivePages}
                      onClick={() => setActiveTripsPage(currentActivePage + 1)}
                      className="tab-btn"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentActivePage === totalActivePages ? 0.5 : 1, cursor: currentActivePage === totalActivePages ? 'default' : 'pointer', margin: 0 }}
                    >
                      Next ▶
                    </button>
                  </div>
                )}

                <div style={{ borderBottom: '1px solid var(--border-light)', margin: '0.1rem 0 1rem 0' }}></div>
              </>
            )}

            {sortedArchivedTrips.length > 0 && (
              <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="tab-btn"
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}
                >
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    📦 Archived Trips ({sortedArchivedTrips.length})
                  </span>
                  <span style={{ fontSize: '0.8rem', transform: showArchived ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    ▼
                  </span>
                </button>

                {showArchived && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem', animation: 'modalEnter 0.2s ease-out' }}>
                      {paginatedArchivedTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          status="archived"
                          onSelect={() => {
                            setAppData(trip);
                            setActiveTab('day-0');
                            localStorage.setItem('active_trip_id', trip.id);
                          }}
                          onToggleArchive={handleToggleArchive}
                          onDelete={setTripToDelete}
                        />
                      ))}
                    </div>

                    {totalArchivedPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
                        <button
                          disabled={currentArchivedPage === 1}
                          onClick={() => setArchivedTripsPage(currentArchivedPage - 1)}
                          className="tab-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentArchivedPage === 1 ? 0.5 : 1, cursor: currentArchivedPage === 1 ? 'default' : 'pointer', margin: 0 }}
                        >
                          ◀ Prev
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Page {currentArchivedPage} of {totalArchivedPages}
                        </span>
                        <button
                          disabled={currentArchivedPage === totalArchivedPages}
                          onClick={() => setArchivedTripsPage(currentArchivedPage + 1)}
                          className="tab-btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentArchivedPage === totalArchivedPages ? 0.5 : 1, cursor: currentArchivedPage === totalArchivedPages ? 'default' : 'pointer', margin: 0 }}
                        >
                          Next ▶
                        </button>
                      </div>
                    )}
                  </>
                )}
                <div style={{ borderBottom: '1px solid var(--border-light)', margin: '1rem 0' }}></div>
              </div>
            )}

            {sortedActiveTrips.length === 0 && sortedArchivedTrips.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border-light)', borderRadius: '12px', marginTop: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🔍</span>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>No trips found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.25rem 0' }}>
                  No trips match "{searchQuery}". Try adjusting your search query.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-light)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  Clear Search
                </button>
              </div>
            )}
          </>
        )}

        {recentTrips.length === 0 && (() => {
          const itemsPerPage = 3;
          const totalSamplePages = Math.ceil(sampleItinerary.length / itemsPerPage);
          const currentSamplePage = Math.min(sampleTripsPage, totalSamplePages || 1);
          const paginatedSampleTrips = sampleItinerary.slice((currentSamplePage - 1) * itemsPerPage, currentSamplePage * itemsPerPage);

          return (
            <>
              <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.1rem', fontSize: '1rem' }}>Sample Itineraries</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
                {paginatedSampleTrips.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => item.data ? onLoadLocalData(item.data) : onFetchData(item.url)}
                    className="card"
                    style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'border-color 0.2s', margin: 0 }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    <span style={{ fontSize: '1.2rem' }}>🗺️</span>
                    <span style={{ fontWeight: '600', fontSize: '0.85rem', lineHeight: '1' }}>{item.name}</span>
                  </button>
                ))}
              </div>

              {totalSamplePages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    disabled={currentSamplePage === 1}
                    onClick={() => setSampleTripsPage(currentSamplePage - 1)}
                    className="tab-btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentSamplePage === 1 ? 0.5 : 1, cursor: currentSamplePage === 1 ? 'default' : 'pointer', margin: 0 }}
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Page {currentSamplePage} of {totalSamplePages}
                  </span>
                  <button
                    disabled={currentSamplePage === totalSamplePages}
                    onClick={() => setSampleTripsPage(currentSamplePage + 1)}
                    className="tab-btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: currentSamplePage === totalSamplePages ? 0.5 : 1, cursor: currentSamplePage === totalSamplePages ? 'default' : 'pointer', margin: 0 }}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </>
          );
        })()}

        <div style={{ borderBottom: '1px solid var(--border-light)', margin: '0.1rem 0' }}></div>

        <ActionGrid
          onCreateClick={() => setShowCreateModal(true)}
          onPasteClick={() => setShowPasteModal(true)}
          onFileUpload={handleFileUpload}
        />

        <LoadFromUrl
          onFetchData={onFetchData}
          isLoading={isLoading}
        />

        <BackupControls
          recentTrips={recentTrips}
          handleExportBackup={handleExportBackup}
          handleImportBackup={handleImportBackup}
        />

      </div>
    </div>
  );
}

export default DashboardView;
