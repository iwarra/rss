import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

export const client = new Database(`${import.meta.dir}/app.db`, {
  create: true,
});

export const db = drizzle({ client });
db.run("PRAGMA foreign_keys = ON;");

export default db;
