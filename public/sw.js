const CACHE_NAME = "gt-academy-shell-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./student.html",
  "./teacher.html",
  "./css/style.css",
  "./js/academy.js",
  "./js/student.js",
  "./js/teacher.js",
  "./js/booking.js",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || requestUrl.pathname.includes("socket.io")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});