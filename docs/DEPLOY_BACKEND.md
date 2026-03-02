# Backend deploy (Render.com)

Backend ko **Render.com** par deploy karo (free tier). Uske baad Vercel wale frontend ko backend URL se connect karna hoga.

---

## Step 1: Render par backend deploy

1. **https://dashboard.render.com** par jao → Login/Signup (GitHub se sign in kar sakte ho).
2. **New +** → **Web Service**.
3. **Connect a repository** → GitHub → **ayush210520-cell/sky2c** (ya jahan repo hai) select karo → **Connect**.
4. **Ye settings zaroor set karo** (nahi to "start not found" / yarn error aayega):
   - **Name:** logistics-backend (ya kuch bhi)
   - **Root Directory:** `backend` ← **ye zaroor.** (Repo root par "start" script nahi hai, backend folder mein hai.)
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Agar pehle se Web Service bana diya hai to: **Dashboard** → apna service → **Settings** → **Build & Deploy** → **Root Directory** = `backend` daalo, **Build Command** = `npm install`, **Start Command** = `npm start` → **Save**. Phir **Manual Deploy** → **Clear build cache & deploy**.
6. **Environment** section mein ye variables add karo (key-value):

   | Key | Value |
   |-----|--------|
   | `FRONTEND_URL` | `https://tumhara-vercel-app.vercel.app` (apna Vercel frontend URL – slash ke bina) |
   | `NODE_ENV` | `production` |

   Zoho use karte ho to ye bhi add karo (values apni):

   | Key | Value |
   |-----|--------|
   | `ZOHO_INTEGRATION_ENABLED` | `true` |
   | `ZOHO_ACCOUNTS_DOMAIN` | `zoho.in` |
   | `ZOHO_CLIENT_ID` | ... |
   | `ZOHO_CLIENT_SECRET` | ... |
   | `ZOHO_REFRESH_TOKEN` | ... |
   | `ZOHO_REDIRECT_URI` | `https://tumhara-vercel-app.vercel.app/oauth/callback` (agar production se Zoho auth use karna ho) |

7. **Create Web Service** par click karo. Build aur deploy chalega.
8. Deploy hone ke baad **backend URL** milega, jaise:  
   `https://logistics-backend-xxxx.onrender.com`

---

## Step 2: Frontend ko backend se connect karo (Vercel)

1. **Vercel Dashboard** → apna project (frontend) → **Settings** → **Environment Variables**.
2. Add karo:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://logistics-backend-xxxx.onrender.com/api` (Step 1 ka backend URL + `/api`)
   - **Environment:** Production (aur agar chaho to Preview bhi)
3. **Save** karo.
4. **Deployments** → latest deployment → **⋯** → **Redeploy** (taaki naya env variable build mein aa jaye).

Ab production frontend API calls isi backend URL par bhejega.

---

## Step 3 (optional): Zoho production

Agar production app se Zoho login karna ho to:

1. **Zoho API Console** → apna Client → **Authorized Redirect URIs** mein add karo:  
   `https://tumhara-vercel-app.vercel.app/oauth/callback`
2. Backend (Render) env mein `ZOHO_REDIRECT_URI` = `https://tumhara-vercel-app.vercel.app/oauth/callback` set karo.

---

## Render free tier note

Free service thodi der inactive rehne par **sleep** ho jati hai. Pehla request 30–60 sec mein wake karta hai. Agar hamesha on chahiye to paid plan lo.

---

## Alternative: Railway

- **https://railway.app** → New Project → Deploy from GitHub → repo select karo.
- **Root Directory** = `backend` set karo.
- **Start Command:** `npm start`
- Env vars (FRONTEND_URL, Zoho, etc.) Railway dashboard se add karo.
- Deploy ke baad URL mil jayega – use **VITE_API_URL** mein Vercel par daal do.
