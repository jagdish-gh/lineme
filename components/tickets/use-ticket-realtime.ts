"use client";

import { useEffect, useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type TicketRealtimeTarget = {
  entryId: string;
  lineId: string;
  ticketToken: string;
};

type UseTicketRealtimeOptions = {
  onRefreshTicket: (
    ticketToken: string,
    entryId: string,
    showInlineError?: boolean
  ) => void;
  targets: TicketRealtimeTarget[];
};

export function useTicketRealtime({
  onRefreshTicket,
  targets
}: UseTicketRealtimeOptions) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const channelKey = targets
    .map((target) => target.entryId)
    .sort()
    .join(":");

  useEffect(() => {
    if (!supabase || !targets.length) {
      return;
    }

    const refreshTimers = new Map<string, number>();
    const refreshTarget = (target: TicketRealtimeTarget) => {
      const existingTimer = refreshTimers.get(target.entryId);

      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      refreshTimers.set(
        target.entryId,
        window.setTimeout(() => {
          refreshTimers.delete(target.entryId);
          onRefreshTicket(target.ticketToken, target.entryId, false);
        }, 150)
      );
    };
    const channelNonce = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const channel = supabase.channel(`ticket-history:${channelKey}:${channelNonce}`);

    for (const target of targets) {
      channel
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `line_id=eq.${target.lineId}`,
            schema: "public",
            table: "line_entries"
          },
          () => refreshTarget(target)
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            filter: `id=eq.${target.lineId}`,
            schema: "public",
            table: "lines"
          },
          () => refreshTarget(target)
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: `entry_id=eq.${target.entryId}`,
            schema: "public",
            table: "line_entry_requests"
          },
          () => refreshTarget(target)
        );
    }

    channel.subscribe();
    const ticketChannels = targets.map((target) =>
      supabase
        .channel(`ticket:${target.ticketToken}`)
        .on("broadcast", { event: "refresh" }, () => {
          refreshTarget(target);
        })
        .subscribe()
    );

    return () => {
      for (const timer of refreshTimers.values()) {
        window.clearTimeout(timer);
      }

      void supabase.removeChannel(channel);
      for (const ticketChannel of ticketChannels) {
        void supabase.removeChannel(ticketChannel);
      }
    };
  }, [channelKey, onRefreshTicket, supabase, targets]);
}
