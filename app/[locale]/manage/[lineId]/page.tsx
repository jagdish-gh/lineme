import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import {
  LineManager,
  type ManagedEntry
} from "@/components/manage-lines/line-manager";
import { LineJoinQrCard } from "@/components/manage-lines/line-join-qr-card";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { locales, type Locale } from "@/i18n/routing";
import { getEffectiveLineStatus } from "@/lib/lines/manage-line";
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

  const { error: rolloverError } = await supabase.rpc(
    "rollover_owned_line_day",
    {
      p_line_id: lineId
    }
  );

  if (rolloverError) {
    console.error("Failed to roll over line day", rolloverError);
  }

  const effectiveStatus = getEffectiveLineStatus(
    line.status,
    line.paused_until
  );
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

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="min-w-0">
            <LineManager
              allowPause={line.allow_pause}
              lineId={lineId}
              lineStatus={effectiveStatus}
              pausedUntil={effectiveStatus === "paused" ? line.paused_until : null}
              questions={(questions ?? []) as Array<{ id: string; label: string; position: number }>}
              entries={(entries ?? []) as ManagedEntry[]}
            />
          </div>
          <LineJoinQrCard
            className="lg:sticky lg:top-6"
            code={line.public_code}
            copiedLabel={t("codeCopied")}
            copyLabel={t("copyCode")}
            description={t("qr.description")}
            downloadLabel={t("qr.download")}
            lineCodeLabel={t("lineCode")}
            lineNameLabel={t("lineName")}
            lineName={line.name}
            lineStatus={effectiveStatus}
            lineStatusLabel={t(`lineStatus.${effectiveStatus}`)}
            lineType={lineType}
            lineTypeLabel={t("lineType")}
            location={line.location}
            locationLabel={t("location")}
            locale={locale}
            posterFooter={t("qr.posterFooter")}
            posterSubtitle={t("qr.posterSubtitle")}
            printLabel={t("qr.print")}
            title={t("qr.title")}
          />
        </div>
      </div>
    </main>
  );
}
