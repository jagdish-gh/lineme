import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LineME - Queue Management App",
    short_name: "LineME",
    description: "Join and manage queues digitally in real time.",
    start_url: "/en",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    categories: ["business", "productivity", "utilities"],
    lang: "en",
    scope: "/",
    id: siteConfig.url,
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  };
}
