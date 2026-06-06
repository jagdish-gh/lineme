export type PublicLineQuestion = {
  answer_type: "choice" | "email" | "number" | "phone" | "text";
  id: string;
  is_required: boolean;
  label: string;
  options: string[];
  position: number;
};

export type PublicLine = {
  custom_line_type: string | null;
  estimated_service_minutes: number | null;
  id: string;
  line_type: "clinic" | "event" | "other" | "restaurant" | "service";
  location: string | null;
  name: string;
  public_code: string;
  questions: PublicLineQuestion[];
  status: "active" | "closed" | "paused";
  waiting_count: number;
};

export type JoinedLineTicket = {
  entryId: string;
  joinedAt?: string;
  peopleAhead: number;
  positionNumber: number;
  requests?: LineEntryRequest[];
  status?: "called" | "cancelled" | "served" | "waiting";
  ticketToken: string;
};

export type LineEntryRequest = {
  answeredAt?: string | null;
  createdAt: string;
  id: string;
  prompt: string;
  response?: string | null;
  status: "answered" | "cancelled" | "pending";
};

export type SavedJoinedLine = {
  line: PublicLine;
  ticket: JoinedLineTicket;
};

export function normalizeLineCode(value: string) {
  const fromUrl = (() => {
    try {
      const url = new URL(value);
      return url.searchParams.get("code") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    } catch {
      return value;
    }
  })();

  return fromUrl.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}
