"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  Share2,
  TicketCheck,
  UserMinus,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCreatorSession } from "@/components/auth/use-creator-session";
import { JoinAuthDialog } from "@/components/join-line/join-auth-dialog";
import { JoinLineFaq } from "@/components/join-line/join-line-faq";
import { QrCodeScanner } from "@/components/join-line/qr-code-scanner";
import { CopyLineCodeButton } from "@/components/manage-lines/copy-line-code-button";
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
  initialCode?: string;
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
  initialCode = ""
}: JoinLineExperienceProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("joinLine");
  const { loading: authLoading, user } = useCreatorSession();
  const [code, setCode] = useState(normalizeLineCode(initialCode));
  const [line, setLine] = useState<PublicLine | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ticket, setTicket] = useState<JoinedLineTicket | null>(null);
  const [savedLines, setSavedLines] = useState<SavedJoinedLine[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [leaving, setLeaving] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [joinAuthDialogOpen, setJoinAuthDialogOpen] = useState(false);
  const [resumeJoinAfterLogin, setResumeJoinAfterLogin] = useState(false);
  const [requestResponses, setRequestResponses] = useState<Record<string, string>>({});
  const [respondingRequestId, setRespondingRequestId] = useState("");
  const [searchError, setSearchError] = useState("");
  const [qrError, setQrError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [ticketError, setTicketError] = useState("");
  const [copied, setCopied] = useState(false);
  const detailMode = normalizeLineCode(initialCode).length === 10;

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

  async function fetchAccountTickets() {
    try {
      const response = await fetch("/api/lines/public/tickets", {
        cache: "no-store"
      });

      if (!response.ok) {
        return [];
      }

      const result = (await response.json()) as {
        tickets?: SavedJoinedLine[];
      };

      return result.tickets ?? [];
    } catch {
      return [];
    }
  }

  function mergeSavedLines(...groups: SavedJoinedLine[][]) {
    const tickets = new Map<string, SavedJoinedLine>();

    for (const group of groups) {
      for (const savedLine of group) {
        tickets.set(savedLine.ticket.ticketToken, savedLine);
      }
    }

    return [...tickets.values()].sort(
      (left, right) =>
        new Date(right.ticket.joinedAt ?? 0).getTime() -
        new Date(left.ticket.joinedAt ?? 0).getTime()
    );
  }

  function isActiveTicket(savedLine: SavedJoinedLine) {
    return ["waiting", "called"].includes(
      savedLine.ticket.status ?? "waiting"
    );
  }

  async function restoreAccountTicketForLine(foundLine: PublicLine) {
    const accountTickets = await fetchAccountTickets();
    const accountTicket = accountTickets.find(
      (item) =>
        item.line.public_code === foundLine.public_code &&
        isActiveTicket(item)
    );

    if (accountTicket) {
      setLine(accountTicket.line);
      setTicket(accountTicket.ticket);
      setSavedLines((current) => mergeSavedLines([accountTicket], current));
    }
  }

  async function restoreTicketForLine(foundLine: PublicLine) {
    const storedValue = window.localStorage.getItem(
      `lineme-ticket-${foundLine.public_code}`
    );

    if (!storedValue) {
      await restoreAccountTicketForLine(foundLine);
      return;
    }

    try {
      const storedTicket = JSON.parse(storedValue) as JoinedLineTicket;
      const restored = await fetchSavedTicket(storedTicket.ticketToken);

      if (restored) {
        setSavedLines((current) => mergeSavedLines([restored], current));

        if (isActiveTicket(restored)) {
          setLine(restored.line);
          setTicket(restored.ticket);
        } else {
          await restoreAccountTicketForLine(foundLine);
        }
      } else {
        window.localStorage.removeItem(
          `lineme-ticket-${foundLine.public_code}`
        );
        await restoreTicketForLine(foundLine);
      }
    } catch {
      window.localStorage.removeItem(`lineme-ticket-${foundLine.public_code}`);
      await restoreTicketForLine(foundLine);
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
      const savedDraft = window.localStorage.getItem(
        `lineme-join-draft-${result.line.public_code}`
      );

      if (savedDraft) {
        try {
          const parsedDraft = JSON.parse(savedDraft) as unknown;

          if (
            parsedDraft &&
            typeof parsedDraft === "object" &&
            "answers" in parsedDraft &&
            parsedDraft.answers &&
            typeof parsedDraft.answers === "object" &&
            !Array.isArray(parsedDraft.answers)
          ) {
            setAnswers(parsedDraft.answers as Record<string, string>);
            setResumeJoinAfterLogin(
              "autoJoin" in parsedDraft && Boolean(parsedDraft.autoJoin)
            );
          } else if (
            parsedDraft &&
            typeof parsedDraft === "object" &&
            !Array.isArray(parsedDraft)
          ) {
            setAnswers(parsedDraft as Record<string, string>);
          } else {
            throw new Error("Invalid join draft");
          }
        } catch {
          setAnswers({});
          window.localStorage.removeItem(
            `lineme-join-draft-${result.line.public_code}`
          );
        }
      } else {
        setAnswers({});
      }
      await restoreTicketForLine(result.line);
      if (!detailMode) {
        router.push(`/${locale}/join/${result.line.public_code}`);
      }
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
        const restoredBrowserTickets = restoredResults.filter(
          (item): item is SavedJoinedLine => Boolean(item)
        );
        const accountTickets = await fetchAccountTickets();
        const restored = mergeSavedLines(
          accountTickets,
          restoredBrowserTickets
        );

        setSavedLines(restored);

        if (detailMode) {
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

  async function submitJoin() {
    if (!line) {
      return;
    }

    setJoinAuthDialogOpen(false);
    setJoinError("");
    setStatus("joining");

    try {
      const response = await fetch("/api/lines/public", {
        body: JSON.stringify({
          answers,
          code: line.public_code,
          joinWithAccount: Boolean(user)
        }),
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
      window.localStorage.removeItem(
        `lineme-join-draft-${line.public_code}`
      );
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
      router.push(`/${locale}/tickets`);
    } catch {
      setJoinError(t("errors.join_failed"));
    } finally {
      setStatus("idle");
    }
  }

  function joinLine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (authLoading) {
      return;
    }

    if (!user) {
      setJoinAuthDialogOpen(true);
      return;
    }

    void submitJoin();
  }

  function joinWithLogin() {
    if (!line) {
      return;
    }

    window.localStorage.setItem(
      `lineme-join-draft-${line.public_code}`,
      JSON.stringify({ answers, autoJoin: true })
    );
    const nextPath = `/${locale}/join/${line.public_code}`;
    router.push(`/${locale}/auth?next=${encodeURIComponent(nextPath)}`);
  }

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !resumeJoinAfterLogin ||
      !line ||
      ticket ||
      status !== "idle"
    ) {
      return;
    }

    setResumeJoinAfterLogin(false);
    void submitJoin();
    // submitJoin uses the current line and answers restored from the login draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, line, resumeJoinAfterLogin, status, ticket, user]);

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

  function closeTicket() {
    router.push(`/${locale}/join`);
  }

  function joinLineAgain() {
    if (!line) {
      return;
    }

    setTicket(null);
    setTicketError("");
    void findLine(line.public_code);
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
    <div
      className={
        detailMode
          ? "grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-start"
          : "grid gap-5"
      }
    >
      <div className={detailMode ? "hidden" : "grid content-start gap-5"}>
        <Link
          href={`/${locale}/tickets`}
          className="rounded-[2rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
        >
          <Surface className="p-4 transition hover:bg-white/85 sm:p-5 dark:hover:bg-white/15">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                {t("saved.title")}
              </h2>
              <span className="shrink-0 text-xs font-semibold text-teal-700 dark:text-teal-200">
                {t("saved.history")}
              </span>
            </div>
            {savedLines[0] ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-950/[0.035] px-4 py-3 dark:bg-white/[0.06]">
              <span className="min-w-0">
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {t("line.nameLabel")}
                </span>
                <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                  {savedLines[0].line.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                  {t("line.typeLabel")}:{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {savedLines[0].line.line_type === "other" &&
                    savedLines[0].line.custom_line_type
                      ? savedLines[0].line.custom_line_type
                      : t(`line.types.${savedLines[0].line.line_type}`)}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                  {t(
                    `success.status.${savedLines[0].ticket.status ?? "waiting"}`
                  )}{" "}
                  · {t("success.position")} {savedLines[0].ticket.positionNumber}
                </span>
              </span>
                <TicketCheck
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {loadingSaved ? t("saved.loading") : t("saved.none")}
              </p>
            )}
          </Surface>
        </Link>

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
        className={detailMode ? "contents" : "hidden"}
      >
        {ticket && line ? (
          <Surface className="p-6 text-center sm:p-8">
            <button
              type="button"
              onClick={closeTicket}
              className="mb-2 inline-flex min-h-9 items-center gap-2 self-start rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-950/5 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white sm:float-left"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              {t("detailBack")}
            </button>
            <div className="clear-both" />
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
              <TicketCheck aria-hidden="true" className="h-7 w-7" />
            </span>
            <p className="mt-5 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
              {t(`success.status.${ticket.status ?? "waiting"}`)}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t("line.nameLabel")}
            </p>
            <h2 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
              {line.name}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {t("line.typeLabel")}:{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {line.line_type === "other" && line.custom_line_type
                  ? line.custom_line_type
                  : t(`line.types.${line.line_type}`)}
              </span>
            </p>
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
            ) : line.status === "active" ? (
              <ActionButton
                type="button"
                className="mt-5"
                disabled={status === "searching"}
                onClick={joinLineAgain}
              >
                {status === "searching" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                )}
                {t("success.joinAgain")}
              </ActionButton>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    {line.public_code}
                  </span>
                  <CopyLineCodeButton
                    code={line.public_code}
                    copiedLabel={t("line.codeCopied")}
                    copyLabel={t("line.copyCode")}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {t("line.nameLabel")}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">
                {line.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {t("line.typeLabel")}:{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {line.line_type === "other" && line.custom_line_type
                    ? line.custom_line_type
                    : t(`line.types.${line.line_type}`)}
                </span>
              </p>
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
                disabled={
                  authLoading ||
                  status === "joining" ||
                  line.status !== "active"
                }
              >
                {authLoading || status === "joining" ? (
                  <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                ) : null}
                {line.status === "active"
                  ? t("form.joinButton")
                  : t("form.unavailableButton")}
              </ActionButton>
              <InlineError message={joinError} />
            </form>
          </Surface>
        ) : searchError ? (
          <Surface className="p-7 text-center sm:p-9">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-700 dark:bg-rose-300/10 dark:text-rose-200">
              <Search aria-hidden="true" className="h-6 w-6" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
              {t("detailErrorTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
              {searchError}
            </p>
            <Link
              href={`/${locale}/join`}
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t("detailBack")}
            </Link>
          </Surface>
        ) : (
          <Surface className="grid min-h-64 place-items-center p-7">
            <LoaderCircle
              aria-label={t("detailLoading")}
              className="h-7 w-7 animate-spin text-teal-600 dark:text-teal-300"
            />
          </Surface>
        )}
        <JoinLineFaq />
      </div>
      <JoinAuthDialog
        open={joinAuthDialogOpen}
        title={t("joinAuth.title")}
        description={t("joinAuth.description")}
        loginLabel={t("joinAuth.login")}
        anonymousLabel={t("joinAuth.anonymous")}
        closeLabel={t("joinAuth.close")}
        onClose={() => setJoinAuthDialogOpen(false)}
        onLogin={joinWithLogin}
        onAnonymous={() => void submitJoin()}
      />
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
