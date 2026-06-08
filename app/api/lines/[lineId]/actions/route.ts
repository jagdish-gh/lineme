import { NextResponse } from "next/server";

import { supabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const actions = new Set(["call", "call_next", "no_show", "serve"]);

type LineEntryNotificationTarget = {
  id: string;
  ticket_token: string;
};

async function broadcastTicketRefreshes(
  targets: LineEntryNotificationTarget[],
  lineId: string
) {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey || !targets.length) {
    return;
  }

  const messages = [...new Map(
    targets.map((target) => [target.ticket_token, target])
  ).values()].map((target) => ({
    event: "refresh",
    payload: { entry_id: target.id, line_id: lineId },
    topic: `ticket:${target.ticket_token}`
  }));

  try {
    const response = await fetch(
      `${supabaseConfig.url}/realtime/v1/api/broadcast`,
      {
        body: JSON.stringify({ messages }),
        headers: {
          Authorization: `Bearer ${supabaseConfig.publishableKey}`,
          apikey: supabaseConfig.publishableKey,
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );

    if (!response.ok) {
      console.error("Failed to broadcast ticket refreshes", {
        status: response.status
      });
    }
  } catch (error) {
    console.error("Failed to broadcast ticket refreshes", error);
  }
}

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

  const { data: previouslyCalledEntries } = await supabase
    .from("line_entries")
    .select("id, ticket_token")
    .eq("line_id", lineId)
    .eq("status", "called");

  if (action === "no_show") {
    if (!entryId) {
      return NextResponse.json(
        { code: "member_not_available" },
        { status: 400 }
      );
    }

    const { data: noShowEntry, error: noShowError } = await supabase
      .from("line_entries")
      .update({ status: "no_show" })
      .eq("id", entryId)
      .eq("line_id", lineId)
      .eq("status", "called")
      .select("id, ticket_token")
      .maybeSingle();

    if (noShowError) {
      const code =
        noShowError.code === "23514" ? "database_not_ready" : "action_failed";
      return NextResponse.json({ code }, { status: 400 });
    }

    if (!noShowEntry) {
      return NextResponse.json(
        { code: "member_not_available" },
        { status: 400 }
      );
    }

    const { data: activeEntries } = await supabase
      .from("line_entries")
      .select("id, ticket_token")
      .eq("line_id", lineId)
      .in("status", ["waiting", "called"]);

    await broadcastTicketRefreshes(
      [...(activeEntries ?? []), noShowEntry],
      lineId
    );

    return NextResponse.json({ entryId: noShowEntry.id });
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
      "no_waiting_members",
      "invalid_action"
    ]);
    const code = known.has(error.message) ? error.message : "action_failed";
    return NextResponse.json(
      { code },
      { status: code === "line_not_found" ? 404 : 400 }
    );
  }

  const affectedEntryIds = new Set(
    [
      data,
      entryId,
      ...(previouslyCalledEntries ?? []).map((entry) => entry.id)
    ].filter((value): value is string => typeof value === "string")
  );
  const [{ data: activeEntries }, { data: affectedEntries }] =
    await Promise.all([
      supabase
        .from("line_entries")
        .select("id, ticket_token")
        .eq("line_id", lineId)
        .in("status", ["waiting", "called"]),
      affectedEntryIds.size
        ? supabase
            .from("line_entries")
            .select("id, ticket_token")
            .in("id", [...affectedEntryIds])
        : Promise.resolve({ data: [] })
    ]);

  await broadcastTicketRefreshes(
    [...(activeEntries ?? []), ...(affectedEntries ?? [])],
    lineId
  );

  return NextResponse.json({ entryId: data });
}
