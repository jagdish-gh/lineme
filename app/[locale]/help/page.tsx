import { BookOpenText, Search, SquareArrowOutUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { locales, type Locale } from "@/i18n/routing";
import { getHelpPath, helpContent } from "@/lib/help-content";
import { getAlternates, getLocaleUrl, siteConfig } from "@/lib/seo";

type HelpPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params
}: HelpPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const content = helpContent[typedLocale];
  const url = getLocaleUrl(typedLocale, "/help");

  return {
    title: `${content.title} | ${siteConfig.name}`,
    description: content.description,
    alternates: getAlternates(typedLocale, "/help"),
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      siteName: siteConfig.name,
      locale: typedLocale,
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: content.title,
      description: content.description
    }
  };
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const content = helpContent[typedLocale];
  const pageUrl = getLocaleUrl(typedLocale, "/help");
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        name: content.title,
        description: content.description,
        url: pageUrl,
        inLanguage: typedLocale,
        isPartOf: {
          "@id": `${siteConfig.url}/#website`
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: content.articles.map((article) => ({
          "@type": "Question",
          name: article.title,
          acceptedAnswer: {
            "@type": "Answer",
            text: article.answer
          }
        }))
      }
    ]
  };

  return (
    <main
      id="main-content"
      className="flex-1 bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <PageEyebrow icon={BookOpenText}>{content.eyebrow}</PageEyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-5xl">
            {content.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            {content.description}
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {content.articles.map((article) => (
            <Link
              key={article.slug}
              href={`/${typedLocale}${getHelpPath(article.slug)}`}
              className="group rounded-[2rem] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
            >
              <Surface className="flex h-full min-h-64 flex-col p-6 transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-white/85 dark:group-hover:bg-white/15">
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                    <Search aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <SquareArrowOutUpRight
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:text-teal-600 dark:text-slate-500 dark:group-hover:text-teal-200"
                  />
                </div>
                <h2 className="mt-5 text-xl font-semibold leading-7 text-slate-950 dark:text-white">
                  {article.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {article.answer}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {article.keywords.slice(0, 2).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-slate-950/10 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
