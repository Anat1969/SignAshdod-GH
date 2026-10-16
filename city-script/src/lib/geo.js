// גאומטריה פשוטה: נקודה בתוך פוליגון, מרחק, ואיתור כתובת דרך Nominatim.
export function pointInPolygon([x, y], poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function distanceMeters(a, b) {
  const R = 6371000, toR = (d) => (d * Math.PI) / 180
  const dLat = toR(b[1] - a[1]), dLng = toR(b[0] - a[0])
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[1])) * Math.cos(toR(b[1])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// אזור האופי בנקודה: האזור בעדיפות הגבוהה ביותר שמכיל אותה.
export function zoneAt(lngLat, zones) {
  const hits = zones.filter((z) => pointInPolygon(lngLat, z.polygon))
  hits.sort((a, b) => (b.priority || 1) - (a.priority || 1))
  return hits[0] || null
}

export const ASHDOD_CENTER = [34.6553, 31.8014]
export const ASHDOD_BOUNDS = [[34.585, 31.735], [34.715, 31.855]]

const GEO_CACHE = 'ktav-geocode-v1'
function readCache() { try { return JSON.parse(localStorage.getItem(GEO_CACHE) || '{}') } catch { return {} } }
function writeCache(c) { try { localStorage.setItem(GEO_CACHE, JSON.stringify(c)) } catch { /* אחסון חסום */ } }

let lastCall = 0
// Nominatim: בקשה אחת בשנייה, רק בלחיצה, תוצאות במטמון. מוגבל לתחום אשדוד.
export async function geocode(query) {
  const q = query.trim()
  if (!q) return []
  const cache = readCache()
  if (cache[q]) return cache[q]
  const wait = Math.max(0, 1100 - (Date.now() - lastCall))
  if (wait) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
  const [[w, s], [e, n]] = ASHDOD_BOUNDS
  const params = new URLSearchParams({
    q: /אשדוד|ashdod/i.test(q) ? q : `${q}, אשדוד`,
    format: 'jsonv2', limit: '5', 'accept-language': 'he', countrycodes: 'il',
    viewbox: `${w},${n},${e},${s}`, bounded: '1', addressdetails: '1',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('שירות איתור הכתובות אינו זמין כרגע')
  const json = await res.json()
  const out = json.map((r) => ({ label: r.display_name.split(',').slice(0, 3).join(','), lng: +r.lon, lat: +r.lat }))
  cache[q] = out
  writeCache(cache)
  return out
}
