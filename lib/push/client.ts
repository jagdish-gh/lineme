"use client";

export type PendingPushPrompt = {
  lineName: string;
  ticketToken: string;
};

export const pendingPushPromptStorageKey = "lineme-pending-push-prompt";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output;
}

export function queuePushPrompt(prompt: PendingPushPrompt) {
  window.localStorage.setItem(
    pendingPushPromptStorageKey,
    JSON.stringify(prompt)
  );
  window.dispatchEvent(new Event("lineme:push-prompt"));
}

export function readPendingPushPrompt() {
  try {
    const stored = window.localStorage.getItem(pendingPushPromptStorageKey);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<PendingPushPrompt>;

    return typeof parsed.ticketToken === "string" &&
      typeof parsed.lineName === "string"
      ? {
          lineName: parsed.lineName,
          ticketToken: parsed.ticketToken
        }
      : null;
  } catch {
    return null;
  }
}

export function clearPendingPushPrompt() {
  window.localStorage.removeItem(pendingPushPromptStorageKey);
}

export async function subscribeTicketToPush(ticketToken: string, locale: string) {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    throw new Error("push_not_supported");
  }

  if (Notification.permission === "denied") {
    throw new Error("push_denied");
  }

  const publicKeyResponse = await fetch("/api/push/public-key", {
    cache: "no-store"
  });

  if (!publicKeyResponse.ok) {
    throw new Error("push_not_configured");
  }

  const { publicKey } = (await publicKeyResponse.json()) as {
    publicKey?: string;
  };

  if (!publicKey) {
    throw new Error("push_not_configured");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("push_denied");
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const existingSubscription =
    await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true
    }));

  const response = await fetch("/api/push/subscribe", {
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      locale,
      ticketToken
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });

  if (!response.ok) {
    throw new Error("push_subscribe_failed");
  }
}
