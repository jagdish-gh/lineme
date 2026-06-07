import { ArrowLeft, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import {
  LineManager,
  type ManagedEntry
} from "@/components/manage-lines/line-manager";
import { CopyLineCodeButton } from "@/components/manage-lines/copy-line-code-button";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { locales, type Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ManageLinePage({
  params
}: {
  params: Promise<{ lineId: string; locale: string }>;
}) {
  const { lineId, locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("manageLine");
  const supabase = await createSupabaseServerClient();
  if (!supabase) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth?next=${encodeURIComponent(`/${locale}/manage/${lineId}`)}`);

  const { data: line } = await supabase
    .from("lines")
    .select("id, name, location, line_type, custom_line_type, public_code, status, allow_pause, paused_until")
    .eq("id", lineId)
    .maybeSingle();
  if (!line) notFound();
  const effectiveStatus =
    line.status === "paused" &&
    line.paused_until &&
    new Date(line.paused_until).getTime() <= Date.now()
      ? "active"
      : line.status;
  const lineType =
    line.line_type === "other" && line.custom_line_type
      ? line.custom_line_type
      : t(`types.${line.line_type}`);

  const [{ data: questions }, { data: entries }] = await Promise.all([
    supabase.from("line_questions").select("id, label, position").eq("line_id", lineId).order("position"),
    supabase
      .from("line_entries")
      .select("id, position_number, answers, status, joined_at, line_entry_requests(id, prompt, response, status, created_at, answered_at)")
      .eq("line_id", lineId)
      .order("position_number")
  ]);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/manage`}
            aria-label={t("back")}
            title={t("back")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/10 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
          <PageEyebrow icon={RefreshCw}>{t("eyebrow")}</PageEyebrow>
        </div>

        <Surface className="mt-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {t("lineName")}
              </p>
              <h1 className="mt-1 break-words text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">
                {line.name}
              </h1>
            </div>
            <span
              className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                effectiveStatus === "active"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                  : effectiveStatus === "paused"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              {t(`lineStatus.${effectiveStatus}`)}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-slate-950/5 pt-5 sm:grid-cols-2 dark:border-white/10">
            <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("lineType")}
              </dt>
              <dd className="mt-1 font-semibold text-slate-900 dark:text-white">
                {lineType}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-950/[0.035] p-4 dark:bg-white/[0.06]">
              <dt className="text-xs text-slate-500 dark:text-slate-400">
                {t("lineCode")}
              </dt>
              <dd className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="select-all font-mono text-base font-bold tracking-[0.1em] text-slate-900 dark:text-white">
                  {line.public_code}
                </span>
                <CopyLineCodeButton
                  code={line.public_code}
                  copiedLabel={t("codeCopied")}
                  copyLabel={t("copyCode")}
                />
              </dd>
            </div>
            {line.location ? (
              <div className="rounded-2xl bg-slate-950/[0.035] p-4 sm:col-span-2 dark:bg-white/[0.06]">
                <dt className="text-xs text-slate-500 dark:text-slate-400">
                  {t("location")}
                </dt>
                <dd className="mt-1 flex items-start gap-2 font-semibold text-slate-900 dark:text-white">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
                  />
                  {line.location}
                </dd>
              </div>
            ) : null}
          </dl>
        </Surface>
        <div className="mt-8">
          <LineManager
            allowPause={line.allow_pause}
            lineId={lineId}
            lineStatus={effectiveStatus}
            pausedUntil={effectiveStatus === "paused" ? line.paused_until : null}
            questions={(questions ?? []) as Array<{ id: string; label: string; position: number }>}
            entries={(entries ?? []) as ManagedEntry[]}
          />
        </div>
      </div>
    </main>
  );
}
