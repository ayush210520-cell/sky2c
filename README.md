# Shipment Tracking System

Full-stack shipment tracking with **React (Vite)**, **Node.js/Express**, optional **Google Sheets** or **in-memory** storage, **Leaflet/OpenStreetMap** map (no API key), and optional **Nodemailer** for emails.

---

## Run without any API keys

- **Backend:** Do not set `GOOGLE_SHEET_ID` in `.env`. The app uses **in-memory storage** (data resets on restart).
- **Frontend:** Map uses **Leaflet + OpenStreetMap** – no key needed. You can leave `VITE_GOOGLE_MAPS_API_KEY` unset.
- **Email:** Leave `EMAIL_USER` / `EMAIL_PASS` unset if you don’t need emails.

Just run backend and frontend; no Google Cloud or API keys required.

---

## Folder structure

### Backend

```
backend/
├── .env                    # Copy from .env.example
├── .env.example
├── package.json
└── src/
    ├── server.js           # Express app entry
    ├── constants/
    │   └── status.js       # Status flow, email trigger statuses
    ├── db/
    │   └── sheets.js       # Google Sheets read/write/update
    ├── repositories/
    │   ├── shipments.js    # Shipment CRUD vs Sheet
    │   └── statusHistory.js
    ├── services/
    │   ├── email.js        # Nodemailer status emails
    │   └── shipmentService.js  # Create, assign, status, location
    ├── routes/
    │   └── shipments.js    # REST APIs
    └── jobs/
        └── cron.js         # Optional location simulation
```

### Frontend

```
frontend/
├── .env                    # Copy from .env.example
├── .env.example
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx            # Router + routes
    ├── App.jsx
    ├── index.css
    ├── api/
    │   └── client.js       # API helpers + shipments
    ├── hooks/
    │   └── usePoll.js      # Polling for live updates
    ├── utils/
    │   └── googleMaps.js   # Load Google Maps script
    ├── components/
    │   ├── ShipmentMap.jsx # Google Map + markers + popups
    │   ├── ShipmentCard.jsx
    │   └── StatusBadge.jsx
    └── pages/
        ├── HomePage.jsx
        ├── TrackPage.jsx   # Customer tracking (read-only)
        └── AdminPage.jsx   # Create, assign, status, location + map
```

---

## Google Sheet schema

Create a Google Sheet with two sheets (tabs). Exact header names matter.

### Sheet 1: `Shipments`

| Column            | Description                          |
|-------------------|--------------------------------------|
| ShipmentNumber    | Unique ID (e.g. SHP-ABC-123)         |
| AssignedTo        | Transporter / Shipping Line / Airline|
| CustomerEmail     | Customer email for notifications     |
| CurrentStatus     | One of: Created, Picked Up, …        |
| CurrentLocationName | Location name                        |
| Latitude          | Number                               |
| Longitude         | Number                               |
| TransportMode     | Truck / Ocean / Air                  |
| LastUpdatedTime   | ISO timestamp                        |
| CreatedAt         | ISO timestamp                        |

**Header row:** Row 1 must be exactly:
`ShipmentNumber`, `AssignedTo`, `CustomerEmail`, `CurrentStatus`, `CurrentLocationName`, `Latitude`, `Longitude`, `TransportMode`, `LastUpdatedTime`, `CreatedAt`

### Sheet 2: `Shipment Status History`

| Column        | Description        |
|---------------|--------------------|
| ShipmentNumber| Same as Shipments  |
| Status        | Status at event    |
| LocationName  | Optional           |
| Latitude      | Optional           |
| Longitude     | Optional           |
| RecordedAt    | ISO timestamp      |

**Header row:**  
`ShipmentNumber`, `Status`, `LocationName`, `Latitude`, `Longitude`, `RecordedAt`

**Google Sheets API setup:**  
Create a Google Cloud project → enable **Google Sheets API** → create a **Service Account** → download JSON key. Put the sheet ID (from the sheet URL) in `GOOGLE_SHEET_ID`, and the service account email + private key in `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`. Share the Google Sheet with the service account email (Editor).

---

## Status flow (automated)

Order enforced by backend:

1. Created  
2. Picked Up  
3. Dispatched  
4. In Transit  
5. Out for Delivery  
6. Delivered  

On each status change the backend:

- Saves a row in **Shipment Status History**
- Sends an **email** to the customer when status is: Picked Up, Dispatched, In Transit, Delivered
- Updates **Last Updated Time** (and optional location)

---

## Backend APIs (sample usage)

| Method | Path | Description |
|--------|------|-------------|
| POST   | `/api/shipments` | Create shipment (body: customerEmail, assignedTo, transportMode, currentLocationName, latitude, longitude) |
| GET    | `/api/shipments` | List all (query `?active=true` for non-Delivered) |
| GET    | `/api/shipments/:shipmentNumber` | Get one (for tracking page) |
| GET    | `/api/shipments/:shipmentNumber/history` | Status history |
| PATCH  | `/api/shipments/:shipmentNumber/assign` | Assign (body: `{ "assignedTo": "DHL" }`) |
| PATCH  | `/api/shipments/:shipmentNumber/status` | Update status (body: `{ "status": "In Transit", "locationName", "latitude", "longitude" }`) |
| PATCH  | `/api/shipments/:shipmentNumber/location` | Update location only (body: `{ "locationName", "latitude", "longitude" }`) |

---

## Email template (example)

Backend uses **Nodemailer** with an HTML template. Content includes:

- Shipment Number  
- Current Status  
- Current Location  
- Assigned To  
- **Tracking link** (e.g. `FRONTEND_URL/track/SHP-xxx`)  

See `backend/src/services/email.js` for the full HTML and plain-text template.

---

## How to run locally

### 1. Google Sheet and credentials

1. Create a Google Sheet with tabs **Shipments** and **Shipment Status History** and the headers above.
2. Google Cloud Console: create project → enable **Google Sheets API** → create **Service Account** → download JSON.
3. Copy from the JSON: `client_email` and `private_key`. Put sheet ID from the sheet URL into `.env` as `GOOGLE_SHEET_ID`.
4. Share the sheet with the service account email (Editor).

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY
# Optional: EMAIL_* for Nodemailer, FRONTEND_URL for links in emails

npm install
npm run dev
```

Server runs at `http://localhost:5000`. To disable the demo cron job, set `DISABLE_CRON=true` in `.env`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
# Set VITE_GOOGLE_MAPS_API_KEY=your_key (enable Maps JavaScript API in Google Cloud)

npm install
npm run dev
```

App runs at `http://localhost:5173`.

### 4. Test flow

1. Open **Admin** → create a shipment (customer email, assigned to, etc.).
2. Use **Assign**, **Update Status**, **Update Location** as needed.
3. Open **Track Shipment** and enter the shipment number to see map and history.
4. Ensure backend `.env` has valid `EMAIL_*` to send status emails (e.g. Gmail App Password).

---

## Assignment visibility

- **Map popup:** Shipment number, Assigned To, Status, Current Location, Last Updated.
- **Tracking page:** Same in the shipment card and in the status history.
- **Emails:** Assigned To and tracking link are included in every status update email.

---

## Live / near-real-time updates

- **Backend:** Manual updates via PATCH APIs; optional cron in `src/jobs/cron.js` (e.g. simulate location).
- **Frontend:** `usePoll` in Track and Admin pages refreshes data every **2 minutes** (configurable in each page).

You can change the poll interval in the page (e.g. `POLL_MS = 60 * 1000` for 1 minute).
