import {
  type PublicLine,
  type SavedJoinedLine
} from "@/lib/lines/public-line";

type JoinedTicketRecord = {
  line: PublicLine;
  ticket: {
    entry_id: string;
    joined_at: string;
    people_ahead: number;
    position_number: number;
    requests?: Array<{
      answered_at: string | null;
      created_at: string;
      id: string;
      prompt: string;
      response: string | null;
      status: "answered" | "cancelled" | "pending";
    }>;
    status: "called" | "cancelled" | "served" | "waiting";
    ticket_token: string;
  };
};

export function mapJoinedTicketRecord(
  record: JoinedTicketRecord
): SavedJoinedLine {
  return {
    line: record.line,
    ticket: {
      entryId: record.ticket.entry_id,
      joinedAt: record.ticket.joined_at,
      peopleAhead: record.ticket.people_ahead,
      positionNumber: record.ticket.position_number,
      requests: (record.ticket.requests ?? []).map((request) => ({
        answeredAt: request.answered_at,
        createdAt: request.created_at,
        id: request.id,
        prompt: request.prompt,
        response: request.response,
        status: request.status
      })),
      status: record.ticket.status,
      ticketToken: record.ticket.ticket_token
    }
  };
}

export function mapJoinedTicketRecords(data: unknown): SavedJoinedLine[] {
  return Array.isArray(data)
    ? (data as JoinedTicketRecord[]).map(mapJoinedTicketRecord)
    : [];
}
