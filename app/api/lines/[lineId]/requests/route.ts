import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const entryId =
    "entryId" in input && typeof input.entryId === "string" ? input.entryId : "";
  const prompt =
    "prompt" in input && typeof input.prompt === "string"
      ? input.prompt.trim()
      : "";

  if (!entryId || prompt.length < 1 || prompt.length > 300) {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const { data: entry } = await supabase
    .from("line_entries")
    .select("id")
    .eq("id", entryId)
    .eq("line_id", lineId)
    .maybeSingle();

  if (!entry) {
    return NextResponse.json({ code: "member_not_found" }, { status: 404 });
  }

  const { error } = await supabase.from("line_entry_requests").insert({
    entry_id: entryId,
    prompt
  });

  if (error) {
    console.error("Failed to request extra member information", error);
    return NextResponse.json({ code: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
