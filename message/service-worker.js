const CACHE_NAME = 'hhc-cache-20261024-2';
const urlsToCache = [
  './',
  './index.html',
  './list.json',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('hhc-cache-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isAppNavigation = event.request.mode === 'navigate';
  const isSermonList = requestUrl.origin === self.location.origin
    && requestUrl.pathname.endsWith('/list.json');

  if (isAppNavigation || isSermonList) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) {
            return caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, response.clone()))
              .then(() => response);
          }
          return response;
        })
        .catch(() => caches.match(event.request)
          .then(response => response || (isAppNavigation && caches.match('./index.html')))
          .then(response => response || Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
