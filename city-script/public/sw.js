// דפים מהרשת, נכסים ותמונות מהמטמון.
const CACHE = 'ktav-hair-v1'
self.addEventListener('install', (e) => { self.skipWaiting() })
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/index.html')))
    return
  }
  const sameOrigin = url.origin === self.location.origin
  const isAsset = sameOrigin && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/data/'))
  const isFont = url.hostname.endsWith('gstatic.com') || url.hostname.endsWith('googleapis.com')
  if (isAsset || isFont) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req)
      if (hit) return hit
      const res = await fetch(req)
      if (res.ok || res.type === 'opaque') c.put(req, res.clone())
      return res
    }))
  }
})
