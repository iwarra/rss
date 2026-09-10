import "server-only";

import { getDb } from "@/server/db/client";
import { ingestionReportsTable } from "@/server/db/schema";

import type { IngestionReport } from "./types";

export async function saveIngestionReport(
  report: IngestionReport,
): Promise<void> {
  const db = await getDb();

  await db.insert(ingestionReportsTable).values({
    status: report.status,
    createdAt: Date.now(),
    durationMs: Math.round(report.durationMs),
    report,
  });
}
