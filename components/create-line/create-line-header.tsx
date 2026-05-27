import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Sparkles } from "lucide-react";

type CreateLineHeaderProps = {
  eyebrow: string;
  subtitle: string;
  title: string;
};

export function CreateLineHeader({ eyebrow, subtitle, title }: CreateLineHeaderProps) {
  return (
    <div className="max-w-3xl">
      <PageEyebrow icon={Sparkles}>{eyebrow}</PageEyebrow>
      <h1 className="mt-6 text-4xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
        {subtitle}
      </p>
    </div>
  );
}
