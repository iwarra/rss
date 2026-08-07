import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const feedsTable = sqliteTable("feeds", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  link: text().notNull().unique(),
  rssLink: text().notNull().unique(),
  description: text(),
  language: text(),
  sy_updatePeriod: text(),
  sy_updateFrequency: text(),
  image: text({ mode: "json" }),
});

export type Feed = typeof feedsTable.$inferSelect;
export type NewFeed = typeof feedsTable.$inferInsert;
