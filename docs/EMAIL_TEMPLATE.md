# Email template (backend)

Status update emails are sent by `backend/src/services/email.js` using Nodemailer.

## When emails are sent

- Picked Up  
- Dispatched  
- In Transit  
- Delivered  

(Configured in `backend/src/constants/status.js` → `EMAIL_TRIGGER_STATUSES`.)

## Content included

- **Subject:** `Shipment {shipmentNumber} – {currentStatus}`
- **Body:** Shipment Number, Current Status, Current Location, Assigned To, and a **Track Shipment** button linking to `{FRONTEND_URL}/track/{shipmentNumber}`

## Env vars

- `EMAIL_HOST`, `EMAIL_PORT` (e.g. smtp.gmail.com, 587)
- `EMAIL_USER`, `EMAIL_PASS` (e.g. Gmail + App Password)
- `EMAIL_FROM` (optional)
- `FRONTEND_URL` (base URL for tracking links)

The full HTML template is in `email.js` (table layout, inline styles, escaped user content).
