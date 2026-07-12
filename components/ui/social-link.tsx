import { type LucideIcon } from "lucide-react";

type SocialLinkProps = {
  href: string;
  icon: LucideIcon;
  label: string;
};

export function SocialLink({ href, icon: Icon, label }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex rounded-full border border-slate-950/10 bg-white/65 p-2 text-teal-600 transition hover:border-slate-950/20 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-500 dark:border-white/10 dark:bg-white/10 dark:text-teal-300 dark:hover:border-white/20 dark:hover:text-white"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </a>
  );
}
