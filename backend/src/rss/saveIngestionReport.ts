import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { IngestionReport } from "@/rss/ingest";

const reportsDirectory = join(import.meta.dir, "../../logs");

export async function saveIngestionReport(
  report: IngestionReport,
): Promise<string> {
  await mkdir(reportsDirectory, { recursive: true });

  const fileName = `ingestion-${fileTimestamp(new Date())}.json`;
  const filePath = join(reportsDirectory, fileName);
  await writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`);

  return filePath;
}

function fileTimestamp(date: Date): string {
  return date.toISOString().replaceAll(":", "-").replace(".", "-");
}
