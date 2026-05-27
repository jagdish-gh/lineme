import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { CalendarDays, LockKeyhole } from "lucide-react";

type PrivacySection = {
  title: string;
  body: string;
};

type PrivacyPolicyContentProps = {
  effectiveDate: string;
  eyebrow: string;
  intro: string;
  sections: PrivacySection[];
  title: string;
};

export function PrivacyPolicyContent({
  effectiveDate,
  eyebrow,
  intro,
  sections,
  title
}: PrivacyPolicyContentProps) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <PageEyebrow icon={LockKeyhole}>{eyebrow}</PageEyebrow>
        <h1 className="mt-6 text-4xl font-semibold tracking-normal text-slate-950 [text-wrap:balance] dark:text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          {intro}
        </p>

        <Surface className="mt-8 p-5 sm:p-7">
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-500/10 px-3 py-2 text-sm font-semibold text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            {effectiveDate}
          </p>

          <div className="mt-7 grid gap-7">
            {sections.map((section) => (
              <article key={section.title}>
                <h2 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </Surface>
      </div>
    </section>
  );
}
