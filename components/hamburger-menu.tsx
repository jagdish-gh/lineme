"use client";

import {
  ChevronDown,
  CircleHelp,
  ListChecks,
  ListPlus,
  LogIn,
  Menu
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

type HamburgerMenuProps = {
  className?: string;
};

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: `/${locale}/join`, label: t("join"), Icon: LogIn },
    { href: `/${locale}/create`, label: t("create"), Icon: ListPlus },
    { href: `/${locale}/help`, label: t("help"), Icon: CircleHelp },
    { href: `/${locale}/manage`, label: t("manage"), Icon: ListChecks }
  ];

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={cn("relative md:hidden", className)} ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="mobile-menu"
        aria-label={open ? t("close") : t("menu")}
        onClick={() => setOpen((value) => !value)}
        className="group inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 pr-1.5 text-slate-700 shadow-sm transition hover:border-teal-500/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
      >
        <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Menu aria-hidden="true" className="h-5 w-5" />
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          id="mobile-menu"
          role="menu"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30"
        >
          <div className="border-b border-slate-100 px-3 py-3 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {t("menu")}
            </p>
          </div>

          <div className="py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                role="menuitem"
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <link.Icon
                  aria-hidden="true"
                  className="h-4 w-4 text-teal-600 dark:text-teal-300"
                />
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2 dark:border-white/10">
            <div className="flex items-center gap-3 px-1">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
