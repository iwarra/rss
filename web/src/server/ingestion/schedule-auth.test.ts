import assert from "node:assert/strict";
import test from "node:test";

import {
  isScheduledIngestionRequestAuthorized,
  SCHEDULE_AUTHORIZATION_HEADER,
} from "./schedule-auth.ts";

void test("authorizes a request carrying the configured scheduling secret", () => {
  const request = new Request("https://example.test/api/ingestion", {
    headers: { [SCHEDULE_AUTHORIZATION_HEADER]: "expected-secret" },
  });

  assert.equal(
    isScheduledIngestionRequestAuthorized(request, "expected-secret"),
    true,
  );
});

void test("rejects missing or incorrect scheduling secrets", () => {
  const request = new Request("https://example.test/api/ingestion", {
    headers: { [SCHEDULE_AUTHORIZATION_HEADER]: "incorrect-secret" },
  });

  assert.equal(
    isScheduledIngestionRequestAuthorized(request, undefined),
    false,
  );
  assert.equal(
    isScheduledIngestionRequestAuthorized(request, "expected-secret"),
    false,
  );
});
