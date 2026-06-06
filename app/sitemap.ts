import type { MetadataRoute } from "next";

import { locales } from "@/i18n/routing";
import { getLocaleUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => [
    {
      url: getLocaleUrl(locale),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: locale === "en" ? 1 : 0.9
    },
    {
      url: `${getLocaleUrl(locale)}/join`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: locale === "en" ? 0.9 : 0.8
    }
  ]);
}
