import { ListChecks, Plus, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import {
  ManageLinesList,
  type ManagedLine
} from "@/components/manage-lines/manage-lines-list";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { locales, type Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ManageLinesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
};

type LineStatusFilter = "active" | "all" | "closed" | "paused";

const statusFilters: LineStatusFilter[] = [
  "active",
  "paused",
  "closed",
  "all"
];

function getEffectiveStatus(line: ManagedLine) {
  return line.status === "paused" &&
    line.paused_until &&
    new Date(line.paused_until).getTime() <= Date.now()
    ? "active"
    : line.status;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: ManageLinesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: "manageLines.metadata"
  });

  return {
    title: t("title"),
    description: t("description"),
    robots: {
      index: false,
      follow: false
    }
  };
}

export default async function ManageLinesPage({
  params,
  searchParams
}: ManageLinesPageProps) {
  const { locale } = await params;
  const { status } = await searchParams;
  const selectedStatus = statusFilters.includes(status as LineStatusFilter)
    ? (status as LineStatusFilter)
    : "active";

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("manageLines");
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <ManagePageShell
        createHref={`/${locale}/create`}
        description={t("description")}
        eyebrow={t("eyebrow")}
        title={t("title")}
      >
        <MessageState
          description={t("configuration.description")}
          title={t("configuration.title")}
        />
      </ManagePageShell>
    );
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/${locale}/auth?next=${encodeURIComponent(`/${locale}/manage`)}`
    );
  }

  const { data, error } = await supabase
    .from("lines")
    .select(
      "id, name, location, line_type, custom_line_type, estimated_service_minutes, daily_capacity, auto_notify, allow_pause, status, paused_until, public_code, created_at"
    )
    .order("created_at", { ascending: false });

  const lines = (data ?? []) as ManagedLine[];
  const filteredLines =
    selectedStatus === "all"
      ? lines
      : lines.filter((line) => getEffectiveStatus(line) === selectedStatus);
  const statusCounts = Object.fromEntries(
    statusFilters.map((filter) => [
      filter,
      filter === "all"
        ? lines.length
        : lines.filter((line) => getEffectiveStatus(line) === filter).length
    ])
  ) as Record<LineStatusFilter, number>;

  return (
    <ManagePageShell
      count={lines.length}
      createHref={`/${locale}/create`}
      description={t("description")}
      eyebrow={t("eyebrow")}
      title={t("title")}
    >
      {error ? (
        <MessageState
          description={t("error.description")}
          title={t("error.title")}
        />
      ) : lines.length ? (
        <>
          <div
            aria-label={t("filters.label")}
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
          >
            {statusFilters.map((filter) => {
              const selected = selectedStatus === filter;

              return (
                <Link
                  key={filter}
                  href={
                    filter === "active"
                      ? `/${locale}/manage`
                      : `/${locale}/manage?status=${filter}`
                  }
                  role="tab"
                  aria-selected={selected}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
                    selected
                      ? "border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal-300 dark:bg-teal-300 dark:text-slate-950"
                      : "border-slate-950/10 bg-white/65 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                  }`}
                >
                  {t(`filters.${filter}`)}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      selected
                        ? "bg-white/20 dark:bg-slate-950/10"
                        : "bg-slate-950/5 dark:bg-white/10"
                    }`}
                  >
                    {statusCounts[filter]}
                  </span>
                </Link>
              );
            })}
          </div>

          {filteredLines.length ? (
            <div className="mt-5">
              <ManageLinesList lines={filteredLines} locale={locale} />
            </div>
          ) : (
            <Surface className="mt-5 p-7 text-center sm:p-10">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-500/10 text-slate-600 dark:bg-slate-300/10 dark:text-slate-300">
                <ListChecks aria-hidden="true" className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
                {t("filters.emptyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("filters.emptyDescription")}
              </p>
            </Surface>
          )}
        </>
      ) : (
        <Surface className="p-7 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
            <ListChecks aria-hidden="true" className="h-6 w-6" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
            {t("empty.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">
            {t("empty.description")}
          </p>
          <Link
            href={`/${locale}/create`}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("createFirst")}
          </Link>
        </Surface>
      )}
    </ManagePageShell>
  );
}

type ManagePageShellProps = {
  children: React.ReactNode;
  count?: number;
  createHref: string;
  description: string;
  eyebrow: string;
  title: string;
};

async function ManagePageShell({
  children,
  count,
  createHref,
  description,
  eyebrow,
  title
}: ManagePageShellProps) {
  const t = await getTranslations("manageLines");

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.20),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.16),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.14),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <PageEyebrow icon={ListChecks}>{eyebrow}</PageEyebrow>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              {description}
            </p>
            {typeof count === "number" ? (
              <p className="mt-3 text-sm font-semibold text-teal-700 dark:text-teal-200">
                {t("lineCount", { count })}
              </p>
            ) : null}
          </div>
          <Link
            href={createHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:bg-teal-300 dark:text-slate-950 dark:hover:bg-teal-200"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("createNew")}
          </Link>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}

function MessageState({
  description,
  title
}: {
  description: string;
  title: string;
}) {
  return (
    <Surface className="p-7 text-center sm:p-10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-700 dark:bg-amber-300/10 dark:text-amber-200">
        <TriangleAlert aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600 dark:text-slate-300">
        {description}
      </p>
    </Surface>
  );
}
