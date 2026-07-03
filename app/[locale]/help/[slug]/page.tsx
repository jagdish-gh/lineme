import { ArrowLeft, BookOpenText, CheckCircle2, LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { locales, type Locale } from "@/i18n/routing";
import {
  getHelpArticle,
  getHelpPath,
  helpContent
} from "@/lib/help-content";
import { getAlternates, getLocaleUrl, siteConfig } from "@/lib/seo";

type HelpArticlePageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    helpContent[locale].articles.map((article) => ({
      locale,
      slug: article.slug
    }))
  );
}

export async function generateMetadata({
  params
}: HelpArticlePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const article = getHelpArticle(typedLocale, slug);

  if (!article) {
    notFound();
  }

  const path = getHelpPath(article.slug);
  const url = getLocaleUrl(typedLocale, path);

  return {
    title: `${article.title} | ${siteConfig.name}`,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: getAlternates(typedLocale, path),
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      url,
      siteName: siteConfig.name,
      locale: typedLocale,
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.metaDescription
    }
  };
}

export default async function HelpArticlePage({
  params
}: HelpArticlePageProps) {
  const { locale, slug } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const article = getHelpArticle(typedLocale, slug);

  if (!article) {
    notFound();
  }

  const content = helpContent[typedLocale];
  const pageUrl = getLocaleUrl(typedLocale, getHelpPath(article.slug));
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: article.title,
        description: article.metaDescription,
        url: pageUrl,
        inLanguage: typedLocale,
        isPartOf: {
          "@id": `${siteConfig.url}/#website`
        },
        mainEntity: {
          "@id": `${pageUrl}#faq`
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: article.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: article.answer
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteConfig.name,
            item: getLocaleUrl(typedLocale)
          },
          {
            "@type": "ListItem",
            position: 2,
            name: content.eyebrow,
            item: getLocaleUrl(typedLocale, "/help")
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: pageUrl
          }
        ]
      }
    ]
  };

  const relatedArticles = article.related
    .map((relatedSlug) => getHelpArticle(typedLocale, relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <main
      id="main-content"
      className="flex-1 bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(18rem,0.28fr)] lg:items-start">
        <article className="min-w-0">
          <div className="flex items-center gap-3">
            <Link
              href={`/${typedLocale}/help`}
              aria-label={content.eyebrow}
              title={content.eyebrow}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/10 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <PageEyebrow icon={BookOpenText}>{content.eyebrow}</PageEyebrow>
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-5xl">
            {article.title}
          </h1>

          <Surface className="mt-8 p-6 sm:p-8">
            <p className="text-xl leading-8 text-slate-800 dark:text-slate-100">
              {article.answer}
            </p>
          </Surface>

          <div className="mt-8 grid gap-5">
            {article.details.map((detail) => (
              <p
                key={detail}
                className="text-base leading-7 text-slate-600 dark:text-slate-300"
              >
                {detail}
              </p>
            ))}
          </div>

          {article.steps ? (
            <section className="mt-10">
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">
                Steps
              </h2>
              <ol className="mt-5 grid gap-3">
                {article.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-2xl border border-slate-950/10 bg-white/60 p-4 text-sm leading-6 text-slate-700 backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white dark:bg-teal-300 dark:text-slate-950">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </article>

        <aside className="lg:sticky lg:top-28">
          <Surface className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
              <CheckCircle2
                aria-hidden="true"
                className="h-4 w-4 text-teal-600 dark:text-teal-300"
              />
              Related answers
            </h2>
            <div className="mt-4 grid gap-2">
              {relatedArticles.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${typedLocale}${getHelpPath(related.slug)}`}
                  className="group flex items-start gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-white/75 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LinkIcon
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-teal-600 dark:text-slate-500 dark:group-hover:text-teal-200"
                  />
                  {related.title}
                </Link>
              ))}
            </div>
          </Surface>
        </aside>
      </div>
    </main>
  );
}
