import "server-only";
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { consumedArticlesTable } from "../db/schema";

//TODO: must chunk large GUID lists
export async function findConsumedGuids(
  feedId: number,
  guids: string[],
): Promise<Set<string>> {
  if (guids.length === 0) return new Set();

  const db = await getDb();
  const rows = await db
    .select({ guid: consumedArticlesTable.guid })
    .from(consumedArticlesTable)
    .where(
      and(
        eq(consumedArticlesTable.feedId, feedId),
        inArray(consumedArticlesTable.guid, guids),
      ),
    );
  return new Set(rows.map((row) => row.guid));
}
