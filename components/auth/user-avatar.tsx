"use client";

import { type User } from "@supabase/supabase-js";
import {
  ChevronDown,
  ListChecks,
  LoaderCircle,
  LogOut,
  TicketCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  className?: string;
  label: string;
  user: User | null;
};

function getUserName(user: User) {
  const metadata = user.user_metadata;
  const candidates = [metadata.full_name, metadata.name, metadata.user_name];

  return candidates.find(
    (value): value is string => typeof value === "string" && Boolean(value.trim())
  );
}

export function UserAvatar({ className, label, user }: UserAvatarProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("nav.account");
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const avatarUrl =
    typeof user.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null;
  const name = getUserName(user);
  const accessibleLabel = user.email ? `${label}: ${user.email}` : label;

  async function signOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      setSigningOut(false);
      return;
    }

    setOpen(false);
    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={accessibleLabel}
        onClick={() => setOpen((value) => !value)}
        className="group inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 bg-white p-0.5 pr-1.5 text-slate-700 shadow-sm transition hover:border-teal-500/40 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
      >
        <span className="relative inline-grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {avatarUrl ? (
            // OAuth avatar URLs are dynamic and can come from different identity providers.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" src={avatarUrl} />
          ) : (
            <UserRound aria-hidden="true" className="h-5 w-5" />
          )}
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"
          />
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("h-3.5 w-3.5 transition", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30"
        >
          <div className="border-b border-slate-100 px-3 py-3 dark:border-white/10">
            {name ? (
              <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                {name}
              </p>
            ) : null}
            {user.email ? (
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {user.email}
              </p>
            ) : null}
          </div>

          <div className="py-2">
            <Link
              role="menuitem"
              href={`/${locale}/profile`}
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <UserRound aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              {t("profile")}
            </Link>
            <Link
              role="menuitem"
              href={`/${locale}/tickets`}
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <TicketCheck aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              {t("tickets")}
            </Link>
            <Link
              role="menuitem"
              href={`/${locale}/manage`}
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <ListChecks aria-hidden="true" className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              {t("manage")}
            </Link>
          </div>

          <div className="border-t border-slate-100 pt-2 dark:border-white/10">
            <button
              role="menuitem"
              type="button"
              disabled={signingOut}
              onClick={signOut}
              className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-400/10"
            >
              {signingOut ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut aria-hidden="true" className="h-4 w-4" />
              )}
              {signingOut ? t("signingOut") : t("logout")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
