"use client";

import { Check, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type ShareLineButtonProps = {
  code: string;
  name: string;
};

export function ShareLineButton({ code, name }: ShareLineButtonProps) {
  const locale = useLocale();
  const t = useTranslations("manageLines");
  const [copied, setCopied] = useState(false);

  async function shareLine() {
    const url = `${window.location.origin}/${locale}/join/${code}`;

    if (navigator.share) {
      await navigator.share({
        text: t("shareText", { name }),
        url
      });
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={shareLine}
      className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-950/10 bg-white/75 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
    >
      {copied ? (
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Share2 aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {copied ? t("linkCopied") : t("shareLink")}
    </button>
  );
}
