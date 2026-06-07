import { NextResponse } from "next/server";

import {
  type PublicLine,
  type SavedJoinedLine
} from "@/lib/lines/public-line";
import { mapJoinedTicketRecord } from "@/lib/lines/joined-tickets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TicketStatus = "called" | "cancelled" | "served" | "waiting";

function getTicketToken(body: unknown) {
  return body &&
    typeof body === "object" &&
    "ticketToken" in body &&
    typeof body.ticketToken === "string"
    ? body.ticketToken
    : "";
}

function isTicketToken(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const ticketToken = getTicketToken(body);

  if (!isTicketToken(ticketToken)) {
    return NextResponse.json({ code: "invalid_ticket" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("lookup_public_line_ticket", {
    p_ticket_token: ticketToken
  });

  if (error) {
    console.error("Failed to look up public line ticket", error);
    return NextResponse.json({ code: "ticket_lookup_failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ code: "ticket_not_found" }, { status: 404 });
  }

  const restored = data as {
    line: PublicLine;
    ticket: {
      entry_id: string;
      joined_at: string;
      people_ahead: number;
      position_number: number;
      requests?: Array<{
        answered_at: string | null;
        created_at: string;
        id: string;
        prompt: string;
        response: string | null;
        status: "answered" | "cancelled" | "pending";
      }>;
      status: TicketStatus;
      ticket_token: string;
    };
  };
  const savedLine: SavedJoinedLine = mapJoinedTicketRecord(restored);

  return NextResponse.json(savedLine);
}

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const ticketToken = getTicketToken(body);

  if (!isTicketToken(ticketToken)) {
    return NextResponse.json({ code: "invalid_ticket" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("leave_public_line", {
    p_ticket_token: ticketToken
  });

  if (error) {
    console.error("Failed to leave public line", error);
    return NextResponse.json({ code: "leave_failed" }, { status: 500 });
  }

  if (data === "not_found") {
    return NextResponse.json({ code: "ticket_not_found" }, { status: 404 });
  }

  if (data === "already_completed") {
    return NextResponse.json({ code: "already_completed" }, { status: 409 });
  }

  return NextResponse.json({ status: data });
}
