"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Link2,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  TicketCheck,
  UserMinus,
  UsersRound
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { QrCodeScanner } from "@/components/join-line/qr-code-scanner";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Surface } from "@/components/ui/surface";
import {
  normalizeLineCode,
  type JoinedLineTicket,
  type PublicLine,
  type SavedJoinedLine
} from "@/lib/lines/public-line";

type JoinLineExperienceProps = {
  initialCode: string;
};

type RequestStatus = "idle" | "joining" | "searching";

function InlineError({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="mt-3 rounded-xl border border-rose-200 bg-rose-50/85 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"
    >
      {message}
    </p>
  );
}

export function JoinLineExperience({
  initialCode
}: JoinLineExperienceProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("joinLine");
  const [code, setCode] = useState(normalizeLineCode(initialCode));
  const [line, setLine] = useState<PublicLine | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ticket, setTicket] = useState<JoinedLineTicket | null>(null);
  const [savedLines, setSavedLines] = useState<SavedJoinedLine[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [openingTicketToken, setOpeningTicketToken] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [requestResponses, setRequestResponses] = useState<Record<string, string>>({});
  const [respondingRequestId, setRespondingRequestId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [qrError, setQrError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [ticketError, setTicketError] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchSavedTicket(ticketToken: string) {
    try {
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
    } catch {
      return null;
    }
  }

  async function restoreTicketForLine(foundLine: PublicLine) {
    const storedValue = window.localStorage.getItem(
      `lineme-ticket-${foundLine.public_code}`
    );

    if (!storedValue) {
      return;
    }

    try {
      const storedTicket = JSON.parse(storedValue) as JoinedLineTicket;
      const restored = await fetchSavedTicket(storedTicket.ticketToken);

      if (restored) {
        setLine(restored.line);
        setTicket(restored.ticket);
        setSavedLines((current) => [
          restored,
          ...current.filter(
            (item) => item.ticket.ticketToken !== restored.ticket.ticketToken
          )
        ]);
      } else {
        window.localStorage.removeItem(
          `lineme-ticket-${foundLine.public_code}`
        );
      }
    } catch {
      window.localStorage.removeItem(`lineme-ticket-${foundLine.public_code}`);
    }
  }

  async function findLine(value = code, source: "qr" | "search" = "search") {
    const normalizedCode = normalizeLineCode(value);
    const setLookupError = source === "qr" ? setQrError : setSearchError;

    if (normalizedCode.length !== 10) {
      setLookupError(t("errors.invalidCode"));
      return;
    }

    setCode(normalizedCode);
    setSearchError("");
    setQrError("");
    setJoinError("");
    setTicketError("");
    setStatus("searching");
    setLine(null);
    setTicket(null);

    try {
      const response = await fetch(
        `/api/lines/public?code=${encodeURIComponent(normalizedCode)}`,
        { cache: "no-store" }
      );
      const result = (await response.json()) as {
        code?: string;
        line?: PublicLine;
      };

      if (!response.ok || !result.line) {
        setLookupError(
          result.code === "line_not_found"
            ? t("errors.notFound")
            : t("errors.lookup")
        );
        return;
      }

      setLine(result.line);
      setAnswers({});
      await restoreTicketForLine(result.line);
      router.replace(`/${locale}/join/${result.line.public_code}`, {
        scroll: false
      });
    } catch {
      setLookupError(t("errors.lookup"));
    } finally {
      setStatus("idle");
    }
  }

  useEffect(() => {
    async function restoreSavedLines() {
      const ticketKeys = Array.from(
        { length: window.localStorage.length },
        (_, index) => window.localStorage.key(index)
      ).filter((key): key is string => Boolean(key?.startsWith("lineme-ticket-")));
      const savedTickets: Array<{ key: string; token: string }> = [];

      for (const key of ticketKeys) {
        try {
          const stored = JSON.parse(
            window.localStorage.getItem(key) ?? ""
          ) as JoinedLineTicket;

          if (stored.ticketToken) {
            savedTickets.push({ key, token: stored.ticketToken });
          } else {
            window.localStorage.removeItem(key);
          }
        } catch {
          window.localStorage.removeItem(key);
        }
      }

      try {
        const restoredResults = await Promise.all(
          savedTickets.map(async ({ key, token }) => {
            const restored = await fetchSavedTicket(token);

            if (!restored) {
              window.localStorage.removeItem(key);
            }

            return restored;
          })
        );
        const restored = restoredResults.filter(
          (item): item is SavedJoinedLine => Boolean(item)
        );

        setSavedLines(restored);

        if (normalizeLineCode(initialCode).length === 10) {
          await findLine(initialCode);
        }
      } finally {
        setLoadingSaved(false);
      }
    }

    void restoreSavedLines();
    // The initial share-link code should be resolved only on first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function joinLine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!line) {
      return;
    }

    setJoinError("");
    setStatus("joining");

    try {
      const response = await fetch("/api/lines/public", {
        body: JSON.stringify({ answers, code: line.public_code }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const result = (await response.json()) as {
        code?: string;
        ticket?: JoinedLineTicket;
      };

      if (!response.ok || !result.ticket) {
        const errorKey =
          result.code &&
          [
            "line_at_capacity",
            "line_not_active",
            "required_answer_missing"
          ].includes(result.code)
            ? result.code
            : "join_failed";
        setJoinError(t(`errors.${errorKey}`));
        return;
      }

      const joinedTicket = { ...result.ticket, status: "waiting" as const };
      setTicket(joinedTicket);
      window.localStorage.setItem(
        `lineme-ticket-${line.public_code}`,
        JSON.stringify(joinedTicket)
      );
      setSavedLines((current) => [
        { line, ticket: joinedTicket },
        ...current.filter(
          (item) => item.ticket.ticketToken !== joinedTicket.ticketToken
        )
      ]);
    } catch {
      setJoinError(t("errors.join_failed"));
    } finally {
      setStatus("idle");
    }
  }

  function handleScannedCode(scannedCode: string) {
    setCode(scannedCode);
    void findLine(scannedCode, "qr");
  }

  async function copyShareLink() {
    if (!line) {
      return;
    }

    const shareUrl = `${window.location.origin}/${locale}/join/${line.public_code}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareLine() {
    if (!line) {
      return;
    }

    const url = `${window.location.origin}/${locale}/join/${line.public_code}`;

    if (navigator.share) {
      await navigator.share({ text: t("shareText", { name: line.name }), url });
      return;
    }

    await copyShareLink();
  }

  async function refreshTicket() {
    if (!ticket) {
      return;
    }

    setStatus("searching");
    setTicketError("");

    try {
      const restored = await fetchSavedTicket(ticket.ticketToken);

      if (!restored) {
        setTicketError(t("errors.ticket_lookup"));
        return;
      }

      setLine(restored.line);
      setTicket(restored.ticket);
      setSavedLines((current) => [
        restored,
        ...current.filter(
          (item) => item.ticket.ticketToken !== restored.ticket.ticketToken
        )
      ]);
    } catch {
      setTicketError(t("errors.ticket_lookup"));
    } finally {
      setStatus("idle");
    }
  }

  async function openSavedLine(savedLine: SavedJoinedLine) {
    setOpeningTicketToken(savedLine.ticket.ticketToken);
    setTicketError("");
    setLine(savedLine.line);
    setTicket(savedLine.ticket);
    setCode(savedLine.line.public_code);

    try {
      const restored = await fetchSavedTicket(savedLine.ticket.ticketToken);

      if (!restored) {
        setTicketError(t("errors.ticket_lookup"));
        return;
      }

      setLine(restored.line);
      setTicket(restored.ticket);
      setCode(restored.line.public_code);
      setSavedLines((current) => [
        restored,
        ...current.filter(
          (item) => item.ticket.ticketToken !== restored.ticket.ticketToken
        )
      ]);
      window.localStorage.setItem(
        `lineme-ticket-${restored.line.public_code}`,
        JSON.stringify(restored.ticket)
      );
    } finally {
      setOpeningTicketToken("");
    }
  }

  function closeTicket() {
    setLine(null);
    setTicket(null);
    setCode("");
    setTicketError("");
  }

  async function leaveLine() {
    if (
      !line ||
      !ticket ||
      !["waiting", "called"].includes(ticket.status ?? "waiting")
    ) {
      return;
    }

    setLeaving(true);
    setTicketError("");

    try {
      const response = await fetch("/api/lines/public/ticket", {
        body: JSON.stringify({ ticketToken: ticket.ticketToken }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE"
      });
      const result = (await response.json()) as { code?: string };

      if (!response.ok) {
        setLeaveDialogOpen(false);
        setTicketError(
          result.code === "already_completed"
            ? t("errors.already_completed")
            : t("errors.leave_failed")
        );
        return;
      }

      window.localStorage.removeItem(`lineme-ticket-${line.public_code}`);
      setSavedLines((current) =>
        current.filter(
          (item) => item.ticket.ticketToken !== ticket.ticketToken
        )
      );
      setLine(null);
      setTicket(null);
      setCode("");
      setLeaveDialogOpen(false);
    } catch {
      setLeaveDialogOpen(false);
      setTicketError(t("errors.leave_failed"));
    } finally {
      setLeaving(false);
    }
  }

  async function respondToRequest(requestId: string) {
    if (!ticket) {
      return;
    }

    const responseText = requestResponses[requestId]?.trim();

    if (!responseText) {
      setTicketError(t("errors.response_required"));
      return;
    }

    setRespondingRequestId(requestId);
    setTicketError("");

    try {
      const response = await fetch("/api/lines/public/ticket/request", {
        body: JSON.stringify({
          requestId,
          response: responseText,
          ticketToken: ticket.ticketToken
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        setTicketError(t("errors.response_failed"));
        return;
      }

      const restored = await fetchSavedTicket(ticket.ticketToken);
      if (restored) {
        setTicket(restored.ticket);
        setLine(restored.line);
        setSavedLines((current) => [
          restored,
          ...current.filter(
            (item) => item.ticket.ticketToken !== restored.ticket.ticketToken
          )
        ]);
      }
    } catch {
      setTicketError(t("errors.response_failed"));
    } finally {
      setRespondingRequestId("");
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
      <div className="grid content-start gap-5">
        <Surface className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
              <Search aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("search.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("search.description")}
              </p>
            </div>
          </div>

          <form
            className="mt-5 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void findLine();
            }}
          >
            <input
              aria-label={t("search.label")}
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
              maxLength={10}
              placeholder={t("search.placeholder")}
              value={code}
              onChange={(event) => {
                setCode(normalizeLineCode(event.target.value));
                setSearchError("");
              }}
              className="min-h-12 min-w-0 flex-1 rounded-2xl border border-slate-950/10 bg-white/80 px-4 font-mono text-base font-bold uppercase tracking-[0.12em] text-slate-950 shadow-sm outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
            <ActionButton
              type="submit"
              size="medium"
              disabled={status === "searching"}
              className="w-full px-4 sm:w-auto"
            >
              {status === "searching" ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Search aria-hidden="true" className="h-4 w-4" />
              )}
              <span>{t("search.button")}</span>
            </ActionButton>
          </form>
          <InlineError message={searchError} />
        </Surface>

        <Surface className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:bg-sky-300/10 dark:text-sky-200">
              <Share2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("sharedLink.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("sharedLink.description")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-950/[0.035] px-4 py-3 text-xs text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
            <Link2 aria-hidden="true" className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" />
            <span className="truncate">lineme.app/{locale}/join/XXXXXXXXXX</span>
          </div>
        </Surface>

        <Surface className="p-5 sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-700 dark:bg-violet-300/10 dark:text-violet-200">
              <ScanQrIcon />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {t("qr.title")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("qr.description")}
              </p>
            </div>
          </div>
          <QrCodeScanner onCode={handleScannedCode} />
          <InlineError message={qrError} />
        </Surface>
      </div>

      <div
        className={`min-w-0 ${
          line || savedLines.length ? "order-first lg:order-none" : ""
        }`}
      >
        {ticket && line ? (
          <Surface className="p-6 text-center sm:p-8">
            <button
              type="button"
              onClick={closeTicket}
              className="mb-2 inline-flex min-h-9 items-center gap-2 self-start rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-950/5 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white sm:float-left"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {t("saved.back")}
            </button>
            <div className="clear-both" />
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <TicketCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
              {t(`success.status.${ticket.status ?? "waiting"}`)}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
              {t("success.title", { name: line.name })}
            </h2>
            <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("success.position")}
                </p>
                <p className="mt-1 text-3xl font-bold text-teal-700 dark:text-teal-200">
                  {ticket.positionNumber}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("success.ahead")}
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">
                  {ticket.peopleAhead}
                </p>
              </div>
            </div>
            {ticket.requests?.some((request) => request.status === "pending") ? (
              <div className="mx-auto mt-6 max-w-lg space-y-3 text-left">
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">
                  {t("extraInfo.title")}
                </h3>
                {ticket.requests
                  .filter((request) => request.status === "pending")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-400/10"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {request.prompt}
                      </p>
                      <textarea
                        rows={3}
                        maxLength={1000}
                        value={requestResponses[request.id] ?? ""}
                        onChange={(event) =>
                          setRequestResponses((current) => ({
                            ...current,
                            [request.id]: event.target.value
                          }))
                        }
                        placeholder={t("extraInfo.placeholder")}
                        className="mt-3 w-full resize-none rounded-xl border border-slate-950/10 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-slate-950/30 dark:text-white"
                      />
                      <ActionButton
                        type="button"
                        size="small"
                        className="mt-3 w-full sm:w-auto"
                        disabled={respondingRequestId === request.id}
                        onClick={() => void respondToRequest(request.id)}
                      >
                        {respondingRequestId === request.id ? (
                          <LoaderCircle
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin"
                          />
                        ) : null}
                        {respondingRequestId === request.id
                          ? t("extraInfo.sending")
                          : t("extraInfo.submit")}
                      </ActionButton>
                    </div>
                  ))}
              </div>
            ) : null}
            {ticket.status === "served" ? (
              <p className="mx-auto mt-5 max-w-md rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium leading-6 text-emerald-800 dark:text-emerald-200">
                {t("success.servedInfo")}
              </p>
            ) : ticket.status === "cancelled" ? (
              <p className="mx-auto mt-5 max-w-md rounded-2xl bg-slate-500/10 px-4 py-3 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
                {t("success.cancelledInfo")}
              </p>
            ) : (
              <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("success.saved")}
              </p>
            )}
            {["waiting", "called"].includes(ticket.status ?? "waiting") ? (
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <ActionButton
                  type="button"
                  variant="secondary"
                  size="small"
                  disabled={status === "searching" || leaving}
                  onClick={refreshTicket}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={`h-4 w-4 ${status === "searching" ? "animate-spin" : ""}`}
                  />
                  {t("saved.refresh")}
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="danger"
                  size="small"
                  disabled={leaving || status === "searching"}
                  onClick={() => setLeaveDialogOpen(true)}
                >
                  {leaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <UserMinus aria-hidden="true" className="h-4 w-4" />
                  )}
                  {leaving ? t("leave.leaving") : t("leave.button")}
                </ActionButton>
              </div>
            ) : null}
            <InlineError message={ticketError} />
          </Surface>
        ) : line ? (
          <Surface className="overflow-hidden">
            <div className="border-b border-slate-950/5 p-5 sm:p-7 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    line.status === "active"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                  }`}
                >
                  {t(`status.${line.status}`)}
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {line.public_code}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">
                {line.name}
              </h2>
              {line.location ? (
                <p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                  />
                  {line.location}
                </p>
              ) : null}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="flex gap-2 rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
                  <UsersRound
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 text-teal-600 dark:text-teal-300"
                  />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("line.waiting")}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {t("line.people", { count: line.waiting_count })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
                  <Clock3
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 text-teal-600 dark:text-teal-300"
                  />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("line.estimated")}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {line.estimated_service_minutes
                        ? t("line.minutes", {
                            count: line.estimated_service_minutes
                          })
                        : t("line.notAvailable")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={shareLine}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-950/10 bg-white/75 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("share")}
                </button>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-950/10 bg-white/75 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  {copied ? (
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {copied ? t("copied") : t("copyLink")}
                </button>
              </div>
            </div>

            <form className="p-5 sm:p-7" onSubmit={joinLine}>
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-300"
                />
                <div>
                  <h3 className="font-semibold text-slate-950 dark:text-white">
                    {line.questions.length
                      ? t("form.title")
                      : t("form.readyTitle")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {line.questions.length
                      ? t("form.description")
                      : t("form.readyDescription")}
                  </p>
                </div>
              </div>

              {line.questions.length ? (
                <div className="mt-6 grid gap-5">
                  {line.questions.map((question) => (
                    <label key={question.id}>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {question.label}
                        {question.is_required ? (
                          <span className="ml-1 text-rose-500" aria-hidden="true">
                            *
                          </span>
                        ) : null}
                      </span>
                      {question.answer_type === "choice" ? (
                        <select
                          required={question.is_required}
                          value={answers[question.id] ?? ""}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: event.target.value
                            }))
                          }
                          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-950/10 bg-white/80 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        >
                          <option value="">{t("form.selectOption")}</option>
                          {question.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            question.answer_type === "number"
                              ? "number"
                              : question.answer_type === "phone"
                                ? "tel"
                                : question.answer_type
                          }
                          required={question.is_required}
                          value={answers[question.id] ?? ""}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [question.id]: event.target.value
                            }))
                          }
                          className="mt-2 min-h-12 w-full rounded-2xl border border-slate-950/10 bg-white/80 px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500/60 focus:ring-4 focus:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-white"
                        />
                      )}
                    </label>
                  ))}
                </div>
              ) : null}

              <ActionButton
                type="submit"
                className="mt-6 w-full"
                disabled={status === "joining" || line.status !== "active"}
              >
                {status === "joining" ? (
                  <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                ) : null}
                {line.status === "active"
                  ? t("form.joinButton")
                  : t("form.unavailableButton")}
              </ActionButton>
              <InlineError message={joinError} />
            </form>
          </Surface>
        ) : savedLines.length ? (
          <Surface className="p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                <TicketCheck aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                  {t("saved.title")}
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {t("saved.description")}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {savedLines.map((savedLine) => (
                <button
                  key={savedLine.ticket.ticketToken}
                  type="button"
                  disabled={Boolean(openingTicketToken)}
                  onClick={() => void openSavedLine(savedLine)}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-950/10 bg-white/70 p-4 text-left transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-950 dark:text-white">
                      {savedLine.line.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                      {t(
                        `success.status.${savedLine.ticket.status ?? "waiting"}`
                      )}{" "}
                      · {t("success.position")} {savedLine.ticket.positionNumber}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-teal-700 dark:text-teal-200">
                    {openingTicketToken === savedLine.ticket.ticketToken ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin"
                      />
                    ) : (
                      t("saved.open")
                    )}
                  </span>
                </button>
              ))}
            </div>
          </Surface>
        ) : (
          <Surface className="grid min-h-64 place-items-center p-7 text-center sm:min-h-[28rem]">
            <div className="max-w-md">
              {loadingSaved ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto h-7 w-7 animate-spin text-teal-600 dark:text-teal-300"
                />
              ) : (
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                  <TicketCheck aria-hidden="true" className="h-7 w-7" />
                </span>
              )}
              <h2 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">
                {t("empty.title")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("empty.description")}
              </p>
            </div>
          </Surface>
        )}
      </div>
      <ConfirmationDialog
        open={leaveDialogOpen}
        title={t("leave.title")}
        description={t("leave.confirm", { name: line?.name ?? "" })}
        cancelLabel={t("leave.cancel")}
        confirmLabel={t("leave.button")}
        loadingLabel={t("leave.leaving")}
        loading={leaving}
        onCancel={() => setLeaveDialogOpen(false)}
        onConfirm={() => void leaveLine()}
      />
    </div>
  );
}

function ScanQrIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M8 8h8v8H8z" />
    </svg>
  );
}
