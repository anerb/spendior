var version=20230417085343;
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

const OFFLINE_URL = "./app/offline.html";

// Clear all but the current cache. Current cache is keyed off `cacheName`.
async function clearCaches() {
  const keys = await caches.keys();
  for (const key of keys) {
    if (key === cacheName) {
       return;
    }
    await caches.delete(key);
  }
}

async function doActivate() {
  console.log(['activate', cacheName]);
  await clearCaches();
  const cache = await caches.open(cacheName);
  // Setting {cache: 'reload'} in the new request will ensure that the response
  // isn't fulfilled from the HTTP cache; i.e., it will be from the network.
  const request = new Request(OFFLINE_URL, {cache: 'reload'});
  const response = await fetch(request);
  // Consume response. No need for response.clone().
  await cache.put(request, response);
}

function onActivate(e) {
  e.waitUntil(doActivate());
}

// TODO: refine this with a non-fragile signal from the sending side.
function isDataTransmission(url) {
  return url.indexOf('/exec') >= 0;
}


function fetchDefault() {
  const bodyText = "some body text";
  const myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
  const myResponse = new Response(bodyText, myOptions);
  return myResponse;
}

async function fetchOffline() {
  const defaultResponse = fetchDefault();
  let offlineResponse = defaultResponse;
  try {
    const cache = await caches.open(cacheName);
    offlineResponse = await cache.match("./app/offline.html");
  } catch (error) {
    console.log(['fetchOffline', 'error', error]);
  } finally {
    return offlineResponse;
  }
}

async function cachedFetch(event) {
  const cache = await caches.open(cacheName);
  const request = event.request;
  let response = undefined;
  try {
    console.log(['cachedFetch', e.request.url]);
    response = await cache.match(request);
    if (response === undefined) {
      console.log(['cachedFetch', 'cache lookup is undefined']);
    }
  } catch (error) {
    console.log(['cachedFetch', 'could not get cached response', error]);
  }

  if (response !== undefined) {
    return response;
  }

  let liveResponse = undefined;
  try {
    console.log(['cachedFetch', 'live', e.request.url]);
    liveResponse = await fetch(e.request);
  } catch (error) {
    console.log(['cachedFetch', 'doing live', error, liveResponse]);
    // Reset liveResponse if an error occured, so we don't store it.
    liveResponse = undefined;
  }

  if (liveResponse !== undefined) {
    await cache.put(e.request, liveResponse.clone());
    return liveResponse;
  } else {
    response = defaultResponse();
    return response;
  }
}

async function doFetch(event) {
  let response = undefined;
  if (isDataTransmission(event.request.url)) {
    response = await fetchOffline();
  } else {
    response = await cachedFetch(event);
  }
  return response;
}

function onFetch(event) {
  event.respondWith(doFetch(event));
}


self.addEventListener("activate", onActivate);
self.addEventListener("fetch", onFetch);
