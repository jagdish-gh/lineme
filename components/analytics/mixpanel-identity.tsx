"use client";

import { type User } from "@supabase/supabase-js";
import { useLocale } from "next-intl";
import { useEffect, useMemo } from "react";

import {
  consumePendingSignUpMethod,
  identifyUser,
  MixpanelEvent,
  resetAnalytics,
  trackEvent
} from "@/lib/analytics/mixpanel";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const signUpWindowMs = 10 * 60 * 1000;
const signUpsInFlight = new Set<string>();

type SupabaseBrowserClient = NonNullable<
  ReturnType<typeof createSupabaseBrowserClient>
>;

function identifyAndTrackSignUp(
  user: User,
  locale: string,
  supabase: SupabaseBrowserClient
) {
  identifyUser(user.id, locale, user.email);

  const metadataSignUpMethod = user.user_metadata.lineme_sign_up_method;
  const pendingSignUpMethod = consumePendingSignUpMethod();
  const signUpMethod =
    metadataSignUpMethod === "email" || metadataSignUpMethod === "google"
      ? metadataSignUpMethod
      : pendingSignUpMethod;
  const createdAt = new Date(user.created_at).getTime();
  const isRecentlyCreated =
    Number.isFinite(createdAt) && Date.now() - createdAt <= signUpWindowMs;
  const trackedKey = `lineme-sign-up-tracked-${user.id}`;

  if (
    signUpMethod &&
    isRecentlyCreated &&
    !user.user_metadata.lineme_sign_up_tracked_at &&
    !window.localStorage.getItem(trackedKey) &&
    !signUpsInFlight.has(user.id)
  ) {
    signUpsInFlight.add(user.id);
    trackEvent(MixpanelEvent.SignUpCompleted, {
      email: user.email,
      locale,
      platform: "web",
      sign_up_method: signUpMethod
    }, (success) => {
      signUpsInFlight.delete(user.id);

      if (success) {
        window.localStorage.setItem(trackedKey, "true");
        void supabase.auth.updateUser({
          data: {
            lineme_sign_up_tracked_at: new Date().toISOString()
          }
        });
      }
    });
  }
}

export function MixpanelIdentity() {
  const locale = useLocale();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        identifyAndTrackSignUp(data.user, locale, supabase);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        resetAnalytics();
        return;
      }

      if (
        session?.user &&
        ["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(
          event
        )
      ) {
        identifyAndTrackSignUp(session.user, locale, supabase);
      }
    });

    return () => subscription.unsubscribe();
  }, [locale, supabase]);

  return null;
}
