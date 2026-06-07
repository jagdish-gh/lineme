"use client";

import {
  CalendarDays,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  MapPin,
  RefreshCw,
  TicketCheck,
  UserMinus
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { CopyLineCodeButton } from "@/components/manage-lines/copy-line-code-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Surface } from "@/components/ui/surface";
import { type SavedJoinedLine } from "@/lib/lines/public-line";
import { cn } from "@/lib/utils";

type TicketFilter = "all" | "completed" | "dropped" | "pending";

type TicketHistoryProps = {
  tickets: SavedJoinedLine[];
};

const filters: TicketFilter[] = ["pending", "completed", "dropped", "all"];

function getTicketFilter(ticket: SavedJoinedLine): Exclude<TicketFilter, "all"> {
  if (ticket.ticket.status === "cancelled") {
    return "dropped";
  }

  if (ticket.ticket.status === "served" || ticket.line.status === "closed") {
    return "completed";
  }

  return "pending";
}

const categoryStyles = {
  pending:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
  completed:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  dropped:
    "bg-slate-500/10 text-slate-600 dark:bg-slate-300/10 dark:text-slate-300"
};

export function TicketHistory({ tickets }: TicketHistoryProps) {
  const locale = useLocale();
  const t = useTranslations("tickets");
  const [filter, setFilter] = useState<TicketFilter>("pending");
  const [history, setHistory] = useState(tickets);
  const [loadingBrowserTickets, setLoadingBrowserTickets] = useState(true);
  const [refreshingTicketId, setRefreshingTicketId] = useState("");
  const [leavingTicketId, setLeavingTicketId] = useState("");
  const [ticketToLeave, setTicketToLeave] = useState<SavedJoinedLine | null>(
    null
  );
  const [refreshErrors, setRefreshErrors] = useState<Record<string, string>>({});
  const visibleTickets = useMemo(
    () =>
      filter === "all"
        ? history
        : history.filter((ticket) => getTicketFilter(ticket) === filter),
    [filter, history]
  );
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short"
      }),
    [locale]
  );

  useEffect(() => {
    let active = true;

    async function restoreBrowserTickets() {
      const savedTickets = Object.keys(window.localStorage)
        .filter((key) => key.startsWith("lineme-ticket-"))
        .flatMap((key) => {
          try {
            const stored = JSON.parse(window.localStorage.getItem(key) ?? "") as {
              ticketToken?: unknown;
            };

            return typeof stored.ticketToken === "string"
              ? [{ key, ticketToken: stored.ticketToken }]
              : [];
          } catch {
            window.localStorage.removeItem(key);
            return [];
          }
        });

      const restored = (
        await Promise.all(
          savedTickets.map(async ({ key, ticketToken }) => {
            try {
              const response = await fetch("/api/lines/public/ticket", {
                body: JSON.stringify({ ticketToken }),
                cache: "no-store",
                headers: { "Content-Type": "application/json" },
                method: "POST"
              });

              if (response.status === 404) {
                window.localStorage.removeItem(key);
                return null;
              }

              return response.ok
                ? ((await response.json()) as SavedJoinedLine)
                : null;
            } catch {
              return null;
            }
          })
        )
      ).filter((ticket): ticket is SavedJoinedLine => Boolean(ticket));

      if (active) {
        setHistory((current) => {
          const merged = new Map(
            current.map((ticket) => [ticket.ticket.ticketToken, ticket])
          );

          for (const ticket of restored) {
            merged.set(ticket.ticket.ticketToken, ticket);
          }

          return [...merged.values()].sort(
            (a, b) =>
              new Date(b.ticket.joinedAt ?? 0).getTime() -
              new Date(a.ticket.joinedAt ?? 0).getTime()
          );
        });
        setLoadingBrowserTickets(false);
      }
    }

    void restoreBrowserTickets();

    return () => {
      active = false;
    };
  }, []);

  async function refreshTicket(ticket: SavedJoinedLine) {
    const entryId = ticket.ticket.entryId;
    setRefreshingTicketId(entryId);
    setRefreshErrors((current) => ({ ...current, [entryId]: "" }));

    try {
      const response = await fetch("/api/lines/public/ticket", {
        body: JSON.stringify({ ticketToken: ticket.ticket.ticketToken }),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Ticket refresh failed");
      }

      const refreshed = (await response.json()) as SavedJoinedLine;
      setHistory((current) =>
        current.map((item) =>
          item.ticket.entryId === entryId ? refreshed : item
        )
      );
    } catch {
      setRefreshErrors((current) => ({
        ...current,
        [entryId]: t("refreshError")
      }));
    } finally {
      setRefreshingTicketId("");
    }
  }

  async function leaveTicket() {
    if (!ticketToLeave) {
      return;
    }

    const entryId = ticketToLeave.ticket.entryId;
    setLeavingTicketId(entryId);
    setRefreshErrors((current) => ({ ...current, [entryId]: "" }));

    try {
      const response = await fetch("/api/lines/public/ticket", {
        body: JSON.stringify({
          ticketToken: ticketToLeave.ticket.ticketToken
        }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Leave ticket failed");
      }

      setHistory((current) =>
        current.map((item) =>
          item.ticket.entryId === entryId
            ? {
                ...item,
                ticket: {
                  ...item.ticket,
                  peopleAhead: 0,
                  status: "cancelled"
                }
              }
            : item
        )
      );
      window.localStorage.removeItem(
        `lineme-ticket-${ticketToLeave.line.public_code}`
      );
      setTicketToLeave(null);
    } catch {
      setTicketToLeave(null);
      setRefreshErrors((current) => ({
        ...current,
        [entryId]: t("leave.error")
      }));
    } finally {
      setLeavingTicketId("");
    }
  }

  return (
    <>
      <div
        aria-label={t("filters.label")}
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
      >
        {filters.map((item) => {
          const count =
            item === "all"
              ? history.length
              : history.filter((ticket) => getTicketFilter(ticket) === item)
                  .length;

          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
              className={cn(
                "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
                filter === item
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-300 dark:bg-teal-300 dark:text-slate-950"
                  : "border-slate-950/10 bg-white/65 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
              )}
            >
              {t(`filters.${item}`)}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  filter === item
                    ? "bg-white/20 dark:bg-slate-950/10"
                    : "bg-slate-950/5 dark:bg-white/10"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visibleTickets.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {visibleTickets.map((ticket) => {
            const category = getTicketFilter(ticket);
            const isActiveTicket = ["waiting", "called"].includes(
              ticket.ticket.status ?? "waiting"
            );
            const CategoryIcon =
              category === "pending"
                ? Clock3
                : category === "completed"
                  ? CheckCircle2
                  : CircleSlash2;

            return (
              <Surface
                key={ticket.ticket.entryId}
                className="overflow-hidden p-5 sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        categoryStyles[category]
                      )}
                    >
                      <CategoryIcon aria-hidden="true" className="h-3.5 w-3.5" />
                      {t(`categories.${category}`)}
                    </span>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {t("lineName")}
                    </p>
                    <h2 className="mt-0.5 truncate text-xl font-semibold text-slate-950 dark:text-white">
                      {ticket.line.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("lineType")}:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {ticket.line.line_type === "other" &&
                        ticket.line.custom_line_type
                          ? ticket.line.custom_line_type
                          : t(`types.${ticket.line.line_type}`)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="rounded-xl bg-slate-950/[0.035] px-3 py-2 font-mono text-xs font-bold tracking-[0.1em] text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                      {ticket.line.public_code}
                    </span>
                    <CopyLineCodeButton
                      code={ticket.line.public_code}
                      copiedLabel={t("codeCopied")}
                      copyLabel={t("copyCode")}
                    />
                  </div>
                </div>

                {ticket.line.location ? (
                  <p className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                    />
                    {ticket.line.location}
                  </p>
                ) : null}

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-teal-500/10 p-4 dark:bg-teal-300/10">
                    <dt className="text-xs font-semibold text-teal-800 dark:text-teal-200">
                      {t("yourNumber")}
                    </dt>
                    <dd className="mt-1 text-3xl font-bold text-teal-700 dark:text-teal-200">
                      {ticket.ticket.positionNumber}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">
                      {t("peopleAheadLabel")}
                    </dt>
                    <dd className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                      {ticket.ticket.peopleAhead}
                    </dd>
                    <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t("peopleAhead", {
                        count: ticket.ticket.peopleAhead
                      })}
                    </dd>
                  </div>
                </dl>

                <div
                  className={cn(
                    "mt-3 rounded-2xl border p-4",
                    ticket.ticket.status === "called"
                      ? "border-emerald-300 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-400/10"
                      : "border-slate-950/5 bg-white/55 dark:border-white/10 dark:bg-white/[0.04]"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("ticketStatus")}
                      </p>
                      <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                        {t(`status.${ticket.ticket.status ?? "waiting"}`)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={
                          refreshingTicketId === ticket.ticket.entryId ||
                          leavingTicketId === ticket.ticket.entryId
                        }
                        onClick={() => void refreshTicket(ticket)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-950/10 bg-white/75 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                      >
                        <RefreshCw
                          aria-hidden="true"
                          className={cn(
                            "h-3.5 w-3.5",
                            refreshingTicketId === ticket.ticket.entryId &&
                              "animate-spin"
                          )}
                        />
                        {refreshingTicketId === ticket.ticket.entryId
                          ? t("refreshing")
                          : t("refresh")}
                      </button>
                      {isActiveTicket ? (
                        <button
                          type="button"
                          disabled={
                            refreshingTicketId === ticket.ticket.entryId ||
                            leavingTicketId === ticket.ticket.entryId
                          }
                          onClick={() => setTicketToLeave(ticket)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:border-rose-400/25 dark:bg-rose-400/5 dark:text-rose-300 dark:hover:bg-rose-400/10"
                        >
                          <UserMinus aria-hidden="true" className="h-3.5 w-3.5" />
                          {t("leave.button")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {refreshErrors[ticket.ticket.entryId] ? (
                  <p
                    role="alert"
                    className="mt-3 text-xs font-medium text-rose-700 dark:text-rose-300"
                  >
                    {refreshErrors[ticket.ticket.entryId]}
                  </p>
                ) : null}

                {ticket.ticket.joinedAt ? (
                  <p className="mt-4 flex items-center gap-2 border-t border-slate-950/5 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    {t("joined", {
                      date: formatter.format(new Date(ticket.ticket.joinedAt))
                    })}
                  </p>
                ) : null}
              </Surface>
            );
          })}
        </div>
      ) : loadingBrowserTickets ? (
        <Surface className="mt-5 p-8 text-center sm:p-10">
          <RefreshCw
            aria-label={t("loading")}
            className="mx-auto h-6 w-6 animate-spin text-teal-600 dark:text-teal-300"
          />
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {t("loading")}
          </p>
        </Surface>
      ) : (
        <Surface className="mt-5 p-8 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
            <TicketCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("empty.description")}
          </p>
        </Surface>
      )}
      <ConfirmationDialog
        open={Boolean(ticketToLeave)}
        title={t("leave.title")}
        description={t("leave.description", {
          name: ticketToLeave?.line.name ?? ""
        })}
        cancelLabel={t("leave.cancel")}
        confirmLabel={t("leave.confirm")}
        loading={Boolean(leavingTicketId)}
        loadingLabel={t("leave.leaving")}
        onCancel={() => {
          if (!leavingTicketId) {
            setTicketToLeave(null);
          }
        }}
        onConfirm={() => void leaveTicket()}
      />
    </>
  );
}
