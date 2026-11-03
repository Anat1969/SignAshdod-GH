// Where each site is (2026-11-03): the requests carry an address, not coordinates. The address is looked up once in
// OpenStreetMap Nominatim (free, no key, at most one lookup a second) and kept on this device, so a tour costs
// lookups only for new sites. A site that cannot be found stays in the list without a pin.

const KEY = 'sign-geo-v1';
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
};
const write = (m) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* storage blocked: memory only */
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withCity = (a) => (/אשדוד|ashdod/i.test(a) ? a : `${a}, אשדוד`);

/** Coordinates for each address; calls onPin as each one arrives, cached ones at once. */
export async function geocodeAll(addresses, onPin, { signal } = {}) {
  const cache = read();
  const todo = [];
  for (const a of new Set(addresses.filter(Boolean))) {
    if (a in cache) cache[a] && onPin(a, cache[a]);
    else todo.push(a);
  }
  for (const a of todo.slice(0, 40)) {
    if (signal?.aborted) return;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=il&accept-language=he&q=${encodeURIComponent(withCity(a))}`;
      const res = await fetch(url, { signal });
      const [hit] = res.ok ? await res.json() : [];
      cache[a] = hit ? { lat: +hit.lat, lng: +hit.lon } : null;
      write(cache);
      if (cache[a]) onPin(a, cache[a]);
    } catch {
      if (signal?.aborted) return;
    }
    await sleep(1100);
  }
}

/** Metres between two points (haversine). */
export function distance(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtDistance = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} מ'` : `${(m / 1000).toFixed(1)} ק"מ`);
