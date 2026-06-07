import { NextResponse } from "next/server";

import { getSafeAuthRedirectPath } from "@/lib/auth/redirect-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getLocaleFromPath(path: string) {
  const locale = path.split("/")[1];
  return locale === "hi" ? "hi" : "en";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieNext = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)lineme-auth-next=([^;]+)/)?.[1];
  const next = getSafeAuthRedirectPath(
    (cookieNext ? decodeURIComponent(cookieNext) : null) ??
      url.searchParams.get("next"),
    "/en/create"
  );
  const locale = getLocaleFromPath(next);
  const supabase = await createSupabaseServerClient();

  if (!code || !supabase) {
    const response = NextResponse.redirect(
      new URL(`/${locale}/auth?error=configuration&next=${encodeURIComponent(next)}`, url.origin)
    );
    response.cookies.delete("lineme-auth-next");
    return response;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const response = NextResponse.redirect(
      new URL(`/${locale}/auth?error=callback&next=${encodeURIComponent(next)}`, url.origin)
    );
    response.cookies.delete("lineme-auth-next");
    return response;
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.delete("lineme-auth-next");
  return response;
}
