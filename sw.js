var version=20230416105900;
var cacheName = `version=${version}`;

function showNotification(title, body) {
  if (Notification.permission != "granted") {
    return;
  }
  randomNotification(title, body);
}

function randomNotification(title, body) {
  const notifImg = '../images/eur.png';
  const options = {
    body: body,
    icon: notifImg,
  };
  self.registration.showNotification(title, options)
}

const appShellFiles = [
  "./app/debug.html",
  "./app/index.html",
  "./app/settings.html",
  "./app/offline.html",
  "./css/settings.css",
  "./css/style.css",
  "./css/offline.css",
  "./js/common.js",
  "./js/debug.js",
  "./js/main.js",
  "./js/settings.js",
  "./js/offline.js",
  "./manifest.json",
  "./sw.js",
];


/* Start the service worker and cache all of the app's content */
self.addEventListener('install',
  async (e) => {
    console.log("[Service Worker] Install");
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persistent) => {
        if (persistent) {
          console.log("Storage will not be cleared except by explicit user action");
        } else {
          console.log("Storage may be cleared by the UA under storage pressure.");
        }
      });
    }
  }
);

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        })
      );
    })
  );
});

// TODO: refine this with a non-fragile signal from the sending side.
function isDataTransmission(url) {
  return url.indexOf('/exec') >= 0;
}

async function onFetchRequest(event) {
  if (isDataTransmission(event.request.url)) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match("./app/offline.html");
        return cachedResponse;
      }
    })());
  }



  //   const queryParameters = e.request.url.substring(e.request.url.indexOf('?') + 1);
  //   let response = {sd: "start"};
  //   try {
  //     response = await fetch(e.request, {mode: 'no-cors'});
  //     response.sd = "noprob";
  //   } catch (e) {
  //     showNotification('error', e.message);
  //     const bodyText = "some body text";
  //     const myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
  //     const myResponse = new Response(bodyText, myOptions);
  //     return myResponse;
  //   } finally {
  //     showNotification('sent', queryParameters);
  //     return response;
  //   }
  // }
  const r = await caches.match(e.request);
  console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
  console.log(['actual fetch', e.request.url]);
  const response = await fetch(e.request);
  const cache = await caches.open(cacheName);
  cache.put(e.request, response.clone());
  return response;
}

self.addEventListener("fetch", (e) => {
  e.respondWith(onFetchRequest(e))
}
);
