import { CreateLineForm } from "@/components/create-line/create-line-form";
import { locales, type Locale } from "@/i18n/routing";
import { getLocaleUrl, siteConfig } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

type CreateLinePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params
}: CreateLinePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "createLine.metadata" });
  const typedLocale = locale as Locale;

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${getLocaleUrl(typedLocale)}/create`,
      languages: Object.fromEntries(
        locales.map((availableLocale) => [
          availableLocale,
          `${getLocaleUrl(availableLocale)}/create`
        ])
      )
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${getLocaleUrl(typedLocale)}/create`,
      siteName: siteConfig.name,
      locale: typedLocale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description")
    }
  };
}

export default async function CreateLinePage({ params }: CreateLinePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)]"
    >
      <CreateLineForm />
    </main>
  );
}
