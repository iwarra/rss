import { getCloudflareContext } from "@opennextjs/cloudflare";

import { isScheduledIngestionRequestAuthorized } from "@/server/ingestion/schedule-auth";
import { ingestFeeds } from "@/server/ingestion/service";

export const runtime = "nodejs";

type IngestionEnv = {
  INGESTION_CRON_SECRET?: string;
};

export async function POST(request: Request): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  const { INGESTION_CRON_SECRET } = env as IngestionEnv;

  if (!isScheduledIngestionRequestAuthorized(request, INGESTION_CRON_SECRET)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const report = await ingestFeeds();
    return Response.json(report);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
