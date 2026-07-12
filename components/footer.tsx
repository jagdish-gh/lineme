"use client";

import { Instagram, Linkedin, Mail, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Logo } from "@/components/logo/Logo";
import { SocialLink } from "@/components/ui/social-link";
import { brand } from "@/lib/brand";

const footerLinkKeys = ["join", "create", "help", "manage"] as const;
const legalLinkKeys = ["privacy"] as const;
const socialLinks = [
  {
    href: "https://www.instagram.com/lineme.in/",
    icon: Instagram,
    label: "LineMe on Instagram"
  },
  {
    href: "https://www.linkedin.com/company/lineme-official",
    icon: Linkedin,
    label: "LineMe on LinkedIn"
  }
] as const;

export function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const year = new Date().getFullYear();

  const links = {
    join: `/${locale}/join`,
    create: `/${locale}/create`,
    help: `/${locale}/help`,
    manage: `/${locale}/manage`,
    privacy: `/${locale}/privacy`
  };

  return (
    <footer className="border-t border-slate-200/80 bg-white/70 px-4 py-10 backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-950/70 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
        <div className="max-w-md">
          <Link
            aria-label={t("logo")}
            href={`/${locale}`}
            className="inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500"
          >
            <Logo animated />
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("description")}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-950/10 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/10">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              {t("badges.secure")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-950/10 bg-white/65 px-3 py-2 dark:border-white/10 dark:bg-white/10">
              <MapPin aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              {t("badges.local")}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
            {t("product")}
          </h2>
          <nav aria-label={t("product")} className="mt-4 grid gap-3">
            {footerLinkKeys.map((key) => (
              <Link
                key={key}
                href={links[key]}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:text-white"
              >
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
            {t("contact")}
          </h2>
          <a
            href={`mailto:${brand.contactMailtoEmail}`}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:text-white"
          >
            <Mail aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            {brand.contactEmail}
          </a>
          <p className="mt-5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {t("availability")}
          </p>
          <div className="mt-4 flex gap-2">
            {socialLinks.map((socialLink) => (
              <SocialLink key={socialLink.href} {...socialLink} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
            {t("legal")}
          </h2>
          <nav aria-label={t("legal")} className="mt-4 grid gap-3">
            {legalLinkKeys.map((key) => (
              <Link
                key={key}
                href={links[key]}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:text-white"
              >
                {t(`links.${key}`)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-slate-200/80 pt-5 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("copyright", { year })}</p>
        <p>{t("tagline")}</p>
      </div>
    </footer>
  );
}
