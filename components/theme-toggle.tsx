"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const themeOptions = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Laptop }
] as const;

export function ThemeToggle() {
  const t = useTranslations("theme");
  const nav = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-label={nav("theme")}
      className="grid grid-cols-3 rounded-full border border-white/60 bg-white/65 p-1 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-white/10"
      role="group"
    >
      {themeOptions.map(({ value, icon: Icon }) => {
        const active = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            title={t(value)}
            onClick={() => setTheme(value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition duration-200 hover:bg-white hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icon
              aria-hidden="true"
              className={active ? "h-4 w-4 text-teal-600 dark:text-teal-300" : "h-4 w-4"}
            />
            <span className="sr-only">{t(value)}</span>
          </button>
        );
      })}
    </div>
  );
}
