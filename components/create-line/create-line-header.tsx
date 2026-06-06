import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

type CreateLineHeaderProps = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  subtitle?: string;
  title: string;
};

export function CreateLineHeader({
  backHref,
  backLabel,
  eyebrow,
  subtitle,
  title
}: CreateLineHeaderProps) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-950/10 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <PageEyebrow icon={Sparkles}>{eyebrow}</PageEyebrow>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
