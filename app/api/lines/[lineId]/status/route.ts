import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const actions = new Set(["expire", "pause", "pause_30", "resume"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ code: "authentication_required" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const action =
    body &&
    typeof body === "object" &&
    "action" in body &&
    typeof body.action === "string"
      ? body.action
      : "";

  if (!actions.has(action)) {
    return NextResponse.json({ code: "invalid_action" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("manage_line_status", {
    p_action: action,
    p_line_id: lineId
  });

  if (error) {
    const known = new Set([
      "line_expired",
      "line_not_found",
      "pause_not_allowed"
    ]);
    return NextResponse.json(
      { code: known.has(error.message) ? error.message : "status_failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({ line: Array.isArray(data) ? data[0] : data });
}
