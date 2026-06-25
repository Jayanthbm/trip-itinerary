# Trip Itinerary Viewer
A fully responsive, powerful React application built with Vite for viewing, managing, and navigating highly detailed JSON-based trip itineraries.

## Overview
Trip Itinerary Viewer serves as an elegant, robust UI shell that can ingest arbitrary JSON itinerary payloads directly from the web, file system uploads, or bundled samples. It converts complex logistical data (pre-booking reservations, day-to-day timelines, budget checklists) into beautiful, compartmentalized UI views.

---

## 🚀 Features

### **Dynamic Data Loading**
- **Query Parameter Linking:** Launch exactly where you want by injecting a `?it=URL` property directly into the web address bar. The app will immediately intercept this, download the JSON, and map the UI.
- **URL Importer:** A simple input box to natively fetch external JSON endpoints on the fly.
- **Offline File Uploads:** Direct `<input type="file" />` integration allowing you to load `*.json` documents locally without network requests.
- **JSON Exporter:** Hit "Download" at any time to dump the currently active itinerary scope back into a formatted `*.json` file on disk.

### **Multi-Trip Management & Intelligent Caching**
The application implements a robust local database layer using IndexedDB and `localStorage` to manage multiple itineraries:
- **Offline Multi-Trip Storage:** Itineraries are stored inside browser-native IndexedDB. Users can save, switch, and delete multiple trips directly from a visual "Recent Trips" dashboard.
- **Offline Reliability:** The active trip state is preserved across reloads using the `active_trip_id` reference in `localStorage`.
- **Network Caching:** Implements URL-based request debouncing! If a matching URL request is made within exactly 15 minutes of an existing IndexedDB cache hit, the trip data is loaded instantly from the database, bypassing redundant network overhead.

### **UI Components**
- **Detailed Layout Engine:** Renders comprehensive daily `timelines`, `checklists`, and dedicated daily `budgets`.
- **Prebooking View:** Summarized insights into overarching pre-purchased tickets including accommodations (hotels/resorts), domestic/international flights, and independent priority activities.
- **Global Budget Engine:** Automatically consolidates and charts cost arrays.
- **Global Actions:** A sleek context-aware floating scroll-to-top button activates automatically on deeper content.

---

## 📦 Usage

To launch the project locally:

1. Guarantee standard dependencies are initialized:
```bash
npm install
```
2. Spawn the local Vite dev deployment:
```bash
npm run dev
```

## 📄 JSON Schema Documentation

The application relies on a specific JSON structure to render itineraries correctly. Below is the detailed breakdown of the required schema.

### Root Element
| Key | Type | Description |
| :--- | :--- | :--- |
| `title` | String | The main title of your trip (e.g., "Vietnam Adventure 2026") |
| `startDate` | String | Trip start date in "D Month YYYY" format (e.g., "3 July 2026") |
| `currency` | String | Currency code (e.g., "INR", "USD", "VND") |
| `days` | Array | List of daily itinerary objects (see Day Object) |
| `prebookingData` | Object | Global reservations (see Pre-booking Section) |

### Day Object (`days[]`)
| Key | Type | Description |
| :--- | :--- | :--- |
| `day` | String | Label for the day (e.g., "Day 1", "Start", "Travel Day") |
| `title` | String | Subtitle describing the day's focus |
| `summary` | String | Brief narrative of the day's plan |
| `checklist` | Array | Simple strings for daily tasks/reminders |
| `active_plan` | String | The title of the currently active default plan (e.g., "Main Plan") |
| `plans` | Array | Array of plan options (see Plan Object) |

### Plan Object (`plans[]`)
| Key | Type | Description |
| :--- | :--- | :--- |
| `title` | String | Title of this plan option (e.g. "Main Plan", "Backup Plan") |
| `timeline` | Array | Timeline items for this plan (see Timeline Item) |
| `additionalBudget` | Array | Extra costs not captured in the timeline (see Budget Item) |

#### Timeline Item
`{ "time": "9:00 AM", "title": "Breakfast", "description": "Local food", "duration": "1h", "cost": 500, "location": "Cafe", "mapsLink": "URL" }`

#### Budget Item
`{ "title": "Tips", "cost": 500 }`

### Pre-booking Section (`prebookingData`)
Contains specialized arrays for major reservations. All items require an `id` (Number) and `status` ("Pending" or "Booked").

- **`flights`**: `date` (YYYY-MM-DD), `from`/`to` (Codes), `departure`/`arrival`, `airline`, `durationMinutes` (Number), `cost` (Number), `terminal: { departure, arrival }`,`status` (Pending), `links[]`.
- **`trains`**: `date`, `from`/`to`, `name`, `departure`/`arrival`, `durationMinutes` (Number), `cost`, `links[]`.
- **`bus`**: `date`, `from`/`to`, `departure`/`arrival`, `provider`, `durationMinutes` (Number), `cost`, `points: { pickup, drop }`,`status` (Pending), `links[]`.
- **`rooms`**: `name`, `checkin`/`checkout` (YYYY-MM-DD HH:mm), `cost`, `location`, `mapsLink`,`status` (Pending), `links[]`.
- **`activities`**: `name`, `cost`, `notes`, `links[]`, `status` (Pending),`excludeFromBudget` (Boolean).

---

## 🤖 AI Prompt

Use the following prompt to generate a compatible JSON file using an LLM (Claude, GPT-4, etc.):

> **System Prompt**: Act as a professional travel itinerary architect. Output **ONLY** raw JSON.
>
> **Task**: Create a [NUMBER] day itinerary for [LOCATION] starting on [DATE]. Use [CURRENCY] as the currency.
>
> **Schema Rules**:
> 1. **Root**: `title`, `startDate` (e.g. "3 July 2026"), `currency` (3-letter code), `days` (Array), `prebookingData` (Object).
> 2. **Days**: Each day needs `day`, `title`, `summary`, `checklist` (Array), `active_plan` (String), and `plans` (Array).
>    - Each item in `plans` must have `title` (e.g., "Main Plan" or "Backup Plan"), `timeline` (Array of Timeline Items), and `additionalBudget` (Array of Budget Items).
> 3. **Timeline**: Each item must have `time`, `title`, `description`, `duration` (e.g. "2h 30m"), `cost` (Number), `location`, and `mapsLink`.
> 4. **Pre-booking**: Must include arrays for `flights`, `trains`, `bus`, `rooms`, and `activities`.
>    - Routes (Flights/Trains/Bus) MUST include `durationMinutes` as a Number.
>    - Rooms MUST include `checkin` and `checkout` in `YYYY-MM-DD HH:mm` format.
>    - Activities SHOULD include `excludeFromBudget`: false.
> 5. **Numbers**: All `cost` fields MUST be raw Numbers (e.g., 500), NOT strings (e.g., "500" or "₹500").
