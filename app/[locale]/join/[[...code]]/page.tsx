import { ScanLine } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { JoinLineExperience } from "@/components/join-line/join-line-experience";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { locales, type Locale } from "@/i18n/routing";
import { getLocaleUrl } from "@/lib/seo";

type JoinLinePageProps = {
  params: Promise<{
    code?: string[];
    locale: string;
  }>;
};

export async function generateMetadata({
  params
}: JoinLinePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "joinLine.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${getLocaleUrl(locale as Locale)}/join`
    }
  };
}

export default async function JoinLinePage({ params }: JoinLinePageProps) {
  const { code, locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("joinLine");

  return (
    <main
      id="main-content"
      className="flex-1 bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.18),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(139,92,246,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-7 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.14),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(139,92,246,0.12),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl lg:max-w-none">
          <PageEyebrow icon={ScanLine}>{t("eyebrow")}</PageEyebrow>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white sm:mt-4 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base lg:max-w-none lg:whitespace-nowrap">
            {t("description")}
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <JoinLineExperience initialCode={code?.[0] ?? ""} />
        </div>
      </div>
    </main>
  );
}
