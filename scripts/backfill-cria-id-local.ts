/**
 * scripts/backfill-cria-id-local.ts — AUT-313
 *
 * Aplica backfill de partos.cria_id en smartcow_local usando la estrategia
 * fecha_nacimiento ±3 días + diio_madre match. Solo aplica candidatos no-ambiguos
 * (1-a-1 parto↔animal).
 *
 * Root cause documentado en docs/db/cria-id-linkage-analysis.md (AUT-312):
 *   - tope real = 12.4% (2,335/18,814 partos vivos)
 *   - target 80% AUT-313 es inalcanzable — AgroApp no exporta DIIO de cría
 *
 * Uso:
 *   npx tsx scripts/backfill-cria-id-local.ts [--dry-run]
 *
 * Requiere que smartcow-db-local esté corriendo en 127.0.0.1:5440
 */

import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const LOCAL_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local";

async function main() {
  const pool = new Pool({ connectionString: LOCAL_URL });

  console.log("=== backfill-cria-id-local (AUT-313) ===");
  if (DRY_RUN) console.log("DRY RUN — no writes");

  // ── 1. Estado antes ───────────────────────────────────────────────────────
  console.log("\n[1] Estado inicial partos:");
  const before = await pool.query<{
    total_vivos: string;
    con_cria: string;
    sin_cria: string;
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE resultado = 'vivo')                  AS total_vivos,
      COUNT(*) FILTER (WHERE resultado = 'vivo' AND cria_id IS NOT NULL) AS con_cria,
      COUNT(*) FILTER (WHERE resultado = 'vivo' AND cria_id IS NULL)     AS sin_cria
    FROM partos
  `);
  const b = before.rows[0];
  const pctBefore =
    ((parseInt(b.con_cria) / parseInt(b.total_vivos)) * 100).toFixed(1);
  console.log(`    total vivos:  ${b.total_vivos}`);
  console.log(`    con cria_id:  ${b.con_cria}  (${pctBefore}%)`);
  console.log(`    sin cria_id:  ${b.sin_cria}`);

  // ── 2. Buscar candidatos ±3 días ──────────────────────────────────────────
  console.log("\n[2] Buscando candidatos ±3 días (diio_madre match)...");
  const candidates = await pool.query<{
    parto_id: number;
    cria_id: number;
    parto_fecha: string;
    nacimiento_fecha: string;
    diio_madre: string;
  }>(`
    WITH candidates AS (
      SELECT
        p.id   AS parto_id,
        a.id   AS cria_id,
        p.fecha AS parto_fecha,
        a.fecha_nacimiento AS nacimiento_fecha,
        (SELECT diio FROM animales WHERE id = p.madre_id) AS diio_madre
      FROM partos p
      JOIN animales a ON a.predio_id = p.predio_id
        AND a.fecha_nacimiento BETWEEN p.fecha - INTERVAL '3 days'
                                   AND p.fecha + INTERVAL '3 days'
        AND a.diio_madre = (SELECT diio FROM animales WHERE id = p.madre_id)
      WHERE p.cria_id IS NULL
        AND p.resultado = 'vivo'
    )
    SELECT *
    FROM candidates
    WHERE
      (SELECT COUNT(*) FROM candidates c2 WHERE c2.cria_id  = candidates.cria_id)  = 1
      AND
      (SELECT COUNT(*) FROM candidates c3 WHERE c3.parto_id = candidates.parto_id) = 1
    ORDER BY parto_id
  `);

  console.log(`    candidatos no-ambiguos encontrados: ${candidates.rows.length}`);

  if (candidates.rows.length === 0) {
    console.log("\nSin candidatos que aplicar. Tope real ya alcanzado.");
    await pool.end();
    return;
  }

  // Mostrar detalle de cada candidato
  console.log("\n    Detalle candidatos:");
  for (const c of candidates.rows) {
    const diasDiff = Math.abs(
      (new Date(c.nacimiento_fecha).getTime() -
        new Date(c.parto_fecha).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    console.log(
      `      parto ${c.parto_id} → animal ${c.cria_id}` +
        ` | parto: ${c.parto_fecha} | nacimiento: ${c.nacimiento_fecha}` +
        ` | diff: ${diasDiff.toFixed(1)} días | diio_madre: ${c.diio_madre}`
    );
  }

  if (DRY_RUN) {
    console.log(`\nDRY RUN — se actualizarían ${candidates.rows.length} parto(s).`);
    await pool.end();
    return;
  }

  // ── 3. Aplicar UPDATE ─────────────────────────────────────────────────────
  console.log(`\n[3] Aplicando UPDATE para ${candidates.rows.length} parto(s)...`);
  const ids = candidates.rows.map((c) => c.parto_id);
  const criasMap = Object.fromEntries(
    candidates.rows.map((c) => [c.parto_id, c.cria_id])
  );

  let updated = 0;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const c of candidates.rows) {
      const res = await client.query(
        `UPDATE partos SET cria_id = $1 WHERE id = $2 AND cria_id IS NULL`,
        [c.cria_id, c.parto_id]
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

  // ── 4. Estado después ─────────────────────────────────────────────────────
  console.log("\n[4] Estado post-backfill:");
  const after = await pool.query<{
    total_vivos: string;
    con_cria: string;
    sin_cria: string;
  }>(`
    SELECT
      COUNT(*) FILTER (WHERE resultado = 'vivo')                  AS total_vivos,
      COUNT(*) FILTER (WHERE resultado = 'vivo' AND cria_id IS NOT NULL) AS con_cria,
      COUNT(*) FILTER (WHERE resultado = 'vivo' AND cria_id IS NULL)     AS sin_cria
    FROM partos
  `);
  const a = after.rows[0];
  const pctAfter =
    ((parseInt(a.con_cria) / parseInt(a.total_vivos)) * 100).toFixed(1);
  console.log(`    total vivos:  ${a.total_vivos}`);
  console.log(`    con cria_id:  ${a.con_cria}  (${pctAfter}%)`);
  console.log(`    sin cria_id:  ${a.sin_cria}`);
  console.log(`    nuevos links: ${updated}`);

  // ── 5. Reporte tope real ──────────────────────────────────────────────────
  console.log("\n[5] Tope real documentado:");
  console.log(
    `    ${pctAfter}% (${a.con_cria}/${a.total_vivos} partos vivos con cria_id)`
  );
  console.log(
    "    El tope real es ~12.4% — AgroApp no exporta DIIO de cría en el Excel Partos."
  );
  console.log(
    "    Para superar este tope: obtener DIIO de cría vía AgroApp API o módulo Terneros."
  );
  console.log(
    "    Ver: docs/db/cria-id-linkage-analysis.md (AUT-312)"
  );

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
