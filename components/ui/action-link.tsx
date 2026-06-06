import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type ActionLinkProps = {
  className?: string;
  description: string;
  href: string;
  id?: string;
  icon: LucideIcon;
  title: string;
  variant?: "primary" | "secondary";
};

const variants = {
  primary:
    "bg-teal-600 text-white shadow-xl shadow-teal-700/20 hover:bg-teal-700 dark:bg-teal-300 dark:text-slate-950 dark:shadow-teal-950/20 dark:hover:bg-teal-200",
  secondary:
    "border border-slate-950/10 bg-white/75 text-slate-950 shadow-sm backdrop-blur-xl hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
};

export function ActionLink({
  className,
  description,
  href,
  id,
  icon: Icon,
  title,
  variant = "primary"
}: ActionLinkProps) {
  return (
    <Link
      href={href}
      id={id}
      className={cn(
        "group flex min-h-24 items-center gap-4 rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
        variants[variant],
        className
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          variant === "primary"
            ? "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-800"
            : "bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200"
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span
          className={cn(
            "mt-1 block text-xs leading-5",
            variant === "primary"
              ? "text-teal-50/90 dark:text-slate-700"
              : "text-slate-500 dark:text-slate-400"
          )}
        >
          {description}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
      />
    </Link>
  );
}
