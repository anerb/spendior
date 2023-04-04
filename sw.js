var version = '20230301.1425';
var cacheName = 'spendior-cache-20230301.1425';

/* Start the service worker and cache all of the app's content */
self.addEventListener('install',
  (e) => {
    console.log("[Service Worker] Install");
  }
);

self.addEventListener('activate',
  (e) => {
    console.log("[Service Worker] activate");
  }
);
