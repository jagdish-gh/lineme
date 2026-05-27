import { type LucideIcon } from "lucide-react";

type FormToggleProps = {
  checked: boolean;
  icon: LucideIcon;
  label: string;
  onChange: (checked: boolean) => void;
};

export function FormToggle({ checked, icon: Icon, label, onChange }: FormToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-slate-950/10 bg-white/70 px-4 text-left shadow-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <span className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      </span>
      <span
        className={
          checked
            ? "flex h-6 w-11 items-center justify-end rounded-full bg-teal-500 px-1"
            : "flex h-6 w-11 items-center justify-start rounded-full bg-slate-300 px-1 dark:bg-slate-700"
        }
      >
        <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  );
}
