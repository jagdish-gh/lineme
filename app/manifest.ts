import type { MetadataRoute } from "next";

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
    id: "/",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
