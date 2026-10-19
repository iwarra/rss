import assert from "node:assert/strict";
import test from "node:test";

import {
  type SchedulerEnv,
  triggerScheduledIngestion,
} from "./scheduled-ingestion.ts";
import { SCHEDULE_AUTHORIZATION_HEADER } from "./server/ingestion/schedule-auth.ts";

void test("sends the scheduling secret to the ingestion service", async () => {
  let request: Request | undefined;
  const env: SchedulerEnv = {
    INGESTION_CRON_SECRET: "expected-secret",
    RSS_WEB: {
      fetch: (receivedRequest) => {
        request = receivedRequest as Request;
        return Promise.resolve(new Response(null, { status: 202 }));
      },
    },
  };

  await triggerScheduledIngestion(env);

  assert.equal(request?.method, "POST");
  assert.equal(
    request?.headers.get(SCHEDULE_AUTHORIZATION_HEADER),
    "expected-secret",
  );
});

void test("surfaces a failed ingestion response so Cloudflare records the cron failure", async () => {
  const env: SchedulerEnv = {
    INGESTION_CRON_SECRET: "expected-secret",
    RSS_WEB: {
      fetch: () =>
        Promise.resolve(new Response("upstream failure", { status: 500 })),
    },
  };

  await assert.rejects(triggerScheduledIngestion(env), /status 500/);
});
