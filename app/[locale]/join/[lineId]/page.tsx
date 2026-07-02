import { ArrowLeft, ScanLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { JoinLineExperience } from "@/components/join-line/join-line-experience";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { locales, type Locale } from "@/i18n/routing";
import { getLocaleUrl } from "@/lib/seo";
import { normalizeLineCode } from "@/lib/lines/public-line";

type JoinLineDetailPageProps = {
  params: Promise<{ lineId: string; locale: string }>;
};

export async function generateMetadata({
  params
}: JoinLineDetailPageProps): Promise<Metadata> {
  const { lineId, locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "joinLine.metadata" });
  const code = normalizeLineCode(lineId);

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: getLocaleUrl(locale as Locale, `/join/${code}`)
    },
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function JoinLineDetailPage({
  params
}: JoinLineDetailPageProps) {
  const { lineId, locale } = await params;
  const code = normalizeLineCode(lineId);

  if (!locales.includes(locale as Locale) || code.length !== 10) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("joinLine");

  return (
    <main
      id="main-content"
      className="flex-1 bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/join`}
              aria-label={t("detailBack")}
              title={t("detailBack")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/10 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <PageEyebrow icon={ScanLine}>{t("detailEyebrow")}</PageEyebrow>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-4xl">
            {t("detailTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            {t("detailDescription")}
          </p>
        </div>

        <div className="mt-8">
          <JoinLineExperience initialCode={code} />
        </div>
      </div>
    </main>
  );
}
