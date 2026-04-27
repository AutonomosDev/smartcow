/**
 * scripts/purge-demo-predios.ts — AUT-317
 *
 * Elimina todos los datos de predios 14-26 (demo/org99) de smartcow_local.
 * Ejecuta los DELETE en orden FK correcto dentro de una transacción.
 * Hace pg_dump antes de cualquier escritura.
 *
 * Uso:
 *   npx tsx scripts/purge-demo-predios.ts [--dry-run]
 *
 * Requiere smartcow-db-local corriendo en 127.0.0.1:5440
 */

import { Pool } from "pg";
import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import * as path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const LOCAL_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local";
const DEMO_PREDIOS = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
const DEMO_IN = `IN (${DEMO_PREDIOS.join(",")})`;

// Helper: format row count for display
function fmt(n: number) {
  return n.toString().padStart(8);
}

async function countWhere(
  pool: Pool,
  table: string,
  where: string
): Promise<number> {
  const res = await pool.query<{ c: string }>(
    `SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`
  );
  return parseInt(res.rows[0].c, 10);
}

async function main() {
  const pool = new Pool({ connectionString: LOCAL_URL });

  console.log("=== purge-demo-predios (AUT-317) ===");
  console.log(`Predios demo a purgar: ${DEMO_PREDIOS.join(", ")}`);
  if (DRY_RUN) console.log("DRY RUN — no writes\n");

  // ── 1. Pre-check: conteos por tabla ────────────────────────────────────────
  console.log("[1] Pre-check: filas afectadas por predios 14-26...\n");

  const demoAnimals = `(SELECT id FROM animales WHERE predio_id ${DEMO_IN})`;
  const demoLotes = `(SELECT id FROM lotes WHERE predio_id ${DEMO_IN})`;

  const tableCounts: Array<{ name: string; count: number }> = [];

  async function addCount(name: string, where: string) {
    const n = await countWhere(pool, name, where);
    tableCounts.push({ name, count: n });
    console.log(`    ${name.padEnd(26)} ${fmt(n)}`);
    return n;
  }

  await addCount("pesajes",             `predio_id ${DEMO_IN}`);
  await addCount("partos",              `predio_id ${DEMO_IN}`);
  await addCount("inseminaciones",      `predio_id ${DEMO_IN}`);
  await addCount("ecografias",          `predio_id ${DEMO_IN}`);
  await addCount("areteos",             `predio_id ${DEMO_IN}`);
  await addCount("bajas",               `predio_id ${DEMO_IN}`);
  await addCount("ventas",              `predio_id ${DEMO_IN}`);
  await addCount("tratamientos",        `predio_id ${DEMO_IN}`);
  await addCount("inventarios",         `predio_id ${DEMO_IN}`);
  await addCount("lotes",               `predio_id ${DEMO_IN}`);
  await addCount("potreros",            `predio_id ${DEMO_IN}`);
  await addCount("movimientos_potrero", `predio_id ${DEMO_IN}`);
  await addCount("conversaciones",      `predio_id ${DEMO_IN}`);
  await addCount("chat_attachments",    `predio_id ${DEMO_IN}`);
  await addCount("chat_sessions",       `predio_id ${DEMO_IN}`);
  await addCount("animales",            `predio_id ${DEMO_IN}`);
  await addCount("predios",             `id ${DEMO_IN}`);

  // lote_animales: rows tied to demo lotes OR demo animals
  const laCount = await countWhere(
    pool,
    "lote_animales",
    `lote_id IN ${demoLotes} OR animal_id IN ${demoAnimals}`
  );
  tableCounts.push({ name: "lote_animales", count: laCount });
  console.log(`    ${"lote_animales".padEnd(26)} ${fmt(laCount)}`);

  // traslados: tied to demo animals OR demo predio origen/destino
  const trasCount = await countWhere(
    pool,
    "traslados",
    `animal_id IN ${demoAnimals}
     OR predio_origen_id ${DEMO_IN}
     OR predio_destino_id ${DEMO_IN}`
  );
  tableCounts.push({ name: "traslados", count: trasCount });
  console.log(`    ${"traslados".padEnd(26)} ${fmt(trasCount)}`);

  const totalRows = tableCounts.reduce((s, t) => s + t.count, 0);
  console.log(`\n    ${"TOTAL".padEnd(26)} ${fmt(totalRows)}`);

  // ── 2. Cross-reference check ─────────────────────────────────────────────
  console.log("\n[2] Verificando referencias cruzadas (predios 1-13 → animales demo)...\n");

  const crossChecks = [
    {
      name: "partos(real) → madre demo",
      q: `SELECT COUNT(*) AS c FROM partos WHERE predio_id NOT ${DEMO_IN} AND madre_id IN ${demoAnimals}`,
    },
    {
      name: "inseminaciones(real) → animal demo",
      q: `SELECT COUNT(*) AS c FROM inseminaciones WHERE predio_id NOT ${DEMO_IN} AND animal_id IN ${demoAnimals}`,
    },
    {
      name: "pesajes(real) → animal demo",
      q: `SELECT COUNT(*) AS c FROM pesajes WHERE predio_id NOT ${DEMO_IN} AND animal_id IN ${demoAnimals}`,
    },
    {
      name: "bajas(real) → animal demo",
      q: `SELECT COUNT(*) AS c FROM bajas WHERE predio_id NOT ${DEMO_IN} AND animal_id IN ${demoAnimals}`,
    },
    {
      name: "ventas(real) → animal demo",
      q: `SELECT COUNT(*) AS c FROM ventas WHERE predio_id NOT ${DEMO_IN} AND animal_id IN ${demoAnimals}`,
    },
    {
      name: "tratamientos(real) → animal demo",
      q: `SELECT COUNT(*) AS c FROM tratamientos WHERE predio_id NOT ${DEMO_IN} AND animal_id IN ${demoAnimals}`,
    },
  ];

  let crossRefFound = false;
  for (const check of crossChecks) {
    const res = await pool.query<{ c: string }>(check.q);
    const count = parseInt(res.rows[0].c, 10);
    const status = count > 0 ? `🔴 CROSS-REF DETECTED  (${count})` : "✓ OK (0)";
    console.log(`    ${check.name.padEnd(40)} ${status}`);
    if (count > 0) crossRefFound = true;
  }

  if (crossRefFound) {
    console.error(
      "\n🔴 STOP: Referencias cruzadas detectadas — datos reales apuntan a animales demo."
    );
    console.error("   No se puede purgar sin romper datos de predios 1-13.");
    await pool.end();
    process.exit(1);
  }
  console.log("\n    Ninguna referencia cruzada — seguro continuar ✓");

  if (DRY_RUN) {
    console.log(`\nDRY RUN — se eliminarían ${totalRows} filas en total.`);
    await pool.end();
    return;
  }

  // ── 3. Backup pg_dump ────────────────────────────────────────────────────
  console.log("\n[3] Creando backup pg_dump de smartcow_local antes de purgar...");
  const backupDir = "/tmp/smartcow-purge-backup";
  mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupFile = path.join(
    backupDir,
    `smartcow_local_pre_purge_${ts}.dump`
  );
  // Container pg_dump (v16) — capture buffer and write to file
  const dumpData = execSync(
    `docker exec smartcow-db-local pg_dump -U smartcow -Fc smartcow_local`,
    { maxBuffer: 200 * 1024 * 1024 }
  );
  writeFileSync(backupFile, dumpData);
  console.log(`    Backup: ${backupFile}`);

  // ── 4. Purgar en orden FK correcto ───────────────────────────────────────
  console.log(`\n[4] Purgando en transacción (${totalRows} filas esperadas)...`);
  const client = await pool.connect();
  const deleted: Record<string, number> = {};

  try {
    await client.query("BEGIN");

    async function del(label: string, table: string, where: string) {
      const res = await client.query(
        `DELETE FROM ${table} WHERE ${where}`
      );
      const n = res.rowCount ?? 0;
      deleted[label] = n;
      console.log(`    ${label.padEnd(26)} ${fmt(n)} eliminados`);
    }

    // Order: leaf tables first, then parents
    await del("lote_animales", "lote_animales",
      `lote_id IN ${demoLotes} OR animal_id IN ${demoAnimals}`);

    await del("movimientos_potrero", "movimientos_potrero",
      `predio_id ${DEMO_IN}`);

    await del("traslados", "traslados",
      `animal_id IN ${demoAnimals}
       OR predio_origen_id ${DEMO_IN}
       OR predio_destino_id ${DEMO_IN}`);

    await del("bajas",          "bajas",          `predio_id ${DEMO_IN}`);
    await del("ventas",         "ventas",          `predio_id ${DEMO_IN}`);
    await del("tratamientos",   "tratamientos",    `predio_id ${DEMO_IN}`);
    await del("areteos",        "areteos",         `predio_id ${DEMO_IN}`);
    await del("ecografias",     "ecografias",      `predio_id ${DEMO_IN}`);
    await del("inseminaciones", "inseminaciones",  `predio_id ${DEMO_IN}`);
    await del("partos",         "partos",          `predio_id ${DEMO_IN}`);
    await del("pesajes",        "pesajes",         `predio_id ${DEMO_IN}`);
    await del("inventarios",    "inventarios",     `predio_id ${DEMO_IN}`);

    // Chat tables referencing predios
    await del("chat_attachments", "chat_attachments", `predio_id ${DEMO_IN}`);
    await del("chat_sessions",    "chat_sessions",    `predio_id ${DEMO_IN}`);
    await del("conversaciones",   "conversaciones",   `predio_id ${DEMO_IN}`);

    // Parent tables
    await del("lotes",    "lotes",    `predio_id ${DEMO_IN}`);
    await del("potreros", "potreros", `predio_id ${DEMO_IN}`);
    await del("animales", "animales", `predio_id ${DEMO_IN}`);
    await del("predios",  "predios",  `id ${DEMO_IN}`);

    await client.query("COMMIT");
    console.log("\n    COMMIT OK ✓");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\nERROR — ROLLBACK ejecutado:", err);
    client.release();
    await pool.end();
    process.exit(1);
  }
  client.release();

  // ── 5. Reporte before/after ──────────────────────────────────────────────
  console.log("\n[5] Reporte before/after:");
  console.log(
    `    ${"Tabla".padEnd(26)} ${"Before".padStart(8)}  ${"Deleted".padStart(8)}`
  );
  console.log("    " + "─".repeat(46));
  for (const { name, count } of tableCounts) {
    const d = deleted[name] ?? 0;
    console.log(`    ${name.padEnd(26)} ${fmt(count)}  ${fmt(d)}`);
  }
  const totalDeleted = Object.values(deleted).reduce((a, b) => a + b, 0);
  console.log("    " + "─".repeat(46));
  console.log(
    `    ${"TOTAL".padEnd(26)} ${fmt(totalRows)}  ${fmt(totalDeleted)}`
  );

  // ── 6. Validar FKs post-purga ────────────────────────────────────────────
  console.log("\n[6] Validando integridad referencial post-purga...\n");
  const fkChecks = [
    {
      name: "animales → predio inexistente",
      q: `SELECT COUNT(*) AS c FROM animales a
          LEFT JOIN predios p ON p.id = a.predio_id WHERE p.id IS NULL`,
    },
    {
      name: "pesajes → animal inexistente",
      q: `SELECT COUNT(*) AS c FROM pesajes pe
          LEFT JOIN animales a ON a.id = pe.animal_id WHERE a.id IS NULL`,
    },
    {
      name: "partos → madre inexistente",
      q: `SELECT COUNT(*) AS c FROM partos pa
          LEFT JOIN animales a ON a.id = pa.madre_id WHERE a.id IS NULL`,
    },
    {
      name: "tratamientos → animal inexistente",
      q: `SELECT COUNT(*) AS c FROM tratamientos t
          LEFT JOIN animales a ON a.id = t.animal_id WHERE a.id IS NULL`,
    },
    {
      name: "lote_animales → animal inexistente",
      q: `SELECT COUNT(*) AS c FROM lote_animales la
          LEFT JOIN animales a ON a.id = la.animal_id WHERE a.id IS NULL`,
    },
    {
      name: "conversaciones → predio inexistente",
      q: `SELECT COUNT(*) AS c FROM conversaciones c
          LEFT JOIN predios p ON p.id = c.predio_id WHERE p.id IS NULL`,
    },
    {
      name: "chat_sessions → predio inexistente",
      q: `SELECT COUNT(*) AS c FROM chat_sessions cs
          LEFT JOIN predios p ON p.id = cs.predio_id WHERE p.id IS NULL`,
    },
  ];

  let fkErrors = 0;
  for (const check of fkChecks) {
    const res = await pool.query<{ c: string }>(check.q);
    const count = parseInt(res.rows[0].c, 10);
    const status = count > 0 ? `🔴 ${count} BROKEN` : "✓ OK";
    console.log(`    ${check.name.padEnd(42)} ${status}`);
    if (count > 0) fkErrors++;
  }

  if (fkErrors > 0) {
    console.error("\n🔴 FKs rotas post-purga. Revisar manualmente.");
  } else {
    console.log("\n    Todas las FKs íntegras ✓");
  }

  // ── 7. Stats finales smartcow_local ─────────────────────────────────────
  console.log("\n[7] Stats finales smartcow_local:\n");
  const finalTables = [
    "animales",
    "pesajes",
    "partos",
    "tratamientos",
    "inseminaciones",
    "ecografias",
    "ventas",
    "bajas",
    "predios",
  ];
  for (const t of finalTables) {
    const res = await pool.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM ${t}`
    );
    console.log(`    ${t.padEnd(20)} ${res.rows[0].count.padStart(8)}`);
  }

  await pool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
