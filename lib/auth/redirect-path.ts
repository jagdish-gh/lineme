import { locales } from "@/i18n/routing";

export function getSafeAuthRedirectPath(value: unknown, fallback = "/en") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  const locale = value.split("/")[1];

  return locales.includes(locale as (typeof locales)[number]) ? value : fallback;
}
