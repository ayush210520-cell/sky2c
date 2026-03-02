# Production pe chalane ke liye – step by step

Jab tak har step complete na ho, production pe issue aata rahega. Ek-ek karke karo.

---

## Step 1: Backend ko jagaye rakho (UptimeRobot) – **sabse zaroori**

Render free service **15 min** idle ke baad so jati hai → tab **ERR_CONNECTION_RESET** aata hai.

1. Browser mein kholo: **https://uptimerobot.com**
2. Sign up / Login (free)
3. **+ Add New Monitor**
4. Ye daalo:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Sky2C Backend
   - **URL:** `https://sky2c.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes
5. **Create Monitor** click karo

Iske ~5 min ke andar backend wake rehne lagega. Bina iske production pe connection reset aata rahega.

---

## Step 2: Backend health check karo

1. Naya tab kholo
2. Ye URL daalo: **https://sky2c.onrender.com/api/health**
3. Agar pehli baar **connection reset** ya **site can’t be reached** aaye to **1–2 min baad dubara** try karo (service wake ho rahi hogi)
4. Jab kaam kare to **JSON** dikhega: `{"ok":true,"message":"Shipment API running",...}`

Agar yahan **kabhi bhi** sahi response nahi aata (5–10 min try ke baad bhi), to problem Render service / deploy / env mein hai. Step 4 dekho.

---

## Step 3: Frontend env + redeploy (Vercel)

1. **Vercel Dashboard** → apna project (sky2c) → **Settings** → **Environment Variables**
2. Check karo:
   - **VITE_API_URL** = `https://sky2c.onrender.com/api` (end mein `/api`, trailing slash nahi)
3. Agar change kiya ho to **Save**
4. **Deployments** → latest deployment → **⋯** (three dots) → **Redeploy** → **Redeploy** (option: “Clear cache and redeploy” better hai)

Redeploy **zaroor** karo, nahi to purani build use hogi aur API URL galat rahega.

---

## Step 4: Backend env (Render)

1. **Render Dashboard** → apna Web Service (sky2c) → **Environment** (left side)
2. Ye dono **zaroor** hon:
   - **FRONTEND_URL** = `https://sky2c.vercel.app` (slash at end **nahi**)
   - **NODE_ENV** = `production`
3. **Save** karo
4. Agar kuch change kiya ho to **Manual Deploy** → **Clear build cache & deploy** chala do

---

## Step 5: Production site test karo

1. **https://sky2c.vercel.app** kholo
2. **Track** ya **Admin** ya **Zoho CRM** use karo
3. Agar ab bhi **connection reset** aaye:
   - Pehle **https://sky2c.onrender.com/api/health** open karo, 30 sec ruk kar refresh karo
   - Phir wapas **sky2c.vercel.app** pe jao aur dubara try karo (frontend retry 6s + 15s wait karta hai)

---

## Short checklist

- [ ] UptimeRobot pe monitor add kiya: `https://sky2c.onrender.com/api/health`, 5 min
- [ ] Browser mein `/api/health` open karke JSON response aaya
- [ ] Vercel pe `VITE_API_URL` = `https://sky2c.onrender.com/api` + **Redeploy** kiya
- [ ] Render pe `FRONTEND_URL` = `https://sky2c.vercel.app` set hai
- [ ] Production site **sky2c.vercel.app** pe test kiya

Sab tick ho jaye to production pe chalna chahiye. Agar kisi step pe atko to us step ka screenshot / error batao.
