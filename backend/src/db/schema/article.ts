import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { feedsTable } from "@/db/schema";

export const articlesTable = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  feedId: integer()
    .notNull()
    .references(() => feedsTable.id, { onDelete: "cascade" }), //KEEP?
  title: text().notNull(),
  link: text().notNull(),
  description: text(),
  pubDate: integer({ mode: "timestamp" }).notNull(),
  guid: text().notNull().unique(),
  media_content: text(),
  sourceCategory: text(), //RSS might provide
  categories: text({ mode: "json" }).$type<string[] | null>(), //AI added
});

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
