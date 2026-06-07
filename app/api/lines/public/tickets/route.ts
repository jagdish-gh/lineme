import { NextResponse } from "next/server";

import { mapJoinedTicketRecords } from "@/lib/lines/joined-tickets";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
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

  const { data, error } = await supabase.rpc("list_joined_line_tickets");

  if (error) {
    console.error("Failed to list joined line tickets", error);
    return NextResponse.json({ code: "ticket_history_failed" }, { status: 500 });
  }

  return NextResponse.json({ tickets: mapJoinedTicketRecords(data) });
}
