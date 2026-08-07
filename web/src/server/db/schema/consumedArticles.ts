import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { feedsTable } from "@/server/db/schema";

export const consumedArticlesTable = sqliteTable(
  "consumed_articles",
  {
    feedId: integer()
      .notNull()
      .references(() => feedsTable.id),
    guid: text().notNull(),
    processedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("consumed_articles_feed_id_guid_unique").on(
      table.feedId,
      table.guid,
    ),
  ],
);

export type ConsumedArticlesData = typeof consumedArticlesTable.$inferSelect;
export type NewConsumedArticle = typeof consumedArticlesTable.$inferInsert;
