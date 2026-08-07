import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { feedsTable } from "@/db/schema";

// name suggestion: consumedArticles
export const articleClassificationsTable = sqliteTable(
  "article_classifications",
  {
    feedId: integer()
      .notNull()
      .references(() => feedsTable.id),
    guid: text().notNull(),
    status: text().notNull(), // processing, done
    processedAt: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("article_classifications_feed_id_guid_unique").on(
      table.feedId,
      table.guid,
    ),
  ],
);

export type ArticleClassification =
  typeof articleClassificationsTable.$inferSelect;
export type NewArticleClassification =
  typeof articleClassificationsTable.$inferInsert;
