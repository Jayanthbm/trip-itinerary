import ootySample from "../samples/ooty_trip.json";
import { parseCost } from "./costUtils";
import {
  normalizeReview,
  addTimelineItemToDay,
  updateCustomItemInDay,
  removeCustomItemFromDay,
  moveCustomItemInDay,
  stripCustomItems,
} from "./reviewHelpers";

// Re-exported for App.jsx convenience; canonical home is ./reviewHelpers.
export {
  addTimelineItemToDay,
  updateCustomItemInDay,
  removeCustomItemFromDay,
  moveCustomItemInDay,
  stripCustomItems,
};

// Stable per-item identity (REVIEW_READINESS_PLAN.md P0-3).
// Used as the review key for timeline/additionalBudget/prebooking items so
// Trip Review data survives inserts, deletes and reorders.
// Uses globalThis (not window) so it also works in Node/test environments.
export const genItemId = () => {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const formatDate = (dateInput) => {
  if (!dateInput) return "";
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const calculateEndDate = (startDate, daysCount) => {
  if (!startDate || !daysCount) return "";
  const date = new Date(startDate);
  if (isNaN(date.getTime())) return startDate;
  date.setDate(date.getDate() + daysCount - 1);
  return formatDate(date);
};

export const isTripInPast = (startDateStr, daysCount) => {
  if (!startDateStr || !daysCount) return false;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return false;
  
  // Calculate end date
  const end = new Date(start);
  end.setDate(end.getDate() + daysCount - 1);
  
  // Set end to the very end of that day (23:59:59.999) to be safe
  end.setHours(23, 59, 59, 999);
  
  const now = new Date();
  return end < now;
};

export const getTripCountdown = (startDateStr, daysCount) => {
  if (!startDateStr) return { text: "", status: "" };
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return { text: "", status: "" };

  // Set times to midnight for date-only comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = start - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      text: `⏳ Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      status: "future"
    };
  } else if (diffDays === 0) {
    return {
      text: `✨ Starts today!`,
      status: "today"
    };
  } else {
    // Check if ongoing
    const end = new Date(start);
    end.setDate(end.getDate() + daysCount - 1);
    end.setHours(23, 59, 59, 999);
    
    const now = new Date();
    if (now <= end) {
      const elapsedDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
      return {
        text: `✈️ Ongoing (Day ${elapsedDays} of ${daysCount})`,
        status: "ongoing"
      };
    } else {
      return {
        text: `✅ Completed`,
        status: "completed"
      };
    }
  }
};

export const statusStyles = {
  future: {
    bg: 'rgba(37, 99, 235, 0.15)',
    border: 'rgba(37, 99, 235, 0.3)',
    color: '#93c5fd'
  },
  today: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.3)',
    color: '#fde047'
  },
  ongoing: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
    color: '#6ee7b7'
  },
  completed: {
    bg: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(148, 163, 184, 0.3)',
    color: '#cbd5e1'
  }
};

export const getCurrencySymbol = (currency) => {
  if (!currency) return "₹";
  const map = { INR: "₹", USD: "$", EUR: "€", GBP: "£", VND: "₫" };
  return map[currency.toUpperCase()] || currency;
};

export const calculateTotalBudget = (trip) => {
  if (!trip) return 0;

  let total = 0;

  // Pre-booking items
  const flights = trip.prebookingData?.flights || [];
  total += flights.reduce((s, f) => s + parseCost(f.cost), 0);

  const trains = trip.prebookingData?.trains || [];
  total += trains.reduce((s, t) => s + parseCost(t.cost), 0);

  const buses = trip.prebookingData?.bus || [];
  total += buses.reduce((s, b) => s + parseCost(b.cost), 0);

  const rooms = trip.prebookingData?.rooms || [];
  total += rooms.reduce((s, r) => s + parseCost(r.cost), 0);

  const activities = (trip.prebookingData?.activities || []).filter(a => a.excludeFromBudget !== true);
  total += activities.reduce((s, a) => s + parseCost(a.cost), 0);

  // Daily timeline and additional budget
  const days = trip.days || [];
  days.forEach(day => {
    const activePlanTitle = day.active_plan || "Main Plan";
    const activePlan = (day.plans || []).find(p => p.title === activePlanTitle) || day.plans?.[0];
    if (activePlan) {
      const timelineItems = (activePlan.timeline || [])
        .filter(e => e.cost !== undefined && e.cost !== null && e.cost !== '' && e.cost > 0)
        // Custom (unplanned) items are excluded from the PLANNED budget —
        // they only count toward actual spend (decision #6).
        .filter(e => e.custom !== true);
      total += timelineItems.reduce((s, i) => s + parseCost(i.cost), 0);

      const additionalItems = activePlan.additionalBudget || [];
      total += additionalItems.reduce((s, i) => s + parseCost(i.cost), 0);
    }
  });

  return total;
};

// ---------------------------------------------------------------------------
// G5 migration — checklist ticks and prebooking booking statuses used to live
// ONLY in localStorage under `${title}_${startDate}_${endDate}_...` keys: never
// backed up, colliding for trips sharing title+dates, orphaned on edits. State
// now lives on the trip object (day.checklist items + prebooking item.status);
// these helpers harvest any legacy localStorage state into saved trips.
// ---------------------------------------------------------------------------

const PREBOOK_SINGULAR = { flights: 'flight', trains: 'train', bus: 'bus', rooms: 'room', activities: 'activity' };

const resolveStorage = (storage) => {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return undefined;
};

const legacyUiKeyBase = (trip) => {
  const end = calculateEndDate(trip.startDate, Array.isArray(trip.days) ? trip.days.length : 0);
  return `${trip.title || ''}_${trip.startDate || ''}_${end}`.replace(/\s+/g, "_");
};

// Upgrades a trip in place-ish (returns the SAME object when there is nothing
// to harvest, a new one otherwise): checklist strings 'true' become checked
// entries, prebooking items still Pending pick up their saved status.
export const migrateLegacyUiState = (trip, storage) => {
  const ls = resolveStorage(storage);
  if (!trip || !ls) return trip;
  const base = legacyUiKeyBase(trip);
  let changed = false;

  const days = (trip.days || []).map((day, dayIndex) => ({
    ...day,
    checklist: (day.checklist || []).map((entry, idx) => {
      const ticked = ls.getItem(`${base}_day_${dayIndex}_checklist_${idx}`) === 'true';
      if (typeof entry !== 'object' || entry === null) {
        // Legacy plain-string row (pre-G5 save): materialize it only if ticked.
        if (!ticked) return entry;
        changed = true;
        return { id: genItemId(), text: String(entry ?? ''), checked: true };
      }
      if (entry.checked === true) return entry;
      if (ticked) {
        changed = true;
        return { ...entry, checked: true };
      }
      return entry;
    }),
  }));

  let prebookingData = trip.prebookingData;
  if (prebookingData) {
    prebookingData = Object.fromEntries(
      Object.keys(PREBOOK_SINGULAR).map((section) => [
        section,
        (prebookingData[section] || []).map((item) => {
          if (item.status && item.status !== 'Pending') return item;
          const saved = ls.getItem(`${base}_prebook_${PREBOOK_SINGULAR[section]}_${item.id}`);
          if (saved) {
            changed = true;
            return { ...item, status: saved };
          }
          return item;
        }),
      ])
    );
  }

  return changed ? { ...trip, days, prebookingData } : trip;
};

// Removes the legacy localStorage keys for a trip AFTER its migrated state has
// been persisted — otherwise an un-check would be resurrected on next load.
export const cleanupLegacyUiState = (trip, storage) => {
  const ls = resolveStorage(storage);
  if (!trip || !ls) return;
  const base = legacyUiKeyBase(trip);
  const doomed = [];
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (key && (key.startsWith(`${base}_day_`) || key.startsWith(`${base}_prebook_`))) doomed.push(key);
  }
  doomed.forEach((key) => ls.removeItem(key));
};

export const validateData = (data) => {
  if (!data) return "Data is empty";
  if (!data.title) return "Missing 'title'";
  if (!data.startDate) return "Missing 'startDate'";
  if (!Array.isArray(data.days)) return "'days' must be an array";
  return null;
};

export const normalizeData = (data) => {
  if (!data) return null;
  const startDate = data.startDate || "";
  const currency = data.currency || "INR";
  const id = data.id || genItemId();

  return {
    ...data,
    id: id,
    review: normalizeReview(data.review),
    title: data.title || "Untitled Itinerary",
    startDate: startDate,
    currency: currency,
    days: (data.days || []).map((day, index) => {
      let plans = [];
      if (Array.isArray(day.plans) && day.plans.length > 0) {
        plans = day.plans.map((p) => ({
          title: p.title || "Main Plan",
          timeline: (p.timeline || []).map((item) => ({
            itemId: item.itemId || genItemId(),
            time: item.time || "10:00 AM",
            title: item.title || "",
            description: item.description || "",
            duration: item.duration || "",
            location: item.location || "",
            mapsLink: item.mapsLink || "",
            cost: parseCost(item.cost),
            custom: item.custom === true,
          })),
          additionalBudget: (p.additionalBudget || []).map((item) => ({
            itemId: item.itemId || genItemId(),
            title: item.title || item.item || "",
            cost: parseCost(item.cost),
          })),
        }));
      } else {
        // Fallback / legacy format
        plans = [
          {
            title: "Main Plan",
            timeline: (day.timeline || []).map((item) => ({
              itemId: item.itemId || genItemId(),
              time: item.time || "10:00 AM",
              title: item.title || "",
              description: item.description || "",
              duration: item.duration || "",
              location: item.location || "",
              mapsLink: item.mapsLink || "",
              cost: parseCost(item.cost),
              custom: item.custom === true,
            })),
            additionalBudget: (day.additionalBudget || []).map((item) => ({
              itemId: item.itemId || genItemId(),
              title: item.title || item.item || "",
              cost: parseCost(item.cost),
            })),
          },
        ];
      }

      let activePlan = day.active_plan;
      if (!activePlan || !plans.some((p) => p.title === activePlan)) {
        activePlan = plans[0]?.title || "Main Plan";
      }

      return {
        day: day.day ? day.day : index + 1,
        title: day.title || "",
        summary: day.summary || "",
        // G5: checklist entries are objects { id, text, checked } so tick state
        // lives on the trip (backed up, stable under reordering). Legacy string
        // entries are upgraded non-destructively.
        checklist: (Array.isArray(day.checklist) ? day.checklist : []).map((entry) =>
          typeof entry === "object" && entry !== null
            ? {
                id: typeof entry.id === "string" && entry.id ? entry.id : genItemId(),
                text: typeof entry.text === "string" ? entry.text : "",
                checked: entry.checked === true,
              }
            : { id: genItemId(), text: String(entry ?? ""), checked: false }
        ),
        active_plan: activePlan,
        plans: plans,
      };
    }),
    prebookingData: {
      flights: Array.isArray(data.prebookingData?.flights)
        ?          data.prebookingData.flights.map((f, i) => ({
            id: i + 1,
            itemId: f.itemId || genItemId(),
            date: f.date || startDate,
            from: f.from || "",
            to: f.to || "",
            departure: f.departure || "",
            arrival: f.arrival || "",
            airline: f.airline || "",
            durationMinutes:
              typeof f.durationMinutes === "number" ? f.durationMinutes : 0,
            status: f.status || "Pending",
            cost: parseCost(f.cost),
            terminal: {
              departure: f.terminal?.departure || "",
              arrival: f.terminal?.arrival || "",
            },
            links: Array.isArray(f.links) ? f.links : [],
          }))
        : [],
      trains: Array.isArray(data.prebookingData?.trains)
        ?          data.prebookingData.trains.map((t, i) => ({
            id: i + 1,
            itemId: t.itemId || genItemId(),
            date: t.date || startDate,
            name: t.name || "",
            from: t.from || "",
            to: t.to || "",
            departure: t.departure || "",
            arrival: t.arrival || "",
            durationMinutes:
              typeof t.durationMinutes === "number" ? t.durationMinutes : 0,
            status: t.status || "Pending",
            cost: parseCost(t.cost),
            links: Array.isArray(t.links) ? t.links : [],
          }))
        : [],
      bus: Array.isArray(data.prebookingData?.bus)
        ?          data.prebookingData.bus.map((b, i) => ({
            id: i + 1,
            itemId: b.itemId || genItemId(),
            date: b.date || startDate,
            from: b.from || "",
            to: b.to || "",
            departure: b.departure || "",
            arrival: b.arrival || "",
            provider: b.provider || "",
            durationMinutes:
              typeof b.durationMinutes === "number" ? b.durationMinutes : 0,
            status: b.status || "Pending",
            cost: parseCost(b.cost),
            points: {
              pickup: b.points?.pickup || "",
              drop: b.points?.drop || "",
            },
            links: Array.isArray(b.links) ? b.links : [],
          }))
        : [],
      rooms: Array.isArray(data.prebookingData?.rooms)
        ?          data.prebookingData.rooms.map((r, i) => ({
            id: i + 1,
            itemId: r.itemId || genItemId(),
            name: r.name || "",
            checkin: r.checkin || "",
            checkout: r.checkout || "",
            cost: parseCost(r.cost),
            status: r.status || "Pending",
            location: r.location || "",
            mapsLink: r.mapsLink || "",
            links: Array.isArray(r.links) ? r.links : [],
          }))
        : [],
      activities: Array.isArray(data.prebookingData?.activities)
        ?          data.prebookingData.activities.map((a, i) => ({
            id: i + 1,
            itemId: a.itemId || genItemId(),
            name: a.name || "",
            status: a.status || "Pending",
            cost: parseCost(a.cost),
            notes: a.notes || "",
            links: Array.isArray(a.links) ? a.links : [],
            excludeFromBudget:
              typeof a.excludeFromBudget === "boolean"
                ? a.excludeFromBudget
                : false,
          }))
        : [],
    },
  };
};

export const sampleItinerary = [
  {
    name: "Ooty Trip (3 Days)",
    data: ootySample,
  },
];

export const parseTimeString = (timeStr, baseDate) => {
  if (!timeStr) return null;
  const cleanStr = timeStr.trim();
  const match = cleanStr.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?$/i);
  if (!match) return null;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (ampm) {
    const ampmUpper = ampm.toUpperCase();
    if (ampmUpper === 'PM' && hours < 12) hours += 12;
    if (ampmUpper === 'AM' && hours === 12) hours = 0;
  }
  
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

export const parseDuration = (durationStr) => {
  if (!durationStr) return 0;
  let totalMinutes = 0;
  
  const hrMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour|h\b)/i);
  if (hrMatch) {
    totalMinutes += parseFloat(hrMatch[1]) * 60;
  }
  
  const minMatch = durationStr.match(/(\d+)\s*(?:min|m\b)/i);
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }
  
  if (!hrMatch && !minMatch) {
    const num = parseFloat(durationStr);
    if (!isNaN(num)) {
      totalMinutes = num;
    }
  }
  
  return totalMinutes;
};
