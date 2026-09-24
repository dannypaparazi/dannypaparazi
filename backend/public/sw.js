const CACHE_NAME = 'scannerapp-shell-v2';

// Only the installable scanner shell and its static assets are cached.
// The admin dashboard and install page render live data on every request
// and must never be served stale.
const APP_SHELL = ['/scan', '/manifest.webmanifest'];

function isCacheable(pathname) {
  return (
    pathname === '/scan' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon.svg' ||
    pathname === '/apple-icon.png' ||
    pathname.startsWith('/icons/')
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

// Stale-while-revalidate, but only for the cacheable set above. Everything
// else (the dashboard, /install, /api/*) bypasses the service worker
// entirely and always goes straight to the network.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isCacheable(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    })
  );
});
