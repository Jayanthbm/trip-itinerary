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

### **Intelligent Caching**
The application implements an extensive state caching model utilizing standard HTML5 `localStorage`:
- **Offline Reliability:** Your active payload is securely retained in browser memory (`it_loaded`), allowing you to close the application safely and return to the identical state without prompt.
- **Network Caching:** Implements URL-based request debouncing! The application monitors the `it_url` property and records your `last_fetch` timestamp. It acts as an intercept proxy: if a matching URL request is made within exactly 15 minutes of an existing cache hit, the trip data is effortlessly loaded from native memory—bypassing redundant internet overhead.

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

### JSON Schema
If you are generating custom JSON models or connecting RESTful APIs to the system, the underlying generic data boundary validates strictly to ensuring it provides:
- A `title` property (String)
- A `startDate` & `endDate` property (String)
- A nested `days` array (Objects mapping your timeline, checklists, and day-to-day budgets)

Optional attributes expand functionality vastly (refer to the offline `src/samples/` elements directly out-of-the-box for architecture inspirations):
- `prebookingData` (containing arrays for `flights`, `rooms`, `activities`)
