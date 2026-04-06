
const CACHE_NAME = "20260406";
const urlsToCache = [
  "./kashi.html",
  "./manifest.json",
  "./icons/hhc-icon-192.png",
  "./icons/hhc-icon-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/swiper/swiper-bundle.min.js",
  "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
