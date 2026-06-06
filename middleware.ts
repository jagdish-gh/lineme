import createMiddleware from "next-intl/middleware";

import { defaultLocale, locales } from "@/i18n/routing";

export default createMiddleware({
  defaultLocale,
  locales,
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",

    "/(en|hi)/:path*",

    "/((?!api|auth/callback|_next|_vercel|.*\\..*|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
