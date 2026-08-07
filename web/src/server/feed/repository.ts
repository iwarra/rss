import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { feedsTable, type NewFeed, type Feed } from "@/server/db/schema";

export async function insertFeed(feed: NewFeed) {
  const db = await getDb();

  await db
    .insert(feedsTable)
    .values(feed)
    .onConflictDoNothing({ target: feedsTable.link });
}

export async function getFeeds(title?: string): Promise<Feed[]> {
  const db = await getDb();
  if (title)
    return db.select().from(feedsTable).where(eq(feedsTable.title, title));
  return db.select().from(feedsTable);
}
