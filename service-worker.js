// service-worker.js

const CACHE_NAME = "bp23rec-training-v4";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/data-trainings.js",
  "./js/data-notions.js",
  "./manifest.webmanifest",
  "./assets/images/graphique-attention.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",

  "./assets/screenshots/mobile-home.png",
  "./assets/screenshots/desktop-home.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match("./index.html");
          return null;
        });
    })
  );
});
