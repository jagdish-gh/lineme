import { NextResponse } from "next/server";

import {
  normalizeLineCode,
  type PublicLine
} from "@/lib/lines/public-line";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const code = normalizeLineCode(searchParams.get("code") ?? "");

  if (code.length !== 10) {
    return NextResponse.json({ code: "invalid_code" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("lookup_public_line", {
    p_code: code
  });

  if (error) {
    console.error("Failed to look up public line", error);
    return NextResponse.json({ code: "lookup_failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ code: "line_not_found" }, { status: 404 });
  }

  return NextResponse.json({ line: data as PublicLine });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const input = body as {
    answers?: unknown;
    code?: unknown;
    joinWithAccount?: unknown;
  };
  const code = normalizeLineCode(
    typeof input.code === "string" ? input.code : ""
  );
  const answers =
    input.answers &&
    typeof input.answers === "object" &&
    !Array.isArray(input.answers)
      ? input.answers
      : {};
  const joinWithAccount = input.joinWithAccount === true;

  if (code.length !== 10) {
    return NextResponse.json({ code: "invalid_code" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (joinWithAccount && !user) {
    return NextResponse.json(
      { code: "authentication_required" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase.rpc("join_public_line", {
    p_answers: answers,
    p_code: code
  });

  if (error) {
    const knownCodes = new Set([
      "answer_too_long",
      "invalid_answers",
      "invalid_choice_answer",
      "invalid_code",
      "invalid_email_answer",
      "invalid_number_answer",
      "invalid_phone_answer",
      "line_at_capacity",
      "line_not_active",
      "line_not_found",
      "required_answer_missing"
    ]);
    const responseCode = knownCodes.has(error.message)
      ? error.message
      : error.code === "PGRST202"
        ? "database_not_ready"
        : "join_failed";

    if (responseCode === "join_failed") {
      console.error("Failed to join public line", error);
    }

    const status =
      responseCode === "line_not_found"
        ? 404
        : responseCode === "database_not_ready"
          ? 503
          : 400;

    return NextResponse.json({ code: responseCode }, { status });
  }

  const ticket = Array.isArray(data) ? data[0] : null;

  if (!ticket) {
    return NextResponse.json({ code: "join_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      ticket: {
        entryId: ticket.entry_id,
        peopleAhead: ticket.people_ahead,
        positionNumber: ticket.position_number,
        ticketToken: ticket.ticket_token
      }
    },
    { status: 201 }
  );
}
