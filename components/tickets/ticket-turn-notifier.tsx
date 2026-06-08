"use client";

import {
  BellRing,
  ChevronRight,
  Hash,
  MapPin,
  TicketCheck,
  UsersRound,
  X
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useTicketRealtime } from "@/components/tickets/use-ticket-realtime";
import { type SavedJoinedLine } from "@/lib/lines/public-line";

const notifiedStorageKey = "lineme-called-ticket-notifications";

function isActiveTicket(ticket: SavedJoinedLine) {
  return ["waiting", "called"].includes(ticket.ticket.status ?? "waiting");
}

function isWatchedTicket(ticket: SavedJoinedLine) {
  return isActiveTicket(ticket) || ticket.ticket.status === "no_show";
}

function getStoredTicketTokens() {
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith("lineme-ticket-"))
    .flatMap((key) => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(key) ?? "") as {
          ticketToken?: unknown;
        };

        return typeof stored.ticketToken === "string"
          ? [stored.ticketToken]
          : [];
      } catch {
        window.localStorage.removeItem(key);
        return [];
      }
    });
}

function getNotifiedTicketIds() {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(notifiedStorageKey) ?? "[]"
    ) as unknown;

    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === "string"))
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveNotifiedTicketIds(ids: Set<string>) {
  window.localStorage.setItem(notifiedStorageKey, JSON.stringify([...ids]));
}

function playTurnChime() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return;
  }

  const audio = new AudioContextConstructor();
  const notes = [880, 1175, 1568, 1175, 1568, 2093];

  for (const [index, frequency] of notes.entries()) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startsAt = audio.currentTime + index * 0.18;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, startsAt);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.34, startsAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.17);
  }

  window.setTimeout(() => void audio.close(), 1400);
}

export function TicketTurnNotifier() {
  const locale = useLocale();
  const t = useTranslations("tickets.turnNotification");
  const ticketsT = useTranslations("tickets");
  const [tickets, setTickets] = useState<SavedJoinedLine[]>([]);
  const [calledTicket, setCalledTicket] = useState<SavedJoinedLine | null>(null);
  const notifiedIdsRef = useRef<Set<string> | null>(null);

  const notifyTicket = useCallback((ticket: SavedJoinedLine) => {
    notifiedIdsRef.current ??= getNotifiedTicketIds();

    if (
      ticket.ticket.status !== "called" ||
      notifiedIdsRef.current.has(ticket.ticket.entryId)
    ) {
      return;
    }

    notifiedIdsRef.current.add(ticket.ticket.entryId);
    saveNotifiedTicketIds(notifiedIdsRef.current);
    setCalledTicket(ticket);

    try {
      playTurnChime();
      window.navigator.vibrate?.([300, 120, 300, 120, 450]);
    } catch {
      // Some browsers block sound or vibration until the user interacts.
    }
  }, []);

  const mergeTickets = useCallback(
    (incoming: SavedJoinedLine[]) => {
      setTickets((current) => {
        const merged = new Map(
          current
            .filter(isWatchedTicket)
            .map((ticket) => [ticket.ticket.ticketToken, ticket])
        );

        for (const ticket of incoming.filter(isWatchedTicket)) {
          merged.set(ticket.ticket.ticketToken, ticket);
          notifyTicket(ticket);
        }

        return [...merged.values()];
      });
    },
    [notifyTicket]
  );

  const refreshTicketByToken = useCallback(
    async (ticketToken: string) => {
      const response = await fetch("/api/lines/public/ticket", {
        body: JSON.stringify({ ticketToken }),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as SavedJoinedLine;
    },
    []
  );

  const loadTickets = useCallback(async () => {
    const tokenTickets = await Promise.all(
      [...new Set(getStoredTicketTokens())].map(refreshTicketByToken)
    );
    const loadedTickets = tokenTickets.filter(
      (ticket): ticket is SavedJoinedLine => Boolean(ticket)
    );

    try {
      const response = await fetch("/api/lines/public/tickets", {
        cache: "no-store"
      });

      if (response.ok) {
        const result = (await response.json()) as {
          tickets?: SavedJoinedLine[];
        };

        loadedTickets.push(...(result.tickets ?? []));
      }
    } catch {
      // Anonymous users and offline moments can still rely on device tickets.
    }

    mergeTickets(loadedTickets);
  }, [mergeTickets, refreshTicketByToken]);

  useEffect(() => {
    void loadTickets();

    const interval = window.setInterval(() => void loadTickets(), 15000);
    const onFocus = () => void loadTickets();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("lineme-ticket-")) {
        void loadTickets();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadTickets]);

  const realtimeTargets = useMemo(
    () =>
      tickets.filter(isActiveTicket).map((ticket) => ({
        entryId: ticket.ticket.entryId,
        lineId: ticket.line.id,
        ticketToken: ticket.ticket.ticketToken
      })),
    [tickets]
  );

  const refreshRealtimeTicket = useCallback(
    async (ticketToken: string) => {
      const refreshed = await refreshTicketByToken(ticketToken);

      if (refreshed) {
        mergeTickets([refreshed]);
      }
    },
    [mergeTickets, refreshTicketByToken]
  );

  useTicketRealtime({
    onRefreshTicket: refreshRealtimeTicket,
    targets: realtimeTargets
  });

  if (!calledTicket) {
    return null;
  }

  const lineType =
    calledTicket.line.line_type === "other" && calledTicket.line.custom_line_type
      ? calledTicket.line.custom_line_type
      : ticketsT(`types.${calledTicket.line.line_type}`);

  return (
    <div
      aria-live="assertive"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-2xl shadow-slate-950/25 dark:border-emerald-400/30 dark:bg-slate-950"
      role="alert"
    >
      <div className="bg-emerald-600 px-4 py-3 text-white dark:bg-emerald-500 dark:text-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/18">
              <BellRing className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                {t("eyebrow")}
              </p>
              <h2 className="truncate text-lg font-bold">
                {t("title")}
              </h2>
            </div>
          </div>
          <button
            aria-label={t("dismiss")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/14 transition hover:bg-white/24"
            onClick={() => setCalledTicket(null)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            <TicketCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-slate-950 dark:text-white">
              {calledTicket.line.name}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("description", { name: calledTicket.line.name })}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Hash className="h-3.5 w-3.5" />
              {t("ticketNumber")}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
              {calledTicket.ticket.positionNumber}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-100">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <UsersRound className="h-3.5 w-3.5" />
              {t("ahead")}
            </p>
            <p className="mt-1 text-2xl font-bold">
              {calledTicket.ticket.peopleAhead}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="rounded-full bg-slate-950/[0.04] px-2.5 py-1 dark:bg-white/[0.08]">
            {lineType}
          </span>
          <span className="rounded-full bg-slate-950/[0.04] px-2.5 py-1 font-mono tracking-[0.12em] dark:bg-white/[0.08]">
            {calledTicket.line.public_code}
          </span>
          {calledTicket.line.location ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/[0.04] px-2.5 py-1 dark:bg-white/[0.08]">
              <MapPin className="h-3.5 w-3.5" />
              {calledTicket.line.location}
            </span>
          ) : null}
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-100">
            {t("instruction")}
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
            href={`/${locale}/tickets`}
          >
            <TicketCheck className="h-4 w-4" />
            {t("viewTicket")}
            <ChevronRight className="h-4 w-4" />
          </a>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-950/5 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
            onClick={() => setCalledTicket(null)}
            type="button"
          >
            {t("dismissShort")}
          </button>
        </div>
      </div>
    </div>
  );
}
