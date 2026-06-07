"use client";

import mixpanel from "mixpanel-browser";

type EventProperties = Record<string, boolean | number | string | undefined>;
type TrackEventCallback = (success: boolean) => void;

export enum MixpanelEvent {
  AdditionalInfoRequested = "additional_info_requested",
  AdditionalInfoSubmitted = "additional_info_submitted",
  LineCreated = "line_created",
  LineJoined = "line_joined",
  LineLeft = "line_left",
  LineStatusChanged = "line_status_changed",
  MemberCalled = "member_called",
  MemberServed = "member_served",
  SignUpCompleted = "sign_up_completed"
}

const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
const deploymentEnvironment =
  process.env.NEXT_PUBLIC_DEPLOYMENT_ENV;
const explicitlyEnabled =
  process.env.NEXT_PUBLIC_MIXPANEL_ENABLED === "true";
const explicitlyDisabled =
  process.env.NEXT_PUBLIC_MIXPANEL_ENABLED === "false";
const enabled = Boolean(
  token &&
    (explicitlyEnabled ||
      (process.env.NODE_ENV === "production" &&
        deploymentEnvironment === "production" &&
        !explicitlyDisabled))
);

let initialized = false;

function sanitizePath(path: string) {
  return path.replace(
    /^\/(en|hi)\/join\/[^/?#]+/,
    "/$1/join/[line]"
  );
}

function sanitizeUrl(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  try {
    const url = new URL(value, window.location.origin);
    url.pathname = sanitizePath(url.pathname);
    url.search = "";
    url.hash = "";
    return value.startsWith("http") ? url.toString() : url.pathname;
  } catch {
    return sanitizePath(value.split("?")[0].split("#")[0]);
  }
}

function initializeMixpanel() {
  if (!enabled || !token || typeof window === "undefined") {
    return false;
  }

  if (initialized) {
    return true;
  }

  const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname
  );

  if (isLocalHost && !explicitlyEnabled) {
    return false;
  }

  mixpanel.init(token, {
    autocapture: false,
    hooks: {
      before_send_events(event) {
        return {
          ...event,
          properties: {
            ...event.properties,
            $current_url: sanitizeUrl(event.properties.$current_url),
            current_url_path: sanitizeUrl(
              event.properties.current_url_path
            ),
            current_url_search: undefined
          }
        };
      }
    },
    ip: true,
    persistence: "localStorage",
    track_pageview: "url-with-path"
  });
  initialized = true;
  return true;
}

function cleanProperties(properties: EventProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );
}

export function trackEvent(
  eventName: MixpanelEvent,
  properties: EventProperties = {},
  callback?: TrackEventCallback
) {
  if (!initializeMixpanel()) {
    callback?.(false);
    return false;
  }

  mixpanel.track(
    eventName,
    cleanProperties(properties),
    { send_immediately: true },
    (response) => {
      const success =
        response === 1 ||
        (typeof response === "object" && response.status === 1);
      callback?.(success);
    }
  );
  return true;
}

export function identifyUser(
  userId: string,
  locale: string,
  email?: string
) {
  if (!initializeMixpanel()) {
    return;
  }

  const identifiedUserId = mixpanel.get_property("$user_id");

  if (
    typeof identifiedUserId === "string" &&
    identifiedUserId !== userId
  ) {
    mixpanel.reset();
  }

  if (mixpanel.get_property("$user_id") !== userId) {
    mixpanel.identify(userId);
  }
  mixpanel.register({
    locale,
    platform: "web"
  });
  mixpanel.people.set({
    ...(email ? { $email: email } : {}),
    locale,
    platform: "web"
  });
}

export function resetAnalytics() {
  if (!initializeMixpanel()) {
    return;
  }

  mixpanel.reset();
}

const pendingSignUpMethodKey = "lineme-pending-sign-up-method";

export function setPendingSignUpMethod(method: "email" | "google") {
  window.localStorage.setItem(pendingSignUpMethodKey, method);
}

export function clearPendingSignUpMethod() {
  window.localStorage.removeItem(pendingSignUpMethodKey);
}

export function consumePendingSignUpMethod() {
  const method = window.localStorage.getItem(pendingSignUpMethodKey);
  clearPendingSignUpMethod();

  return method === "email" || method === "google" ? method : null;
}
