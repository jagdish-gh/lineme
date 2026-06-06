import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/en/create";
}

function getLocaleFromPath(path: string) {
  const locale = path.split("/")[1];
  return locale === "hi" ? "hi" : "en";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));
  const locale = getLocaleFromPath(next);
  const supabase = await createSupabaseServerClient();

  if (!code || !supabase) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth?error=configuration&next=${encodeURIComponent(next)}`, url.origin)
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth?error=callback&next=${encodeURIComponent(next)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
