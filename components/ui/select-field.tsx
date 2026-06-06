import { type LucideIcon } from "lucide-react";
import { type SelectHTMLAttributes } from "react";

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  icon: LucideIcon;
  label: string;
  options: SelectOption[];
};

export function SelectField({
  icon: Icon,
  label,
  options,
  ...selectProps
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-slate-950/10 bg-white/80 px-4 text-slate-700 shadow-sm transition focus-within:border-teal-500/60 focus-within:ring-4 focus-within:ring-teal-500/10 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
        <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300" />
        <select
          className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none"
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}
