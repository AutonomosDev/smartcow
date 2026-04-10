import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/smartcow",
  max: 10,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;
