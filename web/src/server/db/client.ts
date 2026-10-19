import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export interface Env {
  DB: D1Database;
}

export async function getDb(): Promise<DrizzleD1Database<typeof schema>> {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
