import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CreatorSignIn } from "@/components/auth/creator-sign-in";
import { locales, type Locale } from "@/i18n/routing";

type AuthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

function getSafeNextPath(locale: string, value?: string) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : `/${locale}/create?resume=publish`;
}

export async function generateMetadata({ params }: AuthPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "auth.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function AuthPage({ params, searchParams }: AuthPageProps) {
  const { locale } = await params;
  const { error, next } = await searchParams;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <CreatorSignIn
        errorCode={error}
        nextPath={getSafeNextPath(locale, next)}
      />
    </main>
  );
}
