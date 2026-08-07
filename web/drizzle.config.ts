import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/db/schema",
  out: "./drizzle",
  dialect: "sqlite",
});
