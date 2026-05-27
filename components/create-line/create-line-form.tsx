"use client";

import { CreateLineFields } from "@/components/create-line/create-line-fields";
import { CreateLineHeader } from "@/components/create-line/create-line-header";
import { CreateLinePreview } from "@/components/create-line/create-line-preview";
import { useCreateLineForm } from "@/components/create-line/use-create-line-form";
import { ActionButton } from "@/components/ui/action-button";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export function CreateLineForm() {
  const t = useTranslations("createLine");
  const locale = useLocale();
  const { created, form, lineCode, setCreated, updateForm } = useCreateLineForm({
    lineName: t("defaults.lineName"),
    location: t("defaults.location")
  });

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 rounded-full text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:text-slate-300 dark:hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {t("back")}
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <CreateLineHeader
              eyebrow={t("eyebrow")}
              subtitle={t("subtitle")}
              title={t("title")}
            />

            <form
              className="mt-8 grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                setCreated(true);
              }}
            >
              <CreateLineFields form={form} onChange={updateForm} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ActionButton icon={PlayCircle} type="submit">
                  {t("submit")}
                </ActionButton>
                {created ? (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    {t("created")}
                  </p>
                ) : null}
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
          >
            <CreateLinePreview form={form} lineCode={lineCode} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
