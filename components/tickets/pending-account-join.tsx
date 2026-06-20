"use client";

import { LoaderCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCreatorSession } from "@/components/auth/use-creator-session";
import { MixpanelEvent, trackEvent } from "@/lib/analytics/mixpanel";
import {
  normalizeLineCode,
  type JoinedLineTicket,
  type PublicLine
} from "@/lib/lines/public-line";
import { queuePushPrompt } from "@/lib/push/client";

export const pendingAccountJoinStorageKey = "lineme-pending-account-join";

type LineDiscoveryMethod = "qr" | "search" | "share_link";

type PendingAccountJoin = {
  answers: Record<string, string>;
  code: string;
  discoveryMethod: LineDiscoveryMethod;
};

function readPendingAccountJoin() {
  try {
    const stored = window.localStorage.getItem(pendingAccountJoinStorageKey);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<PendingAccountJoin>;
    const code = normalizeLineCode(
      typeof parsed.code === "string" ? parsed.code : ""
    );

    if (code.length !== 10) {
      window.localStorage.removeItem(pendingAccountJoinStorageKey);
      return null;
    }

    return {
      answers:
        parsed.answers &&
        typeof parsed.answers === "object" &&
        !Array.isArray(parsed.answers)
          ? parsed.answers
          : {},
      code,
      discoveryMethod:
        parsed.discoveryMethod === "qr" ||
        parsed.discoveryMethod === "search" ||
        parsed.discoveryMethod === "share_link"
          ? parsed.discoveryMethod
          : "share_link"
    };
  } catch {
    window.localStorage.removeItem(pendingAccountJoinStorageKey);
    return null;
  }
}

export function PendingAccountJoinRedirect() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user } = useCreatorSession();

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (!readPendingAccountJoin()) {
      return;
    }

    if (pathname !== `/${locale}/tickets`) {
      router.replace(`/${locale}/tickets`);
    }
  }, [loading, locale, pathname, router, user]);

  return null;
}

export function AuthCodeRedirect() {
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/auth/callback" || typeof window === "undefined") {
      return;
    }

    const currentUrl = new URL(window.location.href);

    if (!currentUrl.searchParams.has("code")) {
      return;
    }

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.search = currentUrl.search;

    if (readPendingAccountJoin()) {
      callbackUrl.searchParams.set("next", `/${locale}/tickets`);
    }

    window.location.replace(callbackUrl.toString());
  }, [locale, pathname]);

  return null;
}

export function PendingAccountJoin() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("tickets.pendingJoin");
  const { loading, user } = useCreatorSession();
  const processingRef = useRef(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function finishPendingJoin() {
      if (loading || !user || processingRef.current) {
        return;
      }

      const pendingJoin = readPendingAccountJoin();

      if (!pendingJoin) {
        return;
      }

      processingRef.current = true;
      setError("");
      setProcessing(true);

      try {
        const lineResponse = await fetch(
          `/api/lines/public?code=${encodeURIComponent(pendingJoin.code)}`,
          { cache: "no-store" }
        );
        const lineResult = (await lineResponse.json()) as {
          line?: PublicLine;
        };

        if (!lineResponse.ok || !lineResult.line) {
          throw new Error("Pending line lookup failed");
        }

        const joinResponse = await fetch("/api/lines/public", {
          body: JSON.stringify({
            answers: pendingJoin.answers,
            code: pendingJoin.code,
            joinWithAccount: true
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST"
        });
        const joinResult = (await joinResponse.json()) as {
          ticket?: JoinedLineTicket;
        };

        if (!joinResponse.ok || !joinResult.ticket) {
          throw new Error("Pending account join failed");
        }

        const joinedTicket = {
          ...joinResult.ticket,
          status: "waiting" as const
        };

        window.localStorage.removeItem(pendingAccountJoinStorageKey);
        window.localStorage.removeItem(
          `lineme-join-draft-${lineResult.line.public_code}`
        );
        window.localStorage.setItem(
          `lineme-ticket-${lineResult.line.public_code}`,
          JSON.stringify(joinedTicket)
        );
        queuePushPrompt({
          lineName: lineResult.line.name,
          ticketToken: joinedTicket.ticketToken
        });
        trackEvent(MixpanelEvent.LineJoined, {
          join_method: pendingJoin.discoveryMethod,
          line_id: lineResult.line.id,
          line_type: lineResult.line.line_type
        });
        router.replace(`/${locale}/tickets`);
        router.refresh();
      } catch {
        setError(t("error"));
      } finally {
        processingRef.current = false;
        setProcessing(false);
      }
    }

    void finishPendingJoin();
  }, [loading, locale, router, t, user]);

  if (!processing && !error) {
    return null;
  }

  return (
    <div
      role={error ? "alert" : "status"}
      className="mb-5 flex items-center gap-3 rounded-2xl bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-800 dark:text-teal-200"
    >
      {processing ? (
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : null}
      <span>{error || t("loading")}</span>
    </div>
  );
}
