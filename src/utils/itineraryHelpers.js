import ootySample from "../samples/ooty_trip.json";

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
  
  const parseCost = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    const numStr = String(val).replace(/[^\d.]/g, '');
    return parseFloat(numStr) || 0;
  };

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
        .filter(e => e.cost !== undefined && e.cost !== null && e.cost !== '' && e.cost > 0);
      total += timelineItems.reduce((s, i) => s + parseCost(i.cost), 0);

      const additionalItems = activePlan.additionalBudget || [];
      total += additionalItems.reduce((s, i) => s + parseCost(i.cost), 0);
    }
  });

  return total;
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
  const id = data.id || (window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2));

  return {
    ...data,
    id: id,
    title: data.title || "Untitled Itinerary",
    startDate: startDate,
    currency: currency,
    days: (data.days || []).map((day, index) => {
      let plans = [];
      if (Array.isArray(day.plans) && day.plans.length > 0) {
        plans = day.plans.map((p) => ({
          title: p.title || "Main Plan",
          timeline: (p.timeline || []).map((item) => ({
            time: item.time || "10:00 AM",
            title: item.title || "",
            description: item.description || "",
            duration: item.duration || "",
            location: item.location || "",
            mapsLink: item.mapsLink || "",
            cost: typeof item.cost === "number" ? item.cost : 0,
          })),
          additionalBudget: (p.additionalBudget || []).map((item) => ({
            title: item.title || "",
            cost: typeof item.cost === "number" ? item.cost : 0,
          })),
        }));
      } else {
        // Fallback / legacy format
        plans = [
          {
            title: "Main Plan",
            timeline: (day.timeline || []).map((item) => ({
              time: item.time || "10:00 AM",
              title: item.title || "",
              description: item.description || "",
              duration: item.duration || "",
              location: item.location || "",
              mapsLink: item.mapsLink || "",
              cost: typeof item.cost === "number" ? item.cost : 0,
            })),
            additionalBudget: (day.additionalBudget || []).map((item) => ({
              title: item.title || "",
              cost: typeof item.cost === "number" ? item.cost : 0,
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
        checklist: Array.isArray(day.checklist) ? day.checklist : [],
        active_plan: activePlan,
        plans: plans,
      };
    }),
    prebookingData: {
      flights: Array.isArray(data.prebookingData?.flights)
        ? data.prebookingData.flights.map((f, i) => ({
            id: i + 1,
            date: f.date || startDate,
            from: f.from || "",
            to: f.to || "",
            departure: f.departure || "",
            arrival: f.arrival || "",
            airline: f.airline || "",
            durationMinutes:
              typeof f.durationMinutes === "number" ? f.durationMinutes : 0,
            status: f.status || "Pending",
            cost: typeof f.cost === "number" ? f.cost : 0,
            terminal: {
              departure: f.terminal?.departure || "",
              arrival: f.terminal?.arrival || "",
            },
            links: Array.isArray(f.links) ? f.links : [],
          }))
        : [],
      trains: Array.isArray(data.prebookingData?.trains)
        ? data.prebookingData.trains.map((t, i) => ({
            id: i + 1,
            date: t.date || startDate,
            name: t.name || "",
            from: t.from || "",
            to: t.to || "",
            departure: t.departure || "",
            arrival: t.arrival || "",
            durationMinutes:
              typeof t.durationMinutes === "number" ? t.durationMinutes : 0,
            status: t.status || "Pending",
            cost: typeof t.cost === "number" ? t.cost : 0,
            links: Array.isArray(t.links) ? t.links : [],
          }))
        : [],
      bus: Array.isArray(data.prebookingData?.bus)
        ? data.prebookingData.bus.map((b, i) => ({
            id: i + 1,
            date: b.date || startDate,
            from: b.from || "",
            to: b.to || "",
            departure: b.departure || "",
            arrival: b.arrival || "",
            provider: b.provider || "",
            durationMinutes:
              typeof b.durationMinutes === "number" ? b.durationMinutes : 0,
            status: b.status || "Pending",
            cost: typeof b.cost === "number" ? b.cost : 0,
            points: {
              pickup: b.points?.pickup || "",
              drop: b.points?.drop || "",
            },
            links: Array.isArray(b.links) ? b.links : [],
          }))
        : [],
      rooms: Array.isArray(data.prebookingData?.rooms)
        ? data.prebookingData.rooms.map((r, i) => ({
            id: i + 1,
            name: r.name || "",
            checkin: r.checkin || "",
            checkout: r.checkout || "",
            cost: typeof r.cost === "number" ? r.cost : 0,
            status: r.status || "Pending",
            location: r.location || "",
            mapsLink: r.mapsLink || "",
            links: Array.isArray(r.links) ? r.links : [],
          }))
        : [],
      activities: Array.isArray(data.prebookingData?.activities)
        ? data.prebookingData.activities.map((a, i) => ({
            id: i + 1,
            name: a.name || "",
            status: a.status || "Pending",
            cost: typeof a.cost === "number" ? a.cost : 0,
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
