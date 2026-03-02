# Render Backend – Environment Variables Checklist

Screenshot mein values **hidden** dikhti hain (eye icon). Har variable pe click karke **value sahi daala hai** confirm karo.

---

## Zaroori (in dono ke bina CORS / config galat ho sakta hai)

| Variable | Value (exactly aise) | Notes |
|----------|----------------------|--------|
| **FRONTEND_URL** | `https://sky2c.vercel.app` | Trailing slash **mat** lagana. Sirf ye hi URL, comma wagaira nahi. |
| **NODE_ENV** | `production` | |

---

## Zoho (agar Zoho CRM use karte ho)

| Variable | Value |
|----------|--------|
| **ZOHO_INTEGRATION_ENABLED** | `true` |
| **ZOHO_ACCOUNTS_DOMAIN** | `zoho.in` |
| **ZOHO_CLIENT_ID** | (Zoho API Console se – full value paste karo) |
| **ZOHO_CLIENT_SECRET** | (Zoho API Console se) |
| **ZOHO_REFRESH_TOKEN** | (OAuth se mila token – ek line, copy-paste) |
| **ZOHO_REDIRECT_URI** | `https://sky2c.vercel.app/oauth/callback` (production ke liye) |
| **ZOHO_CRM_MODULE** | `Shipments` (ya jo module use karte ho) |

Agar Zoho **nahi** use karte to **ZOHO_INTEGRATION_ENABLED** = `false` rakhna; baaki ZOHO_* optional.

---

## Common galtiyan

- **FRONTEND_URL** empty ya `http://localhost:5173` → production CORS fail / galat origin.
- **FRONTEND_URL** mein trailing slash → `https://sky2c.vercel.app/` mat use karo, sirf `https://sky2c.vercel.app`.
- **ZOHO_REFRESH_TOKEN** empty par **ZOHO_INTEGRATION_ENABLED** = `true` → Zoho APIs error denge (500), lekin connection reset ka sabab usually ye nahi hota.

---

## ERR_CONNECTION_RESET – env se direct link?

Connection reset zyadatar **Render free tier sleep** ki wajah se hota hai (15 min idle = service band).  
Env galat hone se **CORS error** ya **500 JSON** aata hai, **connection reset** kam hota hai.

**Kya karna hai:**  
1. UptimeRobot se `https://sky2c.onrender.com/api/health` har **5 min** ping karo (see RENDER_KEEP_ALIVE.md).  
2. Render **Logs** dekho: koi crash/error to nahi.  
3. Browser mein direct kholo: `https://sky2c.onrender.com/api/health` — agar yahan bhi connection reset aaye to service so rahi hai ya crash ho rahi hai; agar yahan 200 OK aaye to problem frontend/network side ho sakti hai.
