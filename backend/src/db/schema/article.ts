import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const articlesTable = sqliteTable("articles", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  link: text().notNull(),
  description: text(),
  pubDate: integer({ mode: "timestamp" }).notNull(),
  guid: text().notNull(),
  media_content: text(),
  category: text({ mode: "json" }).$type<string[] | null>(),
});

export type Article = typeof articlesTable.$inferSelect;
export type NewArticle = typeof articlesTable.$inferInsert;
