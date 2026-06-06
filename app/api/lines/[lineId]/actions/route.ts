import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const actions = new Set(["call", "call_next", "serve"]);

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

  const input = body && typeof body === "object" ? body : {};
  const action =
    "action" in input && typeof input.action === "string" ? input.action : "";
  const entryId =
    "entryId" in input && typeof input.entryId === "string"
      ? input.entryId
      : null;

  if (!actions.has(action)) {
    return NextResponse.json({ code: "invalid_action" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("manage_line_entry", {
    p_action: action,
    p_entry_id: entryId,
    p_line_id: lineId
  });

  if (error) {
    const known = new Set([
      "line_not_found",
      "member_not_available",
      "no_waiting_members"
    ]);
    const code = known.has(error.message) ? error.message : "action_failed";
    return NextResponse.json(
      { code },
      { status: code === "line_not_found" ? 404 : 400 }
    );
  }

  return NextResponse.json({ entryId: data });
}
