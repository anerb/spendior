importScripts('https://unpkg.com/dexie@3.2.3/dist/dexie.js')

var version=20230503085801;
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

function onActivate(event) {
  event.waitUntil(doActivate());
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

async function fetchOffline(url) {
  const defaultResponse = fetchDefault();
  let offlineResponse = defaultResponse;
  try {
    let serverResponse = await fetch(url, {mode: 'no-cors'});
    console.log(['fetchOffline', 'normal', JSON.stringify(serverResponse)]);
    // const cache = await caches.open(cacheName);
    // offlineResponse = await cache.match("./app/offline.html");    
    let options = { status: 200, statusText: "IsOK" };
    let builtResponse = new Response("data:OK");
    offlineResponse = builtResponse;
  } catch (error) {
    console.log(['fetchOffline', 'error', error]);
    let errorOptions = { status: 200, statusText: "IsNotOK" };
    let errorResponse = new Response("data:NotOK");
    offlineResponse = errorResponse;
  } finally {
    return offlineResponse;
  }
}

async function cachedFetch(event) {
  const cache = await caches.open(cacheName);
  const request = event.request;
  let response = undefined;
  try {
    console.log(['cachedFetch', request.url]);
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
    console.log(['cachedFetch', 'live', request.url]);
    liveResponse = await fetch(request);
  } catch (error) {
    console.log(['cachedFetch', 'doing live', error, liveResponse]);
    // Reset liveResponse if an error occured, so we don't store it.
    liveResponse = undefined;
  }

  if (liveResponse !== undefined) {
    await cache.put(request, liveResponse.clone());
    return liveResponse;
  } else {
    response = defaultResponse();
    return response;
  }
}

async function doFetch(event) {
  let response = undefined;
  let request = event.request;
  if (isDataTransmission(request.url)) {
    response = await fetchOffline(request.url);
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

function queryIt(db) {
  db.open().then(function(){
  
    return db.friends
      .where('age')
      .between(40,65)
      .toArray();
  
  }).then(function(friends){
  
    console.log("Found friends: " + JSON.stringify(friends, null, 2));
    
  }).catch (Dexie.MissingAPIError, function (e) {
    console.log ("Couldn't find indexedDB API");
  }).catch ('SecurityError', function(e) {
    console.log ("SeurityError - This browser doesn't like fiddling with indexedDB.");
    console.log ("If using Safari, this is because jsfiddle runs its samples within an iframe");
    console.log ("Go run some samples instead at: https://github.com/dfahlander/Dexie.js/wiki/Samples");
  }).catch (function (e) {
    console.log (e);
  });
}

function deleteIt(db) {
  db.open().then(function(){
    return db.delete(); // So you can experiment again and again...
  }).catch (Dexie.MissingAPIError, function (e) {
    console.log ("Couldn't find indexedDB API");
  }).catch ('SecurityError', function(e) {
    console.log ("SeurityError - This browser doesn't like fiddling with indexedDB.");
    console.log ("If using Safari, this is because jsfiddle runs its samples within an iframe");
    console.log ("Go run some samples instead at: https://github.com/dfahlander/Dexie.js/wiki/Samples");
  }).catch (function (e) {
    console.log (e);
  });
}


function addIt(db) {
  let decimal = Math.random();
  console.log("adding", decimal);
  db.open().then(function(){
    return db.friends.add({name: "Foo" + decimal, age: 42 + decimal});
    
  }).catch (Dexie.MissingAPIError, function (e) {
    console.log ("Couldn't find indexedDB API");
  }).catch ('SecurityError', function(e) {
    console.log ("SeurityError - This browser doesn't like fiddling with indexedDB.");
    console.log ("If using Safari, this is because jsfiddle runs its samples within an iframe");
    console.log ("Go run some samples instead at: https://github.com/dfahlander/Dexie.js/wiki/Samples");
  }).catch (function (e) {
    console.log (e);
  });
}

function getTransfersTable() {
  let db = new Dexie("SpendiorDB");
  let transfersTable = db.table("transfers");
  return transfersTable;
}

function sendRecordsAndConfirm() {
  return;
  let transfersTable = getTransfersTable();
  var db = new Dexie("MyFriendDB");
  db.version(1).stores({
	  friends: '++id,name,age'
  });
  console.log ("Using Dexie v" + Dexie.semVer);

  queryIt(db);

  if (counter % 2 == 0) {
    addIt(db);
  }

  if (counter > 0) {
    setTimeout(logFromDB, 3000);
  }
}

async function sendRecord(record, server_url) {
  let postOptions = {
    redirect: "follow",
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(record),
    headers: {
        'Content-Type': 'text/plain;charset=utf-8',
    }
  };

  try {
    let response = await fetch(server_url, postOptions);
  } catch (error) {
    console.log("Error when blind-sending record", error);
  }
}


// Copy-pasted from main.js
// TODO: Use real csv parser.
function csv2records(csv) {
  let lines = csv.split(/[\r\n]+/);  // Inching towards fill csv library.
  let records = [];
  let headings = undefined;
  for (let line of lines) {
    let row = line.split(",");  // This is where the hard stuff with quoting happens
    if (headings == undefined) {
      headings = row;
      continue;
    }
    let record = {};
    for (let c = 0; c < headings.length; c++) {
      let heading = headings[c];
      let value = row[c];
      record[heading] = value;
    }
    records.push(record);
  }
  return records;
}

/*
 * Returns an array of [{server_id, server_revision}];
 */
async function readServerRevisions() {
  try {
    // TODO: Get url from settings
    let published_revisions_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTv9KV2ijq4iif2r2KYfFqeKfkCdzNpld_bIWwqS6q3S5ToP_Z3KfTTceD2wnVprqaI9mDat_qWdk7T/pub?gid=1498590524&single=true&output=csv";
    // Fetch text from the URL
    const response = await fetch(published_revisions_url);
    const text = await response.text();

    // Process the text with the text2records function
    const records = csv2records(text);
    return records;
  } catch (error) {
    console.error("ERROR calling httpsGet: ", error);
  }
  return undefined;
}

const CYCLE_TIME = 1*10*1000;



async function updateRecords() {
  const db = new Dexie("Spendior");

  db.version(1).stores({
    records: "[server_id+server_revision],state,record_json",
  });

  const published_values = await readServerRevisions();
  const pendingRecords = await db.records.where("state").equals("pending").toArray();

  // TODO: Use the current settings to send the data.
  let server_sheetname = "data";
  let server_url = "https://script.google.com/macros/s/AKfycbwnznH0VMWsxDUlCuqqQTUrePDaw5d4TuYNhA2FP_t5mgsK_rCGcRxS1jEmG806r9ch-A/exec";

  if (published_values == undefined || pendingRecords == undefined) {
    setTimeout(updateRecords, CYCLE_TIME);
    return;
  }
  for (const record of pendingRecords) {
    // TODO: Figure out int vs string for server_revision!
    const match = published_values.find(
      (item) =>
        String(item.server_id) == String(record.server_id) &&
        String(item.server_revision) == String(record.server_revision)
      );
    if (match) {
      console.log("updating", record);
      db.records.update([record.server_id, record.server_revision], { state: "confirmed" });  // nowait
    } else {
      let serverRecord = JSON.parse(record.record_json);
      serverRecord.server_id = record.server_id;
      serverRecord.server_revision = record.server_revision;
      serverRecord.server_sheetname = server_sheetname;
      console.log("sending", serverRecord);
      sendRecord(serverRecord, server_url);  // nowait
    }
  }
  if (pendingRecords.length > 0) {
    setTimeout(updateRecords, CYCLE_TIME);
  }
}

setTimeout(updateRecords, CYCLE_TIME);

// sw.js
self.addEventListener('message', event => {
  console.log('Received message from main.js:', event.data);
  setTimeout(updateRecords, CYCLE_TIME);
});