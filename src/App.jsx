import React, { useState, useEffect } from 'react';
import Tabs from './components/Tabs';
import PrebookingView from './components/PrebookingView';
import DayView from './components/DayView';
import BudgetView from './components/BudgetView';

import sample2 from './samples/sample2.json';
import sample3 from './samples/sample3.json';
import sample4 from './samples/sample4.json';

const validateData = (data) => {
  if (!data) return "Data is empty";
  if (!data.title) return "Missing 'title'";
  if (!data.startDate) return "Missing 'startDate'";
  if (!data.endDate) return "Missing 'endDate'";
  if (!Array.isArray(data.days)) return "'days' must be an array";
  return null;
};

const sampleItinerary = [
  {
    name: "Benglore- Vietnam (7 days)",
    url: "https://www.jsonkeeper.com/b/J1XIS"
  },
  {
    name: "Benglore-Kerala (5 days)",
    data: sample2,
  },
  {
    name: "Benglore-Coorg (3days)",
    data: sample3,
  },
  {
    name: "Benglore-Baali (7days)",
    data: sample4,
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('day-0');
  const [appData, setAppData] = useState(null);
  const [error, setError] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
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
            const err = validateData(parsed);
            if (!err) {
              setAppData(parsed);
              setActiveTab('day-0');
            } else {
              console.error("Local storage data invalid:", err);
              localStorage.removeItem('it_loaded');
            }
          } catch (e) {
            console.error("Failed to parse local storage data:", e);
            localStorage.removeItem('it_loaded');
          }
        }
      }
    }
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
        const err = validateData(parsed);
        if (!err) {
          setAppData(parsed);
          setActiveTab('day-0');
          return;
        }
      } catch (e) {
        console.error("Cache parse error, falling back to fetch", e);
      }
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

      const err = validateData(jsonData);
      if (err) {
        throw new Error(err);
      }

      setAppData(jsonData);
      setActiveTab('day-0');
      localStorage.setItem('it_loaded', JSON.stringify(jsonData));
      localStorage.setItem('it_url', url);
      localStorage.setItem('last_fetch', new Date().getTime().toString());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = (item) => {
    if (item.url) {
      setUrlInput(item.url);
      checkAndFetchUrl(item.url);
    } else if (item.data) {
      const err = validateData(item.data);
      if (!err) {
        setAppData(item.data);
        setActiveTab('day-0');
        localStorage.setItem('it_loaded', JSON.stringify(item.data));
        localStorage.removeItem('it_url');
        localStorage.removeItem('last_fetch');
        setError(null);
      } else {
        setError("Sample data is invalid: " + err);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const err = validateData(parsed);
        if (err) throw new Error(err);
        setAppData(parsed);
        setActiveTab('day-0');
        localStorage.setItem('it_loaded', JSON.stringify(parsed));
        localStorage.removeItem('it_url');
        localStorage.removeItem('last_fetch');
        setError(null);
      } catch (err) {
        setError("Invalid JSON file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input so same file can be selected again
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

  const handleClose = () => {
    localStorage.removeItem('it_loaded');
    localStorage.removeItem('it_url');
    localStorage.removeItem('last_fetch');
    setAppData(null);
    setUrlInput('');
    setActiveTab('day-0');

    const url = new URL(window.location);
    if (url.searchParams.has('it')) {
      url.searchParams.delete('it');
      window.history.pushState({}, '', url);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasPrebooking = appData && !!appData.prebookingData;

  const renderContent = () => {
    if (!appData) return null;

    if (activeTab === 'prebooking' && hasPrebooking) {
      const itineraryKey = `${appData.title}_${appData.startDate}_${appData.endDate}`.replace(/\s+/g, '_');
      return <PrebookingView data={appData.prebookingData} itineraryKey={itineraryKey} />;
    }

    if (activeTab === 'budget' && hasPrebooking) {
      return <BudgetView prebookingData={appData.prebookingData} daysData={appData.days} />;
    }

    if (activeTab.startsWith('day-')) {
      const dayIndex = parseInt(activeTab.split('-')[1], 10);
      const dayData = appData.days[dayIndex];
      const itineraryKey = `${appData.title}_${appData.startDate}_${appData.endDate}`.replace(/\s+/g, '_');
      if (dayData) return <DayView dayData={dayData} itineraryKey={itineraryKey} dayIndex={dayIndex} />;
    }

    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Please select a valid tab.</div>;
  };

  if (!appData) {
    return (
      <div className="app-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '2rem' }}>Welcome to Itinerary Viewer</h1>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center', flexWrap: 'wrap', flexDirection: 'column', width: '100%' }}>
          <form onSubmit={handleUrlLoad} style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
            <input
              type="url"
              placeholder="Enter JSON URL to load external itinerary..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: '0', padding: '0.8rem 1rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1rem' }}
            />
            <button type="submit" disabled={isLoading} className="tab-btn" style={{ flex: '1 1 auto', margin: 0, padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, fontSize: '1rem', borderRadius: '4px' }}>
              {isLoading ? 'Loading...' : 'Load'}
            </button>
          </form>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>OR</div>
            <label className="tab-btn" style={{ margin: 0, padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', borderRadius: '4px', textAlign: 'center' }}>
              Upload JSON
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', marginBottom: '2rem', borderRadius: '6px' }}>
            Error: {error}
          </div>
        )}

        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Sample Itineraries</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {sampleItinerary.map((item, index) => (
            <button
              key={index}
              onClick={() => handleLoadSample(item)}
              style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'border-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
            >
              <span style={{ fontWeight: 'bold' }}>{item.name}</span>
            </button>
          ))}
        </div>

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: '3rem',
              height: '3rem',
              fontSize: '1.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Scroll to Top"
          >
            ↑
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form onSubmit={handleUrlLoad} style={{ display: 'flex', flex: '1 1 100%', gap: '0.5rem', flexWrap: 'wrap', width: '100%' }}>
          <input
            type="url"
            placeholder="Enter JSON URL to load external itinerary..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: '0', padding: '0.6rem 1rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
          />
          <button type="submit" disabled={isLoading} className="tab-btn" style={{ flex: '0 0 auto', margin: 0, padding: '0.6rem 1.5rem', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.7 : 1, borderRadius: '4px' }}>
            {isLoading ? 'Loading...' : 'Load'}
          </button>
        </form>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="tab-btn" style={{ margin: 0, padding: '0.4rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'border-color 0.2s', borderRadius: '4px' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}>
            Upload
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={handleDownload} className="tab-btn" style={{ margin: 0, padding: '0.4rem 1rem', background: 'var(--bg-color)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', transition: 'border-color 0.2s', borderRadius: '4px' }} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}>
            Download
          </button>
          <button onClick={handleClose} className="tab-btn" style={{ margin: '0 0 0 auto', padding: '0.4rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', borderRadius: '4px' }} onMouseOver={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}>
            Close Itinerary
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', margin: '1rem', borderRadius: '6px' }}>
          Error: {error}
        </div>
      )}

      {appData && (
        <>
          <header className="app-header">
            <h1>{appData.title}</h1>
            <p>{appData.startDate} - {appData.endDate}</p>
          </header>

          <div style={{ paddingBottom: '1rem' }}>
            <Tabs
              days={appData.days}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              hasPrebooking={hasPrebooking}
            />
          </div>

          <main>
            {renderContent()}
          </main>
        </>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '3rem',
            height: '3rem',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="Scroll to Top"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;
