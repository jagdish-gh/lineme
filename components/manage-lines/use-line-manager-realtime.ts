"use client";

import { useEffect, useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UseLineManagerRealtimeOptions = {
  entryIds: string[];
  lineId: string;
  onRefresh: () => void;
};

export function useLineManagerRealtime({
  entryIds,
  lineId,
  onRefresh
}: UseLineManagerRealtimeOptions) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const entryIdsKey = [...entryIds].sort().join(":");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let refreshTimer: number | null = null;
    const refreshFromRealtime = () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(onRefresh, 150);
    };
    const channel = supabase
      .channel(`line-manager:${lineId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          filter: `line_id=eq.${lineId}`,
          schema: "public",
          table: "line_entries"
        },
        refreshFromRealtime
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `id=eq.${lineId}`,
          schema: "public",
          table: "lines"
        },
        refreshFromRealtime
      );

    for (const entryId of entryIds) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          filter: `entry_id=eq.${entryId}`,
          schema: "public",
          table: "line_entry_requests"
        },
        refreshFromRealtime
      );
    }

    channel.subscribe();

    return () => {
      if (refreshTimer) {
        window.clearTimeout(refreshTimer);
      }

      void supabase.removeChannel(channel);
    };
  }, [entryIds, entryIdsKey, lineId, onRefresh, supabase]);
}
