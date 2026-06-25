import React, { useRef, useEffect, useState } from 'react';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon } from './Icons';
import ConfirmPopover from './ConfirmPopover';

const EditDay = ({ dayData, dayIndex, onSave, currencySymbol }) => {
  const [editingPlanTitle, setEditingPlanTitle] = useState(dayData.active_plan || dayData.plans?.[0]?.title || "Main Plan");
  const [confirmDelete, setConfirmDelete] = useState({ show: false, index: null, type: null });
  const lastTimelineRef = useRef(null);

  const plans = dayData.plans || [];
  const currentPlanIndex = plans.findIndex(p => p.title === editingPlanTitle);
  const currentPlan = plans[currentPlanIndex] || plans[0] || { title: "Main Plan", timeline: [], additionalBudget: [] };
  const currentTimeline = currentPlan.timeline || [];
  
  const prevCountRef = useRef(currentTimeline.length);

  useEffect(() => {
    if (currentTimeline.length > prevCountRef.current && lastTimelineRef.current) {
      lastTimelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevCountRef.current = currentTimeline.length;
  }, [currentTimeline.length]);

  const updateField = (field, value) => {
    onSave({ ...dayData, [field]: value });
  };

  const updatePlanField = (field, value) => {
    const updatedPlans = [...plans];
    const planIdx = plans.findIndex(p => p.title === editingPlanTitle);
    if (planIdx !== -1) {
      updatedPlans[planIdx] = {
        ...updatedPlans[planIdx],
        [field]: value
      };
      onSave({ ...dayData, plans: updatedPlans });
    }
  };

  const handleRenamePlan = (newTitle) => {
    if (!newTitle.trim()) return;
    if (plans.some((p, i) => p.title === newTitle && i !== currentPlanIndex)) {
      return; // Name conflict
    }
    const updatedPlans = [...plans];
    updatedPlans[currentPlanIndex] = {
      ...updatedPlans[currentPlanIndex],
      title: newTitle
    };
    const isActive = dayData.active_plan === editingPlanTitle;
    onSave({
      ...dayData,
      active_plan: isActive ? newTitle : dayData.active_plan,
      plans: updatedPlans
    });
    setEditingPlanTitle(newTitle);
  };

  const handleAddPlan = () => {
    let num = 1;
    let name = `Plan ${num}`;
    while (plans.some(p => p.title === name)) {
      num++;
      name = `Plan ${num}`;
    }
    const newPlan = {
      title: name,
      timeline: [],
      additionalBudget: []
    };
    onSave({
      ...dayData,
      plans: [...plans, newPlan]
    });
    setEditingPlanTitle(name);
  };

  const handleDeletePlan = () => {
    if (plans.length <= 1) return;
    const nextPlans = plans.filter((_, i) => i !== currentPlanIndex);
    const nextPlanToEdit = nextPlans[0]?.title || "";
    const isActive = dayData.active_plan === editingPlanTitle;
    onSave({
      ...dayData,
      active_plan: isActive ? nextPlanToEdit : dayData.active_plan,
      plans: nextPlans
    });
    setEditingPlanTitle(nextPlanToEdit);
  };

  const handleSetActive = () => {
    onSave({
      ...dayData,
      active_plan: editingPlanTitle
    });
  };

  // Checklist
  const handleAddChecklist = () => {
    updateField('checklist', [...dayData.checklist, ""]);
  };
  const handleRemoveChecklist = (idx) => {
    setConfirmDelete({ show: true, index: idx, type: 'checklist' });
  };
  const handleUpdateChecklist = (idx, val) => {
    const next = [...dayData.checklist];
    next[idx] = val;
    updateField('checklist', next);
  };

  // Timeline
  const handleAddTimeline = () => {
    const newItem = { time: "09:00 AM", title: "", description: "", duration: "1h", cost: 0, location: "", mapsLink: "" };
    updatePlanField('timeline', [...currentTimeline, newItem]);
  };
  const handleRemoveTimeline = (idx) => {
    setConfirmDelete({ show: true, index: idx, type: 'timeline' });
  };
  const executeDelete = () => {
    const { index, type } = confirmDelete;
    if (type === 'timeline') {
      updatePlanField('timeline', currentTimeline.filter((_, i) => i !== index));
    } else if (type === 'budget') {
      updatePlanField('additionalBudget', currentPlan.additionalBudget.filter((_, i) => i !== index));
    } else if (type === 'checklist') {
      updateField('checklist', dayData.checklist.filter((_, i) => i !== index));
    }
    setConfirmDelete({ show: false, index: null, type: null });
  };
  const handleUpdateTimeline = (idx, updates) => {
    const next = [...currentTimeline];
    next[idx] = { ...next[idx], ...updates };
    updatePlanField('timeline', next);
  };
  const handleMoveTimeline = (idx, dir) => {
    const next = [...currentTimeline];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updatePlanField('timeline', next);
  };

  // Additional Budget
  const handleAddBudget = () => {
    updatePlanField('additionalBudget', [...currentPlan.additionalBudget, { title: "", cost: 0 }]);
  };
  const handleRemoveBudget = (idx) => {
    setConfirmDelete({ show: true, index: idx, type: 'budget' });
  };
  const handleUpdateBudget = (idx, updates) => {
    const next = [...currentPlan.additionalBudget];
    next[idx] = { ...next[idx], ...updates };
    updatePlanField('additionalBudget', next);
  };

  return (
    <div className="edit-day-container" style={{ padding: '1.25rem', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {confirmDelete.show && (
        <ConfirmPopover 
          message={`Are you sure you want to remove this ${confirmDelete.type === 'timeline' ? 'schedule item' : confirmDelete.type === 'checklist' ? 'task' : 'cost'}?`}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete({ show: false, index: null, type: null })}
        />
      )}
      {/* Basic Info */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <h3 className="mb-4" style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>General Info - {dayData.day}</h3>
        <div className="form-group mb-4">
          <label style={{ fontSize: '0.8rem' }}>Day Title</label>
          <input
            type="text"
            className="form-input"
            value={dayData.title || ""}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g., Arrival & City Tour"
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.8rem' }}>Summary / Narrative</label>
          <textarea
            className="form-input"
            style={{ minHeight: '80px' }}
            value={dayData.summary || ""}
            onChange={(e) => updateField('summary', e.target.value)}
            placeholder="What's the plan for today?"
          />
        </div>
      </section>

      {/* Plans Manager Section */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>Day Plans Manager</h3>
          <button className="tab-btn" onClick={handleAddPlan} style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
            <PlusIcon size={14} /> Add Plan
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          {plans.map((p, idx) => {
            const isSelected = p.title === editingPlanTitle;
            const isActive = p.title === dayData.active_plan;
            return (
              <button
                key={idx}
                onClick={() => setEditingPlanTitle(p.title)}
                className="tab-btn"
                style={{
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.85rem',
                  background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                {p.title}
                {isActive && <span style={{ color: '#fbbf24' }}>★</span>}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <div className="form-group" style={{ flex: '2 1 200px' }}>
            <label style={{ fontSize: '0.8rem' }}>Rename Selected Plan</label>
            <input
              type="text"
              className="form-input"
              value={editingPlanTitle}
              onChange={(e) => handleRenamePlan(e.target.value)}
              placeholder="e.g. Main Plan"
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 auto' }}>
            <button
              onClick={handleSetActive}
              disabled={dayData.active_plan === editingPlanTitle}
              className="tab-btn"
              style={{
                flex: 1,
                background: dayData.active_plan === editingPlanTitle ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-secondary)',
                color: dayData.active_plan === editingPlanTitle ? 'var(--accent-secondary)' : 'var(--text-primary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.75rem',
                cursor: dayData.active_plan === editingPlanTitle ? 'default' : 'pointer'
              }}
            >
              {dayData.active_plan === editingPlanTitle ? '✓ Active' : 'Set Active'}
            </button>
            <button
              onClick={handleDeletePlan}
              disabled={plans.length <= 1}
              className="tab-btn"
              style={{
                flex: 0,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '0.75rem',
                cursor: plans.length <= 1 ? 'not-allowed' : 'pointer',
                opacity: plans.length <= 1 ? 0.4 : 1
              }}
            >
              <TrashIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-secondary)', fontSize: '1.1rem' }}>Daily Checklist</h3>
          <button className="tab-btn" onClick={handleAddChecklist} style={{ background: 'var(--accent-secondary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
            <PlusIcon size={14} /> Add Task
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {dayData.checklist.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <CheckIcon size={18} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
              <input
                type="text"
                className="form-input"
                style={{ padding: '0.4rem 0.75rem' }}
                value={item}
                onChange={(e) => handleUpdateChecklist(idx, e.target.value)}
                placeholder="Checklist item..."
              />
              <button
                onClick={() => handleRemoveChecklist(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '0.5rem' }}
              >
                <TrashIcon size={18} />
              </button>
            </div>
          ))}
          {dayData.checklist.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No checklist items yet.</p>}
        </div>
      </section>

      {/* Timeline Section -> Redesigned to Card View */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>Timeline for {editingPlanTitle}</h3>
          <button className="tab-btn" onClick={handleAddTimeline} style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
            <PlusIcon size={14} /> Add Schedule
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {currentTimeline.map((item, idx) => (
            <div 
              key={idx} 
              ref={idx === currentTimeline.length - 1 ? lastTimelineRef : null} 
              className="card" 
              style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)' }}
            >
              {/* Card Header with Number and Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>Item {idx + 1}</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      disabled={idx === 0}
                      onClick={() => handleMoveTimeline(idx, -1)}
                      style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === 0 ? 'default' : 'pointer' }}
                    >
                      <ArrowUpIcon size={18} />
                    </button>
                    <button
                      disabled={idx === currentTimeline.length - 1}
                      onClick={() => handleMoveTimeline(idx, 1)}
                      style={{ background: 'none', border: 'none', color: idx === currentTimeline.length - 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: idx === currentTimeline.length - 1 ? 'default' : 'pointer' }}
                    >
                      <ArrowDownIcon size={18} />
                    </button>
                  </div>
                  <button onClick={() => handleRemoveTimeline(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                    <TrashIcon size={18} />
                  </button>
                </div>
              </div>

              {/* Multi-Row Card Layout */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Row 1: Time */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Time</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={item.time} 
                    onChange={(e) => handleUpdateTimeline(idx, { time: e.target.value })} 
                    placeholder="e.g., 09:00 AM" 
                  />
                </div>

                {/* Row 2: Title */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={item.title} 
                    onChange={(e) => handleUpdateTimeline(idx, { title: e.target.value })} 
                    placeholder="Activity name" 
                  />
                </div>

                {/* Row 3: Duration, Cost */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group flex-1">
                    <label style={{ fontSize: '0.75rem' }}>Duration</label>
                    <input type="text" className="form-input" value={item.duration || ""} onChange={(e) => handleUpdateTimeline(idx, { duration: e.target.value })} placeholder="2h" />
                  </div>
                  <div className="form-group flex-1">
                    <label style={{ fontSize: '0.75rem' }}>Cost ({currencySymbol})</label>
                    <input type="number" className="form-input" value={item.cost} onChange={(e) => handleUpdateTimeline(idx, { cost: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                {/* Row 4: Location */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Location</label>
                  <input type="text" className="form-input" value={item.location || ""} onChange={(e) => handleUpdateTimeline(idx, { location: e.target.value })} />
                </div>

                {/* Row 5: Maps Link */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Maps Link</label>
                  <input type="url" className="form-input" value={item.mapsLink || ""} onChange={(e) => handleUpdateTimeline(idx, { mapsLink: e.target.value })} />
                </div>

                {/* Row 6: Description */}
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Description</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '80px' }} 
                    value={item.description || ""} 
                    onChange={(e) => handleUpdateTimeline(idx, { description: e.target.value })} 
                    placeholder="Describe the activity..."
                  />
                </div>
              </div>
            </div>
          ))}

          {currentTimeline.length > 3 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <button className="tab-btn" onClick={handleAddTimeline} style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem' }}>
                <PlusIcon size={14} /> Add Schedule
              </button>
            </div>
          )}
          {currentTimeline.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No timeline events added yet.</p>}
        </div>
      </section>

      {/* Additional Budget */}
      <section className="card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: 'var(--accent-warning)', fontSize: '1.1rem' }}>Additional Budget for {editingPlanTitle}</h3>
          <button className="tab-btn" onClick={handleAddBudget} style={{ background: 'var(--accent-warning)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}>
            <PlusIcon size={14} /> Add Cost
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentPlan.additionalBudget.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 2 }}>
                <label style={{ fontSize: '0.75rem' }}>Reason</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.title || ""}
                  onChange={(e) => handleUpdateBudget(idx, { title: e.target.value })}
                  placeholder="e.g., Souvenirs"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem' }}>Cost ({currencySymbol})</label>
                <input
                  type="number"
                  className="form-input"
                  value={item.cost}
                  onChange={(e) => handleUpdateBudget(idx, { cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <button
                onClick={() => handleRemoveBudget(idx)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', paddingBottom: '0.75rem' }}
              >
                <TrashIcon size={18} />
              </button>
            </div>
          ))}
          {currentPlan.additionalBudget.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No extra costs added yet.</p>}
        </div>
      </section>
    </div>
  );
};

export default EditDay;
