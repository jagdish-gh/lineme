import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeLineCode } from "@/lib/lines/public-line";

describe("join line flow", () => {
  it("normalizes typed line codes", () => {
    assert.equal(normalizeLineCode(" f653-9d 7848 "), "F6539D7848");
  });

  it("extracts a line code from join links", () => {
    assert.equal(
      normalizeLineCode("https://www.lineme.in/en/join/F6539D7848?utm=ignored"),
      "F6539D7848"
    );
  });

  it("limits codes to the public 10-character format", () => {
    assert.equal(normalizeLineCode("abcdef1234567890"), "ABCDEF1234");
  });
});
