import { ingestFeeds } from "@/server/ingestion/service";
export const runtime = "nodejs";
export async function POST() {
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
