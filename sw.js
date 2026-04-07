// Service Worker — Tiệm Nhà Ỉn PWA
// Strategy: Cache-first for app shell, Network-first for data
const CACHE_NAME = 'tni-v1';
const APP_SHELL = [
  './tiem_nha_in_agent.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
];

// Install: cache app shell
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app, network-first for API calls
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and API calls (JSONBin cloud sync)
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.jsonbin.io') return;

  // Cache-first for local + CDN assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => caches.match('./tiem_nha_in_agent.html'));
    })
  );
});

// Background sync placeholder (for future ESC/POS printer integration)
self.addEventListener('sync', e => {
  if (e.tag === 'print-queue') {
    // Future: retry failed print jobs
  }
});
