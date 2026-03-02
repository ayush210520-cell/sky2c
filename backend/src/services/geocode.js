/**
 * Geocode location name to lat/lng using OpenStreetMap Nominatim.
 * Usage: 1 req/sec. No API key. Set User-Agent per policy.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'LogisticsShipmentApp/1.0 (contact@example.com)';

const RATE_LIMIT_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resolve a location name to { lat, lng } or null if not found.
 * @param {string} query - e.g. "Mumbai, India", "Delhi", "Dubai International Airport"
 */
export async function geocode(query) {
  const trimmed = (query || '').toString().trim();
  if (!trimmed) return null;

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '1',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lng: lon };
  } catch {
    return null;
  }
}

/**
 * Geocode with rate limit: call this, then await delayBeforeNext() before next call.
 */
export async function geocodeWithDelay(query) {
  const result = await geocode(query);
  await sleep(RATE_LIMIT_MS);
  return result;
}

/**
 * Search for place suggestions (for autocomplete). Returns up to 8 results.
 * @param {string} query - e.g. "indore", "mum"
 * @returns {Promise<Array<{ display_name: string, lat: number, lng: number }>>}
 */
export async function suggest(query) {
  const trimmed = (query || '').toString().trim();
  if (!trimmed || trimmed.length < 1) return [];

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '8',
    });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      display_name: item.display_name || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    })).filter((item) => item.display_name && Number.isFinite(item.lat) && Number.isFinite(item.lng));
  } catch {
    return [];
  }
}
