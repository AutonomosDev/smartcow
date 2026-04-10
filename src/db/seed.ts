/**
 * seed.ts — Datos iniciales para la base de datos SmartCow (dev/staging).
 * Crea la organización raíz "JP Ferrada".
 * Los fundos se crean vía ETL (src/etl/migrate-agroapp.ts) desde AgroApp.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx src/db/seed.ts
 *
 * Ticket: AUT-128
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { organizaciones } from "./schema/organizaciones";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/smartcow",
});
const db = drizzle(pool, { schema: { organizaciones } });

async function seed(): Promise<void> {
  console.log("[seed] Iniciando seed...");

  // Organización raíz
  const existing = await db
    .select()
    .from(organizaciones)
    .where(eq(organizaciones.nombre, "JP Ferrada"))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[seed] Org "JP Ferrada" ya existe (id=${existing[0].id})`);
  } else {
    const inserted = await db
      .insert(organizaciones)
      .values({
        nombre: "JP Ferrada",
        plan: "pro",
        modulos: { feedlot: true, crianza: true },
      })
      .returning({ id: organizaciones.id });
    console.log(`[seed] Org "JP Ferrada" creada (id=${inserted[0].id})`);
  }

  console.log("[seed] Listo.");
  console.log("[seed] Para crear fundos: DATABASE_URL=... npx tsx src/etl/migrate-agroapp.ts");

  await pool.end();
}

seed().catch((err) => {
  console.error("[seed] Error:", err);
  process.exit(1);
});
