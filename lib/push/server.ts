import webpush, { type PushSubscription } from "web-push";

export const pushConfig = {
  privateKey: process.env.WEB_PUSH_PRIVATE_KEY,
  publicKey: process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
  subject:
    process.env.WEB_PUSH_SUBJECT ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "mailto:support@lineme.app"
};

export function isPushConfigured() {
  return Boolean(pushConfig.publicKey && pushConfig.privateKey);
}

export function configureWebPush() {
  if (!isPushConfigured()) {
    return false;
  }

  webpush.setVapidDetails(
    pushConfig.subject,
    pushConfig.publicKey!,
    pushConfig.privateKey!
  );

  return true;
}

export type TicketPushPayload = {
  body: string;
  tag: string;
  title: string;
  url: string;
};

export async function sendTicketPush(
  subscription: PushSubscription,
  payload: TicketPushPayload
) {
  if (!configureWebPush()) {
    return { skipped: true };
  }

  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );

  return { skipped: false };
}
