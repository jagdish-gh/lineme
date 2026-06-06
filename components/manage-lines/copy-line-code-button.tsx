"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyLineCodeButtonProps = {
  code: string;
  copiedLabel: string;
  copyLabel: string;
};

export function CopyLineCodeButton({
  code,
  copiedLabel,
  copyLabel
}: CopyLineCodeButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={copyCode}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-950/10 bg-white/75 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
