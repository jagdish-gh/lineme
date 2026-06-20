"use client";

import { BellRing, LoaderCircle, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  clearPendingPushPrompt,
  readPendingPushPrompt,
  subscribeTicketToPush,
  type PendingPushPrompt
} from "@/lib/push/client";

export function PushNotificationPrompt() {
  const locale = useLocale();
  const t = useTranslations("tickets.pushPrompt");
  const [prompt, setPrompt] = useState<PendingPushPrompt | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    function syncPrompt() {
      setPrompt(readPendingPushPrompt());
      setStatus("idle");
    }

    syncPrompt();
    window.addEventListener("lineme:push-prompt", syncPrompt);
    window.addEventListener("storage", syncPrompt);

    return () => {
      window.removeEventListener("lineme:push-prompt", syncPrompt);
      window.removeEventListener("storage", syncPrompt);
    };
  }, []);

  async function enablePush() {
    if (!prompt) {
      return;
    }

    setStatus("loading");

    try {
      await subscribeTicketToPush(prompt.ticketToken, locale);
      clearPendingPushPrompt();
      setPrompt(null);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  function dismissPrompt() {
    clearPendingPushPrompt();
    setPrompt(null);
    setStatus("idle");
  }

  if (!prompt) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-3xl border border-teal-200 bg-white p-4 shadow-2xl shadow-slate-950/20 dark:border-teal-300/25 dark:bg-slate-950"
      role="dialog"
      aria-modal="false"
      aria-labelledby="push-prompt-title"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
          <BellRing aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="push-prompt-title"
            className="text-base font-semibold text-slate-950 dark:text-white"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("description", { name: prompt.lineName })}
          </p>
          {status === "error" ? (
            <p className="mt-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-700 dark:text-rose-200">
              {t("error")}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
              disabled={status === "loading"}
              onClick={() => void enablePush()}
              type="button"
            >
              {status === "loading" ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
              ) : (
                <BellRing aria-hidden="true" className="h-4 w-4" />
              )}
              {status === "loading" ? t("enabling") : t("enable")}
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-950/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              disabled={status === "loading"}
              onClick={dismissPrompt}
              type="button"
            >
              {t("notNow")}
            </button>
          </div>
        </div>
        <button
          aria-label={t("dismiss")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          disabled={status === "loading"}
          onClick={dismissPrompt}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
