import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSafeAuthRedirectPath } from "@/lib/auth/redirect-path";
import { isProviderDisabledError } from "@/lib/supabase/auth-error";

describe("login flow", () => {
  it("allows localized internal redirect paths", () => {
    assert.equal(
      getSafeAuthRedirectPath("/en/manage/line-123", "/en"),
      "/en/manage/line-123"
    );
    assert.equal(getSafeAuthRedirectPath("/hi/create", "/en"), "/hi/create");
  });

  it("rejects external, protocol-relative, and unsupported-locale redirects", () => {
    assert.equal(getSafeAuthRedirectPath("https://evil.test", "/en"), "/en");
    assert.equal(getSafeAuthRedirectPath("//evil.test/path", "/en"), "/en");
    assert.equal(getSafeAuthRedirectPath("/fr/manage", "/en"), "/en");
  });

  it("detects disabled Google provider errors", () => {
    assert.equal(
      isProviderDisabledError({
        code: "validation_failed",
        message: "Unsupported provider: provider is not enabled"
      }),
      true
    );
    assert.equal(
      isProviderDisabledError({
        code: "other",
        message: "Unsupported provider"
      }),
      false
    );
  });
});
