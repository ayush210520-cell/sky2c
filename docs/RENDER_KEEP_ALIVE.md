# Render Free Tier – Backend ko sota nahi rehne do (ERR_CONNECTION_RESET fix)

Render **free** plan par service **15 minute** idle rehne par **sleep** ho jati hai. Uske baad pehla request **connection reset** de sakta hai (30–60 sec wake-up).

**Fix:** Backend ko har **14 minute** pe ek request bhejo taaki wo sote hi na.

---

## Option 1: UptimeRobot (recommended, free)

1. **https://uptimerobot.com** → Sign up (free).
2. **Add New Monitor**:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Sky2C Backend
   - **URL:** `https://sky2c.onrender.com/api/health`
   - **Monitoring Interval:** 5 minutes (free tier min; 15 min se kam idle = no sleep)
3. **Create Monitor** → Save.

Ab har 5 min pe UptimeRobot `/api/health` hit karega, backend awake rahega, **ERR_CONNECTION_RESET** kam hoga.

---

## Option 2: cron-job.org (free)

1. **https://cron-job.org** → Sign up.
2. **Create Cronjob**:
   - **Title:** Sky2C keep-alive
   - **URL:** `https://sky2c.onrender.com/api/health`
   - **Schedule:** Every 14 minutes (e.g. `*/14 * * * *` in cron expression).
3. Save.

---

## Option 3: Render paid plan

Paid plan par service **sleep** nahi hoti – connection reset issue nahi aata.

---

**Short:** UptimeRobot se `https://sky2c.onrender.com/api/health` har 5 min ping karo → backend sota nahi → connection reset nahi aayega.
