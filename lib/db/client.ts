import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/drizzle/schema";
import { getEnv } from "@/lib/env";

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let database: Database | undefined;

export function getDb(): Database {
  if (!database) {
    pool = new Pool({ connectionString: getEnv().DATABASE_URL });
    database = drizzle(pool, { schema });
  }
  return database;
}
