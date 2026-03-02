# Production Environment Variables

Backend = **Render**, Frontend = **Vercel**. Dono ke liye env variables yahan list hain.

---

## 1. Vercel (Frontend) – Environment Variables

**Vercel Dashboard** → apna project → **Settings** → **Environment Variables**

| Variable | Value | Zaroori? |
|----------|--------|----------|
| `VITE_API_URL` | `https://<tumhara-backend>.onrender.com/api` | **Haan** – backend ka full URL + `/api` (trailing slash mat lagana) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (map ke liye) | Optional – map nahi chahiye to chhod do |

**Example:** Agar backend URL hai `https://logistics-backend-abc123.onrender.com`  
→ `VITE_API_URL` = `https://logistics-backend-abc123.onrender.com/api`

**Save ke baad:** Deployments → **Redeploy** (taaki naye env build mein aa jayein).

---

## 2. Render (Backend) – Environment Variables

**Render Dashboard** → apna Web Service → **Environment** (left side) → **Add Environment Variable**

### Zaroori (kam se kam ye daalo)

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://tumhara-app.vercel.app` (Vercel frontend URL – slash ke bina) |
| `NODE_ENV` | `production` |

### Optional – Google Sheets (agar data Google Sheet mein save karna ho)

| Variable | Value |
|----------|--------|
| `GOOGLE_SHEET_ID` | Spreadsheet ID (URL se: `docs.google.com/spreadsheets/d/<ID>/edit`) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Private key (PEM – newlines as `\n`) |
| `SHEET_SHIPMENTS` | `Shipments` (default) |
| `SHEET_STATUS_HISTORY` | `Shipment Status History` (default) |

*Inke bina backend **in-memory** storage use karega – restart par data reset ho jayega.*

### Optional – Email (shipment alerts / tracking link email)

| Variable | Value |
|----------|--------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | Gmail address |
| `EMAIL_PASS` | Gmail App Password (2FA on ho to banao) |
| `EMAIL_FROM` | `"Logistics <your@gmail.com>"` |

### Optional – Zoho CRM (Leads/Deals + shipment sync)

| Variable | Value |
|----------|--------|
| `ZOHO_INTEGRATION_ENABLED` | `true` |
| `ZOHO_ACCOUNTS_DOMAIN` | `zoho.in` (India) ya `zoho.com` (US) |
| `ZOHO_CLIENT_ID` | Zoho API Console se |
| `ZOHO_CLIENT_SECRET` | Zoho API Console se |
| `ZOHO_REFRESH_TOKEN` | OAuth se mila hua token |
| `ZOHO_REDIRECT_URI` | `https://tumhara-app.vercel.app/oauth/callback` (production frontend + path) |
| `ZOHO_CRM_MODULE` | `Shipments` (ya jo module use karte ho) |

---

## Short checklist

**Vercel (frontend):**
- [ ] `VITE_API_URL` = backend URL + `/api`
- [ ] (Optional) `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Save → Redeploy

**Render (backend):**
- [ ] `FRONTEND_URL` = Vercel app URL
- [ ] `NODE_ENV` = `production`
- [ ] (Optional) Google Sheets vars
- [ ] (Optional) Email vars
- [ ] (Optional) Zoho vars (production ke liye `ZOHO_REDIRECT_URI` = Vercel URL + `/oauth/callback`)

Save ke baad Render par naya deploy automatically nahi hota – **Manual Deploy** ya koi commit push karo.
