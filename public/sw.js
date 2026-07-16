self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("lineme-static-v1").then((cache) =>
      cache.addAll([
        "/offline.html",
        "/favicon.svg",
        "/favicon-96x96.png",
        "/apple-touch-icon.png",
        "/web-app-manifest-192x192.png",
        "/web-app-manifest-512x512.png"
      ])
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("lineme-static-") && key !== "lineme-static-v1"
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  if (!url.pathname.startsWith("/_next/static/")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          void caches
            .open("lineme-static-v1")
            .then((cache) => cache.put(request, responseToCache));
        }

        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "LineME";
  const options = {
    body: data.body || "Your queue ticket has an update.",
    badge: data.badge || "/favicon-96x96.png",
    data: {
      url: data.url || "/en/tickets"
    },
    icon: data.icon || "/web-app-manifest-192x192.png",
    tag: data.tag || "lineme-ticket-update"
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = new URL(
    event.notification.data?.url || "/en/tickets",
    self.location.origin
  );
  const targetUrl =
    requestedUrl.origin === self.location.origin
      ? requestedUrl.href
      : new URL("/en/tickets", self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client && client.url === targetUrl) {
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});
