"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Plus,
  Sparkles,
  Users
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

const featureKeys = ["join", "manage", "updates"] as const;

export function HeroSection() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <section className="relative px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pt-24">
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

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              id="join"
              href={`/${locale}/join`}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-950/15 transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {t("hero.primaryCta")}
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              id="create"
              href={`/${locale}/create`}
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-950/10 bg-white/70 px-6 py-3 text-base font-semibold text-slate-950 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t("hero.secondaryCta")}
            </Link>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            <Metric value="08m" label={t("hero.waitTime")} icon={Clock3} />
            <Metric value="12" label={t("hero.peopleAhead")} icon={Users} />
            <Metric value="1.8k" label={t("hero.managedToday")} icon={Activity} />
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <QueuePreview />
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

function Metric({
  value,
  label,
  icon: Icon
}: {
  value: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
      <Icon aria-hidden="true" className="mb-3 h-4 w-4 text-teal-600 dark:text-teal-300" />
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

function QueuePreview() {
  const t = useTranslations();

  const people = [
    { name: "A-18", state: t("queueCard.next"), active: true },
    { name: "A-19", state: t("queueCard.joined"), active: false },
    { name: "A-20", state: t("queueCard.notify"), active: false }
  ];

  return (
    <div className="relative mx-auto max-w-xl">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-teal-400/25 via-sky-300/20 to-slate-200/35 blur-2xl dark:from-teal-300/15 dark:via-indigo-400/10 dark:to-white/5" />

      <div className="overflow-hidden rounded-[2rem] border border-white/65 bg-white/70 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/65 dark:shadow-black/30">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              {t("queueCard.title")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t("queueCard.counter")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t("hero.status")}
          </span>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          {people.map((person, index) => (
            <motion.div
              key={person.name}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + index * 0.08, duration: 0.45 }}
              className={
                person.active
                  ? "rounded-3xl border border-teal-400/40 bg-teal-500/10 p-4 shadow-sm dark:border-teal-300/30 dark:bg-teal-300/10"
                  : "rounded-3xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
              }
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    {person.name}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {person.state}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      #{index + 1}
                    </p>
                  </div>
                </div>
                {person.active ? (
                  <Bell aria-hidden="true" className="h-5 w-5 text-teal-700 dark:text-teal-200" />
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
