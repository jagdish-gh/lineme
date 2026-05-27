import { type LucideIcon } from "lucide-react";

type PageEyebrowProps = {
  icon: LucideIcon;
  children: React.ReactNode;
};

export function PageEyebrow({ children, icon: Icon }: PageEyebrowProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-white/65 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm backdrop-blur-xl dark:border-teal-300/20 dark:bg-white/10 dark:text-teal-200">
      <Icon aria-hidden="true" className="h-4 w-4" />
      {children}
    </div>
  );
}
