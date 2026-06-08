"use client";

import {
  CheckCheck,
  CircleStop,
  Clock3,
  Coffee,
  LoaderCircle,
  Megaphone,
  MessageSquarePlus,
  Pause,
  Play,
  RefreshCw,
  UserRound,
  UserX,
  UsersRound
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RequestInfoDialog } from "@/components/manage-lines/request-info-dialog";
import { useLineManagerRealtime } from "@/components/manage-lines/use-line-manager-realtime";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Surface } from "@/components/ui/surface";
import { MixpanelEvent, trackEvent } from "@/lib/analytics/mixpanel";

type Question = { id: string; label: string; position: number };
type Request = {
  answered_at: string | null;
  created_at: string;
  id: string;
  prompt: string;
  response: string | null;
  status: "answered" | "cancelled" | "pending";
};
export type ManagedEntry = {
  answers: Record<string, string>;
  id: string;
  joined_at: string;
  line_entry_requests: Request[];
  position_number: number;
  status: "called" | "cancelled" | "no_show" | "served" | "waiting";
};

type LineManagerProps = {
  allowPause: boolean;
  entries: ManagedEntry[];
  lineId: string;
  lineStatus: "active" | "closed" | "paused";
  pausedUntil: string | null;
  questions: Question[];
};

const statusStyles = {
  waiting: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
  called: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  served: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  cancelled: "bg-rose-500/10 text-rose-700 dark:text-rose-200",
  no_show: "bg-orange-500/10 text-orange-700 dark:text-orange-200"
};

export function LineManager({
  allowPause,
  entries,
  lineId,
  lineStatus,
  pausedUntil,
  questions
}: LineManagerProps) {
  const t = useTranslations("manageLine");
  const router = useRouter();
  const refreshLine = useCallback(() => router.refresh(), [router]);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [requestEntry, setRequestEntry] = useState<ManagedEntry | null>(null);
  const [requestError, setRequestError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [filter, setFilter] = useState<"active" | "all" | "no_show">("active");
  const [statusAction, setStatusAction] = useState("");
  const [expireDialogOpen, setExpireDialogOpen] = useState(false);

  const questionLabels = useMemo(
    () => new Map(questions.map((question) => [question.id, question.label])),
    [questions]
  );
  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const activeEntries = entries.filter((entry) =>
    ["waiting", "called"].includes(entry.status)
  );
  const noShowEntries = entries.filter((entry) => entry.status === "no_show");
  const visibleEntries =
    filter === "active"
      ? activeEntries
      : filter === "no_show"
        ? noShowEntries
      : entries;
  const calledEntry = entries.find((entry) => entry.status === "called");

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!busyAction && !requestEntry && !requesting) {
        refreshLine();
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [busyAction, refreshLine, requestEntry, requesting]);
  useLineManagerRealtime({ entryIds, lineId, onRefresh: refreshLine });

  function memberLabel(entry: ManagedEntry) {
    const firstAnswer = [...questions]
      .sort((a, b) => a.position - b.position)
      .map((question) => entry.answers[question.id])
      .find(Boolean);
    return firstAnswer || t("memberNumber", { number: entry.position_number });
  }

  async function runAction(action: "call" | "call_next" | "no_show" | "serve", entryId?: string) {
    const key = `${action}:${entryId ?? "next"}`;
    setBusyAction(key);
    setError("");

    try {
      const response = await fetch(`/api/lines/${lineId}/actions`, {
        body: JSON.stringify({ action, entryId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const result = (await response.json()) as { code?: string };

      if (!response.ok) {
        setError(
          result.code === "no_waiting_members"
            ? t("errors.noWaiting")
            : result.code === "member_not_available"
              ? t("errors.memberUnavailable")
              : result.code === "database_not_ready"
                ? t("errors.databaseNotReady")
              : t("errors.actionFailed")
        );
        return;
      }

      if (action === "serve") {
        trackEvent(MixpanelEvent.MemberServed, { line_id: lineId });
      } else {
        trackEvent(MixpanelEvent.MemberCalled, {
          call_method: action === "call_next" ? "next" : "selected",
          line_id: lineId
        });
      }
      router.refresh();
    } catch {
      setError(t("errors.actionFailed"));
    } finally {
      setBusyAction("");
    }
  }

  async function submitRequest(prompt: string) {
    if (!requestEntry) return;
    setRequesting(true);
    setRequestError("");

    try {
      const response = await fetch(`/api/lines/${lineId}/requests`, {
        body: JSON.stringify({ entryId: requestEntry.id, prompt }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });

      if (!response.ok) {
        setRequestError(t("errors.requestFailed"));
        return;
      }

      trackEvent(MixpanelEvent.AdditionalInfoRequested, {
        line_id: lineId
      });
      setRequestEntry(null);
      router.refresh();
    } catch {
      setRequestError(t("errors.requestFailed"));
    } finally {
      setRequesting(false);
    }
  }

  async function updateLineStatus(
    action: "expire" | "pause" | "pause_30" | "resume"
  ) {
    setStatusAction(action);
    setError("");

    try {
      const response = await fetch(`/api/lines/${lineId}/status`, {
        body: JSON.stringify({ action }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const result = (await response.json()) as { code?: string };

      if (!response.ok) {
        setError(
          result.code === "pause_not_allowed"
            ? t("errors.pauseNotAllowed")
            : result.code === "line_expired"
              ? t("errors.lineExpired")
              : t("errors.statusFailed")
        );
        return;
      }

      const newStatus =
        action === "expire"
          ? "closed"
          : action === "resume"
            ? "active"
            : "paused";
      trackEvent(MixpanelEvent.LineStatusChanged, {
        line_id: lineId,
        new_status: newStatus,
        pause_duration_minutes: action === "pause_30" ? 30 : undefined,
        previous_status: lineStatus
      });
      setExpireDialogOpen(false);
      router.refresh();
    } catch {
      setError(t("errors.statusFailed"));
    } finally {
      setStatusAction("");
    }
  }

  return (
    <>
      <Surface className="mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t("intake.title")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {lineStatus === "closed"
                ? t("intake.closed")
                : lineStatus === "paused" && pausedUntil
                  ? t("intake.pausedUntil", {
                      time: new Date(pausedUntil).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit"
                      })
                    })
                  : lineStatus === "paused"
                    ? t("intake.paused")
                    : t("intake.active")}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {lineStatus === "paused" ? (
              <ActionButton
                type="button"
                size="small"
                disabled={Boolean(statusAction)}
                onClick={() => void updateLineStatus("resume")}
              >
                <Play className="h-4 w-4" />
                {t("intake.resume")}
              </ActionButton>
            ) : null}
            {lineStatus === "active" && allowPause ? (
              <>
                <ActionButton
                  type="button"
                  size="small"
                  variant="secondary"
                  disabled={Boolean(statusAction)}
                  onClick={() => void updateLineStatus("pause")}
                >
                  <Pause className="h-4 w-4" />
                  {t("intake.pause")}
                </ActionButton>
                <ActionButton
                  type="button"
                  size="small"
                  variant="secondary"
                  disabled={Boolean(statusAction)}
                  onClick={() => void updateLineStatus("pause_30")}
                >
                  <Coffee className="h-4 w-4" />
                  {t("intake.lunch")}
                </ActionButton>
              </>
            ) : null}
            {lineStatus !== "closed" ? (
              <ActionButton
                type="button"
                size="small"
                variant="danger"
                disabled={Boolean(statusAction)}
                onClick={() => setExpireDialogOpen(true)}
              >
                <CircleStop className="h-4 w-4" />
                {t("intake.expire")}
              </ActionButton>
            ) : null}
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 sm:grid-cols-3">
        <Surface className="p-5">
          <UsersRound className="h-5 w-5 text-teal-600 dark:text-teal-300" />
          <p className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{activeEntries.length}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("summary.active")}</p>
        </Surface>
        <Surface className="p-5">
          <Megaphone className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          <p className="mt-3 truncate text-lg font-bold text-slate-950 dark:text-white">
            {calledEntry ? memberLabel(calledEntry) : t("summary.none")}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t("summary.called")}</p>
        </Surface>
        <Surface className="flex items-center p-5">
          <ActionButton
            type="button"
            className="w-full"
            disabled={Boolean(busyAction)}
            onClick={() => void runAction("call_next")}
          >
            {busyAction === "call_next:next" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
            {t("callNext")}
          </ActionButton>
        </Surface>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">{t("members.title")}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("members.description")}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            aria-label={t("refresh")}
            onClick={() => router.refresh()}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-slate-600 transition hover:bg-white dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setFilter("active")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${filter === "active" ? "bg-teal-600 text-white" : "bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{t("filters.active")}</button>
          <button type="button" onClick={() => setFilter("no_show")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${filter === "no_show" ? "bg-teal-600 text-white" : "bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{t("filters.no_show")}</button>
          <button type="button" onClick={() => setFilter("all")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${filter === "all" ? "bg-teal-600 text-white" : "bg-white/70 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>{t("filters.all")}</button>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {visibleEntries.map((entry) => (
          <Surface key={entry.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[entry.status]}`}>{t(`status.${entry.status}`)}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("position", { number: entry.position_number })}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">{memberLabel(entry)}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {t("joined", { time: new Date(entry.joined_at).toLocaleString() })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["waiting", "called"].includes(entry.status) ? (
                  <>
                    <ActionButton type="button" size="small" disabled={Boolean(busyAction)} onClick={() => void runAction("call", entry.id)}>
                      <Megaphone className="h-4 w-4" />{t("actions.call")}
                    </ActionButton>
                    <ActionButton type="button" size="small" variant="secondary" disabled={Boolean(busyAction)} onClick={() => void runAction("serve", entry.id)}>
                      <CheckCheck className="h-4 w-4" />{t("actions.served")}
                    </ActionButton>
                    {entry.status === "called" ? (
                      <ActionButton type="button" size="small" variant="secondary" disabled={Boolean(busyAction)} onClick={() => void runAction("no_show", entry.id)}>
                        <UserX className="h-4 w-4" />{t("actions.noShow")}
                      </ActionButton>
                    ) : null}
                    <ActionButton type="button" size="small" variant="secondary" onClick={() => setRequestEntry(entry)}>
                      <MessageSquarePlus className="h-4 w-4" />{t("actions.requestInfo")}
                    </ActionButton>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-slate-950/5 pt-5 dark:border-white/10 sm:grid-cols-2">
              {Object.entries(entry.answers).length ? Object.entries(entry.answers).map(([questionId, answer]) => (
                <div key={questionId} className="rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{questionLabels.get(questionId) ?? t("answer")}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-white">{answer}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("noAnswers")}</p>
              )}
            </div>

            {entry.line_entry_requests.length ? (
              <div className="mt-4 grid gap-2">
                {entry.line_entry_requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-violet-200/70 bg-violet-50/60 p-3 text-sm dark:border-violet-400/20 dark:bg-violet-400/10">
                    <p className="font-semibold text-slate-900 dark:text-white">{request.prompt}</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{request.response || t("requests.pending")}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Surface>
        ))}
        {!visibleEntries.length ? (
          <Surface className="p-8 text-center">
            <UserRound className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{t("members.empty")}</p>
          </Surface>
        ) : null}
      </div>

      <RequestInfoDialog
        open={Boolean(requestEntry)}
        title={t("requestDialog.title")}
        description={t("requestDialog.description")}
        memberLabel={requestEntry ? memberLabel(requestEntry) : ""}
        placeholder={t("requestDialog.placeholder")}
        cancelLabel={t("requestDialog.cancel")}
        submitLabel={t("requestDialog.submit")}
        submittingLabel={t("requestDialog.submitting")}
        loading={requesting}
        errorMessage={requestError}
        onCancel={() => setRequestEntry(null)}
        onSubmit={(prompt) => void submitRequest(prompt)}
      />
      <ConfirmationDialog
        open={expireDialogOpen}
        title={t("expireDialog.title")}
        description={t("expireDialog.description")}
        cancelLabel={t("expireDialog.cancel")}
        confirmLabel={t("expireDialog.confirm")}
        loadingLabel={t("expireDialog.expiring")}
        loading={statusAction === "expire"}
        onCancel={() => setExpireDialogOpen(false)}
        onConfirm={() => void updateLineStatus("expire")}
      />
    </>
  );
}
