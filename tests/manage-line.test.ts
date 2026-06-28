import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getCalledLineEntry,
  getEffectiveLineStatus,
  getVisibleLineEntries,
  isActiveLineEntry
} from "@/lib/lines/manage-line";

const entries = [
  { id: "waiting-1", status: "waiting" as const },
  { id: "called-1", status: "called" as const },
  { id: "served-1", status: "served" as const },
  { id: "no-show-1", status: "no_show" as const }
];

describe("manage line flow", () => {
  it("treats expired timed pauses as active", () => {
    assert.equal(
      getEffectiveLineStatus("paused", "2026-06-28T08:00:00.000Z", Date.UTC(2026, 5, 28, 9)),
      "active"
    );
    assert.equal(
      getEffectiveLineStatus("paused", "2026-06-28T10:00:00.000Z", Date.UTC(2026, 5, 28, 9)),
      "paused"
    );
    assert.equal(getEffectiveLineStatus("closed", null), "closed");
  });

  it("filters active, no-show, and all entry views", () => {
    assert.deepEqual(entries.filter(isActiveLineEntry).map((entry) => entry.id), [
      "waiting-1",
      "called-1"
    ]);
    assert.deepEqual(getVisibleLineEntries(entries, "active").map((entry) => entry.id), [
      "waiting-1",
      "called-1"
    ]);
    assert.deepEqual(getVisibleLineEntries(entries, "no_show").map((entry) => entry.id), [
      "no-show-1"
    ]);
    assert.deepEqual(getVisibleLineEntries(entries, "all").map((entry) => entry.id), [
      "waiting-1",
      "called-1",
      "served-1",
      "no-show-1"
    ]);
  });

  it("finds the currently called member", () => {
    assert.deepEqual(getCalledLineEntry(entries), {
      id: "called-1",
      status: "called"
    });
    assert.equal(getCalledLineEntry([{ id: "waiting-1", status: "waiting" }]), null);
  });
});
