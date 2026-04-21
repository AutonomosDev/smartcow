/**
 * scripts/seed-slash-reportar.ts — Agrega /reportar a slash_commands.
 * Ticket: AUT-277
 *
 * Idempotente: no duplica si ya existe.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx scripts/seed-slash-reportar.ts
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { slashCommands } from "../src/db/schema/slash_commands.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/smartcow",
});
const db = drizzle(pool, { schema: { slashCommands } });

async function main(): Promise<void> {
  console.log("[seed-slash-reportar] Verificando /reportar...");

  const existing = await db
    .select()
    .from(slashCommands)
    .where(eq(slashCommands.comando, "/reportar"))
    .limit(1);

  if (existing.length > 0) {
    console.log(`[seed-slash-reportar] /reportar ya existe (id=${existing[0].id}) — sin cambios.`);
    await pool.end();
    return;
  }

  // Calcular orden: después del último existente
  const all = await db.select({ orden: slashCommands.orden }).from(slashCommands);
  const maxOrden = all.reduce((max, r) => Math.max(max, r.orden), 0);

  const [inserted] = await db
    .insert(slashCommands)
    .values({
      comando: "/reportar",
      label: "Reportar al equipo",
      modulo: null,
      promptTemplate: "Quiero reportar algo al equipo de SmartCow",
      orden: maxOrden + 1,
    })
    .returning({ id: slashCommands.id });

  console.log(`[seed-slash-reportar] /reportar creado (id=${inserted.id}, orden=${maxOrden + 1}).`);
  await pool.end();
}

main().catch((err) => {
  console.error("[seed-slash-reportar] Error:", err);
  process.exit(1);
});
