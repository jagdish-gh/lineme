import { HeroSection } from "@/components/hero-section";
import { locales, type Locale } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLocaleUrl, siteConfig } from "@/lib/seo";
import { notFound } from "next/navigation";

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const pageUrl = getLocaleUrl(typedLocale);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        inLanguage: typedLocale,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteConfig.url}/${typedLocale}?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: pageUrl,
        description: t("description"),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        }
      }
    ]
  };

  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.20),_transparent_34%),radial-gradient(circle_at_80%_10%,_rgba(56,189,248,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] transition-colors duration-500 dark:bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.18),_transparent_34%),radial-gradient(circle_at_80%_10%,_rgba(99,102,241,0.16),_transparent_32%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)]"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HeroSection />
    </main>
  );
}
