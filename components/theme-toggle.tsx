"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const themes = ["system", "light", "dark"] as const;
type Theme = (typeof themes)[number];

const themeIcons = {
  system: Laptop,
  light: Sun,
  dark: Moon
};

export function ThemeToggle() {
  const t = useTranslations("theme");
  const nav = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: Theme =
    mounted && themes.includes(theme as Theme) ? (theme as Theme) : "system";
  const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
  const Icon = themeIcons[currentTheme];

  return (
    <button
      type="button"
      aria-label={nav("themeChange", {
        current: t(currentTheme),
        next: t(nextTheme)
      })}
      title={nav("themeChange", {
        current: t(currentTheme),
        next: t(nextTheme)
      })}
      onClick={() => setTheme(nextTheme)}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/65 text-slate-600 shadow-sm backdrop-blur-xl transition duration-200 hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      <span className="sr-only">{t(currentTheme)}</span>
    </button>
  );
}
