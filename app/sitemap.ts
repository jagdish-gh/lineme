import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import {
  getLocaleUrl,
  getLocalizedLanguages,
  publicSitemapRoutes
} from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return locales.flatMap((locale) =>
    publicSitemapRoutes.map((route) => ({
      url: getLocaleUrl(locale, route.path),
      lastModified,
      changeFrequency: route.changeFrequency,
      priority:
        locale === "en"
          ? route.priority
          : Math.round((route.priority - 0.1) * 10) / 10,
      alternates: {
        languages: getLocalizedLanguages(route.path)
      }
    }))
  );
}
