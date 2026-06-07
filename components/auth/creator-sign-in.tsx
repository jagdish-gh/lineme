"use client";

import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ActionButton } from "@/components/ui/action-button";
import { Surface } from "@/components/ui/surface";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { isProviderDisabledError } from "@/lib/supabase/auth-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CreatorSignInProps = {
  errorCode?: string;
  nextPath: string;
};

export function CreatorSignIn({ errorCode, nextPath }: CreatorSignInProps) {
  const t = useTranslations("auth");
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState(
    errorCode ? t(`errors.${errorCode === "callback" ? "callback" : "configuration"}`) : ""
  );

  async function saveRedirectIntent() {
    const response = await fetch("/api/auth/redirect-intent", {
      body: JSON.stringify({ next: nextPath }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });

    if (!response.ok) {
      throw new Error("Could not save the post-login destination");
    }
  }

  async function signInWithGoogle() {
    if (!supabase) {
      setError(t("errors.configuration"));
      return;
    }

    setError("");
    setStatus("loading");

    try {
      await saveRedirectIntent();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });

      if (signInError) {
        setError(
          isProviderDisabledError(signInError)
            ? t("errors.googleProviderDisabled")
            : signInError.message
        );
        setStatus("idle");
      }
    } catch {
      setError(t("errors.callback"));
      setStatus("idle");
    }
  }

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError(t("errors.configuration"));
      return;
    }

    setError("");
    setStatus("loading");

    try {
      await saveRedirectIntent();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true
        }
      });

      if (signInError) {
        setError(signInError.message);
        setStatus("idle");
        return;
      }

      setStatus("sent");
    } catch {
      setError(t("errors.callback"));
      setStatus("idle");
    }
  }

  return (
    <Surface className="p-5 shadow-xl shadow-slate-950/10 sm:p-7 dark:shadow-black/20">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("description")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <GoogleSignInButton
          disabled={status === "loading"}
          onClick={signInWithGoogle}
          type="button"
        >
          {t("google")}
        </GoogleSignInButton>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          {t("or")}
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <form className="grid gap-3" onSubmit={sendMagicLink}>
          <label>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("emailLabel")}
            </span>
            <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-950/10 bg-white/80 px-4 text-slate-700 shadow-sm transition focus-within:border-teal-500/60 focus-within:ring-4 focus-within:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
              <Mail aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              <input
                type="email"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
            </span>
          </label>
          <ActionButton className="w-full" disabled={status === "loading"} type="submit">
            {status === "loading" ? (
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
            ) : null}
            {t("magicLink")}
          </ActionButton>
        </form>

        {status === "sent" ? (
          <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {t("sent")}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {t("notice")}
      </p>
    </Surface>
  );
}
