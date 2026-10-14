// ===== Service Worker: makes the app open without internet =====
// It sits between the page and the network and keeps copies of files in a cache.
//
// Strategy:
//  - Our own files (HTML, CSS, JS, data):  NETWORK FIRST → always fresh when online, cached copy when offline
//  - Libraries, fonts, exercise images:     CACHE FIRST   → they never change, so the cached copy is enough
//  - YouTube videos are NOT cached (too big; they need internet)

const VERSION = "v12"; // change this whenever the file list changes
const APP_CACHE = "app-" + VERSION;
const STATIC_CACHE = "static-v1"; // images / libraries / fonts — they never change, so this name stays fixed

// Files needed for the app to open offline
const APP_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/storage.js",
  "data/exercises.js",
  "data/splits.js",
  "data/videos.js",
  "data/body-model.js",
  "js/i18n.js",
  "js/bodymap.js",
  "js/log.js",
  "js/goals.js",
  "js/profile.js",
  "js/charts.js",
  "js/backup.js",
  "js/calendar.js",
  "js/timer.js",
  "js/plates.js",
  "js/warmup.js",
  "js/records.js",
  "js/volume.js",
  "js/editor.js",
  "js/app.js",
  "js/pwa.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon-32.png",
];
const CHART_JS = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";

// Hosts whose files never change → cache first
const STATIC_HOSTS = ["cdnjs.cloudflare.com", "raw.githubusercontent.com", "fonts.googleapis.com", "fonts.gstatic.com"];

// 1) Install: download and save the app files
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const app = await caches.open(APP_CACHE);
    await app.addAll(APP_FILES);
    const stat = await caches.open(STATIC_CACHE);
    await stat.add(CHART_JS).catch(() => {}); // not fatal if offline right now
    self.skipWaiting(); // use the new version right away
  })());
});

// 2) Activate: delete caches from older versions
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = [APP_CACHE, STATIC_CACHE];
    for (const name of await caches.keys()) {
      if (!keep.includes(name)) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

// 3) Every request from the page goes through here
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else if (STATIC_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(req));
  }
  // anything else (YouTube…) → normal network, no caching
});

async function networkFirst(req) {
  const cache = await caches.open(APP_CACHE);
  try {
    // "no-cache" = always ask the server if the file changed (cheap 304 if not).
    // Without it the browser's own HTTP cache can hand back an OLD file after an update.
    const res = await fetch(req, { cache: "no-cache" });
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    // offline: cached copy (ignore "?x=1" style query strings)
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match("index.html"));
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  // "opaque" = cross-site response we can't read but can still store (e.g. images without CORS)
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

// 4) The page can send a list of exercise images to save ahead of time (your plan's exercises),
//    so they show in the gym even with no signal.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "precache-images") return;
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    for (const url of event.data.urls) {
      if (await cache.match(url)) continue;
      try {
        const res = await fetch(url, { mode: "no-cors" });
        await cache.put(url, res);
      } catch {
        /* offline — try again next time */
      }
    }
  })());
});
