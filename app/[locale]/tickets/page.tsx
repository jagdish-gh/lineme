import { ArrowLeft, TicketCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { TicketHistory } from "@/components/tickets/ticket-history";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { locales, type Locale } from "@/i18n/routing";
import { mapJoinedTicketRecords } from "@/lib/lines/joined-tickets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TicketsPageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: TicketsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "tickets.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false }
  };
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("tickets");
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };
  const accountTickets = user
    ? await supabase?.rpc("list_joined_line_tickets")
    : { data: null, error: null };
  const tickets = accountTickets?.error
    ? []
    : mapJoinedTicketRecords(accountTickets?.data);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/join`}
              aria-label={t("back")}
              title={t("back")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/10 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <PageEyebrow icon={TicketCheck}>{t("eyebrow")}</PageEyebrow>
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {t("description")}
          </p>
        </div>

        <div className="mt-8">
          {accountTickets?.error ? (
            <p
              role="alert"
              className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-700 dark:text-rose-300"
            >
              {t("error")}
            </p>
          ) : null}
          <TicketHistory tickets={tickets} />
        </div>
      </div>
    </main>
  );
}
