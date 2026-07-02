import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { brand } from "@/lib/brand";

type PublicRoute = {
  path: "" | "/create" | "/join" | "/privacy";
  changeFrequency: "monthly" | "weekly";
  priority: number;
};

export const siteConfig = {
  name: brand.name,
  url: brand.url,
  creator: brand.name,
  keywords: [
    "queue management app",
    "digital queue",
    "virtual queue",
    "queue management software",
    "line management",
    "real-time queue tracking",
    "appointment queue",
    "wait time management"
  ]
};

export const publicSitemapRoutes: PublicRoute[] = [
  {
    path: "",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/create",
    changeFrequency: "weekly",
    priority: 0.9
  },
  {
    path: "/join",
    changeFrequency: "weekly",
    priority: 0.9
  },
  {
    path: "/privacy",
    changeFrequency: "monthly",
    priority: 0.4
  }
];

export function getLocalePath(locale: Locale, path = "") {
  return `/${locale}${path}`;
}

export function getSiteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function getLocaleUrl(locale: Locale, path = "") {
  return getSiteUrl(getLocalePath(locale, path));
}

export function getLocalizedLanguages(path = "") {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, getLocaleUrl(locale, path)])
    ),
    "x-default": getLocaleUrl(defaultLocale, path)
  };
}

export function getAlternates(locale: Locale, path = "") {
  return {
    canonical: getLocaleUrl(locale, path),
    languages: getLocalizedLanguages(path)
  };
}
