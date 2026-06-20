import {
  BellRing,
  CalendarDays,
  Clock3,
  MapPin,
  PauseCircle,
  Settings2,
  UsersRound
} from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { CopyLineCodeButton } from "@/components/manage-lines/copy-line-code-button";
import { LineCardQr } from "@/components/manage-lines/line-card-qr";
import { ShareLineButton } from "@/components/manage-lines/share-line-button";
import { Surface } from "@/components/ui/surface";

export type ManagedLine = {
  allow_pause: boolean;
  auto_notify: boolean;
  created_at: string;
  custom_line_type: string | null;
  daily_capacity: number | null;
  estimated_service_minutes: number | null;
  id: string;
  line_type: "clinic" | "event" | "other" | "restaurant" | "service";
  location: string | null;
  name: string;
  paused_until: string | null;
  public_code: string;
  status: "active" | "closed" | "paused";
};

type ManageLinesListProps = {
  lines: ManagedLine[];
  locale: string;
};

const statusStyles = {
  active:
    "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200",
  paused:
    "bg-amber-500/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200",
  closed:
    "bg-slate-500/10 text-slate-600 dark:bg-slate-300/10 dark:text-slate-300"
};

export async function ManageLinesList({ lines, locale }: ManageLinesListProps) {
  const t = await getTranslations("manageLines");
  const format = await getFormatter();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {lines.map((line) => {
        const effectiveStatus =
          line.status === "paused" &&
          line.paused_until &&
          new Date(line.paused_until).getTime() <= Date.now()
            ? "active"
            : line.status;
        const typeLabel =
          line.line_type === "other" && line.custom_line_type
            ? line.custom_line_type
            : t(`types.${line.line_type}`);

        return (
          <Surface
            key={line.id}
            className="overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/5 sm:p-6 dark:hover:shadow-black/20"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[effectiveStatus]}`}
                  >
                    {t(`status.${effectiveStatus}`)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t("lineType")}: {typeLabel}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {t("lineName")}
                </p>
                <h2 className="mt-0.5 truncate text-xl font-semibold text-slate-950 dark:text-white">
                  {line.name}
                </h2>
                {line.location ? (
                  <p className="mt-2 flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                    />
                    <span>{line.location}</span>
                  </p>
                ) : null}
              </div>
              <LineCardQr
                code={line.public_code}
                label={t("qrLabel", { name: line.name })}
                locale={locale}
              />
            </div>

            <div className="mt-5 rounded-2xl border border-slate-950/10 bg-white/65 p-3 dark:border-white/10 dark:bg-slate-950/25">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t("lineCode")}
                  </p>
                  <p className="mt-1 select-all font-mono text-lg font-bold tracking-[0.12em] text-slate-950 dark:text-white">
                    {line.public_code}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ShareLineButton code={line.public_code} name={line.name} />
                  <CopyLineCodeButton
                    code={line.public_code}
                    copiedLabel={t("copied")}
                    copyLabel={t("copyCode")}
                  />
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                />
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    {t("serviceTime")}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                    {line.estimated_service_minutes
                      ? t("minutes", {
                          count: line.estimated_service_minutes
                        })
                      : t("notSet")}
                  </dd>
                </div>
              </div>
              <div className="flex gap-2 rounded-2xl bg-slate-950/[0.035] p-3 dark:bg-white/[0.06]">
                <UsersRound
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                />
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    {t("dailyCapacity")}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                    {line.daily_capacity ?? t("notSet")}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-950/5 pt-4 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <BellRing aria-hidden="true" className="h-3.5 w-3.5" />
                {line.auto_notify ? t("notificationsOn") : t("notificationsOff")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PauseCircle aria-hidden="true" className="h-3.5 w-3.5" />
                {line.allow_pause ? t("pauseAllowed") : t("pauseDisabled")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                {t("created", {
                  date: format.dateTime(new Date(line.created_at), {
                    dateStyle: "medium"
                  })
                })}
              </span>
            </div>
            <Link
              href={`/${locale}/manage/${line.id}`}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
            >
              <Settings2 aria-hidden="true" className="h-4 w-4" />
              {t("manageQueue")}
            </Link>
          </Surface>
        );
      })}
    </div>
  );
}
