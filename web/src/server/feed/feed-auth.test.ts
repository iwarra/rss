import assert from "node:assert/strict";
import test from "node:test";

import {
  FEED_AUTHORIZATION_HEADER,
  isFeedRequestAuthorized,
} from "./feed-auth.ts";

void test("authorizes a request carrying the configured API key header", () => {
  const request = new Request("https://example.test/api/feed", {
    method: "POST",
    headers: { [FEED_AUTHORIZATION_HEADER]: "expected-key" },
  });

  assert.equal(isFeedRequestAuthorized(request, "expected-key"), true);
});

void test("rejects missing or incorrect API key headers", () => {
  const request = new Request("https://example.test/api/feed", {
    method: "POST",
    headers: { [FEED_AUTHORIZATION_HEADER]: "incorrect-key" },
  });

  assert.equal(isFeedRequestAuthorized(request, undefined), false);
  assert.equal(isFeedRequestAuthorized(request, "expected-key"), false);
});

void test("rejects a request with no API key header", () => {
  const request = new Request("https://example.test/api/feed", {
    method: "POST",
  });

  assert.equal(isFeedRequestAuthorized(request, "expected-key"), false);
});
