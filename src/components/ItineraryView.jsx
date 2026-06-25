import React from 'react';
import Tabs from './Tabs';
import PrebookingView from './PrebookingView';
import DayView from './DayView';
import BudgetView from './BudgetView';
import EditView from './EditView';
import ConfirmPopover from './ConfirmPopover';
import { formatDate, calculateEndDate, getCurrencySymbol } from '../utils/itineraryHelpers';
import { DownloadIcon, EyeIcon, EditIcon, XIcon } from './Icons';

function ItineraryView({
  appData,
  activeTab,
  setActiveTab,
  isEditing,
  setIsEditing,
  editsMade,
  error,
  showCloseConfirm,
  setShowCloseConfirm,
  handleDownload,
  handleClose,
  executeClose,
  handleUpdateAppData,
  handleUpdateDay
}) {
  if (!appData) return null;

  const hasPrebooking = !!appData.prebookingData;
  const calculatedEndDate = calculateEndDate(appData.startDate, appData.days.length);
  const currencySymbol = getCurrencySymbol(appData.currency);

  const renderContent = () => {
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
      if (dayData)
        return (
          <DayView
            dayData={dayData}
            itineraryKey={itineraryKey}
            dayIndex={dayIndex}
            startDate={appData.startDate}
            currencySymbol={currencySymbol}
            onUpdateDay={(updated) => handleUpdateDay(dayIndex, updated)}
          />
        );
    }
    return <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Please select a valid tab.</div>;
  };

  return (
    <div className="app-container" style={{ width: '100%', maxWidth: '100%', padding: '0 0.5rem' }}>
      <div className="itinerary-actions-bar">
        <div className="itinerary-actions-container">
          <button onClick={handleDownload} className="itinerary-action-btn" title="Download Itinerary">
            <DownloadIcon size={18} />
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`itinerary-action-btn ${isEditing ? 'active' : ''}`}
            title={isEditing ? "Switch to View Mode" : "Switch to Edit Mode"}
          >
            {isEditing ? <EyeIcon size={18} /> : <EditIcon size={18} />}
          </button>
          <button onClick={handleClose} className="itinerary-action-btn itinerary-action-btn-close" title="Close Itinerary">
            <XIcon size={18} />
          </button>
        </div>
      </div>

      {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "0.75rem 1rem", margin: "1rem", borderRadius: "6px" }}>Error: {error}</div>}

      <header className="app-header">
        <h1>{appData.title}</h1>
        <p>{formatDate(appData.startDate)} - {calculatedEndDate} {editsMade && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>(Unsaved Edits)</span>}</p>
      </header>
      <div style={{ paddingBottom: "1rem" }}>
        <Tabs days={appData.days} activeTab={activeTab} setActiveTab={setActiveTab} hasPrebooking={hasPrebooking} isEditing={isEditing} />
      </div>
      <main>{renderContent()}</main>

      {showCloseConfirm && (
        <ConfirmPopover
          message="You have unsaved changes! Are you sure you want to close? Download your itinerary to save permanently."
          confirmText="Close & Lose Edits"
          onConfirm={executeClose}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}
    </div>
  );
}

export default ItineraryView;
