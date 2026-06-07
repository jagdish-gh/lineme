import { getRequestConfig } from "next-intl/server";

import { defaultLocale, locales, type Locale } from "@/i18n/routing";

const messageLoaders = {
  en: async () => ({
    ...(await import("../messages/en/common.json")).default,
    ...(await import("../messages/en/home.json")).default,
    ...(await import("../messages/en/create-line.json")).default,
    ...(await import("../messages/en/auth.json")).default,
    ...(await import("../messages/en/manage-lines.json")).default,
    ...(await import("../messages/en/manage-line.json")).default,
    ...(await import("../messages/en/profile.json")).default,
    ...(await import("../messages/en/join-line.json")).default,
    ...(await import("../messages/en/tickets.json")).default,
    ...(await import("../messages/en/privacy.json")).default
  }),
  hi: async () => ({
    ...(await import("../messages/hi/common.json")).default,
    ...(await import("../messages/hi/home.json")).default,
    ...(await import("../messages/hi/create-line.json")).default,
    ...(await import("../messages/hi/auth.json")).default,
    ...(await import("../messages/hi/manage-lines.json")).default,
    ...(await import("../messages/hi/manage-line.json")).default,
    ...(await import("../messages/hi/profile.json")).default,
    ...(await import("../messages/hi/join-line.json")).default,
    ...(await import("../messages/hi/tickets.json")).default,
    ...(await import("../messages/hi/privacy.json")).default
  })
} satisfies Record<Locale, () => Promise<Record<string, unknown>>>;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : defaultLocale;

  return {
    locale,
    messages: await messageLoaders[locale]()
  };
});
