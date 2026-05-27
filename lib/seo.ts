import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { brand } from "@/lib/brand";

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

export function getLocaleUrl(locale: Locale) {
  return new URL(`/${locale}`, siteConfig.url).toString();
}

export function getAlternates(locale: Locale) {
  return {
    canonical: getLocaleUrl(locale),
    languages: {
      ...Object.fromEntries(locales.map((item) => [item, getLocaleUrl(item)])),
      "x-default": getLocaleUrl(defaultLocale)
    }
  };
}
