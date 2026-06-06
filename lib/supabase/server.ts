import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
