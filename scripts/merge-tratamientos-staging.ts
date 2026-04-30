/**
 * scripts/merge-tratamientos-staging.ts — AUT-311
 *
 * Mergea tratamientos de smartcow_staging_snapshot → smartcow_local
 * que no existen en local (por id_agroapp).
 *
 * Excluye filas cuyo animal_id no existe en local (FK violation).
 *
 * Uso:
 *   npx tsx scripts/merge-tratamientos-staging.ts [--dry-run]
 *
 * Requiere que smartcow-db-local esté corriendo en 127.0.0.1:5440
 * (docker compose -f docker-compose.local-db.yml up -d)
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql, inArray, notInArray } from "drizzle-orm";
import * as schema from "../src/db/schema/index";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH = 500;

const STAGING_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_staging_snapshot";
const LOCAL_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local";

async function main() {
  const stagingPool = new Pool({ connectionString: STAGING_URL });
  const localPool = new Pool({ connectionString: LOCAL_URL });
  const staging = drizzle(stagingPool, { schema });
  const local = drizzle(localPool, { schema });

  console.log("=== merge-tratamientos-staging ===");
  if (DRY_RUN) console.log("DRY RUN — no writes");

  // 1. Collect local id_agroapp values
  console.log("\n[1] Cargando id_agroapp existentes en local...");
  const localIds = await local.execute<{ id_agroapp: string }>(
    sql`SELECT id_agroapp FROM tratamientos WHERE id_agroapp IS NOT NULL`
  );
  const localIdSet = new Set(localIds.rows.map((r) => r.id_agroapp));
  console.log(`    local tiene ${localIdSet.size} tratamientos con id_agroapp`);

  // 2. Load local animal IDs that belong to staging predios (1-13).
  //    IDs > 38542 in local belong to demo predios (14-26) — same numeric ID
  //    but DIFFERENT animal. Inserting staging tratamientos for those IDs would
  //    corrupt the animal linkage. Only allow predios 1-13.
  console.log("[2] Cargando animal_ids válidos en local (predios 1-13)...");
  const localAnimals = await local.execute<{ id: number }>(
    sql`SELECT id FROM animales WHERE predio_id <= 13`
  );
  const localAnimalSet = new Set(localAnimals.rows.map((r) => r.id));
  console.log(`    local tiene ${localAnimalSet.size} animales en predios 1-13`);

  // 3. Fetch staging-only tratamientos
  console.log("[3] Fetching staging tratamientos...");
  const stagingAll = await staging.execute<{
    id: number;
    predio_id: number;
    animal_id: number;
    fecha: string;
    hora_registro: string | null;
    id_agroapp: string;
    diagnostico: string | null;
    observaciones: string | null;
    medicamentos: unknown;
    usuario_id: number | null;
    creado_en: string;
    inicio: string | null;
    fin: string | null;
    liberacion_carne_max: string | null;
  }>(
    sql`SELECT id, predio_id, animal_id, fecha, hora_registro, id_agroapp,
               diagnostico, observaciones, medicamentos, usuario_id, creado_en,
               inicio, fin, liberacion_carne_max
        FROM tratamientos
        WHERE id_agroapp IS NOT NULL`
  );

  const stagingOnly = stagingAll.rows.filter(
    (r) => !localIdSet.has(r.id_agroapp)
  );
  const valid = stagingOnly.filter((r) => localAnimalSet.has(r.animal_id));
  const skippedAnimal = stagingOnly.length - valid.length;

  console.log(`    staging total:         ${stagingAll.rows.length}`);
  console.log(`    staging-only (new):    ${stagingOnly.length}`);
  console.log(`    animal FK inválido:    ${skippedAnimal} (excluidos)`);
  console.log(`    a insertar:            ${valid.length}`);

  if (valid.length === 0) {
    console.log("\nNada que insertar. Saliendo.");
    await stagingPool.end();
    await localPool.end();
    return;
  }

  if (DRY_RUN) {
    console.log("\nDRY RUN — abortando antes de escribir.");
    await stagingPool.end();
    await localPool.end();
    return;
  }

  // 4. Insert in batches
  console.log(`\n[4] Insertando ${valid.length} rows en batches de ${BATCH}...`);
  let inserted = 0;
  for (let i = 0; i < valid.length; i += BATCH) {
    const batch = valid.slice(i, i + BATCH);
    await local
      .insert(schema.tratamientos)
      .values(
        batch.map((r) => ({
          predioId: r.predio_id,
          animalId: r.animal_id,
          fecha: r.fecha,
          horaRegistro: r.hora_registro ?? undefined,
          idAgroapp: r.id_agroapp,
          diagnostico: r.diagnostico ?? undefined,
          observaciones: r.observaciones ?? undefined,
          medicamentos: r.medicamentos as schema.MedicamentoTratamiento[] ?? undefined,
          usuarioId: r.usuario_id ?? undefined,
          creadoEn: new Date(r.creado_en),
          inicio: r.inicio ?? undefined,
          fin: r.fin ?? undefined,
          liberacionCarneMax: r.liberacion_carne_max ?? undefined,
        }))
      )
      .onConflictDoNothing();
    inserted += batch.length;
    process.stdout.write(`\r    ${inserted}/${valid.length}`);
  }
  console.log("\n    listo");

  // 5. Post-merge stats
  console.log("\n[5] Stats post-merge:");
  const totalLocal = await local.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM tratamientos`
  );
  const conSag = await local.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM tratamientos
        WHERE medicamentos IS NOT NULL AND medicamentos::text != '[]'`
  );
  const conLiberacion = await local.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM tratamientos WHERE liberacion_carne_max IS NOT NULL`
  );
  const huerfanos = await local.execute<{ count: string }>(
    sql`SELECT COUNT(*) as count FROM tratamientos t
        WHERE NOT EXISTS (SELECT 1 FROM animales a WHERE a.id = t.animal_id)`
  );

  console.log(`    tratamientos total:     ${totalLocal.rows[0].count}`);
  console.log(`    con SAG (medicamentos): ${conSag.rows[0].count}`);
  console.log(`    con liberacion_carne:   ${conLiberacion.rows[0].count}`);
  console.log(`    huérfanos (sin animal): ${huerfanos.rows[0].count}`);
  console.log(`    skipped (animal ∉ local): ${skippedAnimal}`);

  await stagingPool.end();
  await localPool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
