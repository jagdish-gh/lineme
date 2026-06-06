import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  children: ReactNode;
  compact?: boolean;
  description?: string;
  icon: LucideIcon;
  title: string;
};

export function FormSection({
  children,
  compact = false,
  description,
  icon: Icon,
  title
}: FormSectionProps) {
  return (
    <Surface className={cn(compact ? "p-4 sm:p-5" : "p-5 sm:p-6")}>
      <div
        className={cn(
          "flex items-start gap-3 border-b border-slate-200/80 dark:border-white/10",
          compact ? "pb-4" : "pb-5"
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className={compact ? "mt-4" : "mt-5"}>{children}</div>
    </Surface>
  );
}
