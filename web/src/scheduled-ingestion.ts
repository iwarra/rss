import { SCHEDULE_AUTHORIZATION_HEADER } from "./server/ingestion/schedule-auth.ts";

export interface SchedulerEnv {
  INGESTION_CRON_SECRET: string;
  RSS_WEB: Pick<Fetcher, "fetch">;
}

export async function triggerScheduledIngestion(
  env: SchedulerEnv,
): Promise<void> {
  const response = await env.RSS_WEB.fetch(
    new Request("https://rss-web.internal/api/ingestion", {
      method: "POST",
      headers: {
        [SCHEDULE_AUTHORIZATION_HEADER]: env.INGESTION_CRON_SECRET,
      },
    }),
  );

  if (!response.ok) {
    throw new Error(
      `Scheduled ingestion failed with status ${response.status}: ${await response.text()}`,
    );
  }
}

export default {
  scheduled(_controller, env, ctx): void {
    ctx.waitUntil(triggerScheduledIngestion(env));
  },
} satisfies ExportedHandler<SchedulerEnv>;
