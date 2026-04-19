/**
 * import-ventas-detalle.ts — Para cada venta de AgroApp, fetch /Venta?service=getAllVentaGanado
 * y poblar tabla `ventas` + actualizar/crear animales con DIIO real.
 *
 * Reemplaza los stubs (tipo=Novillo, sexo=M default) por datos reales: tipo_ganado, sexo,
 * peso final, estado reproductivo al momento de venta.
 *
 * Input: docs/export_agroapp/Ventas_Historial_18-04-2026_1.xlsx (846 ventas — ID + Fundo + Fecha)
 *
 * Output esperado: ~15-20k animales vendidos (algunos duplicados entre ventas, pero la mayoría únicos).
 *                  Tabla `ventas` con un row por animal vendido.
 *
 * Uso:
 *   DATABASE_URL=... AGROAPP_USER=... AGROAPP_PASSWORD=... \
 *     npx tsx src/etl/import-ventas-detalle.ts [--limit N] [--resume]
 */
import ExcelJS from "exceljs";
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { db } from "../db/client";
import { animales, predios, ventas } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";

const AGROAPP_BASE = "http://agroapp.cl:8080/AgroAppWebV18";
const USER = process.env.AGROAPP_USER;
const PASSWORD = process.env.AGROAPP_PASSWORD;
if (!USER || !PASSWORD) {
  console.error("Missing AGROAPP_USER / AGROAPP_PASSWORD env vars");
  process.exit(1);
}

const CHECKPOINT_FILE = "/tmp/import-ventas-detalle.checkpoint.json";
const EXCEL_PATH = "docs/export_agroapp/Ventas_Historial_18-04-2026_1.xlsx";
const CONCURRENCY = 4;
const RETRY_DELAY_MS = 2500;
const MAX_RETRIES = 3;

// Catálogo tipo_ganado → {id, sexo}
const TIPO_GANADO: Record<string, { id: number; sexo: "M" | "H" }> = {
  Novillo:  { id: 1, sexo: "M" },
  Ternera:  { id: 2, sexo: "H" },
  Ternero:  { id: 3, sexo: "M" },
  Toro:     { id: 4, sexo: "M" },
  Vaca:     { id: 5, sexo: "H" },
  Vaquilla: { id: 6, sexo: "H" },
  Torete:   { id: 7, sexo: "M" },
};

const ESTADO_REPRO: Record<string, number> = {
  Inseminada: 1,
  Parida: 2,
  Preencaste: 3,
  "Preñada": 4,
  "Vacía": 5,
};

type VentaMeta = { id: number; fundo: string; fecha: string; nAnimales: number };

interface ApiDetalleRow {
  ID: number;
  Diio: string | number;
  "Tipo ganado": string;
  "Estado Reproductivo": string;
  "Estado leche": string;
  "Peso (kg)": number;
  Mangada: number;
}

interface ApiResponse {
  status_code: number;
  total_animales?: number;
  results?: ApiDetalleRow[];
  message?: string;
}

async function loadVentasMetadata(path: string): Promise<VentaMeta[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet");
  const hdrRow = ws.getRow(1);
  const headers: string[] = [];
  hdrRow.eachCell((cell, col) => { headers[col - 1] = String(cell.value ?? "").trim(); });
  const iID = headers.indexOf("ID");
  const iFundo = headers.indexOf("Fundo");
  const iFecha = headers.indexOf("Fecha venta");
  const iAnim = headers.indexOf("Animales");
  if (iID < 0 || iFundo < 0 || iFecha < 0) throw new Error("Excel missing columns");
  const out: VentaMeta[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = Number(row.getCell(iID + 1).value);
    const fundo = String(row.getCell(iFundo + 1).value ?? "").trim();
    const fechaVal = row.getCell(iFecha + 1).value;
    const nAnim = Number(row.getCell(iAnim + 1).value ?? 0);
    if (!id || !fundo || !fechaVal) continue;
    let fecha = "";
    if (fechaVal instanceof Date) {
      if (isNaN(fechaVal.getTime())) continue;
      fecha = fechaVal.toISOString().slice(0, 10);
    } else if (typeof fechaVal === "string") {
      fecha = fechaVal.slice(0, 10);
    }
    if (!fecha) continue;
    out.push({ id, fundo, fecha, nAnimales: nAnim });
  }
  return out;
}

async function fetchVentaDetalle(ventaId: number, retries = 0): Promise<ApiDetalleRow[]> {
  const filtros = {
    venta_id: ventaId,
    tipo_ganado: "Todos",
    estado_reproductivo: "Todos",
    estado_leche: "Todos",
    order: "Descendente",
    tipo_order: "Ingreso",
  };
  const qs = new URLSearchParams({
    usuario: USER!,
    clave: PASSWORD!,
    service: "getAllVentaGanado",
    jsonFiltros: JSON.stringify(filtros),
  });
  const url = `${AGROAPP_BASE}/Venta?${qs.toString()}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    const json = (await res.json()) as ApiResponse;
    if (json.status_code !== 200) {
      if (retries < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        return fetchVentaDetalle(ventaId, retries + 1);
      }
      console.warn(`  ! venta_id=${ventaId} status=${json.status_code} msg=${json.message}`);
      return [];
    }
    return json.results ?? [];
  } catch (err) {
    if (retries < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
      return fetchVentaDetalle(ventaId, retries + 1);
    }
    console.warn(`  ! venta_id=${ventaId} fetch err after retries: ${(err as Error).message}`);
    return [];
  }
}

async function getPredioMap() {
  const rows = await db.select({ id: predios.id, nombre: predios.nombre }).from(predios);
  const m = new Map<string, number>();
  for (const p of rows) m.set(p.nombre.toLowerCase().trim(), p.id);
  return m;
}

async function ensurePredio(predioMap: Map<string, number>, nombre: string): Promise<number> {
  const key = nombre.toLowerCase().trim();
  const existing = predioMap.get(key);
  if (existing) return existing;
  const inserted = await db.insert(predios).values({ nombre: nombre.trim(), orgId: 1 }).returning({ id: predios.id });
  const newId = inserted[0]!.id;
  predioMap.set(key, newId);
  console.log(`  + predio creado: "${nombre.trim()}" (id=${newId})`);
  return newId;
}

type Stats = {
  ventasOk: number;
  ventasEmpty: number;
  ventasError: number;
  animalesCreados: number;
  animalesActualizados: number;
  ventasRows: number;
};

async function processVenta(meta: VentaMeta, predioMap: Map<string, number>, stats: Stats) {
  const detalle = await fetchVentaDetalle(meta.id);
  if (!detalle.length) {
    stats.ventasEmpty++;
    return;
  }

  const predioId = await ensurePredio(predioMap, meta.fundo);

  // Borrar ventas previas para idempotencia
  await db.delete(ventas).where(eq(ventas.ventaIdAgroapp, meta.id));

  for (const row of detalle) {
    const diio = String(row.Diio).replace(/\.0$/, "").trim();
    if (!diio) continue;
    const tipoStr = String(row["Tipo ganado"] ?? "").trim();
    const tipo = TIPO_GANADO[tipoStr];
    if (!tipo) {
      console.warn(`  ? tipo desconocido "${tipoStr}" diio=${diio}`);
      continue;
    }
    const estadoReproId = ESTADO_REPRO[String(row["Estado Reproductivo"] ?? "").trim()] ?? null;
    const peso = Number(row["Peso (kg)"]) || null;

    // Upsert animal
    const existing = await db
      .select({ id: animales.id, observaciones: animales.observaciones })
      .from(animales)
      .where(and(eq(animales.predioId, predioId), eq(animales.diio, diio)))
      .limit(1);

    let animalId: number;
    if (existing.length) {
      animalId = existing[0]!.id;
      const isStub = (existing[0]!.observaciones ?? "").startsWith("stub");
      // Actualizar: tipo, sexo reales, estado=baja, clear obs si era stub
      await db
        .update(animales)
        .set({
          tipoGanadoId: tipo.id,
          sexo: tipo.sexo,
          estadoReproductivoId: estadoReproId,
          estado: "baja",
          observaciones: isStub ? null : existing[0]!.observaciones,
          actualizadoEn: new Date(),
        })
        .where(eq(animales.id, animalId));
      stats.animalesActualizados++;
    } else {
      const inserted = await db
        .insert(animales)
        .values({
          predioId,
          diio,
          tipoGanadoId: tipo.id,
          sexo: tipo.sexo,
          estadoReproductivoId: estadoReproId,
          estado: "baja",
        })
        .returning({ id: animales.id });
      animalId = inserted[0]!.id;
      stats.animalesCreados++;
    }

    // Insert venta row
    await db.insert(ventas).values({
      predioId,
      animalId,
      fecha: meta.fecha,
      pesoKg: peso ? String(peso) : null,
      ventaIdAgroapp: meta.id,
      nAnimalesRampa: meta.nAnimales,
    });
    stats.ventasRows++;
  }
  stats.ventasOk++;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const resume = args.includes("--resume");

  const metas = await loadVentasMetadata(EXCEL_PATH);
  console.log(`Ventas en Excel: ${metas.length}`);
  const todo = limit ? metas.slice(0, limit) : metas;

  let processedIds = new Set<number>();
  if (resume && existsSync(CHECKPOINT_FILE)) {
    const ck = JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8"));
    processedIds = new Set(ck.processedIds ?? []);
    console.log(`Resuming: ${processedIds.size} ventas ya procesadas`);
  }
  const pending = todo.filter(m => !processedIds.has(m.id));
  console.log(`Pending: ${pending.length} ventas`);

  const predioMap = await getPredioMap();
  const stats: Stats = {
    ventasOk: 0, ventasEmpty: 0, ventasError: 0,
    animalesCreados: 0, animalesActualizados: 0, ventasRows: 0,
  };

  const start = Date.now();
  let done = 0;
  // Worker pool
  const queue = [...pending];
  async function worker() {
    while (queue.length) {
      const m = queue.shift();
      if (!m) break;
      try {
        await processVenta(m, predioMap, stats);
        processedIds.add(m.id);
      } catch (err) {
        stats.ventasError++;
        console.error(`  X venta_id=${m.id}: ${(err as Error).message}`);
      }
      done++;
      if (done % 20 === 0 || done === pending.length) {
        const elapsed = (Date.now() - start) / 1000;
        const rate = done / elapsed;
        const eta = (pending.length - done) / rate;
        console.log(
          `  ${done}/${pending.length} | ok:${stats.ventasOk} empty:${stats.ventasEmpty} err:${stats.ventasError} ` +
          `| animales +${stats.animalesCreados}/~${stats.animalesActualizados} | ventasRows:${stats.ventasRows} ` +
          `| rate: ${rate.toFixed(1)}/s | eta: ${eta.toFixed(0)}s`
        );
        // Checkpoint
        writeFileSync(CHECKPOINT_FILE, JSON.stringify({ processedIds: [...processedIds] }));
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ processedIds: [...processedIds] }));
  console.log(`\n=== VENTAS DETALLE DONE ===`);
  console.log(stats);
  console.log(`Elapsed: ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((err) => { console.error(err); process.exit(1); });
