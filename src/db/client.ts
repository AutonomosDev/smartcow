import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as schema from "./schema/index";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/smartcow",
  max: 10,
});

export const db = drizzle(pool, { schema });

export type DB = typeof db;

/**
 * withPredioContext — Ejecuta `fn` con `app.current_predio` seteado a nivel de sesión.
 *
 * Todas las tablas con RLS habilitado filtran por este valor.
 * Usar en server actions y route handlers que reciben predioId del usuario autenticado.
 *
 * @example
 * const animales = await withPredioContext(predioId, (txDb) =>
 *   txDb.select().from(schema.animales)
 * );
 */
export async function withPredioContext<T>(
  predioId: number,
  fn: (db: DB) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("SET LOCAL app.current_predio = $1", [predioId]);
    const scopedDb = drizzle(client, { schema });
    return await fn(scopedDb as unknown as DB);
  } finally {
    client.release();
  }
}
