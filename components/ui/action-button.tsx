import { type LucideIcon } from "lucide-react";
import { type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "icon";
};

const variants = {
  primary:
    "bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
  secondary:
    "border border-slate-950/10 bg-white/70 text-slate-950 shadow-sm backdrop-blur-xl hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
  icon:
    "h-11 w-11 border border-slate-950/10 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
};

export function ActionButton({
  children,
  className,
  icon: Icon,
  variant = "primary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500",
        variants[variant],
        variant === "icon" && "min-h-0 p-0",
        className
      )}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className="h-5 w-5" /> : null}
      {children}
    </button>
  );
}
