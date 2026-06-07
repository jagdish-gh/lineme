"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Settings2
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ActionButton } from "@/components/ui/action-button";

type CreateLineSuccessProps = {
  code: string;
  copiedLabel: string;
  copyLabel: string;
  customerDescription: string;
  customerLinkLabel: string;
  description: string;
  lineId: string;
  lineCodeLabel: string;
  locale: string;
  manageDescription: string;
  manageLinkLabel: string;
  title: string;
};

export function CreateLineSuccess({
  code,
  copiedLabel,
  copyLabel,
  customerDescription,
  customerLinkLabel,
  description,
  lineId,
  lineCodeLabel,
  locale,
  manageDescription,
  manageLinkLabel,
  title
}: CreateLineSuccessProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/10"
      role="status"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300"
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            {description}
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 rounded-xl border border-emerald-200 bg-white/80 p-3 dark:border-emerald-300/15 dark:bg-slate-950/30">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {lineCodeLabel}
              </p>
              <p className="mt-1 select-all font-mono text-xl font-bold tracking-[0.12em] text-slate-950 dark:text-white">
                {code}
              </p>
            </div>
            <ActionButton
              icon={copied ? Check : Copy}
              onClick={copyCode}
              size="small"
              type="button"
              variant="secondary"
            >
              {copied ? copiedLabel : copyLabel}
            </ActionButton>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-white/80 p-4 dark:border-emerald-300/15 dark:bg-slate-950/30">
              <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-200">
                {customerDescription}
              </p>
              <Link
                href={`/${locale}/join/${code}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                {customerLinkLabel}
              </Link>
            </div>
            <div className="flex flex-col rounded-xl border border-emerald-200 bg-white/80 p-4 dark:border-emerald-300/15 dark:bg-slate-950/30">
              <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-200">
                {manageDescription}
              </p>
              <Link
                href={`/${locale}/manage/${lineId}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              >
                <Settings2 aria-hidden="true" className="h-4 w-4" />
                {manageLinkLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
