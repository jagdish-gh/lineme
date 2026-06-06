import { type LucideIcon } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  size?: "small" | "medium" | "icon";
  variant?: "primary" | "secondary" | "danger";
};

const variants = {
  primary:
    "border border-teal-700 bg-teal-600 text-white shadow-sm shadow-teal-950/10 hover:bg-teal-700 dark:border-teal-300 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200",
  secondary:
    "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10",
  danger:
    "border border-rose-200 bg-white text-rose-600 shadow-sm hover:border-rose-300 hover:bg-rose-50 dark:border-rose-400/25 dark:bg-rose-400/5 dark:text-rose-300 dark:hover:bg-rose-400/10"
};

const sizes = {
  small: "min-h-10 rounded-xl px-4 py-2 text-sm",
  medium: "min-h-12 rounded-xl px-5 py-3 text-sm",
  icon: "h-10 w-10 rounded-xl p-0"
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton(
    {
      children,
      className,
      icon: Icon,
      size = "medium",
      variant = "primary",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-55",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {Icon ? <Icon aria-hidden="true" className="h-4 w-4" /> : null}
        {children}
      </button>
    );
  }
);
