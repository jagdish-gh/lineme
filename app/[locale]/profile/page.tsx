import {
  CalendarDays,
  Clock3,
  KeyRound,
  ListChecks,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { ProfileLogoutButton } from "@/components/auth/profile-logout-button";
import { OAuthAvatar } from "@/components/auth/oauth-avatar";
import { PageEyebrow } from "@/components/ui/page-eyebrow";
import { Surface } from "@/components/ui/surface";
import { locales, type Locale } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "profile.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false }
  };
}

function getMetadataString(
  metadata: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("profile");
  const format = await getFormatter();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(`/${locale}/auth?error=configuration&next=/${locale}/profile`);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/${locale}/auth?next=${encodeURIComponent(`/${locale}/profile`)}`
    );
  }

  const { count } = await supabase
    .from("lines")
    .select("id", { count: "exact", head: true });

  const name =
    getMetadataString(user.user_metadata, [
      "full_name",
      "name",
      "user_name"
    ]) ?? null;
  const avatarUrl = getMetadataString(user.user_metadata, [
    "avatar_url",
    "picture"
  ]);
  const provider =
    typeof user.app_metadata.provider === "string"
      ? user.app_metadata.provider
      : t("unknown");

  const details = [
    {
      icon: Mail,
      label: t("email"),
      value: user.email ?? t("notAvailable")
    },
    {
      icon: KeyRound,
      label: t("provider"),
      value: t.has(`providers.${provider}`)
        ? t(`providers.${provider}`)
        : provider
    },
    {
      icon: CalendarDays,
      label: t("memberSince"),
      value: format.dateTime(new Date(user.created_at), {
        dateStyle: "long"
      })
    },
    {
      icon: Clock3,
      label: t("lastSignIn"),
      value: user.last_sign_in_at
        ? format.dateTime(new Date(user.last_sign_in_at), {
            dateStyle: "medium",
            timeStyle: "short"
          })
        : t("notAvailable")
    }
  ];

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.18),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(56,189,248,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10 transition-colors duration-500 dark:bg-[radial-gradient(circle_at_18%_8%,_rgba(20,184,166,0.14),_transparent_30%),radial-gradient(circle_at_86%_20%,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_#030712_0%,_#0f172a_100%)] sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <PageEyebrow icon={UserRound}>{t("eyebrow")}</PageEyebrow>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
          {t("description")}
        </p>

        <Surface className="mt-8 overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-slate-950/5 p-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 sm:p-8">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
                <OAuthAvatar
                  fallbackClassName="h-8 w-8"
                  size={80}
                  src={avatarUrl}
                />
              </span>
              <div className="min-w-0">
                {name && <h2 className="truncate text-2xl font-semibold text-slate-950 dark:text-white">
                  {name}
                </h2>}
                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                  {user.email}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  {t("authenticated")}
                </span>
              </div>
            </div>
            <ProfileLogoutButton />
          </div>

          <dl className="grid gap-px bg-slate-200/70 sm:grid-cols-2 dark:bg-white/10">
            {details.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex gap-3 bg-white/80 p-5 dark:bg-slate-900/80 sm:p-6"
              >
                <Icon
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-300"
                />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 break-words text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">
                    {value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </Surface>

        <Surface className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:bg-teal-300/10 dark:text-teal-200">
              <ListChecks aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">
                {t("queues", { count: count ?? 0 })}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("queuesDescription")}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/manage`}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t("manageQueues")}
          </Link>
        </Surface>
      </div>
    </main>
  );
}
