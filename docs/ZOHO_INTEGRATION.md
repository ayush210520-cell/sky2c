# Zoho Integration – Logistics App

Is app ko **Zoho CRM** se integrate kiya ja sakta hai taaki shipments automatically Zoho mein sync hon. **Ek baar sahi setup karo – uske baad refresh token dubara generate nahi karna padta** (Zoho server-based app mein refresh token expire nahi hota).

---

## Ek baar sahi setup (zaroor follow karo)

1. **Zoho API Console** mein client **Server-based Application** type ka hona chahiye (Client-based / Self client mat banao). Server-based se refresh token **expire nahi** hota.
2. **Redirect URI** Zoho Console mein bilkul wahi hona chahiye jo app use karti hai (neeche Step 3).
3. Refresh token milne ke baad **Client Secret Zoho Console mein dubara regenerate mat karo** – purana refresh token invalid ho jayega. Agar regenerate karna zaroori ho to phir se Authorize karke naya refresh token lena padega.

---

## Step 1: Client ID & Client Secret (done)

Aapne already **Client ID** aur **Client Secret** generate kar liya hai. Inhe **regenerate mat karo** jab tak naya refresh token na le lo.

## Step 2: Backend `.env` mein daalo

Backend folder ki `.env` file mein ye add karo (values apne generated values se replace karo):

```env
ZOHO_ACCOUNTS_DOMAIN=zoho.in
ZOHO_CLIENT_ID=1000.xxxxxxxxxxxx
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

- **India** Zoho use karte ho to: `ZOHO_ACCOUNTS_DOMAIN=zoho.in`
- **US** use karte ho to: `ZOHO_ACCOUNTS_DOMAIN=zoho.com`

`ZOHO_REFRESH_TOKEN` abhi khali chhod do – next step mein milega.

## Step 3: Zoho API Console mein Redirect URI set karo

1. Zoho API Console (https://api-console.zoho.in ya .com) → apna Client open karo.
2. **Redirect URI** add karo (exactly yehi hona chahiye):
   ```
   http://localhost:5001/api/zoho/callback
   ```
3. Save karo.

## Step 4: Refresh Token generate karo (sirf ek baar)

1. Backend run karo: `cd backend && npm run dev`
2. Browser mein **ek baar** ye URL open karo: `http://localhost:5001/api/zoho/setup`  
   (Setup page par ek baar sahi setup checklist bhi hai.)
3. Wahan **Redirect URI** Zoho Console mein add karo (exact copy-paste), Save karo.
4. **Authorize with Zoho** par click karo → Zoho login → **Accept**.
5. Jo **refresh token** dikhe use copy karke backend `.env` mein daalo:
   ```env
   ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxx
   ZOHO_INTEGRATION_ENABLED=true
   ```
6. Backend restart karo.

**Uske baad:** Refresh token expire nahi hota (server-based app). Access token app khud ~1 hour cache karti hai, Zoho ko har request par hit nahi karti. **Client Secret regenerate mat karo** warna refresh token invalid ho jayega.

## Step 5: Zoho CRM mein Custom Module (optional)

Agar aap shipments ko Zoho CRM mein alag module mein dekhna chahte ho:

1. Zoho CRM → **Setup** → **Customization** → **Modules** → **Create Module**.
2. Module name: **Shipments** (API name: `Shipments`).
3. Is module mein ye **fields** add karo (API names exactly yahi hon):

| Field Label      | API Name           | Type    |
|------------------|--------------------|--------|
| Shipment Number  | Shipment_Number    | Text   |
| Assigned To      | Assigned_To        | Text   |
| Customer Email   | Customer_Email     | Email  |
| Current Status   | Current_Status     | Pick List |
| Current Location | Current_Location   | Text   |
| Pickup Location  | Pickup_Location    | Text   |
| Destination      | Destination        | Text   |
| Transport Mode   | Transport_Mode     | Text   |
| Last Updated     | Last_Updated_Time  | DateTime |

Agar module ka API name alag hai to `.env` mein set karo:
```env
ZOHO_CRM_MODULE=Your_Module_API_Name
```

## Kya sync hota hai

- **Create Shipment** → Zoho CRM mein naya record (insert).
- **Update Status** / **Update Location** → Zoho CRM mein wahi record update (Shipment_Number se search karke).

## Troubleshooting

- **invalid_code / invalid_grant**: Refresh token invalid ya revoke ho chuka. **Kaaran:** Client Secret regenerate kiya ho sakta hai, ya client type Client-based/Self client tha. **Fix:** Zoho Console mein client **Server-based** hai confirm karo, phir sirf ek baar `/api/zoho/setup` se dubara Authorize karke naya refresh token lo aur `.env` mein daalo. Client Secret ab regenerate mat karo.
- **Invalid Redirect URI** – Zoho error: "Redirect URI passed does not match with the one configured":
  1. Use the **same** Zoho API Console as your account: **India** → [api-console.zoho.in](https://api-console.zoho.in); **US/Global** → [api-console.zoho.com](https://api-console.zoho.com).
  2. In that console, open your **Client** → **Redirect URI** and add exactly (copy-paste, no changes):
     `http://localhost:5001/api/zoho/callback`
  3. No `https`, no trailing slash, port must be the one your backend runs on (e.g. 5001). Click **Save**.
  4. Use the setup page to copy the URI: open `http://localhost:5001/api/zoho/setup` and click "Copy Redirect URI".
- **Invalid token / 401**: Refresh token sahi paste kiya? Domain (zoho.in / zoho.com) sahi hai?
- **Redirect URI mismatch**: Zoho Console mein Redirect URI exactly `http://localhost:5001/api/zoho/callback` ho (port same jo backend use kar raha hai).
- **Module not found**: `ZOHO_CRM_MODULE` Zoho ke module API name se match karta hai? (e.g. `Shipments`).
- **Field missing**: Custom module mein upar diye gaye field API names exactly same hon.
