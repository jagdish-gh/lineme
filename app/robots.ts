import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/callback",
        "/en/auth",
        "/hi/auth",
        "/en/manage",
        "/hi/manage",
        "/en/profile",
        "/hi/profile",
        "/en/tickets",
        "/hi/tickets"
      ]
    },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
    host: siteConfig.url
  };
}
