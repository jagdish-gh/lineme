import { NextResponse } from "next/server";

import {
  sendTicketPush,
  type TicketPushPayload
} from "@/lib/push/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const actions = new Set(["call", "call_next", "no_show", "serve"]);

type LineEntryNotificationTarget = {
  id: string;
  ticket_token: string;
};

type PushSubscriptionRecord = {
  auth: string;
  endpoint: string;
  id: string;
  locale: "en" | "hi";
  notifications_sent: string[];
  p256dh: string;
};

type ActiveEntryWithPush = {
  id: string;
  line_id: string;
  lines: {
    name: string;
    public_code: string;
  };
  position_number: number;
  status: "called" | "waiting";
  ticket_push_subscriptions: PushSubscriptionRecord[];
  ticket_token: string;
};

const milestoneMessages = {
  en: {
    ahead2: (lineName: string) => ({
      body: "Only 2 people are ahead of you. Please stay nearby.",
      title: `${lineName}: you are almost up`
    }),
    ahead3: (lineName: string) => ({
      body: "Only 3 people are ahead of you. Get ready for your turn.",
      title: `${lineName}: your turn is close`
    }),
    turn: (lineName: string) => ({
      body: "It is your turn now. Please head to the service area.",
      title: `${lineName}: it is your turn`
    })
  },
  hi: {
    ahead2: (lineName: string) => ({
      body: "आपसे आगे सिर्फ 2 लोग हैं। कृपया पास में रहें।",
      title: `${lineName}: आपकी बारी लगभग आ गई है`
    }),
    ahead3: (lineName: string) => ({
      body: "आपसे आगे सिर्फ 3 लोग हैं। अपनी बारी के लिए तैयार रहें।",
      title: `${lineName}: आपकी बारी नजदीक है`
    }),
    turn: (lineName: string) => ({
      body: "अब आपकी बारी है। कृपया सेवा क्षेत्र में जाएं।",
      title: `${lineName}: आपकी बारी है`
    })
  }
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

function getMilestone(entry: ActiveEntryWithPush, peopleAhead: number) {
  if (entry.status === "called") {
    return "turn";
  }

  if (peopleAhead === 3) {
    return "ahead3";
  }

  if (peopleAhead === 2) {
    return "ahead2";
  }

  return null;
}

async function sendQueueMilestonePushes(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  lineId: string,
  requestUrl: string
) {
  const { data, error } = await supabase
    .from("line_entries")
    .select(
      "id, line_id, position_number, status, ticket_token, lines!inner(name, public_code), ticket_push_subscriptions(id, endpoint, p256dh, auth, locale, notifications_sent)"
    )
    .eq("line_id", lineId)
    .in("status", ["waiting", "called"])
    .order("position_number");

  if (error) {
    console.error("Failed to load push notification targets", error);
    return;
  }

  const entries = (data ?? []) as unknown as ActiveEntryWithPush[];
  const origin = new URL(requestUrl).origin;

  for (const [index, entry] of entries.entries()) {
    const peopleAhead = index;
    const milestone = getMilestone(entry, peopleAhead);

    if (!milestone) {
      continue;
    }

    for (const subscription of entry.ticket_push_subscriptions ?? []) {
      if (subscription.notifications_sent.includes(milestone)) {
        continue;
      }

      const locale = subscription.locale === "hi" ? "hi" : "en";
      const message = milestoneMessages[locale][milestone](entry.lines.name);
      const payload: TicketPushPayload = {
        body: message.body,
        tag: `lineme:${entry.id}:${milestone}`,
        title: message.title,
        url: `${origin}/${locale}/tickets`
      };

      try {
        const result = await sendTicketPush(
          {
            endpoint: subscription.endpoint,
            keys: {
              auth: subscription.auth,
              p256dh: subscription.p256dh
            }
          },
          payload
        );

        if (!result.skipped) {
          await supabase
            .from("ticket_push_subscriptions")
            .update({
              notifications_sent: [
                ...new Set([
                  ...subscription.notifications_sent,
                  milestone
                ])
              ]
            })
            .eq("id", subscription.id);
        }
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
          console.error("Failed to send push notification", error);
        }
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
  const action =
    "action" in input && typeof input.action === "string" ? input.action : "";
  const entryId =
    "entryId" in input && typeof input.entryId === "string"
      ? input.entryId
      : null;

  if (!actions.has(action)) {
    return NextResponse.json({ code: "invalid_action" }, { status: 400 });
  }

  const { error: rolloverError } = await supabase.rpc(
    "rollover_owned_line_day",
    {
      p_line_id: lineId
    }
  );

  if (rolloverError) {
    console.error("Failed to roll over line day", rolloverError);
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
    await sendQueueMilestonePushes(supabase, lineId, request.url);

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
  await sendQueueMilestonePushes(supabase, lineId, request.url);

  return NextResponse.json({ entryId: data });
}
