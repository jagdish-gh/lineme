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
    data: {
      url: data.url || "/en/tickets"
    },
    tag: data.tag || "lineme-ticket-update"
  };

  if (data.badge) {
    options.badge = data.badge;
  }

  if (data.icon) {
    options.icon = data.icon;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/en/tickets",
    self.location.origin
  ).href;

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
