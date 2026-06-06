import { ChevronDown, type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

type DisclosureProps = {
  children: ReactNode;
  description?: string;
  icon?: LucideIcon;
  title: string;
};

export function Disclosure({
  children,
  description,
  icon: Icon,
  title
}: DisclosureProps) {
  return (
    <details className="group rounded-2xl border border-slate-200/80 bg-white/45 dark:border-white/10 dark:bg-white/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
        <span className="flex items-center gap-3">
          {Icon ? (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
          ) : null}
          <span>
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
              {title}
            </span>
            {description ? (
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                {description}
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-400"
        />
      </summary>
      <div className="border-t border-slate-200/80 p-4 dark:border-white/10">{children}</div>
    </details>
  );
}
