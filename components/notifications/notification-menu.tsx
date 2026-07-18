"use client";

import { type User } from "@supabase/supabase-js";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  CircleSlash2,
  Clock3,
  LoaderCircle,
  MessageSquareMore,
  TicketCheck,
  UserPlus,
  UserX
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type NotificationType =
  | "additional_info_requested"
  | "additional_info_submitted"
  | "line_joined"
  | "member_called"
  | "member_cancelled"
  | "member_no_show"
  | "member_served";

type NotificationRecord = {
  created_at: string;
  entry_id: string | null;
  id: string;
  line_id: string | null;
  line_name: string;
  read_at: string | null;
  type: NotificationType;
  user_id: string;
};

type NotificationMenuProps = {
  user: User;
};

const joinerNotificationTypes = new Set<NotificationType>([
  "additional_info_requested",
  "member_called",
  "member_cancelled",
  "member_no_show",
  "member_served"
]);

const notificationIcons = {
  additional_info_requested: MessageSquareMore,
  additional_info_submitted: MessageSquareMore,
  line_joined: UserPlus,
  member_called: BellRing,
  member_cancelled: CircleSlash2,
  member_no_show: UserX,
  member_served: TicketCheck
} satisfies Record<NotificationType, typeof Bell>;

export function NotificationMenu({ user }: NotificationMenuProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("nav.notifications");
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const unreadCount = notifications.filter(
    (notification) => !notification.read_at
  ).length;

  const loadNotifications = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, line_id, entry_id, type, line_name, read_at, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setLoading(false);
    setLoadFailed(Boolean(error));

    if (!error) {
      setNotifications((data ?? []) as NotificationRecord[]);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    void loadNotifications();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `user_id=eq.${user.id}`,
          schema: "public",
          table: "notifications"
        },
        () => {
          void loadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, supabase, user.id]);

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

  function formatRelativeTime(createdAt: string) {
    const elapsedSeconds = Math.round(
      (new Date(createdAt).getTime() - Date.now()) / 1000
    );
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    if (Math.abs(elapsedSeconds) < 60) {
      return formatter.format(elapsedSeconds, "second");
    }

    const elapsedMinutes = Math.round(elapsedSeconds / 60);

    if (Math.abs(elapsedMinutes) < 60) {
      return formatter.format(elapsedMinutes, "minute");
    }

    const elapsedHours = Math.round(elapsedMinutes / 60);

    if (Math.abs(elapsedHours) < 24) {
      return formatter.format(elapsedHours, "hour");
    }

    return formatter.format(Math.round(elapsedHours / 24), "day");
  }

  async function markAllRead() {
    if (!supabase || unreadCount === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    setMarkingAllRead(true);
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (!error) {
      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read_at: notification.read_at ?? readAt
        }))
      );
    }

    setMarkingAllRead(false);
  }

  async function openNotification(notification: NotificationRecord) {
    if (supabase && !notification.read_at) {
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read_at: readAt } : item
        )
      );
      await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", notification.id)
        .eq("user_id", user.id);
    }

    setOpen(false);

    if (joinerNotificationTypes.has(notification.type)) {
      router.push(`/${locale}/tickets`);
    } else if (notification.line_id) {
      router.push(`/${locale}/manage/${notification.line_id}`);
    } else {
      router.push(`/${locale}/manage`);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? t("labelWithUnread", { count: unreadCount })
            : t("label")
        }
        onClick={() => setOpen((value) => !value)}
        className="relative inline-grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-teal-500/40 hover:bg-slate-50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 dark:hover:text-teal-200"
      >
        <Bell aria-hidden="true" className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold leading-none text-white dark:border-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t("title")}
          className="fixed inset-x-3 top-20 z-50 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[24rem] dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/30"
        >
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-4 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {t("title")}
              </p>
              {unreadCount > 0 ? (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {t("unread", { count: unreadCount })}
                </p>
              ) : null}
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markingAllRead}
                onClick={markAllRead}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-teal-700 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 disabled:opacity-60 dark:text-teal-200 dark:hover:bg-teal-300/10"
              >
                {markingAllRead ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-3.5 w-3.5 animate-spin"
                  />
                ) : (
                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                )}
                {t("markAllRead")}
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(32rem,calc(100dvh-7rem))] overflow-y-auto p-2">
            {loading ? (
              <div className="grid min-h-40 place-items-center text-slate-500 dark:text-slate-400">
                <LoaderCircle
                  aria-label={t("loading")}
                  className="h-6 w-6 animate-spin"
                />
              </div>
            ) : loadFailed ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {t("error")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    void loadNotifications();
                  }}
                  className="mt-3 rounded-full px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-teal-200 dark:hover:bg-teal-300/10"
                >
                  {t("retry")}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="mx-auto inline-grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {t("emptyDescription")}
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={cn(
                      "group relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-950/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:hover:bg-white/10",
                      !notification.read_at &&
                        "bg-teal-50/80 dark:bg-teal-300/[0.07]"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-full",
                        notification.read_at
                          ? "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                          : "bg-teal-100 text-teal-700 dark:bg-teal-300/15 dark:text-teal-200"
                      )}
                    >
                      <Icon aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {t(`types.${notification.type}.title`, {
                          lineName: notification.line_name
                        })}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {t(`types.${notification.type}.description`)}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <Clock3 aria-hidden="true" className="h-3 w-3" />
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </span>
                    {!notification.read_at ? (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    ) : (
                      <Check
                        aria-hidden="true"
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
