"use client";

import { motion } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  ListPlus,
  LocateFixed,
  LogIn,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { HeroFaq } from "@/components/home/hero-faq";
import { ActionLink } from "@/components/ui/action-link";
import { HighlightList } from "@/components/ui/highlight-list";

const featureKeys = ["join", "manage", "updates"] as const;

export function HeroSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="relative px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8">
      <div className="absolute inset-x-0 top-24 -z-10 mx-auto h-72 max-w-5xl rounded-full bg-teal-300/20 blur-3xl dark:bg-teal-400/10" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/65 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm backdrop-blur-xl dark:border-teal-300/20 dark:bg-white/10 dark:text-teal-200">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            {t("hero.eyebrow")}
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-6xl lg:text-7xl">
            {t("hero.title")}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 [text-wrap:balance] dark:text-slate-300 sm:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
            <ActionLink
              description={t("hero.primaryDescription")}
              id="join"
              href={`/${locale}/join`}
              icon={LogIn}
              title={t("hero.primaryCta")}
            />
            <ActionLink
              description={t("hero.secondaryDescription")}
              id="create"
              href={`/${locale}/create`}
              icon={ListPlus}
              title={t("hero.secondaryCta")}
              variant="secondary"
            />
          </div>

          <div className="mt-6 max-w-2xl">
            <HighlightList
              items={[
                { id: "browser", icon: Smartphone, label: t("hero.highlights.browser") },
                { id: "position", icon: LocateFixed, label: t("hero.highlights.position") },
                { id: "updates", icon: BellRing, label: t("hero.highlights.updates") }
              ]}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <HeroFaq />
        </motion.div>
      </div>

      <div
        id="manage"
        className="mx-auto mt-16 grid max-w-7xl gap-4 sm:grid-cols-3 lg:mt-20"
      >
        {featureKeys.map((key) => (
          <motion.article
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
              <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {t(`features.${key}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t(`features.${key}.description`)}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
