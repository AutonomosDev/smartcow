/**
 * scripts/seed-synthetic-dataset.ts — AUT-289 Fase B
 *
 * Clona datos de JP (org_id=1) a org_id=99 anonimizando:
 *   - predios: "Predio Demo 1..N"
 *   - potreros: "Potrero N"
 *   - DIIOs: secuencial DEMO-00001..
 *   - region: "Demo"
 * Pesos, fechas, eventos, jerarquía se preservan (datos reales útiles para LLM).
 *
 * Modos:
 *   default:     si org 99 ya existe, aborta.
 *   --refresh:   trunca datos org 99 + chat_cache org 99 + re-clona.
 *                users con org_id=99 se mantienen intactos.
 *                Para cron nocturno 00:00 CLT.
 *
 * Run:
 *   DATABASE_URL=... npx tsx scripts/seed-synthetic-dataset.ts
 *   DATABASE_URL=... npx tsx scripts/seed-synthetic-dataset.ts --refresh
 */

import { sql } from "drizzle-orm";
import { db } from "@/src/db/client";

const SOURCE_ORG_ID = 1;
const TRIAL_ORG_ID = 99;
const REFRESH_MODE = process.argv.includes("--refresh");

async function refreshOrg99(): Promise<void> {
  console.log(`[seed] --refresh: limpiando datos org ${TRIAL_ORG_ID}…`);
  // Orden respeta FKs: eventos -> animales -> potreros -> predios -> org.
  // users con org_id=99 NO se tocan (se mantienen los testers).
  await db.execute(sql`
    DELETE FROM chat_cache WHERE predio_id IN (
      SELECT id FROM predios WHERE org_id = ${TRIAL_ORG_ID}
    )
  `);
  await db.execute(sql`DELETE FROM tratamientos WHERE predio_id IN (SELECT id FROM predios WHERE org_id=${TRIAL_ORG_ID})`);
  await db.execute(sql`DELETE FROM partos WHERE predio_id IN (SELECT id FROM predios WHERE org_id=${TRIAL_ORG_ID})`);
  await db.execute(sql`DELETE FROM pesajes WHERE predio_id IN (SELECT id FROM predios WHERE org_id=${TRIAL_ORG_ID})`);
  await db.execute(sql`DELETE FROM animales WHERE predio_id IN (SELECT id FROM predios WHERE org_id=${TRIAL_ORG_ID})`);
  await db.execute(sql`DELETE FROM potreros WHERE org_id = ${TRIAL_ORG_ID}`);
  await db.execute(sql`DELETE FROM predios WHERE org_id = ${TRIAL_ORG_ID}`);
  await db.execute(sql`DELETE FROM organizaciones WHERE id = ${TRIAL_ORG_ID}`);
  console.log("[seed] --refresh: datos limpios.");
}

async function seed() {
  if (REFRESH_MODE) {
    await refreshOrg99();
  } else {
    console.log(`[seed] Verificando org ${TRIAL_ORG_ID}…`);
    const existing = await db.execute(
      sql`SELECT id FROM organizaciones WHERE id = ${TRIAL_ORG_ID}`
    );
    if (existing.rows.length > 0) {
      console.log(`[seed] Org ${TRIAL_ORG_ID} ya existe. Abortando. (use --refresh para re-clonar)`);
      process.exit(0);
    }
  }

  console.log("[seed] Iniciando clonado anonimizado…");

  // ── 1. Organización ────────────────────────────────────────────────
  await db.execute(sql`
    INSERT INTO organizaciones (id, nombre, plan, usage_cap_usd, modulos, config)
    VALUES (${TRIAL_ORG_ID}, 'Fundo Demo', 'free', 5.00,
            '{"feedlot":true,"crianza":true}'::jsonb,
            '{"demo":true}'::jsonb)
  `);

  // ── 2. Predios — clonar con nombres anonimizados ──────────────────
  console.log("[seed] Clonando predios…");
  await db.execute(sql`
    INSERT INTO predios (org_id, nombre, region, config)
    SELECT ${TRIAL_ORG_ID},
           'Predio Demo ' || ROW_NUMBER() OVER (ORDER BY id),
           'Demo',
           '{}'::jsonb
    FROM predios WHERE org_id = ${SOURCE_ORG_ID}
    ORDER BY id
  `);

  // Construir mapa old_predio_id → new_predio_id
  await db.execute(sql`
    CREATE TEMP TABLE predio_map AS
    WITH src AS (
      SELECT id AS old_id, ROW_NUMBER() OVER (ORDER BY id) AS rn
      FROM predios WHERE org_id = ${SOURCE_ORG_ID}
    ),
    dst AS (
      SELECT id AS new_id, ROW_NUMBER() OVER (ORDER BY id) AS rn
      FROM predios WHERE org_id = ${TRIAL_ORG_ID}
    )
    SELECT src.old_id, dst.new_id
    FROM src JOIN dst USING (rn)
  `);

  const predioCount = await db.execute(sql`SELECT COUNT(*) AS n FROM predio_map`);
  console.log(`[seed] ${predioCount.rows[0].n} predios clonados`);

  // ── 3. Potreros — clonar con nombres genéricos ─────────────────────
  console.log("[seed] Clonando potreros…");
  await db.execute(sql`
    INSERT INTO potreros (predio_id, org_id, nombre, hectareas, capacidad_animales, tipo)
    SELECT pm.new_id,
           ${TRIAL_ORG_ID},
           'Potrero ' || ROW_NUMBER() OVER (PARTITION BY p.predio_id ORDER BY p.id),
           p.hectareas,
           p.capacidad_animales,
           p.tipo
    FROM potreros p
    JOIN predio_map pm ON pm.old_id = p.predio_id
  `);

  // ── 4. Animales — DIIOs renumerados secuencialmente ────────────────
  console.log("[seed] Clonando animales (puede tardar)…");
  await db.execute(sql`
    INSERT INTO animales (
      predio_id, diio, eid, tipo_ganado_id, raza_id, sexo,
      fecha_nacimiento, estado_reproductivo_id, estado,
      diio_madre, padre, abuelo, origen,
      tipo_propiedad, modulo_actual, observaciones, desecho
    )
    SELECT
      pm.new_id,
      'DEMO-' || LPAD(ROW_NUMBER() OVER (ORDER BY a.id)::text, 6, '0'),
      NULL,
      a.tipo_ganado_id, a.raza_id, a.sexo,
      a.fecha_nacimiento, a.estado_reproductivo_id, a.estado,
      NULL, NULL, NULL, NULL,
      a.tipo_propiedad, a.modulo_actual, NULL, a.desecho
    FROM animales a
    JOIN predio_map pm ON pm.old_id = a.predio_id
    ORDER BY a.id
  `);

  // Mapa animal_id
  await db.execute(sql`
    CREATE TEMP TABLE animal_map AS
    WITH src AS (
      SELECT a.id AS old_id, ROW_NUMBER() OVER (ORDER BY a.id) AS rn
      FROM animales a
      JOIN predios p ON p.id = a.predio_id
      WHERE p.org_id = ${SOURCE_ORG_ID}
    ),
    dst AS (
      SELECT a.id AS new_id, ROW_NUMBER() OVER (ORDER BY a.id) AS rn
      FROM animales a
      JOIN predios p ON p.id = a.predio_id
      WHERE p.org_id = ${TRIAL_ORG_ID}
    )
    SELECT src.old_id, dst.new_id
    FROM src JOIN dst USING (rn)
  `);

  const animalCount = await db.execute(sql`SELECT COUNT(*) AS n FROM animal_map`);
  console.log(`[seed] ${animalCount.rows[0].n} animales clonados`);

  // ── 5. Pesajes ─────────────────────────────────────────────────────
  console.log("[seed] Clonando pesajes…");
  await db.execute(sql`
    INSERT INTO pesajes (predio_id, animal_id, peso_kg, fecha, dispositivo, usuario_id)
    SELECT pm.new_id, am.new_id, ps.peso_kg, ps.fecha, 'Demo', NULL
    FROM pesajes ps
    JOIN predio_map pm ON pm.old_id = ps.predio_id
    JOIN animal_map am ON am.old_id = ps.animal_id
  `);

  // ── 6. Partos ──────────────────────────────────────────────────────
  console.log("[seed] Clonando partos…");
  await db.execute(sql`
    INSERT INTO partos (predio_id, madre_id, fecha, resultado, cria_id,
                        tipo_ganado_cria_id, numero_partos, observaciones, usuario_id)
    SELECT pm.new_id, am.new_id, pt.fecha, pt.resultado, am_cria.new_id,
           pt.tipo_ganado_cria_id, pt.numero_partos, NULL, NULL
    FROM partos pt
    JOIN predio_map pm ON pm.old_id = pt.predio_id
    JOIN animal_map am ON am.old_id = pt.madre_id
    LEFT JOIN animal_map am_cria ON am_cria.old_id = pt.cria_id
  `);

  // ── 7. Tratamientos ────────────────────────────────────────────────
  console.log("[seed] Clonando tratamientos…");
  await db.execute(sql`
    INSERT INTO tratamientos (predio_id, animal_id, fecha, diagnostico, medicamentos)
    SELECT pm.new_id, am.new_id, t.fecha, t.diagnostico, t.medicamentos
    FROM tratamientos t
    JOIN predio_map pm ON pm.old_id = t.predio_id
    JOIN animal_map am ON am.old_id = t.animal_id
  `);

  // ── 8. Summary ─────────────────────────────────────────────────────
  const summary = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM predios WHERE org_id=${TRIAL_ORG_ID}) AS predios,
      (SELECT COUNT(*) FROM potreros WHERE org_id=${TRIAL_ORG_ID}) AS potreros,
      (SELECT COUNT(*) FROM animales a JOIN predios p ON p.id=a.predio_id WHERE p.org_id=${TRIAL_ORG_ID}) AS animales,
      (SELECT COUNT(*) FROM pesajes ps JOIN predios p ON p.id=ps.predio_id WHERE p.org_id=${TRIAL_ORG_ID}) AS pesajes,
      (SELECT COUNT(*) FROM partos pt JOIN predios p ON p.id=pt.predio_id WHERE p.org_id=${TRIAL_ORG_ID}) AS partos,
      (SELECT COUNT(*) FROM tratamientos t JOIN predios p ON p.id=t.predio_id WHERE p.org_id=${TRIAL_ORG_ID}) AS tratamientos
  `);

  console.log("\n[seed] ✓ Clone anonimizado completo:");
  console.log(summary.rows[0]);
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] ERROR:", err);
  process.exit(1);
});
