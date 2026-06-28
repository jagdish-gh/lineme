import { NextResponse } from "next/server";

import {
  sendTicketPush,
  type TicketPushPayload
} from "@/lib/push/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PushSubscriptionRecord = {
  auth: string;
  endpoint: string;
  id: string;
  locale: "en" | "hi";
  p256dh: string;
};

type RequestedInfoPushTarget = {
  id: string;
  line_id: string;
  lines: {
    name: string;
  };
  ticket_push_subscriptions: PushSubscriptionRecord[];
  ticket_token: string;
};

const infoRequestMessages = {
  en: (lineName: string) => ({
    body: "The team has asked for more information. Open your ticket to respond.",
    title: `${lineName}: information needed`
  }),
  hi: (lineName: string) => ({
    body: "टीम ने आपसे अधिक जानकारी मांगी है। उत्तर देने के लिए अपना टिकट खोलें।",
    title: `${lineName}: जानकारी चाहिए`
  })
};

async function broadcastTicketRefresh(
  target: { id: string; ticket_token: string },
  lineId: string
) {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    return;
  }

  try {
    const response = await fetch(
      `${supabaseConfig.url}/realtime/v1/api/broadcast`,
      {
        body: JSON.stringify({
          messages: [
            {
              event: "refresh",
              payload: { entry_id: target.id, line_id: lineId },
              topic: `ticket:${target.ticket_token}`
            }
          ]
        }),
        headers: {
          Authorization: `Bearer ${supabaseConfig.publishableKey}`,
          apikey: supabaseConfig.publishableKey,
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );

    if (!response.ok) {
      console.error("Failed to broadcast ticket refresh", {
        status: response.status
      });
    }
  } catch (error) {
    console.error("Failed to broadcast ticket refresh", error);
  }
}

async function notifyTicketHolderAboutInfoRequest(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  target: RequestedInfoPushTarget,
  requestId: string,
  requestUrl: string
) {
  const origin = new URL(requestUrl).origin;

  for (const subscription of target.ticket_push_subscriptions ?? []) {
    const locale = subscription.locale === "hi" ? "hi" : "en";
    const message = infoRequestMessages[locale](target.lines.name);
    const payload: TicketPushPayload = {
      body: message.body,
      tag: `lineme:${target.id}:request:${requestId}`,
      title: message.title,
      url: `${origin}/${locale}/tickets`
    };

    try {
      await sendTicketPush(
        {
          endpoint: subscription.endpoint,
          keys: {
            auth: subscription.auth,
            p256dh: subscription.p256dh
          }
        },
        payload
      );
    } catch (error) {
      const statusCode =
        typeof error === "object" &&
        error &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
          ? error.statusCode
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("ticket_push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      } else {
        console.error("Failed to send info request push notification", error);
      }
    }
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

  const { data: createdRequest, error } = await supabase
    .from("line_entry_requests")
    .insert({
      entry_id: entryId,
      prompt
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to request extra member information", error);
    return NextResponse.json({ code: "request_failed" }, { status: 500 });
  }

  const { data: target, error: targetError } = await supabase
    .from("line_entries")
    .select(
      "id, line_id, ticket_token, lines!inner(name), ticket_push_subscriptions(id, endpoint, p256dh, auth, locale)"
    )
    .eq("id", entryId)
    .eq("line_id", lineId)
    .maybeSingle();

  if (targetError) {
    console.error("Failed to load info request notification target", targetError);
  }

  if (target && createdRequest?.id) {
    const notificationTarget = target as unknown as RequestedInfoPushTarget;
    await broadcastTicketRefresh(notificationTarget, lineId);
    await notifyTicketHolderAboutInfoRequest(
      supabase,
      notificationTarget,
      createdRequest.id,
      request.url
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
