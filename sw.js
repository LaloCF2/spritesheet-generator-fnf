const CACHE_NAME = 'spritegen-v1.1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/escaner.js',
  './js/optimizador.js',
  './js/psych.js',
  './js/compresor.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

