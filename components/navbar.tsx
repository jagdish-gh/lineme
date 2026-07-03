"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { UserAvatar } from "@/components/auth/user-avatar";
import { useCreatorSession } from "@/components/auth/use-creator-session";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "./logo/Logo";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { loading, user } = useCreatorSession();

  const navLinks = [
    { href: `/${locale}/join`, label: t("join") },
    { href: `/${locale}/create`, label: t("create") },
    { href: `/${locale}/help`, label: t("help") },
    { href: `/${locale}/manage`, label: t("manage") }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/55 backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-950/45">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-7xl items-center justify-between py-4 px-4 sm:px-0"
      >
        <Link
          aria-label={t("logo")}
          href={`/${locale}`}
          className="group inline-flex items-center gap-3 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
        >
          <Logo animated />
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-8 md:flex">
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>

          {!loading && !user ? (
            <Link
              href={`/${locale}/auth?next=${encodeURIComponent(`/${locale}/manage`)}`}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm shadow-teal-950/10 transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
            >
              {t("login")}
            </Link>
          ) : null}
          <UserAvatar label={t("signedInUser")} user={user} />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("close") : t("menu")}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/70 text-slate-800 shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 md:hidden"
          >
            {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-menu" className="border-t border-white/50 px-4 pb-4 dark:border-white/10 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-xl shadow-slate-950/5 backdrop-blur-2xl dark:bg-slate-900/75">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-white/10"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-wrap items-center gap-3 px-1 pt-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
