import "server-only";
import { desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { articlesTable } from "../db/schema";

export async function getArticles() {
  const db = await getDb();
  return db
    .select()
    .from(articlesTable)
    .orderBy(desc(articlesTable.pubDate), desc(articlesTable.id));
}
