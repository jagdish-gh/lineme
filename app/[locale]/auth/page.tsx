import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { CreatorSignIn } from "@/components/auth/creator-sign-in";
import { locales, type Locale } from "@/i18n/routing";
import { getSafeAuthRedirectPath } from "@/lib/auth/redirect-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export const dynamic = "force-dynamic";

function getSafeNextPath(locale: string, value?: string) {
  return getSafeAuthRedirectPath(
    value,
    `/${locale}/create?resume=publish`
  );
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
  const nextPath = getSafeNextPath(locale, next);
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      redirect(nextPath);
    }
  }

  return (
    <main
      id="main-content"
      className="flex flex-1 bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.18),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.14),_transparent_30%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto w-full max-w-lg">
        <CreatorSignIn errorCode={error} nextPath={nextPath} />
      </div>
    </main>
  );
}
