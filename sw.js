/*
  CRMEF Memory Museum — Service Worker
  ------------------------------------------------------------------
  Keeps this a simple, safe setup:
  - On install, caches just the core shell (this page, the manifest,
    and the icon) so the site can still open when offline.
  - On every request, tries the network first (so visitors always get
    your latest photos/edits when they're online), and only falls back
    to the cache if the network fails.
  - Anything successfully fetched gets saved to the cache automatically,
    so the more a visitor browses while online, the more works offline
    later — no need to hand-list every photo file here.

  To ship an update to visitors who already installed the app, bump
  CACHE_NAME below (e.g. 'v2') — that's the only maintenance this needs.
  ------------------------------------------------------------------
*/

const CACHE_NAME = 'crmef-museum-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => { /* fine if a core asset is briefly unavailable */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle simple GET requests — let everything else pass through normally.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Save a copy of anything we successfully fetch, for offline use later.
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
