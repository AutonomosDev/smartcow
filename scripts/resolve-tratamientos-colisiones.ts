/**
 * scripts/resolve-tratamientos-colisiones.ts — AUT-314
 *
 * Recupera los 1,133 tratamientos excluidos por AUT-311 cuyo animal_id
 * (rango 38543-38905 en staging) colisionaba con animales demo en smartcow_local.
 *
 * Estrategia:
 *  1. Los 363 animales staging (predios JP Ferrada 3,4,9) con IDs 38543-38905
 *     NO existen en smartcow_local (ningún DIIO del rango match en local).
 *  2. Se insertan como animales nuevos (IDs asignados por sequence).
 *  3. Se insertan sus 1,133 tratamientos apuntando a los nuevos IDs.
 *
 * Prerrequisito: smartcow-db-local corriendo en 127.0.0.1:5440
 *
 * Uso:
 *   npx tsx scripts/resolve-tratamientos-colisiones.ts [--dry-run]
 */

import { Pool } from "pg";

const DRY_RUN = process.argv.includes("--dry-run");
const STAGING_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_staging_snapshot";
const LOCAL_URL =
  "postgresql://smartcow:smartcow_local@127.0.0.1:5440/smartcow_local";

// Rango de IDs staging que colisionaron con demo en local
const STAGING_RANGE_MIN = 38543;
const STAGING_RANGE_MAX = 38905;

async function main() {
  const stagingPool = new Pool({ connectionString: STAGING_URL });
  const localPool = new Pool({ connectionString: LOCAL_URL });

  console.log("=== resolve-tratamientos-colisiones (AUT-314) ===");
  if (DRY_RUN) console.log("DRY RUN — no writes");

  // ── 1. Cargar animales staging excluidos ────────────────────────────────
  console.log(
    `\n[1] Cargando animales staging IDs ${STAGING_RANGE_MIN}-${STAGING_RANGE_MAX}...`
  );
  const stagingAnimals = await stagingPool.query<{
    id: number;
    predio_id: number;
    diio: string;
    eid: string | null;
    tipo_ganado_id: number;
    raza_id: number | null;
    sexo: string;
    fecha_nacimiento: string | null;
    estado_reproductivo_id: number | null;
    estado: string;
    diio_madre: string | null;
    padre: string | null;
    abuelo: string | null;
    origen: string | null;
    tipo_propiedad: string;
    mediero_id: number | null;
    modulo_actual: string | null;
    observaciones: string | null;
    desecho: boolean;
    creado_en: string;
    actualizado_en: string;
  }>(
    `SELECT id, predio_id, diio, eid, tipo_ganado_id, raza_id, sexo,
            fecha_nacimiento, estado_reproductivo_id, estado, diio_madre,
            padre, abuelo, origen, tipo_propiedad, mediero_id, modulo_actual,
            observaciones, desecho, creado_en, actualizado_en
     FROM animales
     WHERE id BETWEEN $1 AND $2
     ORDER BY id`,
    [STAGING_RANGE_MIN, STAGING_RANGE_MAX]
  );
  console.log(`    animales staging a insertar: ${stagingAnimals.rows.length}`);

  // ── 2. Verificar que ningún DIIO ya existe en local (doble check) ────────
  console.log("\n[2] Verificando ausencia de DIIOs en local...");
  const diiList = stagingAnimals.rows.map((r) => r.diio).filter((d) => d && d !== "1");
  const existCheck = await localPool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM animales WHERE diio = ANY($1)`,
    [diiList]
  );
  const existCount = parseInt(existCheck.rows[0].count, 10);
  if (existCount > 0) {
    console.error(
      `    ERROR: ${existCount} DIIOs ya existen en local. Abortar.`
    );
    await stagingPool.end();
    await localPool.end();
    process.exit(1);
  }
  console.log("    OK — ningún DIIO duplicado en local");

  // ── 3. Cargar tratamientos staging del rango excluido ───────────────────
  console.log("\n[3] Cargando tratamientos excluidos del rango...");
  const stagingTratamientos = await stagingPool.query<{
    id: number;
    predio_id: number;
    animal_id: number;
    fecha: string;
    hora_registro: string | null;
    id_agroapp: string | null;
    diagnostico: string | null;
    observaciones: string | null;
    medicamentos: unknown;
    usuario_id: number | null;
    creado_en: string;
    inicio: string | null;
    fin: string | null;
    liberacion_carne_max: string | null;
  }>(
    `SELECT id, predio_id, animal_id, fecha, hora_registro, id_agroapp,
            diagnostico, observaciones, medicamentos, usuario_id, creado_en,
            inicio, fin, liberacion_carne_max
     FROM tratamientos
     WHERE animal_id BETWEEN $1 AND $2
     ORDER BY id`,
    [STAGING_RANGE_MIN, STAGING_RANGE_MAX]
  );
  console.log(
    `    tratamientos a insertar: ${stagingTratamientos.rows.length}`
  );

  // ── 4. Verificar que ningún id_agroapp ya existe en local ───────────────
  console.log("\n[4] Verificando id_agroapp ausentes en local...");
  const agroappIds = stagingTratamientos.rows
    .map((r) => r.id_agroapp)
    .filter(Boolean) as string[];
  const dupCheck = await localPool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tratamientos WHERE id_agroapp = ANY($1)`,
    [agroappIds]
  );
  const dupCount = parseInt(dupCheck.rows[0].count, 10);
  if (dupCount > 0) {
    console.error(
      `    ERROR: ${dupCount} id_agroapp ya existen en local. Abortar.`
    );
    await stagingPool.end();
    await localPool.end();
    process.exit(1);
  }
  console.log("    OK — ningún id_agroapp duplicado en local");

  if (DRY_RUN) {
    console.log(
      `\nDRY RUN — se insertarían ${stagingAnimals.rows.length} animales y ${stagingTratamientos.rows.length} tratamientos.`
    );
    await stagingPool.end();
    await localPool.end();
    return;
  }

  // ── 5. Insertar animales y construir mapeo staging_id → local_id ────────
  console.log(
    `\n[5] Insertando ${stagingAnimals.rows.length} animales en local...`
  );
  const localClient = await localPool.connect();
  try {
    await localClient.query("BEGIN");

    // Tabla temporal para el mapeo
    await localClient.query(`
      CREATE TEMP TABLE aut314_animal_map (
        staging_id INTEGER NOT NULL,
        local_id   INTEGER NOT NULL
      )
    `);

    // Insertar animales uno a uno para capturar el ID generado (sequence)
    for (const animal of stagingAnimals.rows) {
      const res = await localClient.query<{ id: number }>(
        `INSERT INTO animales (
          predio_id, diio, eid, tipo_ganado_id, raza_id, sexo,
          fecha_nacimiento, estado_reproductivo_id, estado, diio_madre,
          padre, abuelo, origen, tipo_propiedad, mediero_id, modulo_actual,
          observaciones, desecho, creado_en, actualizado_en
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING id`,
        [
          animal.predio_id,
          animal.diio,
          animal.eid ?? null,
          animal.tipo_ganado_id,
          animal.raza_id ?? null,
          animal.sexo,
          animal.fecha_nacimiento ?? null,
          animal.estado_reproductivo_id ?? null,
          animal.estado,
          animal.diio_madre ?? null,
          animal.padre ?? null,
          animal.abuelo ?? null,
          animal.origen ?? null,
          animal.tipo_propiedad,
          animal.mediero_id ?? null,
          animal.modulo_actual ?? null,
          animal.observaciones ?? null,
          animal.desecho,
          animal.creado_en,
          animal.actualizado_en,
        ]
      );
      const localId = res.rows[0].id;
      await localClient.query(
        `INSERT INTO aut314_animal_map (staging_id, local_id) VALUES ($1, $2)`,
        [animal.id, localId]
      );
    }
    console.log(`    ${stagingAnimals.rows.length} animales insertados`);

    // Verificar mapeo completo
    const mapCheck = await localClient.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM aut314_animal_map`
    );
    if (parseInt(mapCheck.rows[0].count, 10) !== stagingAnimals.rows.length) {
      throw new Error("Mapeo incompleto — abortando transacción");
    }

    // ── 6. Insertar tratamientos con animal_id remapeado ──────────────────
    console.log(
      `\n[6] Insertando ${stagingTratamientos.rows.length} tratamientos...`
    );
    let insertedTratamientos = 0;
    for (const trat of stagingTratamientos.rows) {
      const mapRes = await localClient.query<{ local_id: number }>(
        `SELECT local_id FROM aut314_animal_map WHERE staging_id = $1`,
        [trat.animal_id]
      );
      if (mapRes.rows.length === 0) {
        throw new Error(
          `Sin mapeo para staging animal_id=${trat.animal_id} — abortar`
        );
      }
      const localAnimalId = mapRes.rows[0].local_id;

      await localClient.query(
        `INSERT INTO tratamientos (
          predio_id, animal_id, fecha, hora_registro, id_agroapp,
          diagnostico, observaciones, medicamentos, usuario_id,
          creado_en, inicio, fin, liberacion_carne_max
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          trat.predio_id,
          localAnimalId,
          trat.fecha,
          trat.hora_registro ?? null,
          trat.id_agroapp ?? null,
          trat.diagnostico ?? null,
          trat.observaciones ?? null,
          trat.medicamentos ? JSON.stringify(trat.medicamentos) : null,
          trat.usuario_id ?? null,
          trat.creado_en,
          trat.inicio ?? null,
          trat.fin ?? null,
          trat.liberacion_carne_max ?? null,
        ]
      );
      insertedTratamientos++;
      if (insertedTratamientos % 100 === 0) {
        process.stdout.write(
          `\r    ${insertedTratamientos}/${stagingTratamientos.rows.length}`
        );
      }
    }
    process.stdout.write(`\r    ${insertedTratamientos}/${stagingTratamientos.rows.length}\n`);

    await localClient.query("COMMIT");
    console.log("    COMMIT OK");

    // ── 7. Stats post-insert ─────────────────────────────────────────────
    console.log("\n[7] Stats post-insert:");
    const totalAnimales = await localPool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM animales WHERE predio_id IN (3,4,9)`
    );
    const totalTrat = await localPool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM tratamientos WHERE predio_id IN (3,4,9)`
    );
    const huerfanos = await localPool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM tratamientos t
       WHERE NOT EXISTS (SELECT 1 FROM animales a WHERE a.id = t.animal_id)`
    );
    console.log(
      `    animales predios 3,4,9:     ${totalAnimales.rows[0].count}`
    );
    console.log(
      `    tratamientos predios 3,4,9: ${totalTrat.rows[0].count}`
    );
    console.log(`    tratamientos huérfanos:      ${huerfanos.rows[0].count}`);
    console.log(
      `    animales insertados:         ${stagingAnimals.rows.length}`
    );
    console.log(
      `    tratamientos insertados:     ${insertedTratamientos}`
    );
  } catch (err) {
    await localClient.query("ROLLBACK");
    console.error("\nERROR — ROLLBACK ejecutado:", err);
    await localClient.release();
    await stagingPool.end();
    await localPool.end();
    process.exit(1);
  }

  localClient.release();
  await stagingPool.end();
  await localPool.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
