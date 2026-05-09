const CACHE_NAME = 'tourist-safety-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Only cache same-origin GET requests — skip ALL external URLs
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET, external origins, and API calls
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return; // skip googleapis, localhost:5000, etc.
  if (url.pathname.startsWith('/api/')) return;

  // Network first, fall back to cache for same-origin assets only
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
