import { type LucideIcon } from "lucide-react";

export type HighlightItem = {
  icon: LucideIcon;
  id: string;
  label: string;
};

type HighlightListProps = {
  items: HighlightItem[];
};

export function HighlightList({ items }: HighlightListProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, id, label }) => (
        <li
          key={id}
          className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300" />
          {label}
        </li>
      ))}
    </ul>
  );
}
