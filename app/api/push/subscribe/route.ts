import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function isUuid(value: unknown) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const input = body && typeof body === "object" ? body : {};
  const ticketToken =
    "ticketToken" in input && isUuid(input.ticketToken)
      ? input.ticketToken
      : "";
  const subscription =
    "subscription" in input &&
    input.subscription &&
    typeof input.subscription === "object"
      ? (input.subscription as {
          endpoint?: unknown;
          keys?: {
            auth?: unknown;
            p256dh?: unknown;
          };
        })
      : null;
  const endpoint =
    typeof subscription?.endpoint === "string" ? subscription.endpoint : "";
  const p256dh =
    typeof subscription?.keys?.p256dh === "string"
      ? subscription.keys.p256dh
      : "";
  const auth =
    typeof subscription?.keys?.auth === "string" ? subscription.keys.auth : "";
  const locale =
    "locale" in input && (input.locale === "en" || input.locale === "hi")
      ? input.locale
      : "en";

  if (!ticketToken || !endpoint || !p256dh || !auth) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const { error } = await supabase.rpc("upsert_ticket_push_subscription", {
    p_auth: auth,
    p_endpoint: endpoint,
    p_locale: locale,
    p_p256dh: p256dh,
    p_ticket_token: ticketToken,
    p_user_agent: request.headers.get("user-agent")
  });

  if (error) {
    const code =
      error.message === "ticket_not_found"
        ? "ticket_not_found"
        : error.code === "PGRST202"
          ? "database_not_ready"
          : "subscribe_failed";

    if (code === "subscribe_failed") {
      console.error("Failed to save push subscription", error);
    }

    return NextResponse.json(
      { code },
      { status: code === "ticket_not_found" ? 404 : 400 }
    );
  }

  return NextResponse.json({ success: true });
}
