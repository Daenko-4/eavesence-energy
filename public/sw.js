const CACHE_NAME = "eavesence-pwa-v2";
const OFFLINE_URL = "/offline";
const APP_ROUTES = ["/home", "/de/zuhause"];
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/brand/eavesence-icon-approved-final-192.png",
  "/brand/eavesence-icon-approved-final-512.png",
];

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE_URLS);

  for (const route of APP_ROUTES) {
    const response = await fetch(route);
    if (!response.ok) continue;

    await cache.put(route, response.clone());
    const html = await response.text();
    const assetUrls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => new URL(match[1], self.location.origin))
      .filter(
        (url) =>
          url.origin === self.location.origin &&
          (url.pathname.startsWith("/_next/static/") ||
            url.pathname.startsWith("/brand/") ||
            url.pathname === "/icon.png"),
      )
      .map((url) => url.href);

    await Promise.allSettled(assetUrls.map((url) => cache.add(url)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("eavesence-pwa-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request, { ignoreSearch: true });
          return cachedPage ?? caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  if (["font", "image", "script", "style"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cachedResponse) =>
          cachedResponse ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
