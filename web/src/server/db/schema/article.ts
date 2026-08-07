import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { feedsTable } from "@/server/db/schema";

export const articlesTable = sqliteTable(
  "articles",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    feedId: integer()
      .notNull()
      .references(() => feedsTable.id, { onDelete: "cascade" }), //KEEP?
    title: text().notNull(),
    link: text().notNull(),
    description: text(),
    pubDate: integer({ mode: "timestamp" }).notNull(),
    guid: text().notNull(),
    media_content: text(),
    sourceCategory: text(), //RSS might provide
    categories: text({ mode: "json" }).$type<string[] | null>(), //Model assignes based on embeddings similarity score
  },
  (table) => [
    uniqueIndex("articles_feed_id_guid_unique").on(table.feedId, table.guid),
  ],
);

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
