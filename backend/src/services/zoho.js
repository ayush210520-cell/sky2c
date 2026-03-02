/**
 * Zoho CRM integration – OAuth refresh token flow, push shipment create/update.
 * Access token cache: ek baar refresh token set karo, phir access token ~1 hour cache rehta hai (dubara Zoho hit nahi).
 * Set ZOHO_INTEGRATION_ENABLED=true and ZOHO_REFRESH_TOKEN in .env to enable.
 */
const ACCOUNTS_DOMAIN = process.env.ZOHO_ACCOUNTS_DOMAIN || 'zoho.in';
const CRM_DOMAIN = ACCOUNTS_DOMAIN === 'zoho.com' ? 'zohoapis.com' : `zohoapis.${ACCOUNTS_DOMAIN.replace('zoho.', '')}`;
const ACCOUNTS_URL = `https://accounts.${ACCOUNTS_DOMAIN}`;
const CRM_API_BASE = `https://www.${CRM_DOMAIN}/crm/v2`;

/** Access token cache – refresh ~1 hour pe ek baar, baaki time yahi use (Zoho rate limit bachta hai). */
let cachedToken = null; // { access_token, expiresAt }

function isEnabled() {
  return process.env.ZOHO_INTEGRATION_ENABLED === 'true' &&
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN;
}

/**
 * Fetch new access token from Zoho (refresh_token use karke).
 */
async function fetchNewAccessToken() {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho: missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET or ZOHO_REFRESH_TOKEN');
  }
  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const errCode = (data.error || '').toLowerCase();
    if (errCode === 'invalid_code' || errCode === 'invalid_client' || errCode === 'invalid_grant') {
      throw new Error('Zoho refresh token invalid or expired. Ek baar sahi setup karo: docs/ZOHO_INTEGRATION.md dekho. Naya token: /api/zoho/setup se Authorize karo, .env mein ZOHO_REFRESH_TOKEN update karo.');
    }
    throw new Error(data.error || data.message || `Zoho token failed: ${res.status}`);
  }
  const expiresIn = (data.expires_in || 3600) * 1000;
  return {
    access_token: data.access_token,
    expiresAt: Date.now() + expiresIn - 60000, // 1 min early refresh
  };
}

/**
 * Get access token – cache use karta hai, expire hone par hi Zoho call karta hai (ek baar setup, phir stable).
 */
export async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.access_token;
  }
  cachedToken = await fetchNewAccessToken();
  return cachedToken.access_token;
}

/**
 * Exchange one-time auth code for refresh token (use once during setup).
 */
export async function getRefreshTokenFromCode(code, redirectUri) {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Zoho: set ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in .env');
  }
  const res = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error || data.message || `Zoho token exchange failed: ${res.status}`);
  }
  return { refresh_token: data.refresh_token, access_token: data.access_token };
}

/**
 * Push shipment to Zoho CRM (insert or update by Shipment_Number).
 */
export async function pushShipmentToZoho(shipment) {
  if (!isEnabled()) return null;
  const module = process.env.ZOHO_CRM_MODULE || 'Shipments';
  const token = await getAccessToken();
  const record = {
    Shipment_Number: shipment.shipmentNumber || '',
    Assigned_To: shipment.assignedTo || '',
    Customer_Email: shipment.customerEmail || '',
    Current_Status: shipment.currentStatus || '',
    Current_Location: shipment.currentLocationName || '',
    Pickup_Location: shipment.pickupLocationName || '',
    Destination: shipment.destinationName || '',
    Transport_Mode: shipment.transportMode || '',
    Last_Updated_Time: shipment.lastUpdatedTime || '',
  };

  const criteria = `(Shipment_Number:equals:${shipment.shipmentNumber})`;
  const searchRes = await fetch(
    `${CRM_API_BASE}/${module}/search?criteria=${encodeURIComponent(criteria)}`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const searchData = await searchRes.json().catch(() => ({}));
  const existingId = searchData?.data?.length > 0 ? searchData.data[0].id : null;

  if (existingId) {
    const updateRes = await fetch(`${CRM_API_BASE}/${module}/${existingId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: [record] }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.message || `Zoho update failed: ${updateRes.status}`);
    }
    return { id: existingId, action: 'updated' };
  }

  const insertRes = await fetch(`${CRM_API_BASE}/${module}`, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: [record] }),
  });
  const insertData = await insertRes.json().catch(() => ({}));
  if (!insertRes.ok || insertData?.data?.[0]?.code !== 'SUCCESS') {
    const msg = insertData?.data?.[0]?.message || insertData?.message || `Zoho insert failed: ${insertRes.status}`;
    throw new Error(msg);
  }
  return { id: insertData.data[0].details?.id, action: 'created' };
}

/**
 * Fetch records from a Zoho CRM module (e.g. Leads, Deals).
 * Options: page, per_page, sort_by, sort_order, converted (Leads only).
 */
export async function getCrmRecords(moduleName, options = {}) {
  if (!isEnabled()) throw new Error('Zoho integration is not enabled');
  const token = await getAccessToken();
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.per_page) params.set('per_page', String(Math.min(200, options.per_page)));
  if (options.sort_by) params.set('sort_by', options.sort_by);
  if (options.sort_order) params.set('sort_order', options.sort_order);
  if (options.converted !== undefined && moduleName === 'Leads') params.set('converted', options.converted);
  const qs = params.toString();
  const url = `${CRM_API_BASE}/${moduleName}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.details?.[0]?.message || `Zoho ${moduleName} fetch failed: ${res.status}`);
  }
  if (data.data === undefined && data.code && data.code !== 'SUCCESS') {
    throw new Error(data.message || data.details?.[0]?.message || 'Zoho API error');
  }
  return data.data || [];
}

/** Default "closed" stages for Deals (next-step = exclude these). */
const DEAL_CLOSED_STAGES = ['Closed Won', 'Closed Lost', 'Closed'];

/**
 * Get Leads from Zoho CRM. nextStepOnly: only non-converted (open) leads.
 */
export async function getLeads(nextStepOnly = false) {
  const opts = nextStepOnly ? { converted: 'false', per_page: 200 } : { per_page: 200 };
  return getCrmRecords('Leads', opts);
}

/**
 * Get Deals from Zoho CRM. nextStepOnly: exclude closed stages.
 */
export async function getDeals(nextStepOnly = false) {
  const records = await getCrmRecords('Deals', { per_page: 200, sort_by: 'Last_Activity_Time', sort_order: 'desc' });
  if (!nextStepOnly) return records;
  return records.filter((r) => {
    const stage = (r.Stage && r.Stage.name) || r.Stage || '';
    return !DEAL_CLOSED_STAGES.some((s) => String(stage).toLowerCase() === s.toLowerCase());
  });
}

export { isEnabled as isZohoEnabled };
