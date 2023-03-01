var version = '20230301.1320';
var cacheName = 'spendior-cache-20230301.1320';
var filesToCache = [];
/*
  './index.html',
  './css/style.css',
  './js/main.js',
  './images/ayelet_twint.png',
];
*/

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});

/* Serve cached content when offline */
/*
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
*/

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(oldName) {
          return (oldName != cacheName)
        }).map(function(oldName) {
          return caches.delete(oldName);
        })
      );
    })
  );
});