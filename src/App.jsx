import React, { useState, useEffect } from 'react';
import Tabs from './components/Tabs';
import PrebookingView from './components/PrebookingView';
import DayView from './components/DayView';
import BudgetView from './components/BudgetView';
import CreateItineraryModal from './components/CreateItineraryModal';
import PromptGenerator from './components/PromptGenerator';
import EditView from './components/EditView';
import ConfirmPopover from './components/ConfirmPopover';
import ootySample from './samples/ooty_trip.json';
import vietnamSample from './samples/benagluru_vietnam_7.json';

const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const calculateEndDate = (startDate, daysCount) => {
  if (!startDate || !daysCount) return "";
  const date = new Date(startDate);
  if (isNaN(date.getTime())) return startDate;
  date.setDate(date.getDate() + daysCount - 1);
  return formatDate(date);
};

const getCurrencySymbol = (currency) => {
  if (!currency) return "₹";
  const map = { INR: "₹", USD: "$", EUR: "€", GBP: "£", VND: "₫" };
  return map[currency.toUpperCase()] || currency;
};

const validateData = (data) => {
  if (!data) return "Data is empty";
  if (!data.title) return "Missing 'title'";
  if (!data.startDate) return "Missing 'startDate'";
  if (!Array.isArray(data.days)) return "'days' must be an array";
  return null;
};

const normalizeData = (data) => {
  if (!data) return null;
  const startDate = data.startDate || "";
  const currency = data.currency || "INR";

  return {
    ...data,
    title: data.title || "Untitled Itinerary",
    startDate: startDate,
    currency: currency,
    days: (data.days || []).map((day, index) => ({
      day: day.day ? day.day : index + 1,
      title: day.title || "",
      summary: day.summary || "",
      checklist: Array.isArray(day.checklist) ? day.checklist : [],
      additionalBudget: (day.additionalBudget || []).map(item => ({
        title: item.title || "",
        cost: typeof item.cost === 'number' ? item.cost : 0
      })),
      timeline: (day.timeline || []).map(item => ({
        time: item.time || "10:00 AM",
        title: item.title || "",
        description: item.description || "",
        duration: item.duration || "",
        location: item.location || "",
        mapsLink: item.mapsLink || "",
        cost: typeof item.cost === 'number' ? item.cost : 0
      }))
    })),
    prebookingData: {
      flights: Array.isArray(data.prebookingData?.flights) ? data.prebookingData.flights.map((f, i) => ({
        id: i + 1, date: f.date || startDate, from: f.from || "", to: f.to || "",
        departure: f.departure || "", arrival: f.arrival || "", airline: f.airline || "",
        durationMinutes: typeof f.durationMinutes === 'number' ? f.durationMinutes : 0,
        status: f.status || "Pending", cost: typeof f.cost === 'number' ? f.cost : 0,
        terminal: { departure: f.terminal?.departure || "", arrival: f.terminal?.arrival || "" },
        links: Array.isArray(f.links) ? f.links : []
      })) : [],
      trains: Array.isArray(data.prebookingData?.trains) ? data.prebookingData.trains.map((t, i) => ({
        id: i + 1, date: t.date || startDate, name: t.name || "", from: t.from || "", to: t.to || "",
        departure: t.departure || "", arrival: t.arrival || "",
        durationMinutes: typeof t.durationMinutes === 'number' ? t.durationMinutes : 0,
        status: t.status || "Pending", cost: typeof t.cost === 'number' ? t.cost : 0,
        links: Array.isArray(t.links) ? t.links : []
      })) : [],
      bus: Array.isArray(data.prebookingData?.bus) ? data.prebookingData.bus.map((b, i) => ({
        id: i + 1, date: b.date || startDate, from: b.from || "", to: b.to || "",
        departure: b.departure || "", arrival: b.arrival || "", provider: b.provider || "",
        durationMinutes: typeof b.durationMinutes === 'number' ? b.durationMinutes : 0,
        status: b.status || "Pending", cost: typeof b.cost === 'number' ? b.cost : 0,
        points: { pickup: b.points?.pickup || "", drop: b.points?.drop || "" },
        links: Array.isArray(b.links) ? b.links : []
      })) : [],
      rooms: Array.isArray(data.prebookingData?.rooms) ? data.prebookingData.rooms.map((r, i) => ({
        id: i + 1, name: r.name || "", checkin: r.checkin || "", checkout: r.checkout || "",
        cost: typeof r.cost === 'number' ? r.cost : 0, status: r.status || "Pending",
        location: r.location || "", mapsLink: r.mapsLink || "", links: Array.isArray(r.links) ? r.links : []
      })) : [],
      activities: Array.isArray(data.prebookingData?.activities) ? data.prebookingData.activities.map((a, i) => ({
        id: i + 1, name: a.name || "", status: a.status || "Pending",
        cost: typeof a.cost === 'number' ? a.cost : 0, notes: a.notes || "",
        links: Array.isArray(a.links) ? a.links : [],
        excludeFromBudget: typeof a.excludeFromBudget === 'boolean' ? a.excludeFromBudget : false
      })) : []
    }
  };
};

const sampleItinerary = [
  {
    name: "Ooty Trip (3 Days)",
    data: ootySample,
  },
  {
    name: "Bengaluru - Vietnam (7 days)",
    data: vietnamSample,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState('day-0');
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // New States for Creator/Editor
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPromptGen, setShowPromptGen] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editsMade, setEditsMade] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check if edits_made was stored
    const storedEdits = localStorage.getItem('edits_made');
    if (storedEdits === 'true') setEditsMade(true);

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('it');

    if (urlParam) {
      setUrlInput(urlParam);
      checkAndFetchUrl(urlParam);
    } else {
      const storedUrl = localStorage.getItem('it_url');
      if (storedUrl) {
        setUrlInput(storedUrl);
        checkAndFetchUrl(storedUrl);
      } else {
        const storedData = localStorage.getItem('it_loaded');
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            if (!validateData(parsed)) {
              setAppData(parsed);
              setActiveTab('day-0');
            } else {
              localStorage.removeItem('it_loaded');
            }
          } catch (e) {
            localStorage.removeItem('it_loaded');
          }
        }
      }
    }

    // Tab close warning
    const handleBeforeUnload = (e) => {
      if (localStorage.getItem('edits_made') === 'true') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const checkAndFetchUrl = async (url) => {
    const storedUrl = localStorage.getItem('it_url');
    const lastFetch = localStorage.getItem('last_fetch');
    const storedDataStr = localStorage.getItem('it_loaded');
    const now = new Date().getTime();
    const fifteenMins = 15 * 60 * 1000;

    if (storedUrl === url && storedDataStr && lastFetch && (now - parseInt(lastFetch, 10) < fifteenMins)) {
      try {
        const parsed = JSON.parse(storedDataStr);
        if (!validateData(parsed)) {
          setAppData(parsed);
          setActiveTab('day-0');
          return;
        }
      } catch (e) { }
    }
    await fetchData(url);
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
      setAppData(normalized);
      setActiveTab('day-0');
      localStorage.setItem('it_loaded', JSON.stringify(normalized));
      localStorage.setItem('it_url', url);
      localStorage.setItem('last_fetch', new Date().getTime().toString());
      setEditsMade(false);
      localStorage.removeItem('edits_made');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppData = (newData) => {
    setAppData(newData);
    localStorage.setItem('it_loaded', JSON.stringify(newData));
    setEditsMade(true);
    localStorage.setItem('edits_made', 'true');
  };

  const handleLoadLocalData = (data) => {
    if (validateData(data)) {
      setError("Invalid itinerary data");
      return;
    }
    const normalized = normalizeData(data);
    setAppData(normalized);
    setActiveTab('day-0');
    localStorage.setItem('it_loaded', JSON.stringify(normalized));
    localStorage.removeItem('it_url');
    localStorage.removeItem('last_fetch');
    setEditsMade(false);
    localStorage.removeItem('edits_made');
    setError(null);
  };

  const handleCreateNew = (formData) => {
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

    setAppData(newItinerary);
    setActiveTab('day-0');
    localStorage.setItem('it_loaded', JSON.stringify(newItinerary));
    localStorage.removeItem('it_url');
    localStorage.removeItem('last_fetch');
    setEditsMade(true);
    localStorage.setItem('edits_made', 'true');
    setShowCreateModal(false);
    setIsEditing(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (validateData(parsed)) throw new Error(validateData(parsed));
        const normalized = normalizeData(parsed);
        setAppData(normalized);
        setActiveTab('day-0');
        localStorage.setItem('it_loaded', JSON.stringify(normalized));
        localStorage.removeItem('it_url');
        localStorage.removeItem('last_fetch');
        setEditsMade(false);
        localStorage.removeItem('edits_made');
        setError(null);
      } catch (err) {
        setError("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
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

  const handleUrlLoad = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    await checkAndFetchUrl(urlInput.trim());
  };

  const handlePasteLoad = () => {
    if (!pasteValue.trim()) return;
    try {
      const parsed = JSON.parse(pasteValue);
      if (validateData(parsed)) {
        setError(validateData(parsed));
        return;
      }
      handleLoadLocalData(parsed);
      setShowPasteModal(false);
      setPasteValue('');
    } catch (err) {
      setError("Invalid JSON: " + err.message);
    }
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
    localStorage.removeItem('it_loaded');
    localStorage.removeItem('it_url');
    localStorage.removeItem('last_fetch');
    localStorage.removeItem('edits_made');
    setAppData(null);
    setUrlInput('');
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

  const hasPrebooking = appData && !!appData.prebookingData;
  const calculatedEndDate = appData ? calculateEndDate(appData.startDate, appData.days.length) : "";
  const currencySymbol = appData ? getCurrencySymbol(appData.currency) : "₹";

  const renderContent = () => {
    if (!appData) return null;
    if (isEditing) {
      return (
        <EditView
          appData={appData}
          activeTab={activeTab}
          onUpdate={handleUpdateAppData}
          currencySymbol={currencySymbol}
        />
      );
    }

    const itineraryKey = `${appData.title}_${appData.startDate}_${calculatedEndDate}`.replace(/\s+/g, "_");

    if (activeTab === 'prebooking' && hasPrebooking) {
      return <PrebookingView data={appData.prebookingData} itineraryKey={itineraryKey} currencySymbol={currencySymbol} />;
    }
    if (activeTab === 'budget' && hasPrebooking) {
      return <BudgetView prebookingData={appData.prebookingData} daysData={appData.days} currencySymbol={currencySymbol} />;
    }
    if (activeTab.startsWith('day-')) {
      const dayIndex = parseInt(activeTab.split('-')[1], 10);
      const dayData = appData.days[dayIndex];
      if (dayData) return <DayView dayData={dayData} itineraryKey={itineraryKey} dayIndex={dayIndex} startDate={appData.startDate} currencySymbol={currencySymbol} />;
    }
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Please select a valid tab.</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '3.5rem' }}>
      {/* Modals & Overlays */}
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

      {!appData ? (
        <div className="app-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '0.2rem' }}>J-itinerary</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            {/* Section 1: Create, Upload, Paste Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <button onClick={() => setShowCreateModal(true)} className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-secondary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
                <span style={{ fontSize: '1.2rem' }}>➕</span>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Create</span>
              </button>

              <label className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
                <span style={{ fontSize: '1.2rem' }}>📁</span>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Upload</span>
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>

              <button onClick={() => setShowPasteModal(true)} className="card" style={{ padding: '1.25rem 0.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }} onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')} onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-light)')}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>Paste</span>
              </button>
            </div>

            {/* Section 2: URL Load */}
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

            {/* Section 3: AI Prompt Generator (Compact & Creative) */}
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

            <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.1rem', fontSize: '1rem' }}>Sample Itineraries</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
              {sampleItinerary.map((item, index) => (
                <button
                  key={index}
                  onClick={() => item.data ? handleLoadLocalData(item.data) : fetchData(item.url)}
                  className="card"
                  style={{
                    padding: '1.25rem 0.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'border-color 0.2s',
                    margin: 0
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>🗺️</span>
                  <span style={{ fontWeight: '600', fontSize: '0.85rem', lineHeight: '1' }}>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="app-container" style={{ width: '100%', maxWidth: '100%', padding: '0 0.5rem' }}>
          <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderBottom: "1px solid var(--border-light)", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <form onSubmit={handleUrlLoad} style={{ display: "flex", flex: "1 1 100%", gap: "0.5rem", flexWrap: "wrap", width: "100%" }}>
              <input type="url" placeholder="Enter JSON URL to load external itinerary..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} style={{ flex: "1 1 200px", minWidth: "0", padding: "0.6rem 1rem", borderRadius: "4px", border: "1px solid var(--border-light)", background: "var(--bg-color)", color: "var(--text-primary)" }} />
              <button type="submit" disabled={isLoading} className="tab-btn" style={{ flex: "0 0 auto", margin: 0, padding: "0.6rem 1.5rem", background: "var(--accent-primary)", border: "none", color: "#fff", cursor: isLoading ? "default" : "pointer", opacity: isLoading ? 0.7 : 1, borderRadius: "4px" }}>
                {isLoading ? "Loading..." : "Load"}
              </button>
            </form>
            <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
              <label className="tab-btn" style={{ margin: 0, padding: "0.4rem 1rem", background: "var(--bg-color)", border: "1px solid var(--border-light)", color: "var(--text-primary)", cursor: "pointer", transition: "border-color 0.2s", borderRadius: "4px" }} onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")} onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}>
                Upload
                <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: "none" }} />
              </label>
              <button onClick={handleDownload} className="tab-btn" style={{ margin: 0, padding: "0.4rem 1rem", background: "var(--bg-color)", border: "1px solid var(--border-light)", color: "var(--text-primary)", cursor: "pointer", transition: "border-color 0.2s", borderRadius: "4px" }} onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent-primary)")} onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}>
                Download
              </button>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`tab-btn ${isEditing ? 'active' : ''}`}
                style={{ margin: 0, padding: "0.4rem 1rem", background: isEditing ? "var(--gradient-secondary)" : "var(--bg-color)", border: "1px solid var(--border-light)", color: isEditing ? "#fff" : "var(--text-primary)", cursor: "pointer", transition: "all 0.2s", borderRadius: "4px" }}
              >
                {isEditing ? "View Mode" : "Edit Mode"}
              </button>
              <button onClick={handleClose} className="tab-btn" style={{ margin: "0 0 0 auto", padding: "0.4rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer", transition: "all 0.2s", borderRadius: "4px" }} onMouseOver={(e) => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }} onMouseOut={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#ef4444"; }}>
                Close Itinerary
              </button>
            </div>
          </div>

            {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", margin: "1rem", borderRadius: "6px" }}>Error: {error}</div>}

            {appData && (
              <>
                <header className="app-header">
                  <h1>{appData.title}</h1>
                  <p>{formatDate(appData.startDate)} - {calculatedEndDate} {editsMade && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Unsaved Edits)</span>}</p>
                </header>
                <div style={{ paddingBottom: "1rem" }}>
                  <Tabs days={appData.days} activeTab={activeTab} setActiveTab={setActiveTab} hasPrebooking={hasPrebooking} isEditing={isEditing} />
                </div>
                <main>{renderContent()}</main>
              </>
            )}

            {showCloseConfirm && (
              <ConfirmPopover
                message="You have unsaved changes! Are you sure you want to close? Download your itinerary to save permanently."
                confirmText="Close & Lose Edits"
                onConfirm={executeClose}
                onCancel={() => setShowCloseConfirm(false)}
              />
            )}
        </div>
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
