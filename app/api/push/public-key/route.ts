import { NextResponse } from "next/server";

import { pushConfig } from "@/lib/push/server";

export async function GET() {
  if (!pushConfig.publicKey) {
    return NextResponse.json(
      { code: "push_not_configured" },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey: pushConfig.publicKey });
}
