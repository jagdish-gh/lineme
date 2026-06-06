import { NextResponse } from "next/server";

import {
  toCreateLineRpcParams,
  validateCreateLine
} from "@/lib/lines/create-line";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ code: "configuration" }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "authentication_required" },
      { status: 401 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }

  const validation = validateCreateLine(body);

  if (!validation.success) {
    return NextResponse.json({ code: validation.code }, { status: 400 });
  }

  const { data, error } = await supabase.rpc(
    "create_line",
    toCreateLineRpcParams(validation.data)
  );

  const line = Array.isArray(data) ? data[0] : null;

  if (error?.code === "PGRST202") {
    console.error("Create line database migration is not applied", error);
    return NextResponse.json(
      { code: "database_not_ready" },
      { status: 503 }
    );
  }

  if (error || !line) {
    console.error("Failed to create line", error);
    return NextResponse.json({ code: "create_failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: line.id,
      publicCode: line.public_code
    },
    { status: 201 }
  );
}
