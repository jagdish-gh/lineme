"use client";

import { Check, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/ui/action-button";

type CreateLineSuccessProps = {
  code: string;
  copiedLabel: string;
  copyLabel: string;
  description: string;
  lineCodeLabel: string;
  title: string;
};

export function CreateLineSuccess({
  code,
  copiedLabel,
  copyLabel,
  description,
  lineCodeLabel,
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
        </div>
      </div>
    </div>
  );
}
