/**
 * API base URL – from env. Vite embeds this at build time.
 * Default 5001 so it matches "backend on PORT=5001" when 5000 is in use.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function api(method, path, body = null) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }

  const doFetch = async () => {
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || res.statusText);
    return data;
  };

  const isNetworkError = (e) =>
    method === 'GET' && (e?.name === 'TypeError' || /failed|reset|network/i.test(String(e?.message || '')));

  try {
    return await doFetch();
  } catch (err) {
    if (!isNetworkError(err)) throw err;
    // Render free tier: wake-up can take 30–60s. Retry twice with longer waits.
    try {
      await sleep(6000);
      return await doFetch();
    } catch (err2) {
      if (!isNetworkError(err2)) throw err2;
      await sleep(15000);
      return await doFetch();
    }
  }
}

export const shipments = {
  getAll: (activeOnly = false) =>
    api('GET', `/shipments${activeOnly ? '?active=true' : ''}`),
  getByNumber: (num) => api('GET', `/shipments/${encodeURIComponent(num)}`),
  getHistory: (num) => api('GET', `/shipments/${encodeURIComponent(num)}/history`),
  create: (data) => api('POST', '/shipments', data),
  assign: (num, assignedTo) =>
    api('PATCH', `/shipments/${encodeURIComponent(num)}/assign`, { assignedTo }),
  updateStatus: (num, status, location = {}) =>
    api('PATCH', `/shipments/${encodeURIComponent(num)}/status`, {
      status,
      ...location,
    }),
  updateLocation: (num, location) =>
    api('PATCH', `/shipments/${encodeURIComponent(num)}/location`, location),
};

export const geocode = {
  suggest: (q) => api('GET', `/geocode/suggest?q=${encodeURIComponent(q)}`),
};

export const zoho = {
  getLeads: (nextStepOnly = false) =>
    api('GET', `/zoho/leads${nextStepOnly ? '?next_step=1' : ''}`),
  getDeals: (nextStepOnly = false) =>
    api('GET', `/zoho/deals${nextStepOnly ? '?next_step=1' : ''}`),
};
