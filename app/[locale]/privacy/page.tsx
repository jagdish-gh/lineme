import { PrivacyPolicyContent } from "@/components/privacy/privacy-policy-content";
import { locales, type Locale } from "@/i18n/routing";
import { brand } from "@/lib/brand";
import { getAlternates, getLocaleUrl, siteConfig } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

const sectionKeys = [
  "information",
  "usage",
  "sharing",
  "retention",
  "choices",
  "contact"
] as const;

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "privacy.metadata" });
  const typedLocale = locale as Locale;
  const url = getLocaleUrl(typedLocale, "/privacy");

  return {
    title: t("title"),
    description: t("description"),
    alternates: getAlternates(typedLocale, "/privacy"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url,
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

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.18),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.14),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)]"
    >
      <PrivacyPolicyContent
        effectiveDate={t("effectiveDate")}
        eyebrow={t("eyebrow")}
        intro={t("intro")}
        sections={sectionKeys.map((key) => ({
          title: t(`sections.${key}.title`),
          body:
            key === "contact"
              ? t.rich(`sections.${key}.body`, {
                  email: brand.contactEmail,
                  emailLink: (chunks) => (
                    <a
                      href={`mailto:${brand.contactMailtoEmail}`}
                      className="font-semibold text-teal-700 underline decoration-teal-500/40 underline-offset-4 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-teal-200 dark:hover:text-white"
                    >
                      {chunks}
                    </a>
                  )
                })
              : t(`sections.${key}.body`)
        }))}
        title={t("title")}
      />
    </main>
  );
}
