/**
 * import-agroapp-full.ts — AUT-235
 *
 * Carga consultas_full.json (output de fetch_full_v3.py) en las
 * tablas ventas, tratamientos y traslados de PostgreSQL.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx src/etl/import-agroapp-full.ts /tmp/consultas_full.json
 *
 * Idempotente: usa upsert por (animal_id, fecha, id_agroapp).
 * Animales o predios no encontrados se saltan con log.
 */
import * as fs from "fs";
import { db } from "../db/client";
import { animales, predios, ventas, tratamientos, traslados } from "../db/schema";
import { eq, and } from "drizzle-orm";

const BATCH = 200;
const LOG_EVERY = 500;

type Medicamento = { nombre: string; dosis: string | null; lote: string | null };

type Evento = {
  tipo: string;
  fecha?: string;
  hora?: string;
  id?: string;
  fundo?: string;
  fundo_origen?: string;
  fundo_destino?: string;
  peso?: number | null;
  observacion?: string;
  medicamentos?: Medicamento[];
  diagnostico?: string;
  observaciones?: string;
};

type ConsultaEntry = {
  error?: string;
  eventos?: Evento[];
};

function parseDate(ddmmyyyy: string | undefined): string | null {
  if (!ddmmyyyy) return null;
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

async function main() {
  const jsonPath = process.argv[2] ?? "/tmp/consultas_full.json";
  if (!fs.existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  console.log(`Loading ${jsonPath}...`);
  const raw: Record<string, ConsultaEntry> = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const diios = Object.keys(raw);
  console.log(`Entries: ${diios.length}`);

  // Cache predios por nombre (normalizado lowercase)
  const predioRows = await db.select({ id: predios.id, nombre: predios.nombre }).from(predios);
  const predioByNombre = new Map<string, number>();
  for (const p of predioRows) predioByNombre.set(p.nombre.toLowerCase().trim(), p.id);

  // Cache animales por diio
  const animalRows = await db
    .select({ id: animales.id, diio: animales.diio, predioId: animales.predioId })
    .from(animales);
  const animalByDiio = new Map<string, { id: number; predioId: number }>();
  for (const a of animalRows) animalByDiio.set(a.diio, { id: a.id, predioId: a.predioId });

  console.log(`Predios cargados: ${predioByNombre.size} | Animales cargados: ${animalByDiio.size}`);

  const stats = { ventasOk: 0, tratOk: 0, traslOk: 0, skip: 0, noAnimal: 0 };
  let processed = 0;

  for (const diio of diios) {
    const entry = raw[diio];
    if (entry.error || !entry.eventos?.length) {
      stats.skip++;
      processed++;
      continue;
    }

    const animal = animalByDiio.get(diio);
    if (!animal) {
      stats.noAnimal++;
      processed++;
      if (stats.noAnimal <= 10) console.log(`  SKIP no-animal diio=${diio}`);
      continue;
    }

    const { id: animalId, predioId } = animal;

    for (const ev of entry.eventos) {
      const fecha = parseDate(ev.fecha);
      if (!fecha) continue;

      try {
        if (ev.tipo === "Venta") {
          await db
            .insert(ventas)
            .values({
              predioId,
              animalId,
              fecha,
              pesoKg: ev.peso != null ? String(ev.peso) : null,
              destino: ev.observacion ?? null,
            })
            .onConflictDoNothing();
          stats.ventasOk++;
        } else if (ev.tipo === "Tratamiento") {
          const predioOrigenId = ev.fundo
            ? predioByNombre.get(ev.fundo.toLowerCase().trim()) ?? null
            : null;
          const resolvedPredio = predioOrigenId ?? predioId;
          await db
            .insert(tratamientos)
            .values({
              predioId: resolvedPredio,
              animalId,
              fecha,
              horaRegistro: ev.hora ?? null,
              idAgroapp: ev.id ?? null,
              diagnostico: ev.diagnostico ?? null,
              observaciones: ev.observaciones ?? null,
              medicamentos: ev.medicamentos?.length ? ev.medicamentos : null,
            })
            .onConflictDoNothing();
          stats.tratOk++;
        } else if (ev.tipo === "Traslado") {
          const origenId = ev.fundo_origen
            ? predioByNombre.get(ev.fundo_origen.toLowerCase().trim()) ?? null
            : null;
          const destinoId = ev.fundo_destino
            ? predioByNombre.get(ev.fundo_destino.toLowerCase().trim()) ?? null
            : null;
          await db
            .insert(traslados)
            .values({
              animalId,
              fecha,
              idAgroapp: ev.id ?? null,
              predioOrigenId: origenId,
              predioDestinoId: destinoId,
              fundoOrigenNombre: ev.fundo_origen ?? null,
              fundoDestinoNombre: ev.fundo_destino ?? null,
            })
            .onConflictDoNothing();
          stats.traslOk++;
        }
      } catch (err) {
        console.error(`  ERROR diio=${diio} tipo=${ev.tipo}:`, err);
      }
    }

    processed++;
    if (processed % LOG_EVERY === 0) {
      console.log(
        `  ${processed}/${diios.length} | ventas:${stats.ventasOk} trat:${stats.tratOk} trasl:${stats.traslOk} noAnimal:${stats.noAnimal}`
      );
    }
  }

  console.log("\n=== DONE ===");
  console.log(`Procesados: ${processed}`);
  console.log(`Ventas:       ${stats.ventasOk}`);
  console.log(`Tratamientos: ${stats.tratOk}`);
  console.log(`Traslados:    ${stats.traslOk}`);
  console.log(`Sin animal:   ${stats.noAnimal}`);
  console.log(`Skip (error): ${stats.skip}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
