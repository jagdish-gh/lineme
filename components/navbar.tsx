"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/auth/user-avatar";
import { useCreatorSession } from "@/components/auth/use-creator-session";
import { HamburgerMenu } from "@/components/hamburger-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationMenu } from "@/components/notifications/notification-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "./logo/Logo";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
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
          {user ? <NotificationMenu key={user.id} user={user} /> : null}
          <UserAvatar label={t("signedInUser")} user={user} />
          <HamburgerMenu />
        </div>
      </nav>
    </header>
  );
}
