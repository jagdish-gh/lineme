import { ArrowLeft, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import {
  LineManager,
  type ManagedEntry
} from "@/components/manage-lines/line-manager";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
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
    .select("id, name, location, public_code, status, allow_pause, paused_until")
    .eq("id", lineId)
    .maybeSingle();
  if (!line) notFound();
  const effectiveStatus =
    line.status === "paused" &&
    line.paused_until &&
    new Date(line.paused_until).getTime() <= Date.now()
      ? "active"
      : line.status;

  const [{ data: questions }, { data: entries }] = await Promise.all([
    supabase.from("line_questions").select("id, label, position").eq("line_id", lineId).order("position"),
    supabase
      .from("line_entries")
      .select("id, position_number, answers, status, joined_at, line_entry_requests(id, prompt, response, status, created_at, answered_at)")
      .eq("line_id", lineId)
      .order("position_number")
  ]);

  return (
    <main id="main-content" className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-8 dark:bg-[linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href={`/${locale}/manage`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />{t("back")}
        </Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PageEyebrow icon={RefreshCw}>{t("eyebrow")}</PageEyebrow>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">{line.name}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-mono font-bold">{line.public_code}</span>
              {line.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{line.location}</span> : null}
            </div>
          </div>
          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
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
