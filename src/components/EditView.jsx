import React, { useState } from 'react';
import EditPrebooking from './EditPrebooking';
import EditDay from './EditDay';

const EditView = ({ appData, activeTab, onUpdate, currencySymbol }) => {
  if (!appData) return null;

  const handleDayUpdate = (dayIndex, updatedDay) => {
    const newDays = [...appData.days];
    newDays[dayIndex] = updatedDay;
    onUpdate({ ...appData, days: newDays });
  };

  const handlePrebookingUpdate = (updatedPrebooking) => {
    onUpdate({ ...appData, prebookingData: updatedPrebooking });
  };

  // If in a day tab, show Day Editor
  if (activeTab.startsWith('day-')) {
    const dayIndex = parseInt(activeTab.split('-')[1], 10);
    const dayData = appData.days[dayIndex];
    if (dayData) {
      return (
        <EditDay 
          dayData={dayData} 
          dayIndex={dayIndex} 
          onSave={(updated) => handleDayUpdate(dayIndex, updated)}
          currencySymbol={currencySymbol}
        />
      );
    }
  }

  // If in prebooking tab, show Prebooking Editor
  // If in budget tab, let's also show prebooking editor or a message
  if (activeTab === 'prebooking' || activeTab === 'budget') {
    return (
      <EditPrebooking 
        data={appData.prebookingData || {}} 
        onSave={handlePrebookingUpdate}
        currencySymbol={currencySymbol}
      />
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
      Select a tab to start editing.
    </div>
  );
};

export default EditView;
