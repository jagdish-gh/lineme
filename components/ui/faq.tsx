"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  answer: string;
  id: string;
  question: string;
};

type FaqProps = {
  className?: string;
  icon?: LucideIcon;
  items: FaqItem[];
  openItemIndex?: number | null;
  subtitle?: string;
  title: string;
};

export function Faq({
  className,
  icon: Icon,
  items,
  openItemIndex = 0,
  subtitle,
  title
}: FaqProps) {
  const idPrefix = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(openItemIndex);

  return (
    <div className={cn("relative mx-auto max-w-xl", className)}>
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-teal-400/25 via-sky-300/20 to-slate-200/35 blur-2xl dark:from-teal-300/15 dark:via-indigo-400/10 dark:to-white/5" />

      <div className="overflow-hidden rounded-[2rem] border border-white/65 bg-white/75 shadow-2xl shadow-slate-950/10 backdrop-blur-2xl transition-colors duration-500 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/30">
        <div className="border-b border-slate-200/80 px-5 py-5 dark:border-white/10 sm:px-6">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
            ) : null}
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200/80 px-5 dark:divide-white/10 sm:px-6">
          {items.map((item, index) => {
            const isOpen = index === openIndex;
            const contentId = `${idPrefix}-faq-content-${item.id}`;

            return (
              <div key={item.id} className="py-1">
                <button
                  type="button"
                  aria-controls={contentId}
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:text-white"
                >
                  {item.question}
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform dark:text-slate-400",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen ? (
                  <p
                    id={contentId}
                    className="pb-4 pr-8 text-sm leading-6 text-slate-600 dark:text-slate-300"
                  >
                    {item.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
