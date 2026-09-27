const CACHE_NAME = 'hhc-cache-20260927';
const urlsToCache = [
  './',
  './index.html',
  './hhc-icon-512.png',
  './manifest.json',
  './logo.png'
];

// ① install：同一オリジンだけ確実にキャッシュ
self.addEventListener('install', (event) => {
  self.skipWaiting(); // ② 初回から新SWを有効化
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 念のため try/catch で失敗しても install を壊さない
      for (const url of urlsToCache) {
        try { await cache.add(url); } catch (e) { /* 無視 */ }
      }
    })
  );
});

// ③ activate：すぐ制御を握る
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ④ fetch：キャッシュ優先
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
