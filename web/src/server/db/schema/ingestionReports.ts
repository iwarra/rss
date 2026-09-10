import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ingestionReportsTable = sqliteTable("ingestion_reports", {
  id: integer().primaryKey({ autoIncrement: true }),
  status: text().notNull(),
  createdAt: integer().notNull(),
  durationMs: integer().notNull(),
  report: text({ mode: "json" }).notNull(),
});

export type IngestionReportRecord = typeof ingestionReportsTable.$inferSelect;
