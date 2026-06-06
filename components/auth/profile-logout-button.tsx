"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfileLogoutButton() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("profile");
  const [loading, setLoading] = useState(false);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      setLoading(false);
      return;
    }

    router.replace(`/${locale}`);
    router.refresh();
  }

  return (
    <ActionButton
      type="button"
      variant="danger"
      onClick={signOut}
      disabled={loading}
      icon={loading ? LoaderCircle : LogOut}
    >
      {loading ? t("signingOut") : t("logout")}
    </ActionButton>
  );
}
