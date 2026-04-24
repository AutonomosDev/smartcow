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
  medieros,
  tratamientos,
  partos,
  pesajes,
  ventas,
  traslados,
  inventarios,
  inseminaciones,
  semen,
  users,
  bajas,
} from "../db/schema";
import {
  tipoGanado,
  razas,
  inseminadores,
  bajaMotivo,
  bajaCausa,
  tipoParto,
  subtipoParto,
} from "../db/schema/catalogos";
import { eq, sql } from "drizzle-orm";
import { resolveFundo } from "./fundo-resolver";

type Tipo =
  | "tratamientos"
  | "partos"
  | "ventas"
  | "ganado"
  | "bajas"
  | "traslados"
  | "inventarios"
  | "inseminaciones"
  | "pesajes"
  | "stubs";

const LOG_EVERY = 1000;

function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
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

/**
 * Parsea strings AgroApp tipo "30 Días" o "3 días" → 30 / 3.
 * Acepta también numbers puros. Devuelve null si no es interpretable.
 */
function parseDiasInt(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/^-?\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parsea campo "Medicamento-Reg. SAG" formato AgroApp: "Dexabiopen - 0111-B"
 * → { nombre: "Dexabiopen", regSag: "0111-B" }
 * Tolera guión en regSag (ej "0111-B"), splitea en el primer " - ".
 */
function splitNombreReg(v: unknown): { nombre: string | null; regSag: string | null } {
  const s = cleanStr(v, 300);
  if (!s) return { nombre: null, regSag: null };
  const idx = s.indexOf(" - ");
  if (idx < 0) return { nombre: s, regSag: null };
  return { nombre: s.slice(0, idx).trim() || null, regSag: s.slice(idx + 3).trim() || null };
}

/**
 * Parsea campo "Serie-Venc." formato AgroApp: "25002788 - 03/2027"
 * → { lote: "25002788", vencimiento: "2027-03-01" }
 * Fecha "MM/YYYY" se normaliza a primer día del mes (YYYY-MM-01).
 */
function splitSerieVenc(v: unknown): { lote: string | null; vencimiento: string | null } {
  const s = cleanStr(v, 200);
  if (!s) return { lote: null, vencimiento: null };
  const idx = s.indexOf(" - ");
  const lote = idx < 0 ? s : s.slice(0, idx).trim();
  const vencRaw = idx < 0 ? "" : s.slice(idx + 3).trim();
  let vencimiento: string | null = null;
  const mMy = vencRaw.match(/^(\d{1,2})\/(\d{4})$/);
  const mDmy = vencRaw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mMy) {
    vencimiento = `${mMy[2]}-${mMy[1].padStart(2, "0")}-01`;
  } else if (mDmy) {
    vencimiento = `${mDmy[3]}-${mDmy[2].padStart(2, "0")}-${mDmy[1].padStart(2, "0")}`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(vencRaw)) {
    vencimiento = vencRaw;
  }
  return { lote: lote || null, vencimiento };
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

  // Catálogos para crear animales on-demand (mismo patrón que pesajes v2, AUT-297)
  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map((r) => [r.nombre.toLowerCase().trim(), r.id]));
  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  // Agrupar por (ID + Diio): un tratamiento puede tener N medicamentos = N filas en el xlsx
  type Med = {
    nombre: string | null;
    regSag: string | null;
    lote: string | null;
    vencimiento: string | null;
    dosis: string | null;
    via: string | null;
    repetirCadaDias: number | null;
    repetirTotal: number | null;
    resguardoCarneDias: number | null;
    liberacionCarne: string | null;
  };
  const grupos = new Map<string, { row: Record<string, unknown>; meds: Med[] }>();
  for (const r of rows) {
    const id = String(r["ID"] ?? "").replace(/\.0$/, "");
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "");
    if (!id || !diio) continue;
    const key = `${id}::${diio}`;

    const { nombre, regSag } = splitNombreReg(r["Medicamento-Reg. SAG"]);
    const { lote, vencimiento } = splitSerieVenc(r["Serie-Venc."]);
    const dosis = cleanStr(r["Dosis"], 100);
    const via = cleanStr(r["Vía"], 100);
    const repetirCada = parseDiasInt(r["Repetir cada"]);
    const repetirTotal = parseDiasInt(r["Repetir"]);
    const resguardoCarne = parseDiasInt(r["Resguardo carne"]);
    const liberacionCarne = toDateStr(r["Liberación carne"]);

    const hasMedData =
      nombre || regSag || lote || vencimiento || dosis || via ||
      repetirCada != null || repetirTotal != null || resguardoCarne != null || liberacionCarne;
    const med: Med | null = hasMedData
      ? { nombre, regSag, lote, vencimiento, dosis, via, repetirCadaDias: repetirCada, repetirTotal, resguardoCarneDias: resguardoCarne, liberacionCarne }
      : null;

    if (grupos.has(key)) {
      if (med) grupos.get(key)!.meds.push(med);
    } else {
      grupos.set(key, { row: r, meds: med ? [med] : [] });
    }
  }
  console.log(`Tratamientos únicos: ${grupos.size.toLocaleString()} (agrupados por ID+Diio)`);

  let ok = 0;
  let noFecha = 0;
  let noAnimalPredio = 0;
  let errors = 0;
  let animalesCreados = 0;
  let tgFaltantes = 0;
  let processed = 0;

  for (const [, g] of grupos) {
    const r = g.row;
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha tratamiento"]);
    const tipoNombre = cleanStr(r["Tipo ganado"])?.toLowerCase() ?? "";
    const creadoPor = cleanStr(r["Creado por"]);

    processed++;
    if (!fecha) { noFecha++; continue; }

    // Resolver predio del xlsx
    const predioIdFromFile = fundoNombre ? await ensurePredio(predioMap, fundoNombre) : null;

    // Resolver o crear animal (mismo patrón que pesajes v2)
    let animal = animalMap.get(diio);
    if (!animal) {
      if (!predioIdFromFile) { noAnimalPredio++; continue; }
      const tgId = tgMap.get(tipoNombre);
      if (!tgId) {
        tgFaltantes++;
        if (tgFaltantes <= 5) console.error(`  tipo_ganado desconocido: "${tipoNombre}" diio=${diio}`);
        continue;
      }
      const sexo: "M" | "H" = SEXO_MAP[tipoNombre] ?? "M";
      try {
        const ins = await db
          .insert(animales)
          .values({
            predioId: predioIdFromFile,
            diio,
            tipoGanadoId: tgId,
            sexo,
            estado: "baja", // animal no está en GanadoActual → ya no está vivo
          })
          .returning({ id: animales.id, predioId: animales.predioId });
        if (ins[0]) {
          animal = { id: ins[0].id, predioId: ins[0].predioId };
          animalMap.set(diio, animal);
          animalesCreados++;
        } else {
          errors++;
          continue;
        }
      } catch (err) {
        errors++;
        if (errors <= 5) console.error(`  ERR crear animal diio=${diio}:`, (err as Error).message);
        continue;
      }
    }

    const predioId = predioIdFromFile ?? animal.predioId;

    const inicio = toDateStr(r["Inicio"]);
    const fin = toDateStr(r["Fin"]);
    // Denormalizar: máxima fecha de liberación de carne entre todos los medicamentos
    const liberacionCarneMax = g.meds
      .map((m) => m.liberacionCarne)
      .filter((v): v is string => !!v)
      .sort()
      .pop() ?? null;

    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

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
          inicio,
          fin,
          liberacionCarneMax,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio} id=${r["ID"]}:`, (err as Error).message);
    }

    if (processed % LOG_EVERY === 0) {
      console.log(
        `  ${processed}/${grupos.size} | ok:${ok} creados:${animalesCreados} noFecha:${noFecha} noAnimalPredio:${noAnimalPredio} tgFalta:${tgFaltantes} err:${errors}`
      );
    }
  }

  console.log(`\n=== TRATAMIENTOS DONE ===`);
  console.log(`Insertados: ${ok}`);
  console.log(`Animales creados on-demand: ${animalesCreados}`);
  console.log(`Skip — sin fecha: ${noFecha}  sin animal+sin predio: ${noAnimalPredio}  tipo_ganado desconocido: ${tgFaltantes}`);
  console.log(`Errores insert: ${errors}`);
}

/**
 * importPartos — v2 (AUT-300 W5).
 *
 * Cambios vs v1:
 *  - Resuelve/crea catálogos tipo_parto + subtipo_parto con upsert
 *    (antes el subtipo se perdía como "observaciones").
 *  - Crea madre on-demand si el DIIO no está en animales (patrón pesajes v2)
 *    — explica el gap de 2.600 partos: vacas ya vendidas que se registraron
 *    parto vivo en AgroApp pero no están en GanadoActual.
 *  - Mapea usuario_id desde "Creado por".
 *  - observaciones ahora es NULL (no contamina con subtipo_parto).
 *  - Campo "Collar" EXCLUIDO (fuera de scope, dato lechero).
 */
async function importPartos(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map((r) => [r.nombre.toLowerCase().trim(), r.id]));
  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  // Catálogos tipo_parto / subtipo_parto
  const tpRows = await db.select({ id: tipoParto.id, nombre: tipoParto.nombre }).from(tipoParto);
  const tpMap = new Map<string, number>(tpRows.map((r) => [r.nombre.toLowerCase().trim(), r.id]));

  const stRows = await db
    .select({ id: subtipoParto.id, nombre: subtipoParto.nombre, tipoPartoId: subtipoParto.tipoPartoId })
    .from(subtipoParto);
  const stMap = new Map<string, number>(
    stRows.map((r) => [`${r.tipoPartoId}::${r.nombre.toLowerCase().trim()}`, r.id])
  );

  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  async function getOrCreateTipoParto(nombre: string): Promise<number> {
    const k = nombre.toLowerCase().trim();
    const existing = tpMap.get(k);
    if (existing) return existing;
    const ins = await db
      .insert(tipoParto)
      .values({ nombre: nombre.trim() })
      .onConflictDoNothing()
      .returning({ id: tipoParto.id });
    let id = ins[0]?.id;
    if (!id) {
      const row = await db
        .select({ id: tipoParto.id })
        .from(tipoParto)
        .where(eq(tipoParto.nombre, nombre.trim()))
        .limit(1);
      id = row[0]?.id;
    }
    if (!id) throw new Error(`No se pudo crear/leer tipo_parto "${nombre}"`);
    tpMap.set(k, id);
    return id;
  }

  async function getOrCreateSubtipoParto(tpId: number, nombre: string): Promise<number> {
    const k = `${tpId}::${nombre.toLowerCase().trim()}`;
    const existing = stMap.get(k);
    if (existing) return existing;
    const ins = await db
      .insert(subtipoParto)
      .values({ tipoPartoId: tpId, nombre: nombre.trim() })
      .returning({ id: subtipoParto.id });
    const id = ins[0]?.id;
    if (!id) throw new Error(`No se pudo crear subtipo_parto "${nombre}" (tipo=${tpId})`);
    stMap.set(k, id);
    return id;
  }

  let ok = 0, noAnimal = 0, noFecha = 0, errors = 0;
  let animalesCreados = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha parto"]);
    if (!diio) { errors++; continue; }
    if (!fecha) { noFecha++; continue; }

    const predioIdFromFile = fundoNombre ? await ensurePredio(predioMap, fundoNombre) : null;

    // Resolver madre on-demand. Tipo ganado de la MADRE no siempre viene en xlsx;
    // fallback Vaca (Hembra). "Tipo ganado" del xlsx de partos a veces es el de la cría.
    let animal = animalMap.get(diio);
    if (!animal) {
      if (!predioIdFromFile) { noAnimal++; continue; }
      // La madre es hembra. Tipo ganado default = "vaca".
      const vacaId = tgMap.get("vaca");
      if (!vacaId) { noAnimal++; continue; }
      try {
        const ins = await db.insert(animales).values({
          predioId: predioIdFromFile,
          diio,
          tipoGanadoId: vacaId,
          sexo: "H",
          estado: "baja", // si no está en GanadoActual, no está viva
        }).returning({ id: animales.id, predioId: animales.predioId });
        if (ins[0]) {
          animal = { id: ins[0].id, predioId: ins[0].predioId };
          animalMap.set(diio, animal);
          animalesCreados++;
        }
      } catch { noAnimal++; continue; }
      if (!animal) { noAnimal++; continue; }
    }

    const predioId = predioIdFromFile ?? animal.predioId;

    // Mapear Estado del Excel al enum resultado de partos
    const estadoRaw = cleanStr(r["Estado"])?.toLowerCase() ?? "";
    const resultado: "vivo" | "muerto" | "aborto" | "gemelar" =
      estadoRaw.includes("muert") ? "muerto" :
      estadoRaw.includes("abort") ? "aborto" :
      estadoRaw.includes("gemel") ? "gemelar" : "vivo";

    const tipoPartoNombre = cleanStr(r["Tipo parto"], 100);
    const subtipoPartoNombre = cleanStr(r["Subtipo parto"], 100);
    const tipoPartoId = tipoPartoNombre ? await getOrCreateTipoParto(tipoPartoNombre) : null;
    const subtipoPartoId =
      tipoPartoId != null && subtipoPartoNombre
        ? await getOrCreateSubtipoParto(tipoPartoId, subtipoPartoNombre)
        : null;

    // Tipo ganado de la cría: derivado del Sexo del parto cuando está vivo.
    const sexoCria = cleanStr(r["Sexo"])?.toLowerCase() ?? "";
    const tipoGanadoCriaId = sexoCria.startsWith("h")
      ? tgMap.get("ternera") ?? null
      : sexoCria.startsWith("m")
        ? tgMap.get("ternero") ?? null
        : null;

    const creadoPor = cleanStr(r["Creado por"]);
    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

    try {
      await db
        .insert(partos)
        .values({
          predioId,
          madreId: animal.id,
          fecha,
          resultado,
          tipoPartoId,
          subtipoPartoId,
          tipoGanadoCriaId,
          numeroPartos:
            typeof r["Total partos"] === "number"
              ? Math.floor(r["Total partos"] as number)
              : null,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
    }

    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | ok:${ok} creados:${animalesCreados} noAnimal:${noAnimal} noFecha:${noFecha} err:${errors}`);
    }
  }

  console.log(`\n=== PARTOS DONE ===`);
  console.log(`Insertados: ${ok}`);
  console.log(`Madres creadas on-demand: ${animalesCreados}`);
  console.log(`Skip — sin animal: ${noAnimal}  sin fecha: ${noFecha}  errores: ${errors}`);
  console.log(`Tipos parto en catálogo: ${tpMap.size} | Subtipos: ${stMap.size}`);
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

/**
 * importPesajes — Rescata todos los pesajes del xlsx Pesajes_Historial.
 *
 * AUT-297 (W2): versión v2.
 *
 * Cambios vs v1:
 *  - crea animales on-demand si el DIIO no está en `animales` (estado='baja').
 *    83% de DIIOs del xlsx histórico son animales ya vendidos que nunca se
 *    registraron en la tabla porque el import de Ganado Actual solo trae vivos.
 *  - mapea edad_meses, observaciones, creado_por (resolver usuario_id por nombre).
 *  - detecta "PESAJE DESDE VENTA" en obs → dispositivo='agroapp_venta'.
 *  - post-proceso: marca el primer pesaje por animal como es_peso_llegada=true.
 */
async function importPesajes(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  // Catálogos para crear animales on-demand
  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map((r) => [r.nombre.toLowerCase().trim(), r.id]));
  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  // Users para resolver "Creado por" → usuario_id (match best-effort por nombre)
  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  let ok = 0, noFecha = 0, noPeso = 0, noDiio = 0, errorsInsert = 0;
  let animalesCreados = 0, tgFaltantes = 0;
  let pesajesVenta = 0;
  let i = 0;
  const predioPorAnimalFromFile = new Map<number, number>(); // animalId → predioId inferido del xlsx

  for (const r of rows) {
    i++;
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    const fecha = toDateStr(r["Fecha creado"]);
    const peso = r["Peso"];
    const tipoNombre = cleanStr(r["Tipo ganado"])?.toLowerCase() ?? "";
    const edadRaw = r["Edad (meses)"];
    const edadMeses =
      typeof edadRaw === "number" ? edadRaw : edadRaw != null ? parseFloat(String(edadRaw)) : null;
    const obsRaw = cleanStr(r["Observaciones"], 2000);
    const creadoPor = cleanStr(r["Creado por"]);

    if (!diio) { noDiio++; continue; }
    if (!fecha) { noFecha++; continue; }
    if (peso == null || peso === "") { noPeso++; continue; }

    // Resolver predio
    const predioId = fundoNombre
      ? await ensurePredio(predioMap, fundoNombre)
      : null;

    // Resolver o crear animal
    let animal = animalMap.get(diio);
    if (!animal) {
      if (!predioId) { errorsInsert++; continue; }
      const tgId = tgMap.get(tipoNombre);
      if (!tgId) {
        tgFaltantes++;
        if (tgFaltantes <= 5) console.error(`  tipo_ganado desconocido: "${tipoNombre}" diio=${diio}`);
        continue;
      }
      const sexo: "M" | "H" = SEXO_MAP[tipoNombre] ?? "M";
      try {
        const ins = await db
          .insert(animales)
          .values({
            predioId,
            diio,
            tipoGanadoId: tgId,
            sexo,
            estado: "baja", // animal no está en GanadoActual → ya no está vivo
          })
          .returning({ id: animales.id, predioId: animales.predioId });
        if (ins[0]) {
          animal = { id: ins[0].id, predioId: ins[0].predioId };
          animalMap.set(diio, animal);
          animalesCreados++;
        } else {
          errorsInsert++;
          continue;
        }
      } catch (err) {
        errorsInsert++;
        if (errorsInsert <= 5) console.error(`  ERR crear animal diio=${diio}:`, (err as Error).message);
        continue;
      }
    }

    const predioFinal = predioId ?? animal.predioId;
    predioPorAnimalFromFile.set(animal.id, predioFinal);

    // Detectar marcador "PESAJE DESDE VENTA"
    const esPesajeVenta = obsRaw ? /pesaje\s*desde\s*venta/i.test(obsRaw) : false;
    const dispositivo = esPesajeVenta ? "agroapp_venta" : "agroapp";
    if (esPesajeVenta) pesajesVenta++;

    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

    try {
      await db
        .insert(pesajes)
        .values({
          predioId: predioFinal,
          animalId: animal.id,
          fecha,
          pesoKg: String(peso),
          dispositivo,
          edadMeses: edadMeses != null && Number.isFinite(edadMeses) ? String(edadMeses) : null,
          observaciones: obsRaw,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errorsInsert++;
      if (errorsInsert <= 5) console.error(`  ERR insert pesaje diio=${diio}:`, (err as Error).message);
    }

    if (i % LOG_EVERY === 0) {
      console.log(
        `  ${i}/${rows.length} | ok:${ok} creados:${animalesCreados} pesaje_venta:${pesajesVenta} tg_faltante:${tgFaltantes} err:${errorsInsert}`
      );
    }
  }

  console.log(`\n=== PESAJES DONE ===`);
  console.log(`Insertados: ${ok}`);
  console.log(`Animales creados on-demand: ${animalesCreados}`);
  console.log(`Pesajes desde venta: ${pesajesVenta}`);
  console.log(`Skip — sin DIIO: ${noDiio}  sin fecha: ${noFecha}  sin peso: ${noPeso}`);
  console.log(`Skip — tipo_ganado desconocido: ${tgFaltantes}`);
  console.log(`Errores insert: ${errorsInsert}`);

  // Post-proceso: marcar el primer pesaje de cada animal como es_peso_llegada
  console.log(`\n[post] Marcando es_peso_llegada (primer pesaje por animal)...`);
  const marked = await db.execute(sql`
    WITH primeros AS (
      SELECT DISTINCT ON (animal_id) id
      FROM pesajes
      ORDER BY animal_id, fecha ASC, id ASC
    )
    UPDATE pesajes
       SET es_peso_llegada = TRUE
      FROM primeros
     WHERE pesajes.id = primeros.id
       AND pesajes.es_peso_llegada = FALSE
  `);
  console.log(`  Marcados: ${(marked as unknown as { rowCount?: number }).rowCount ?? "?"}`);
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

/**
 * importBajas — v2 (AUT-300 W5).
 *
 * Cambios vs v1:
 *  - INSERTA en tabla `bajas` (v1 solo marcaba animales.estado='baja').
 *  - Upsert idempotente de baja_motivo y baja_causa por nombre del xlsx
 *    ("Motivo" / "Detalle" de AgroApp: Muerte / Neumonía, Abomasitis, etc.).
 *  - Fecha del xlsx = "Fecha baja" (separada de "Fecha creado").
 *  - Usuario_id desde "Creado por".
 *  - Mantiene el patrón on-demand: si el DIIO no existe en animales, se crea
 *    con estado='baja'.
 */
async function importBajas(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const animalMap = await getAnimalMap();

  const tgRows = await db.select({ id: tipoGanado.id, nombre: tipoGanado.nombre }).from(tipoGanado);
  const tgMap = new Map(tgRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  const rzRows = await db.select({ id: razas.id, nombre: razas.nombre }).from(razas);
  const rzMap = new Map(rzRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  // Catálogos baja_motivo / baja_causa con upsert en memoria
  const motivoRows = await db.select({ id: bajaMotivo.id, nombre: bajaMotivo.nombre }).from(bajaMotivo);
  const motivoMap = new Map<string, number>(motivoRows.map(r => [r.nombre.toLowerCase().trim(), r.id]));

  const causaRows = await db
    .select({ id: bajaCausa.id, nombre: bajaCausa.nombre, motivoId: bajaCausa.motivoId })
    .from(bajaCausa);
  // key = `${motivoId}::${nombre.toLowerCase()}`
  const causaMap = new Map<string, number>(
    causaRows.map((r) => [`${r.motivoId}::${r.nombre.toLowerCase().trim()}`, r.id])
  );

  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  const SEXO_MAP: Record<string, "M" | "H"> = {
    novillo: "M", ternero: "M", toro: "M",
    vaca: "H", vaquilla: "H", ternera: "H",
  };

  async function getOrCreateMotivo(nombre: string): Promise<number> {
    const k = nombre.toLowerCase().trim();
    const existing = motivoMap.get(k);
    if (existing) return existing;
    const ins = await db
      .insert(bajaMotivo)
      .values({ nombre: nombre.trim() })
      .onConflictDoNothing()
      .returning({ id: bajaMotivo.id });
    let id = ins[0]?.id;
    if (!id) {
      // Conflict — releer
      const row = await db
        .select({ id: bajaMotivo.id })
        .from(bajaMotivo)
        .where(eq(bajaMotivo.nombre, nombre.trim()))
        .limit(1);
      id = row[0]?.id;
    }
    if (!id) throw new Error(`No se pudo crear/leer baja_motivo "${nombre}"`);
    motivoMap.set(k, id);
    return id;
  }

  async function getOrCreateCausa(motivoId: number, nombre: string): Promise<number> {
    const k = `${motivoId}::${nombre.toLowerCase().trim()}`;
    const existing = causaMap.get(k);
    if (existing) return existing;
    const ins = await db
      .insert(bajaCausa)
      .values({ motivoId, nombre: nombre.trim() })
      .returning({ id: bajaCausa.id });
    const id = ins[0]?.id;
    if (!id) throw new Error(`No se pudo crear baja_causa "${nombre}" (motivo=${motivoId})`);
    causaMap.set(k, id);
    return id;
  }

  let ok = 0, created = 0, noAnimal = 0, noFecha = 0, errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundoNombre = cleanStr(r["Fundo"]);
    const fechaBaja = toDateStr(r["Fecha baja"]) ?? toDateStr(r["Fecha creado"]);
    const motivoNombre = cleanStr(r["Motivo"], 100);
    const detalleNombre = cleanStr(r["Detalle"], 100);
    const creadoPor = cleanStr(r["Creado por"]);

    if (!diio || !fundoNombre) { errors++; continue; }
    if (!fechaBaja) { noFecha++; continue; }

    const predioId = await ensurePredio(predioMap, fundoNombre);
    if (!predioId) { errors++; continue; }

    let animal = animalMap.get(diio);
    if (!animal) {
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
      if (!animal) { noAnimal++; continue; }
    } else {
      await db.update(animales).set({ estado: "baja" }).where(eq(animales.diio, diio));
    }

    // Resolver motivo/causa con upsert. Si no hay motivo en xlsx, skip insert en bajas.
    if (!motivoNombre) { errors++; continue; }
    const motivoId = await getOrCreateMotivo(motivoNombre);
    const causaId = detalleNombre ? await getOrCreateCausa(motivoId, detalleNombre) : null;
    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

    try {
      await db
        .insert(bajas)
        .values({
          predioId,
          animalId: animal.id,
          fecha: fechaBaja,
          motivoId,
          causaId,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR insert baja diio=${diio}:`, (err as Error).message);
    }

    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | ok:${ok} creados:${created} sinAnimal:${noAnimal} sinFecha:${noFecha} err:${errors}`);
    }
  }

  console.log(`\n=== BAJAS DONE ===`);
  console.log(`Insertados: ${ok} | Animales creados: ${created} | Sin animal: ${noAnimal} | Sin fecha: ${noFecha} | Errores: ${errors}`);
  console.log(`Motivos en catálogo: ${motivoMap.size} | Causas: ${causaMap.size}`);
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

/**
 * importStubsFromTratamientos — Crea registros mínimos en `animales` para DIIOs
 * que aparecen en el Excel de tratamientos pero no existen en la DB.
 * Esto recupera los ~12k animales vendidos (no en GanadoActual ni Bajas).
 * Usa tipo_ganado_id=1 (Novillo) como default conservador, estado=activo.
 */
async function importStubsFromTratamientos(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();

  // Cargar DIIOs existentes
  const existingRows = await db.select({ diio: animales.diio }).from(animales);
  const existingDiios = new Set(existingRows.map(r => r.diio));
  console.log(`DIIOs ya en DB: ${existingDiios.size.toLocaleString()}`);

  // Extraer DIIOs únicos con su fundo del Excel
  const diioFundo = new Map<string, string>(); // diio → fundo
  for (const r of rows) {
    const diio = String(r["Diio"] ?? "").replace(/\.0$/, "").trim();
    const fundo = cleanStr(r["Fundo"]);
    if (diio && fundo && !existingDiios.has(diio)) {
      diioFundo.set(diio, fundo);
    }
  }
  console.log(`DIIOs faltantes a crear: ${diioFundo.size.toLocaleString()}`);

  // Tipo_ganado_id default = 1 (Novillo) — más común en context feedlot/mediería
  const DEFAULT_TIPO_GANADO_ID = 1;

  let ok = 0, errors = 0;
  let i = 0;
  for (const [diio, fundoNombre] of diioFundo) {
    i++;
    const predioId = await ensurePredio(predioMap, fundoNombre);
    if (!predioId) { errors++; continue; }

    try {
      await db.insert(animales).values({
        predioId,
        diio,
        tipoGanadoId: DEFAULT_TIPO_GANADO_ID,
        sexo: "M",
        estado: "activo",
        observaciones: "stub — creado desde tratamientos sin animal",
      }).onConflictDoNothing();
      existingDiios.add(diio);
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR diio=${diio}:`, (err as Error).message);
    }

    if (i % LOG_EVERY === 0) {
      console.log(`  ${i}/${diioFundo.size} | created:${ok} err:${errors}`);
    }
  }

  console.log(`\n=== STUBS DONE ===`);
  console.log(`Creados: ${ok} | Errores: ${errors}`);
}

/**
 * Parsea multi-línea "Novillo: 126\nVaquilla: 3" → { novillo: 126, vaquilla: 3 }.
 * Acepta también comas, puntos y coma, o un solo valor "Novillo: 126".
 * Keys normalizadas a lowercase sin tildes.
 */
function parseTipoGanadoDesglose(v: unknown): Record<string, number> | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const result: Record<string, number> = {};
  const lines = s.split(/[\n,;]/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(.+?)\s*:\s*(\d+)$/);
    if (!m) continue;
    const key = m[1]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .trim();
    const n = parseInt(m[2], 10);
    if (key && Number.isFinite(n)) result[key] = n;
  }
  return Object.keys(result).length ? result : null;
}

/**
 * Carga medieros en memoria indexados por nombre canónico lowercase.
 */
async function getMedieroMap() {
  const rows = await db
    .select({ id: medieros.id, nombre: medieros.nombre, predioId: medieros.predioId })
    .from(medieros);
  const m = new Map<string, { id: number; predioId: number }>();
  for (const r of rows) m.set(r.nombre.toLowerCase().trim(), { id: r.id, predioId: r.predioId });
  return m;
}

/**
 * Resuelve un string de Origen/Destino/Fundo del xlsx AgroApp a
 * { predioId?, medieroId?, nombre } usando fundo-resolver (AUT-296).
 * Si es proveedor externo, devuelve solo el nombre canónico.
 */
async function resolveFundoRef(
  raw: string | null,
  predioMap: Map<string, number>,
  medieroMap: Map<string, { id: number; predioId: number }>,
): Promise<{ predioId: number | null; medieroId: number | null; nombre: string | null }> {
  if (!raw) return { predioId: null, medieroId: null, nombre: null };
  const res = resolveFundo(raw);
  if (res.kind === "predio") {
    const pid = predioMap.get(res.canonical.toLowerCase().trim()) ?? null;
    return { predioId: pid, medieroId: null, nombre: res.canonical };
  }
  if (res.kind === "mediero") {
    const med = medieroMap.get(res.canonical.toLowerCase().trim());
    return {
      predioId: med?.predioId ?? null,
      medieroId: med?.id ?? null,
      nombre: res.canonical,
    };
  }
  // Proveedor externo — no FK, solo texto histórico
  return { predioId: null, medieroId: null, nombre: res.canonical };
}

async function importTraslados(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const medieroMap = await getMedieroMap();

  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  let ok = 0;
  let noFecha = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const fecha = toDateStr(r["Fecha traslado"]);
    if (!fecha) { noFecha++; continue; }

    const origen = await resolveFundoRef(cleanStr(r["Origen"]), predioMap, medieroMap);
    const destino = await resolveFundoRef(cleanStr(r["Destino"]), predioMap, medieroMap);
    const nAnimalesRaw = r["Animales"];
    const nAnimales =
      typeof nAnimalesRaw === "number"
        ? Math.trunc(nAnimalesRaw)
        : nAnimalesRaw != null
          ? parseInt(String(nAnimalesRaw), 10)
          : null;
    const tipoGanadoDesglose = parseTipoGanadoDesglose(r["Tipo ganado"]);
    const nGuia = cleanStr(r["N° Guía"], 50);
    const estado = cleanStr(r["Estado"], 20);
    const observacion = cleanStr(r["Observaciones"], 500);
    const creadoPor = cleanStr(r["Creado por"]);
    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

    try {
      await db
        .insert(traslados)
        .values({
          fecha,
          idAgroapp: String(r["ID"] ?? "").replace(/\.0$/, "") || null,
          predioOrigenId: origen.predioId,
          medieroOrigenId: origen.medieroId,
          fundoOrigenNombre: origen.nombre,
          predioDestinoId: destino.predioId,
          medieroDestinoId: destino.medieroId,
          fundoDestinoNombre: destino.nombre,
          nAnimales: nAnimales != null && Number.isFinite(nAnimales) ? nAnimales : null,
          tipoGanadoDesglose,
          nGuia,
          estado,
          observacion,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR id=${r["ID"]}:`, (err as Error).message);
    }

    if ((i + 1) % LOG_EVERY === 0) {
      console.log(`  ${i + 1}/${rows.length} | ok:${ok} noFecha:${noFecha} err:${errors}`);
    }
  }

  console.log(`\n=== TRASLADOS DONE ===`);
  console.log(`Insertados: ${ok} | Sin fecha: ${noFecha} | Errores: ${errors}`);
}

async function importInventarios(filePath: string) {
  const rows = await loadSheet(filePath);
  console.log(`Rows en Excel: ${rows.length.toLocaleString()}`);
  const predioMap = await getPredioMap();
  const medieroMap = await getMedieroMap();

  const userRows = await db.select({ id: users.id, nombre: users.nombre }).from(users);
  const userMap = new Map<string, number>();
  for (const u of userRows) {
    const k = (u.nombre ?? "").toLowerCase().trim();
    if (k) userMap.set(k, u.id);
  }

  let ok = 0;
  let noPredio = 0;
  let noFecha = 0;
  let errors = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const fecha = toDateStr(r["Fecha creado"]);
    if (!fecha) { noFecha++; continue; }

    const fundoRef = await resolveFundoRef(cleanStr(r["Fundo"]), predioMap, medieroMap);
    // Inventario requiere predio_id (NOT NULL en schema) — resolveFundo puede dar
    // proveedor externo sin predio; en ese caso fallback a crear/resolver predio por nombre.
    let predioId = fundoRef.predioId;
    if (!predioId) {
      const fundoName = cleanStr(r["Fundo"]);
      if (fundoName) predioId = await ensurePredio(predioMap, fundoName);
    }
    if (!predioId) { noPredio++; continue; }

    const nEncontradosRaw = r["Encontrados"];
    const nEncontrados =
      typeof nEncontradosRaw === "number"
        ? Math.trunc(nEncontradosRaw)
        : nEncontradosRaw != null
          ? parseInt(String(nEncontradosRaw), 10)
          : null;
    const nFaltantesRaw = r["Faltantes"];
    const nFaltantes =
      typeof nFaltantesRaw === "number"
        ? Math.trunc(nFaltantesRaw)
        : nFaltantesRaw != null
          ? parseInt(String(nFaltantesRaw), 10)
          : null;

    const tgEncontrados = parseTipoGanadoDesglose(r["T.G. Encontrados"]);
    const tgFaltantes = parseTipoGanadoDesglose(r["T.G. Faltantes"]);
    const estado = cleanStr(r["Estado"], 20);
    const creadoPor = cleanStr(r["Creado por"]);
    const usuarioId = creadoPor ? userMap.get(creadoPor.toLowerCase().trim()) ?? null : null;

    try {
      await db
        .insert(inventarios)
        .values({
          idAgroapp: String(r["ID"] ?? "").replace(/\.0$/, "") || null,
          predioId,
          medieroId: fundoRef.medieroId,
          fecha,
          nEncontrados: nEncontrados != null && Number.isFinite(nEncontrados) ? nEncontrados : null,
          tgEncontrados,
          nFaltantes: nFaltantes != null && Number.isFinite(nFaltantes) ? nFaltantes : null,
          tgFaltantes,
          estado,
          usuarioId,
        })
        .onConflictDoNothing();
      ok++;
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`  ERR id=${r["ID"]}:`, (err as Error).message);
    }
  }

  console.log(`\n=== INVENTARIOS DONE ===`);
  console.log(`Insertados: ${ok} | Sin predio: ${noPredio} | Sin fecha: ${noFecha} | Errores: ${errors}`);
}

async function main() {
  const tipo = process.argv[2] as Tipo;
  const filePath = process.argv[3];
  if (!tipo || !filePath) {
    console.error("Uso: npx tsx src/etl/import-agroapp-excel.ts <tipo> <archivo.xlsx>");
    console.error("Tipos: tratamientos, partos, ventas, ganado, bajas, inseminaciones, pesajes, traslados, inventarios, stubs");
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
      await importTraslados(filePath);
      break;
    case "inventarios":
      await importInventarios(filePath);
      break;
    case "stubs":
      await importStubsFromTratamientos(filePath);
      break;
    default:
      console.error(`Tipo desconocido: ${tipo}`);
      process.exit(1);
  }

  void sql; void ventas; void eq;

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
