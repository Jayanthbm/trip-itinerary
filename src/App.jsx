import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import ItineraryView from './components/ItineraryView';
import { saveTrip, deleteTrip, getAllTrips, importTrips } from './utils/db';
import {
  isTripInPast,
  normalizeData,
  validateData
} from './utils/itineraryHelpers';

function App() {
  const [activeTab, setActiveTab] = useState('day-0');
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // States for Active Trip close warning
  const [isEditing, setIsEditing] = useState(false);
  const [editsMade, setEditsMade] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // IndexedDB specific states
  const [recentTrips, setRecentTrips] = useState([]);

  const loadRecentTrips = async () => {
    try {
      const trips = await getAllTrips();
      
      let updatedAny = false;
      const processedTrips = await Promise.all(trips.map(async (trip) => {
        const daysCount = trip.days ? trip.days.length : 0;
        if (!trip.archived && isTripInPast(trip.startDate, daysCount)) {
          const updated = { ...trip, archived: true };
          await saveTrip(updated);
          updatedAny = true;
          return updated;
        }
        return trip;
      }));

      setRecentTrips(processedTrips);
      
      if (updatedAny && appData) {
        const currentActive = processedTrips.find(t => t.id === appData.id);
        if (currentActive && currentActive.archived !== appData.archived) {
          setAppData(currentActive);
        }
      }
    } catch (err) {
      console.error("Failed to load recent trips from IndexedDB:", err);
    }
  };

  const fetchData = async (url) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch data from URL");
      const jsonData = await response.json();
      if (validateData(jsonData)) throw new Error(validateData(jsonData));

      const normalized = normalizeData(jsonData);
      normalized.sourceUrl = url;
      const saved = await saveTrip(normalized);
      setAppData(saved);
      setActiveTab('day-0');
      localStorage.setItem('active_trip_id', saved.id);
      setEditsMade(false);
      localStorage.removeItem('edits_made');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppData = async (newData) => {
    try {
      const saved = await saveTrip(newData);
      setAppData(saved);
      localStorage.setItem('active_trip_id', saved.id);
      setEditsMade(true);
      localStorage.setItem('edits_made', 'true');
    } catch (err) {
      console.error("Failed to auto-save trip to IndexedDB:", err);
    }
  };

  const handleUpdateDay = (dayIndex, updatedDay) => {
    const newDays = [...appData.days];
    newDays[dayIndex] = updatedDay;
    handleUpdateAppData({ ...appData, days: newDays });
  };

  const handleLoadLocalData = async (data) => {
    if (validateData(data)) {
      setError("Invalid itinerary data");
      return false;
    }
    try {
      const normalized = normalizeData(data);
      const saved = await saveTrip(normalized);
      setAppData(saved);
      setActiveTab('day-0');
      localStorage.setItem('active_trip_id', saved.id);
      localStorage.removeItem('last_fetch');
      setEditsMade(false);
      localStorage.removeItem('edits_made');
      setError(null);
      return true;
    } catch (err) {
      setError("Failed to save itinerary: " + err.message);
      return false;
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await deleteTrip(id);
      if (appData && appData.id === id) {
        executeClose();
      } else {
        await loadRecentTrips();
      }
      return true;
    } catch (err) {
      setError("Failed to delete trip: " + err.message);
      return false;
    }
  };

  const handleTogglePin = async (trip, e) => {
    e.stopPropagation();
    try {
      const updated = { ...trip, pinned: !trip.pinned };
      const saved = await saveTrip(updated);
      if (appData && appData.id === trip.id) {
        setAppData(saved);
      }
      await loadRecentTrips();
    } catch (err) {
      setError("Failed to toggle pin state: " + err.message);
    }
  };

  const handleToggleArchive = async (trip, e) => {
    e.stopPropagation();
    try {
      const updated = { ...trip, archived: !trip.archived };
      const saved = await saveTrip(updated);
      if (appData && appData.id === trip.id) {
        setAppData(saved);
      }
      await loadRecentTrips();
    } catch (err) {
      setError("Failed to toggle archive state: " + err.message);
    }
  };

  const handleExportBackup = async () => {
    try {
      const trips = await getAllTrips();
      if (trips.length === 0) {
        setError("No trips found to back up.");
        return;
      }
      const blob = new Blob([JSON.stringify(trips, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `j-itinerary-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export backup: " + err.message);
    }
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) {
          throw new Error("Backup file must contain an array of itineraries.");
        }
        
        const validTrips = [];
        for (const item of parsed) {
          if (!validateData(item)) {
            const normalized = normalizeData(item);
            validTrips.push({
              ...normalized,
              pinned: !!item.pinned,
              archived: !!item.archived,
              updatedAt: item.updatedAt || Date.now()
            });
          }
        }
        
        if (validTrips.length === 0) {
          throw new Error("No valid itineraries found in the backup file.");
        }

        await importTrips(validTrips);
        await loadRecentTrips();
        setError(null);
        alert(`Successfully imported ${validTrips.length} trips!`);
      } catch (err) {
        setError("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!appData) {
      loadRecentTrips();
    }
  }, [appData]);

  useEffect(() => {
    const storedEdits = localStorage.getItem('edits_made');
    if (storedEdits === 'true') setEditsMade(true);

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('it');

    const initApp = async () => {
      if (urlParam) {
        try {
          const trips = await getAllTrips();
          const existingTrip = trips.find(t => t.sourceUrl === urlParam);
          if (existingTrip && !validateData(existingTrip)) {
            setAppData(existingTrip);
            setActiveTab('day-0');
            localStorage.setItem('active_trip_id', existingTrip.id);
          } else {
            await fetchData(urlParam);
          }
        } catch (e) {
          await fetchData(urlParam);
        }
      } else {
        const activeTripId = localStorage.getItem('active_trip_id');
        if (activeTripId) {
          try {
            const trips = await getAllTrips();
            const activeTrip = trips.find(t => t.id === activeTripId);
            if (activeTrip && !validateData(activeTrip)) {
              setAppData(activeTrip);
              setActiveTab('day-0');
            } else {
              localStorage.removeItem('active_trip_id');
              await loadRecentTrips();
            }
          } catch (e) {
            localStorage.removeItem('active_trip_id');
            await loadRecentTrips();
          }
        } else {
          await loadRecentTrips();
        }
      }
    };

    initApp();

    const handleBeforeUnload = (e) => {
      if (localStorage.getItem('edits_made') === 'true') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleCreateNew = async (formData) => {
    const { title, startDate, endDate, currency } = formData;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = [];
    let current = new Date(start);
    let index = 0;
    while (current <= end) {
      const dayLabel = index === 0 ? "Start" : `Day ${index}`;
      days.push({
        day: dayLabel,
        title: index === 0 ? "Arrival" : `${dayLabel} Planning`,
        summary: "",
        checklist: [],
        timeline: [],
        additionalBudget: []
      });
      current.setDate(current.getDate() + 1);
      index++;
    }

    const prebookingData = { flights: [], trains: [], bus: [], rooms: [], activities: [] };
    const newItinerary = {
      title,
      startDate: new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      currency,
      days,
      prebookingData
    };

    try {
      const normalized = normalizeData(newItinerary);
      const saved = await saveTrip(normalized);
      setAppData(saved);
      setActiveTab('day-0');
      localStorage.setItem('active_trip_id', saved.id);
      localStorage.removeItem('last_fetch');
      setEditsMade(true);
      localStorage.setItem('edits_made', 'true');
      setIsEditing(true);
      return true;
    } catch (err) {
      setError("Failed to create new itinerary: " + err.message);
      return false;
    }
  };

  const handleDownload = () => {
    if (!appData) return;
    const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appData.title.replace(/\s+/g, '_') || 'itinerary'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    if (editsMade) {
      setShowCloseConfirm(true);
      return;
    }
    executeClose();
  };

  const executeClose = () => {
    localStorage.removeItem('active_trip_id');
    localStorage.removeItem('last_fetch');
    localStorage.removeItem('edits_made');
    setAppData(null);
    setActiveTab('day-0');
    setEditsMade(false);
    setIsEditing(false);
    setShowCloseConfirm(false);
    const url = new URL(window.location);
    if (url.searchParams.has('it')) {
      url.searchParams.delete('it');
      window.history.pushState({}, '', url);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '3.5rem' }}>
      {!appData ? (
        <DashboardView
          recentTrips={recentTrips}
          setAppData={setAppData}
          setActiveTab={setActiveTab}
          handleTogglePin={handleTogglePin}
          handleToggleArchive={handleToggleArchive}
          onDeleteTrip={handleDeleteTrip}
          onSaveNewTrip={handleCreateNew}
          onLoadLocalData={handleLoadLocalData}
          onFetchData={fetchData}
          isLoading={isLoading}
          handleExportBackup={handleExportBackup}
          handleImportBackup={handleImportBackup}
          onSetError={setError}
        />
      ) : (
        <ItineraryView
          appData={appData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editsMade={editsMade}
          error={error}
          showCloseConfirm={showCloseConfirm}
          setShowCloseConfirm={setShowCloseConfirm}
          handleDownload={handleDownload}
          handleClose={handleClose}
          executeClose={executeClose}
          handleUpdateAppData={handleUpdateAppData}
          handleUpdateDay={handleUpdateDay}
        />
      )}

      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(23, 23, 23, 0.8)',
        borderTop: '1px solid var(--border-light)',
        textAlign: 'center',
        padding: '0.75rem',
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="tab-btn"
            style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', margin: 0, padding: '0.4rem 0.8rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', fontSize: '1rem' }}
            title="Scroll to Top"
          >
            ↑
          </button>
        )}
        <span>Itinerary helper Created by <a href="https://github.com/Jayanthbharadwajm/trip-itinerary" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>Jayanth</a></span>
      </footer>
    </div>
  );
}

export default App;
