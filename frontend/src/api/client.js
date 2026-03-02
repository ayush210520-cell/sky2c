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

  try {
    return await doFetch();
  } catch (err) {
    // Render free tier: connection reset when service was sleeping. Retry once after 4s.
    if ((method === 'GET' && /failed|reset|network/i.test(String(err?.message))) || err?.name === 'TypeError') {
      await sleep(4000);
      return await doFetch();
    }
    throw err;
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
