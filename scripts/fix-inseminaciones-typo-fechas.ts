/**
 * scripts/fix-inseminaciones-typo-fechas.ts — AUT-318
 *
 * Corrige fechas futuras en inseminaciones de smartcow_local. AUT-315 detectó
 * 8 registros con año 2030–2053; el patrón es typo de un dígito (2031→2021,
 * 2030→2020, 2053→2023). Decisión Cesar: opción B — UPDATE typo fix, no DELETE.
 *
 * Regla: restar 10 al año hasta que la fecha sea <= CURRENT_DATE.
 *   2030 → 2020   (1 iter)
 *   2031 → 2021   (1 iter)
 *   2053 → 2023   (3 iter)
 *
 * Uso:
 *   npx tsx scripts/fix-inseminaciones-typo-fechas.ts [--dry-run]
 *
 * Requiere smartcow-db-local en 127.0.0.1:5440.
 */

import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const LOCAL_URL =
  process.env.DATABASE_URL ??
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local";

type Row = {
  id: number;
  animal_id: number;
  predio_id: number;
  fecha: string;
};

function fixYear(fecha: string, today: Date): string {
  const d = new Date(fecha);
  while (d > today) {
    d.setUTCFullYear(d.getUTCFullYear() - 10);
  }
  return d.toISOString().slice(0, 10);
}

async function main() {
  const pool = new Pool({ connectionString: LOCAL_URL });

  console.log("=== fix-inseminaciones-typo-fechas (AUT-318) ===");
  console.log(`DB: ${LOCAL_URL}`);
  if (DRY_RUN) console.log("DRY RUN — no writes");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // ── 1. SELECT preview ─────────────────────────────────────────────────────
  console.log("\n[1] Inseminaciones con fecha futura:");
  const rows = await pool.query<Row>(`
    SELECT id, animal_id, predio_id, fecha::text AS fecha
    FROM inseminaciones
    WHERE fecha > CURRENT_DATE
    ORDER BY fecha, id
  `);

  if (rows.rows.length === 0) {
    console.log("    Ninguna. Nada que hacer.");
    await pool.end();
    return;
  }

  console.log(`    Total: ${rows.rows.length}`);
  const plan = rows.rows.map((r) => ({
    ...r,
    fecha_nueva: fixYear(r.fecha, today),
  }));

  for (const p of plan) {
    console.log(
      `      id ${p.id} | animal ${p.animal_id} | predio ${p.predio_id} | ${p.fecha} → ${p.fecha_nueva}`
    );
  }

  // ── 2. Validar: ningún resultado queda futuro ─────────────────────────────
  const stillFuture = plan.filter((p) => new Date(p.fecha_nueva) > today);
  if (stillFuture.length > 0) {
    console.error(`\n[ERROR] ${stillFuture.length} fila(s) siguen futuras tras fix:`);
    stillFuture.forEach((p) => console.error(`   id ${p.id}: ${p.fecha_nueva}`));
    await pool.end();
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log(`\nDRY RUN — se actualizarían ${plan.length} fila(s).`);
    await pool.end();
    return;
  }

  // ── 3. Aplicar UPDATE ─────────────────────────────────────────────────────
  console.log(`\n[2] Aplicando UPDATE para ${plan.length} fila(s)...`);
  let updated = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const p of plan) {
      const res = await client.query(
        `UPDATE inseminaciones SET fecha = $1 WHERE id = $2 AND fecha = $3`,
        [p.fecha_nueva, p.id, p.fecha]
      );
      updated += res.rowCount ?? 0;
    }
    await client.query("COMMIT");
    console.log(`    COMMIT OK — ${updated} row(s) actualizados`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ROLLBACK:", err);
    client.release();
    await pool.end();
    process.exit(1);
  }
  client.release();

  // ── 4. Verificar ──────────────────────────────────────────────────────────
  console.log("\n[3] Verificación post-update:");
  const after = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM inseminaciones WHERE fecha > CURRENT_DATE`
  );
  console.log(`    inseminaciones con fecha futura: ${after.rows[0].count} (esperado 0)`);

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
