"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    return null;
  }

  return createBrowserClient(supabaseConfig.url, supabaseConfig.publishableKey);
}
