import React, { useState, useRef, useEffect } from 'react';
import { CheckIcon } from './Icons';

const InfoIcon = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', marginLeft: '0.45rem', display: 'inline-block' }}>
      <span
        onClick={() => setShow(!show)}
        style={{
          cursor: 'pointer', opacity: 0.7, fontSize: '0.85rem',
          background: 'var(--accent-primary)', color: '#fff',
          width: '18px', height: '18px', borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s', fontWeight: 'bold'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        i
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(30, 30, 30, 0.95)', color: '#fff', padding: '0.75rem',
          borderRadius: '8px', fontSize: '0.75rem', width: '220px', zIndex: 100,
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)', border: '1px solid var(--border-light)',
          backdropFilter: 'blur(10px)', pointerEvents: 'none', lineHeight: '1.4'
        }}>
          {text}
          <div style={{ position: 'absolute', top: '100%', left: '50%', marginLeft: '-5px', border: '5px solid transparent', borderTopColor: 'rgba(30, 30, 30, 0.95)' }} />
        </div>
      )}
    </span>
  );
};

const PromptGenerator = ({ onCancel, onPaste }) => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const bottomRef = useRef(null);

  const [formData, setFormData] = useState({
    location: '',
    fromLocation: '',
    startDate: today,
    endDate: nextWeek,
    startTime: '09:00',
    endTime: '18:00',
    currency: 'INR',
    travelPreference: 'Any',
    hotelPreference: 'Any',
    totalBudget: '',
    numPeople: 1,
    extraInfo: '',
  });
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (generatedPrompt && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generatedPrompt]);

  const formatReadableDate = (iso) => {
    if (!iso) return "";
    const date = new Date(iso);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatTime12h = (time24) => {
    if (!time24) return "";
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const getDaysCount = () => {
    if (!formData.startDate || !formData.endDate) return 1;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    const diff = e - s;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const generatePrompt = () => {
    const { location, fromLocation, currency, travelPreference, hotelPreference, totalBudget, numPeople, extraInfo, startDate, endDate, startTime, endTime } = formData;
    const daysCount = getDaysCount();
    const readableStart = formatReadableDate(startDate);
    const readableEnd = formatReadableDate(endDate);
    const readableStartTime = formatTime12h(startTime);
    const readableEndTime = formatTime12h(endTime);

    const schemaExample = {
      title: `Trip to ${location}`,
      startDate: readableStart,
      currency: currency,
      numPeople: numPeople,
      days: [
        {
          day: "Day 1",
          title: "Arrival and Orientation",
          summary: "Arrival at destination...",
          checklist: ["Check-in", "Local currency"],
          timeline: [
            {
              time: readableStartTime,
              title: "Journey Start",
              description: `Departure from ${fromLocation || 'home'}.`,
              duration: "2h",
              cost: 0,
              location: fromLocation || "Starting Point",
              mapsLink: ""
            }
          ],
          additionalBudget: []
        }
      ],
      prebookingData: {
        flights: [
          {
            id: 1,
            date: "YYYY-MM-DD",
            from: "Source City Code",
            to: "dest City Code",
            departure: "10:00",
            arrival: "14:30",
            airline: "Sample Air",
            durationMinutes: 150,
            status: "Pending",
            cost: 5000 * numPeople,
            terminal: { departure: "T1", arrival: "T2" },
            links: []
          }
        ],
        trains: [
          {
            id: 1,
            date: "YYYY-MM-DD",
            name: "Express 123",
            from: "Source City",
            to: "dest City",
            departure: "08:00",
            arrival: "06:00",
            durationMinutes: 600,
            status: "Pending",
            cost: 2000 * numPeople,
            links: []
          }
        ],
        bus: [
          {
            id: 1,
            date: "YYYY-MM-DD",
            from: "Source City",
            to: "dest City",
            departure: "11:00",
            arrival: "05:00",
            provider: "Luxury Bus",
            durationMinutes: 360,
            status: "Pending",
            cost: 1500 * numPeople,
            points: { pickup: "Main Stand", drop: "City Center" },
            links: []
          }
        ],
        rooms: [
          {
            id: 1,
            name: "Grand Plaza Hotel",
            checkin: "YYYY-MM-DD HH:mm",
            checkout: "YYYY-MM-DD HH:mm",
            cost: 4000 * numPeople,
            status: "Pending",
            location: location,
            mapsLink: "google map link",
            links: []
          }
        ],
        activities: [
          {
            id: 1,
            name: "City Walking Tour",
            cost: 500 * numPeople,
            status: "Pending",
            notes: "Extra Info",
            excludeFromBudget:false,
            links: []
          }
        ]
      }
    };

    const prompt = `Act as a travel expert and generate a detailed itinerary for a ${daysCount}-day trip to ${location} starting from ${fromLocation || "the user's home location"}.

Trip Constraints:
- Start: Departure from ${fromLocation || "home"} on or after ${readableStart} at ${readableStartTime}.
- Return: Arrival back at ${fromLocation || "home"} before ${readableEnd} at ${readableEndTime}.
- Travelers: There are ${numPeople} people traveling.
- Travel Preference: Prioritize ${travelPreference} for major transport. Include specific options in "prebookingData".
- Accommodation: Suggest ${hotelPreference === 'Any' ? 'suitable' : hotelPreference} accommodations.
${totalBudget ? `- Budget Limit: Aim to stay within a total of ${currency} ${totalBudget}.` : ''}

CRITICAL: Calculate all costs (transport, lodging, activities, meals) as the TOTAL for ${numPeople} people.
Example: If bus fare is ${currency} 1500 per person and 2 people are traveling, the cost in JSON must be ${currency} 3000.

Format the output STRICTLY as a valid JSON object matching the structure below.
Use ${currency} for all costs.
Ensure times are in "HH:MM AM/PM" format.

${extraInfo ? `Extra Requirements: ${extraInfo}` : ''}

JSON Schema and Example:
\`\`\`json
${JSON.stringify(schemaExample, null, 2)}
\`\`\`

Generate a full ${daysCount}-day itinerary. Return ONLY the JSON object.`;

    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = generatedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch (err) { }
      document.body.removeChild(textArea);
    } else {
      navigator.clipboard.writeText(generatedPrompt)
        .then(() => setCopied(true))
        .catch(() => {});
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', maxWidth: '600px', margin: '0 auto', position: 'relative', border: '1px solid var(--border-light)', borderRadius: '16px' }}>

      {copied && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--accent-secondary)', color: '#fff', padding: '0.75rem 1.5rem',
          borderRadius: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 3000,
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold'
        }}>
          <CheckIcon size={18} /> Copied to Clipboard!
        </div>
      )}

      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold' }}>AI Prompt Generator</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Row 1: Destination & From */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Where are you going? <InfoIcon text="The destination you are planning to visit." /></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Vietnam, Ooty"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>From? <InfoIcon text="The place where you will be starting your journey." /></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Bengaluru, Airport"
              value={formData.fromLocation}
              onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Start Date & Time */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Start Date <InfoIcon text="Day your journey begins." /></label>
            <input
              type="date"
              className="form-input"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 120px' }}>
            <label>At Time <InfoIcon text="When you can start your travel on the first day." /></label>
            <input
              type="time"
              className="form-input"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Return Date & Time */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Return to Date <InfoIcon text="When you plan to reach back home." /></label>
            <input
              type="date"
              className="form-input"
              min={formData.startDate}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="form-group" style={{ flex: '1 1 120px' }}>
            <label>Time <InfoIcon text="The time you need to be back by." /></label>
            <input
              type="time"
              className="form-input"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Days Box */}
        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
           <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trip Duration</span>
           <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)', fontSize: '1.25rem' }}>{getDaysCount()} Days</span>
        </div>

        {/* Preferences Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Travel Preference <InfoIcon text="Preferred mode of major transport." /></label>
            <select
              className="form-input"
              value={formData.travelPreference}
              onChange={(e) => setFormData({ ...formData, travelPreference: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            >
              <option value="Any">Any</option>
              <option value="Flight">Flight</option>
              <option value="Train">Train</option>
              <option value="Bus">Bus</option>
            </select>
          </div>
          <div className="form-group">
            <label>Hotel Preference <InfoIcon text="Style of accommodation you prefer." /></label>
            <select
              className="form-input"
              value={formData.hotelPreference}
              onChange={(e) => setFormData({ ...formData, hotelPreference: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            >
              <option value="Any">Any</option>
              <option value="5 star">5 Star</option>
              <option value="4 star">4 Star</option>
              <option value="3 star">3 Star</option>
              <option value="Budget">Budget</option>
            </select>
          </div>
        </div>

        {/* travelers & Budget */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1 }}>
             <label>Number of Travelers <InfoIcon text="Total number of people for whom costs should be calculated." /></label>
             <input
               type="number"
               min="1"
               className="form-input"
               value={formData.numPeople}
               onChange={(e) => setFormData({ ...formData, numPeople: parseInt(e.target.value) || 1 })}
               style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
             />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Total Budget (Optional) <InfoIcon text="Optional target budget for the entire trip." /></label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 50000"
              value={formData.totalBudget}
              onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Currency & Extra Info */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Currency <InfoIcon text="Used for all costs in the generated itinerary." /></label>
            <select
              className="form-input"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              style={{ width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>
        </div>

        {/* Extra Info */}
        <div className="form-group">
          <label>Extra Info (Optional) <InfoIcon text="Specific places, food interests, or hidden gems." /></label>
          <textarea
            className="form-input"
            style={{ minHeight: '80px', width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            placeholder="e.g. Include street food tours..."
            value={formData.extraInfo}
            onChange={(e) => setFormData({ ...formData, extraInfo: e.target.value })}
          />
        </div>

        {/* Actions Cluster */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onCancel}
              className="tab-btn"
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '0.8rem', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={generatePrompt}
              disabled={!formData.location}
              className="tab-btn active"
              style={{ flex: 2, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem', fontWeight: 'bold', opacity: !formData.location ? 0.7 : 1, cursor: !formData.location ? 'default' : 'pointer' }}
            >
              Generate AI Prompt
            </button>
          </div>

          <button
            onClick={onPaste}
            className="tab-btn"
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '8px', padding: '0.8rem', transition: 'all 0.2s', margin: 0 }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(79, 70, 229, 0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            Paste JSON Itinerary
          </button>
        </div>

        {/* Generated Output */}
        {generatedPrompt && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Generated Prompt</h3>
              <button
                onClick={handleCopy}
                className="tab-btn"
                style={{ background: copied ? 'var(--accent-secondary)' : 'var(--accent-primary)', color: '#fff', border: 'none', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s', borderRadius: '6px' }}
              >
                {copied ? 'Copied ✅' : 'Copy'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea
                readOnly
                className="form-input"
                style={{ minHeight: '200px', width: '100%', padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)', lineHeight: '1.5' }}
                value={generatedPrompt}
              />
            </div>
          </div>
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
};

export default PromptGenerator;
