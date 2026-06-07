import { NextResponse } from "next/server";

import { getSafeAuthRedirectPath } from "@/lib/auth/redirect-path";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const next =
    body && typeof body === "object" && "next" in body
      ? getSafeAuthRedirectPath(body.next)
      : "/en";
  const response = NextResponse.json({ ok: true });

  response.cookies.set("lineme-auth-next", next, {
    httpOnly: true,
    maxAge: 60 * 15,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
