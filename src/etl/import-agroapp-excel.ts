/**
 * import-agroapp-excel.ts — Importa Excels del UI de AgroApp a PostgreSQL.
 *
 * Uso:
 *   DATABASE_URL=... npx tsx src/etl/import-agroapp-excel.ts <tipo> <archivo.xlsx>
 *
 * Tipos soportados: tratamientos, partos, ventas, ganado, traslados, inseminaciones
 *
 * Los archivos los exporta César desde el botón "Exportar Excel" del UI AgroApp
 * y los deja en docs/export_agroapp/. Este script parsea y hace upsert idempotente
 * por id_agroapp (cuando existe) o por tupla (animal_id, fecha).
 */
import ExcelJS from "exceljs";
import { db } from "../db/client";
import {
  animales,
  predios,
  tratamientos,
  partos,
  pesajes,
  ventas,
  traslados,
  inseminaciones,
  semen,
} from "../db/schema";
import { tipoGanado, razas, inseminadores } from "../db/schema/catalogos";
import { eq, sql } from "drizzle-orm";

type Tipo = "tratamientos" | "partos" | "ventas" | "ganado" | "bajas" | "traslados" | "inseminaciones" | "pesajes";

const LOG_EVERY = 1000;

function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) {
    if (v.getFullYear() < 2000 || v.getFullYear() > 2100) return null;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  return null;
}

function toTimeStr(v: unknown): string | null {
  if (v instanceof Date) {
    const h = String(v.getUTCHours()).padStart(2, "0");
    const m = String(v.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}:00`;
  }
  return null;
}

function cleanStr(v: unknown, max = 500): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function parseMedicamento(nombreReg: string | null, serieVenc: string | null, dosis: string | null) {
  if (!nombreReg && !serieVenc && !dosis) return null;
  const nombre = (nombreReg ?? "").split(" - ")[0]?.trim() || null;
  const lote = (serieVenc ?? "").split(" - ")[0]?.trim() || null;
  return { nombre, dosis: dosis ?? null, lote };
}

async function loadSheet(path: string): Promise<Record<string, unknown>[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet");
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
    headers[col - 1] = String(cell.value ?? `col${col}`).trim();
  });
  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    if (row.cellCount === 0) continue;
    const rec: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      rec[h] = cell.value;
    });
    if (Object.values(rec).some((v) => v != null && v !== "")) rows.push(rec);
  }
  return rows;
}

async function getPredioMap() {
  const rows = await db.select({ id: predios.id, nombre: predios.nombre }).from(predios);
  const m = new Map<string, number>();
  for (const p of rows) m.set(p.nombre.toLowerCase().trim(), p.id);
  return m;
}

async function getAnimalMap() {
  const rows = await db
    .select({ id: animales.id, diio: animales.diio, predioId: animales.predioId })
    .from(animales);
  const m = new Map<string, { id: number; predioId: number }>();
  for (const a of rows) m.set(a.diio, { id: a.id, predioId: a.predioId });
  return m;
}

async function ensurePredio(predioMap: Map<string, number>, nombre: string): Promise<number | null> {
  const key = nombre.toLowerCase().trim();
  const existing = predioMap.get(key);
  if (existing) return existing;

  // Crear predio nuevo — orgId=1 por convención dev
  const inserted = await db
    .insert(predios)
    .values({ nombre: nombre.trim(), orgId: 1 })
    .returning({ id: predios.id });
  const newId = inserted[0]?.id;
  if (!newId) return null;
  predioMap.set(key, newId);
  console.log(`  + predio creado: "${nombre.trim()}" (id=${newId})`);
  return newId;
}

async function importTratamientos(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  let ok = 0;
  let noAnimal = 0;
  let errors = 0;

  // Agrupar tratamientos por (ID + Diio): mismo evento con múltiples medicamentos = 1 fila cada uno en el Excel
  type Med = { nombre: string | null; dosis: string | null; lote: string | null };
  const grupos = new Map<string, { row: Record<string, unknown>; meds: Med[] }>();
  for (const r of rows) {
    const id = String(r["ID"] ?? "");
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "");
    if (!id || !diio) continue;
    const key = `${id}::${diio}`;
    const med = parseMedicamento(cleanStr(r["Medicamento-Reg. SAG"]), cleanStr(r["Serie-Venc."]), cleanStr(r["Dosis"]));
    if (grupos.has(key)) {
      if (med) grupos.get(key)!.meds.push(med);
    } else {
      grupos.set(key, { row: r, meds: med ? [med] : [] });
    }
  }
  console.log(`Tratamientos únicos: ${grupos.size.toLocaleString()} (agrupados por ID+Diio)`);

  let processed = 0;
  for (const [, g] of grupos) {
    const r = g.row;
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "");
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha tratamiento"]);

    processed++;
    if (!fecha) { errors++; continue; }

    const animal = animalMap.get(diio);
    if (!animal) { noAnimal++; continue; }

    const predioId = fundoNombre
      ? (await ensurePredio(predioMap, fundoNombre)) ?? animal.predioId
      : animal.predioId;

    try {
      await db
        .insert(tratamientos)
        .values({
          predioId,
          animalId: animal.id,
          fecha,
          idAgroapp: String(r["ID"]).replace(/\.0$/, ""),
          diagnostico: cleanStr(r["Diagnóstico"], 300),
          observaciones: cleanStr(r["Observaciones"], 500),
          medicamentos: g.meds.length ? g.meds : null,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio} id=${r["ID"]}:`, (err as Error).message);
    }

    if (processed % LOG_EVERY === 0) {
      console.log(`  ${processed}/${grupos.size} | ok:${ok} noAnimal:${noAnimal} err:${errors}`);
    }
  }

  console.log(`\n=== TRATAMIENTOS DONE ===`);
  console.log(`Inserted: ${ok} | Sin animal: ${noAnimal} | Errores: ${errors}`);
}

async function importPartos(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  let ok = 0, noAnimal = 0, errors = 0;
  let i = 0;
  for (const r of rows) {
    i++;
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "");
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha parto"]);
    if (!fecha || !diio) { errors++; continue; }

    const animal = animalMap.get(diio);
    if (!animal) { noAnimal++; continue; }

    const predioId = fundoNombre
      ? (await ensurePredio(predioMap, fundoNombre)) ?? animal.predioId
      : animal.predioId;

    // Mapear Estado del Excel al enum resultado de partos
    const estadoRaw = cleanStr(r["Estado"])?.toLowerCase() ?? "";
    const resultado: "vivo" | "muerto" | "aborto" | "gemelar" =
      estadoRaw.includes("muert") ? "muerto" :
      estadoRaw.includes("abort") ? "aborto" :
      estadoRaw.includes("gemel") ? "gemelar" : "vivo";

    try {
      await db
        .insert(partos)
        .values({
          predioId,
          madreId: animal.id,
          fecha,
          resultado,
          observaciones: cleanStr(r["Subtipo parto"], 500),
          numeroPartos: typeof r["Total partos"] === "number" ? Math.floor(r["Total partos"] as number) : null,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
    }

    if (i % LOG_EVERY === 0) {
      console.log(`  ${i}/${rows.length} | ok:${ok} noAnimal:${noAnimal} err:${errors}`);
    }
  }

  console.log(`\n=== PARTOS DONE ===`);
  console.log(`Inserted: ${ok} | Sin animal: ${noAnimal} | Errores: ${errors}`);
}

async function importVentas(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();

  let ok = 0, errors = 0;
  // Este Excel NO tiene DIIO — es el agregado por rampa.
  // No insertamos en tabla ventas (que requiere animalId) hasta tener el detalle.
  // Por ahora solo reportamos estadísticas.
  let totalAnimales = 0;
  const porFundo = new Map<string, number>();
  for (const r of rows) {
    const fundo = cleanStr(r["Fundo"]) ?? "?";
    const n = Number(r["Animales"] ?? 0);
    totalAnimales += n;
    porFundo.set(fundo, (porFundo.get(fundo) ?? 0) + n);
    ok++;
  }
  console.log(`\n=== VENTAS RESUMEN ===`);
  console.log(`Ventas (rampas): ${ok}`);
  console.log(`Animales vendidos total: ${totalAnimales}`);
  console.log(`Por fundo:`, Object.fromEntries([...porFundo.entries()].sort((a, b) => b[1] - a[1])));
  console.log(`\n⚠ No insertado en tabla ventas — requiere Excel con detalle DIIO por rampa`);
  console.log(`Silenciar warnings:`, { errors, predioMap: predioMap.size });
}

async function importPesajes(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  let ok = 0, noAnimal = 0, errors = 0;
  let i = 0;
  for (const r of rows) {
    i++;
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "");
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha creado"]);
    const peso = r["Peso"];
    if (!fecha || !diio || peso == null) { errors++; continue; }

    const animal = animalMap.get(diio);
    if (!animal) { noAnimal++; continue; }

    const predioId = fundoNombre
      ? (await ensurePredio(predioMap, fundoNombre)) ?? animal.predioId
      : animal.predioId;

    try {
      await db
        .insert(pesajes)
        .values({
          predioId,
          animalId: animal.id,
          fecha,
          pesoKg: String(peso),
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
    }

    if (i % LOG_EVERY === 0) {
      console.log(`  ${i}/${rows.length} | ok:${ok} noAnimal:${noAnimal} err:${errors}`);
    }
  }

  console.log(`\n=== PESAJES DONE ===`);
  console.log(`Inserted: ${ok} | Sin animal: ${noAnimal} | Errores: ${errors}`);
}

async function importGanado(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();

  // Cargar catálogos en memoria
  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  const rzRows = await db.select({ id: razas.id, nombre: razas.nombre }).from(razas);
  const rzMap = new Map(rzRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  // DIIO existentes para upsert
  const existingRows = await db.select({ diio: animales.diio, predioId: animales.predioId }).from(animales);
  const existingSet = new Set(existingRows.map(r => `${r.predioId}:${r.diio}`));

  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  let ok = 0, skipped = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    if (!diio) { errors++; continue; }

    const fundoNombre = cleanStr(r["Fundo"]);
    if (!fundoNombre) { errors++; continue; }
    const predioId = await ensurePredio(predioMap, fundoNombre);
    if (!predioId) { errors++; continue; }

    const tipoNombre = cleanStr(r["Tipo ganado"])?.toLowerCase() ?? "";
    const tgId = tgMap.get(tipoNombre);
    if (!tgId) { errors++; if (errors <= 5) console.error(`  ERR tipoGanado="${tipoNombre}" diio=${diio}`); continue; }

    const sexo: "M" | "H" = SEXO_MAP[tipoNombre] ?? "M";
    const razaNombre = cleanStr(r["Raza"])?.toLowerCase() ?? "";
    const razaId = rzMap.get(razaNombre) ?? null;
    const fechaNac = toDateStr(r["Fecha nacimiento"]);

    const key = `${predioId}:${diio}`;
    if (existingSet.has(key)) {
      // Upsert — actualizar genealogía si está vacía
      await db.update(animales)
        .set({
          padre: cleanStr(r["Padre"], 200) ?? undefined,
          abuelo: cleanStr(r["Abuelo"], 200) ?? undefined,
          diioMadre: cleanStr(r["Diio Madre"], 50) ?? undefined,
          origen: cleanStr(r["Origen"], 200) ?? undefined,
          fechaNacimiento: fechaNac ?? undefined,
          razaId: razaId ?? undefined,
          actualizadoEn: new Date(),
        })
        .where(eq(animales.diio, diio));
      skipped++;
    } else {
      try {
        await db.insert(animales).values({
          predioId,
          diio,
          tipoGanadoId: tgId,
          sexo,
          fechaNacimiento: fechaNac,
          razaId,
          estado: "activo",
          padre: cleanStr(r["Padre"], 200),
          abuelo: cleanStr(r["Abuelo"], 200),
          diioMadre: cleanStr(r["Diio Madre"], 50),
          origen: cleanStr(r["Origen"], 200),
          observaciones: cleanStr(r["Observaciones"], 500),
        }).onConflictDoNothing();
        existingSet.add(key);
        ok++;
      } catch (err) {
        errors++;
        if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
      }
    }

    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | new:${ok} updated:${skipped} err:${errors}`);
    }
  }

  console.log(`\n=== GANADO DONE ===`);
  console.log(`Insertados: ${ok} | Actualizados: ${skipped} | Errores: ${errors}`);
}

async function importBajas(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  const rzRows = await db.select({ id: razas.id, nombre: razas.nombre }).from(razas);
  const rzMap = new Map(rzRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  let ok = 0, created = 0, noAnimal = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    if (!diio || !fundoNombre) { errors++; continue; }

    const predioId = await ensurePredio(predioMap, fundoNombre);
    if (!predioId) { errors++; continue; }

    let animal = animalMap.get(diio);
    if (!animal) {
      // El animal fue dado de baja — lo creamos en estado "baja"
      const tipoNombre = cleanStr(r["Tipo ganado"])?.toLowerCase() ?? "";
      const tgId = tgMap.get(tipoNombre);
      if (!tgId) { noAnimal++; continue; }
      const sexo: "M" | "H" = SEXO_MAP[tipoNombre] ?? "M";
      const rzId = rzMap.get(cleanStr(r["Raza"])?.toLowerCase() ?? "") ?? null;
      try {
        const ins = await db.insert(animales).values({
          predioId,
          diio,
          tipoGanadoId: tgId,
          sexo,
          razaId: rzId,
          fechaNacimiento: toDateStr(r["Fecha nacimiento"]),
          estado: "baja",
        }).returning({ id: animales.id, predioId: animales.predioId });
        if (ins[0]) {
          animalMap.set(diio, { id: ins[0].id, predioId: ins[0].predioId });
          animal = { id: ins[0].id, predioId: ins[0].predioId };
          created++;
        }
      } catch { noAnimal++; continue; }
    } else {
      // Marcar como baja si no lo está
      await db.update(animales).set({ estado: "baja" }).where(eq(animales.diio, diio));
    }

    ok++;
    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | ok:${ok} creados:${created} sinAnimal:${noAnimal} err:${errors}`);
    }
  }

  console.log(`\n=== BAJAS DONE ===`);
  console.log(`Procesados: ${ok} | Animales creados: ${created} | Sin animal: ${noAnimal} | Errores: ${errors}`);
}

async function importInseminaciones(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  // Cargar toros (semen) en memoria
  const semenRows = await db.select({ id: semen.id, toro: semen.toro }).from(semen);
  const semenMap = new Map(semenRows.map(r => [r.toro?.toLowerCase().trim() ?? "", r.id]));

  // Cargar inseminadores
  const insRows = await db.select({ id: inseminadores.id, nombre: inseminadores.nombre }).from(inseminadores);
  const insMap = new Map(insRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  let ok = 0, noAnimal = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha inseminación"]);
    if (!diio || !fecha) { errors++; continue; }

    const animal = animalMap.get(diio);
    if (!animal) { noAnimal++; continue; }

    const predioId = fundoNombre
      ? (await ensurePredio(predioMap, fundoNombre)) ?? animal.predioId
      : animal.predioId;

    const toroNombre = cleanStr(r["Toro"])?.toLowerCase() ?? "";
    const semenId = semenMap.get(toroNombre) ?? null;

    const insNombre = cleanStr(r["Inseminador"])?.toLowerCase() ?? "";
    const insId = insMap.get(insNombre) ?? null;

    try {
      await db.insert(inseminaciones).values({
        predioId,
        animalId: animal.id,
        fecha,
        semenId,
        inseminadorId: insId,
        resultado: "pendiente",
        observaciones: cleanStr(r["Observaciones"], 500),
      }).onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
    }

    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | ok:${ok} noAnimal:${noAnimal} err:${errors}`);
    }
  }

  console.log(`\n=== INSEMINACIONES DONE ===`);
  console.log(`Insertadas: ${ok} | Sin animal: ${noAnimal} | Errores: ${errors}`);
}

async function main() {
  const tipo = process.argv[2] as Tipo;
  const filePath = process.argv[3];
  if (!tipo || !filePath) {
    console.error("Uso: npx tsx src/etl/import-agroapp-excel.ts <tipo> <archivo.xlsx>");
    console.error("Tipos: tratamientos, partos, ventas, ganado, bajas, inseminaciones, pesajes");
    process.exit(1);
  }

  console.log(`Importando ${tipo} desde ${filePath}...`);

  switch (tipo) {
    case "tratamientos":
      await importTratamientos(filePath);
      break;
    case "partos":
      await importPartos(filePath);
      break;
    case "ventas":
      await importVentas(filePath);
      break;
    case "pesajes":
      await importPesajes(filePath);
      break;
    case "ganado":
      await importGanado(filePath);
      break;
    case "bajas":
      await importBajas(filePath);
      break;
    case "inseminaciones":
      await importInseminaciones(filePath);
      break;
    case "traslados":
      console.error(`Traslados son agregados por lote (sin DIIO) — no importar en tabla traslados`);
      process.exit(1);
    default:
      console.error(`Tipo desconocido: ${tipo}`);
      process.exit(1);
  }

  void sql; void ventas; void traslados; void eq;

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
