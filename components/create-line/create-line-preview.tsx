"use client";

import { ActionButton } from "@/components/ui/action-button";
import { type CreateLineFormState } from "@/components/create-line/create-line.types";
import { Clock3, Copy, ListChecks, PauseCircle, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type CreateLinePreviewProps = {
  form: CreateLineFormState;
  lineCode: string;
};

export function CreateLinePreview({ form, lineCode }: CreateLinePreviewProps) {
  const t = useTranslations("createLine");

  return (
    <aside className="rounded-[2rem] border border-white/65 bg-white/70 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t("preview.label")}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
            {form.lineName || t("defaults.lineName")}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {form.location || t("defaults.location")}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t("preview.live")}
        </span>
      </div>

      <div className="grid gap-3 py-5">
        <PreviewMetric
          icon={Clock3}
          label={t("preview.averageWait")}
          value={`${form.estimatedMinutes} ${t("minutes")}`}
        />
        <PreviewMetric
          icon={Users}
          label={t("preview.capacity")}
          value={`${form.capacity} ${t("people")}`}
        />
        <PreviewMetric icon={ListChecks} label={t("preview.type")} value={t(`types.${form.queueType}`)} />
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white/65 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t("preview.lineCode")}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-white">
            {lineCode}
          </p>
          <ActionButton aria-label={t("preview.copy")} icon={Copy} type="button" variant="icon" />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <StatusRow
          icon={ShieldCheck}
          label={form.autoNotify ? t("preview.notifyOn") : t("preview.notifyOff")}
        />
        <StatusRow
          icon={PauseCircle}
          label={form.allowPause ? t("preview.pauseOn") : t("preview.pauseOff")}
        />
      </div>
    </aside>
  );
}

function PreviewMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function StatusRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
      <Icon aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
      {label}
    </div>
  );
}
