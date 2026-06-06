import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const input = body && typeof body === "object" ? body : {};
  const ticketToken =
    "ticketToken" in input && typeof input.ticketToken === "string"
      ? input.ticketToken
      : "";
  const requestId =
    "requestId" in input && typeof input.requestId === "string"
      ? input.requestId
      : "";
  const response =
    "response" in input && typeof input.response === "string"
      ? input.response.trim()
      : "";

  if (!ticketToken || !requestId || response.length < 1 || response.length > 1000) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc(
    "respond_to_line_entry_request",
    {
      p_request_id: requestId,
      p_response: response,
      p_ticket_token: ticketToken
    }
  );

  if (error || !data) {
    return NextResponse.json({ code: "response_failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
