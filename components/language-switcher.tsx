"use client";

import { ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useTransition } from "react";

import { localeNames, locales, type Locale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelectLanguage(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    const segments = pathname.split("/");
    segments[1] = nextLocale;
    const nextPath = segments.join("/") || `/${nextLocale}`;

    startTransition(() => {
      router.replace(nextPath);
    });
  }

  return (
    <label className="relative inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/65 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-xl transition-colors duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
      <Languages aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
      <span className="sr-only">{t("language")}</span>
      <select
        aria-label={t("language")}
        className="cursor-pointer appearance-none bg-transparent pr-5 outline-none disabled:cursor-wait"
        disabled={isPending}
        onChange={onSelectLanguage}
        value={locale}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {localeNames[option]}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 h-3.5 w-3.5" />
    </label>
  );
}
