export type ManagedLineStatus = "active" | "closed" | "paused";

export type ManagedLineEntryStatus =
  | "called"
  | "cancelled"
  | "no_show"
  | "served"
  | "waiting";

export type ManagedLineEntryLike = {
  status: ManagedLineEntryStatus;
};

export type ManagedLineFilter = "active" | "all" | "no_show";

export function getEffectiveLineStatus(
  status: ManagedLineStatus,
  pausedUntil: string | null,
  now = Date.now()
): ManagedLineStatus {
  return status === "paused" &&
    pausedUntil &&
    new Date(pausedUntil).getTime() <= now
    ? "active"
    : status;
}

export function isActiveLineEntry(entry: ManagedLineEntryLike) {
  return entry.status === "waiting" || entry.status === "called";
}

export function getVisibleLineEntries<Entry extends ManagedLineEntryLike>(
  entries: Entry[],
  filter: ManagedLineFilter
) {
  if (filter === "active") {
    return entries.filter(isActiveLineEntry);
  }

  if (filter === "no_show") {
    return entries.filter((entry) => entry.status === "no_show");
  }

  return entries;
}

export function getCalledLineEntry<Entry extends ManagedLineEntryLike>(
  entries: Entry[]
) {
  return entries.find((entry) => entry.status === "called") ?? null;
}
