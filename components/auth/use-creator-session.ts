"use client";

import { type User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useCreatorSession() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    configured: Boolean(supabase),
    loading,
    user
  };
}
