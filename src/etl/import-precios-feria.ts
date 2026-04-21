/**
 * src/etl/import-precios-feria.ts
 * ETL de precios de feria ganadera → tabla precios_feria.
 *
 * Ticket: AUT-271 (reemplaza fixture de AUT-267)
 *
 * FUENTE: ODEPA — Boletín semanal AFECH (Asociación Gremial de Ferias
 * Ganaderas de Chile). Formato XLSX oficial, 293+ boletines disponibles
 * desde 2019. Índice:
 *   https://www.odepa.gob.cl/contenidos-rubro/boletines-del-rubro/boletin-semanal-de-precios-asoc-gremial-de-ferias-ganaderas
 *
 * PARSING:
 *   - Scrapeamos el índice HTML y extraemos URLs .xlsx
 *   - Descargamos cada XLSX → hoja "Precio promedio" (Cuadro 2)
 *   - Columnas: Feria | Comuna | Fecha | Novillo Gordo | Novillo Engorda |
 *     Vaca Gorda | Vaca Engorda | Vaquilla Gorda | Vaquilla Engorda |
 *     Toros | Terneros | Terneras | Cerdos | Lanares | Caballos
 *   - Filtramos bovinos (descartamos cerdos/lanares/caballos)
 *   - Precios en CLP/kg vivo sin IVA
 *
 * USO:
 *   npm run etl:precios-feria               # incremental (desde max_fecha - 14d)
 *   tsx src/etl/import-precios-feria.ts --historico       # backfill completo
 *   tsx src/etl/import-precios-feria.ts --desde=2024-01-01
 *   tsx src/etl/import-precios-feria.ts --max=4           # limit descargas
 *
 * UPSERT: idempotente (INSERT WHERE NOT EXISTS por fuente+feria+categoria+peso_rango+fecha).
 */

import { db } from "@/src/db/client";
import { sql } from "drizzle-orm";
import ExcelJS from "exceljs";

type Categoria =
  | "novillo_gordo"
  | "novillo_engorda"
  | "vaca_gorda"
  | "vaca_engorda"
  | "vaquilla"
  | "vaquilla_engorda"
  | "ternero"
  | "ternera"
  | "toro";

interface FilaPrecio {
  fuente: string;
  feria: string;
  categoria: Categoria;
  peso_rango: string | null;
  fecha: string; // YYYY-MM-DD
  precio_kg_clp: number | null;
  precio_cabeza_clp: number | null;
  moneda: string;
  url_fuente: string | null;
}

// ─────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────

const URL_INDICE =
  "https://www.odepa.gob.cl/contenidos-rubro/boletines-del-rubro/boletin-semanal-de-precios-asoc-gremial-de-ferias-ganaderas";

const USER_AGENT = "smartcow-etl/1.0 (+https://smartcow.cl; contact=cesar@autonomos.dev)";

const FUENTE = "odepa_afech";

/**
 * Mapping columna XLSX → categoría canónica.
 * Orden fijo de columnas en el XLSX de ODEPA (hoja "Precio promedio"):
 * Feria(1), Comuna(2), Fecha(3), NovilloGordo(4), NovilloEngorda(5),
 * VacaGorda(6), VacaEngorda(7), VaquillaGorda(8), VaquillaEngorda(9),
 * Toros(10), Terneros(11), Terneras(12), Cerdos(13), Lanares(14), Caballos(15).
 */
const COL_CATEGORIA: Array<{ col: number; categoria: Categoria }> = [
  { col: 4, categoria: "novillo_gordo" },
  { col: 5, categoria: "novillo_engorda" },
  { col: 6, categoria: "vaca_gorda" },
  { col: 7, categoria: "vaca_engorda" },
  { col: 8, categoria: "vaquilla" },
  { col: 9, categoria: "vaquilla_engorda" },
  { col: 10, categoria: "toro" },
  { col: 11, categoria: "ternero" },
  { col: 12, categoria: "ternera" },
];

// ─────────────────────────────────────────────
// FETCH ÍNDICE Y EXTRAER URLs
// ─────────────────────────────────────────────

interface BoletinLink {
  url: string;
  fechaIso: string; // YYYY-MM-DD extraída del filename
}

/**
 * Extrae fecha YYYY-MM-DD del filename del boletín.
 * Soporta:
 *   - Boletin(SemanalAfech|-semanal-Afech|%20semanal%20Afech)_YYYYMMDD.xlsx
 *   - Boletin-semanal-Afech_DDMMYYYY.xlsx (formato viejo 2019)
 * Valida rango de año (2000-2099) y mes/día para distinguir formatos.
 */
function extraerFechaDeUrl(url: string): string | null {
  // YYYYMMDD: el primer grupo es año (4 dígitos empezando por 20..)
  const m1 = url.match(/_(\d{4})(\d{2})(\d{2})\.xlsx/i);
  if (m1) {
    const [, y, mo, d] = m1;
    const yi = Number(y);
    const mi = Number(mo);
    const di = Number(d);
    if (yi >= 2000 && yi < 2100 && mi >= 1 && mi <= 12 && di >= 1 && di <= 31) {
      return `${y}-${mo}-${d}`;
    }
  }
  // DDMMYYYY: últimos 4 dígitos son año
  const m2 = url.match(/_(\d{2})(\d{2})(\d{4})\.xlsx/i);
  if (m2) {
    const [, d, mo, y] = m2;
    const yi = Number(y);
    const mi = Number(mo);
    const di = Number(d);
    if (yi >= 2000 && yi < 2100 && mi >= 1 && mi <= 12 && di >= 1 && di <= 31) {
      return `${y}-${mo}-${d}`;
    }
  }
  return null;
}

async function fetchIndice(): Promise<BoletinLink[]> {
  const res = await fetch(URL_INDICE, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!res.ok) {
    throw new Error(`[odepa] índice HTTP ${res.status}`);
  }
  const html = await res.text();

  const regex = /href="([^"]*[Bb]oletin[^"]*\.xlsx)"/g;
  const seen = new Set<string>();
  const out: BoletinLink[] = [];
  for (const match of html.matchAll(regex)) {
    const url = match[1];
    if (seen.has(url)) continue;
    seen.add(url);
    const fechaIso = extraerFechaDeUrl(url);
    if (!fechaIso) continue;
    out.push({ url, fechaIso });
  }
  // Orden descendente por fecha (más nuevos primero)
  out.sort((a, b) => (a.fechaIso < b.fechaIso ? 1 : -1));
  return out;
}

// ─────────────────────────────────────────────
// DESCARGA Y PARSEO XLSX
// ─────────────────────────────────────────────

async function descargarXlsx(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "*/*" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`[odepa] descarga HTTP ${res.status} ${url}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("spreadsheet") && !ct.includes("octet-stream") && !ct.includes("ms-excel")) {
    throw new Error(`[odepa] content-type inesperado: ${ct} ${url}`);
  }
  return await res.arrayBuffer();
}

/**
 * Normaliza el nombre de feria/comuna a un slug estable.
 * Ej: "Los Ángeles" → "los_angeles"; "Puerto Montt" → "puerto_montt".
 */
function slugFeria(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Convierte celda XLSX a precio CLP/kg válido. Descarta:
 *   - vacíos/nulls (feria sin transacciones)
 *   - 0 o negativos
 *   - valores <900 (outliers — probablemente error de carga ODEPA
 *     o 1 sola transacción atípica; el rango real bovino en Chile
 *     2019-2026 anduvo entre 1400 y 3400 CLP/kg vivo)
 *   - valores >8000 (outliers por arriba)
 */
function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 900 || n > 8000) return null;
  return Math.round(n);
}

/**
 * Parsea un XLSX de boletín AFECH y retorna filas de precios.
 * Usa la hoja "Precio promedio" (Cuadro 2) — precio promedio general.
 */
async function parsearBoletin(
  buffer: ArrayBuffer,
  url: string,
  fechaIso: string
): Promise<FilaPrecio[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws =
    wb.getWorksheet("Precio promedio") ??
    wb.worksheets.find((w) => w.name.toLowerCase().includes("precio promedio"));
  if (!ws) {
    throw new Error(`[odepa] hoja "Precio promedio" no encontrada en ${url}`);
  }

  const filas: FilaPrecio[] = [];

  // Buscamos fila del header (celda A = "Feria")
  let headerRow = -1;
  for (let r = 1; r <= Math.min(ws.rowCount, 20); r++) {
    const v = ws.getRow(r).getCell(1).value;
    if (v && String(v).trim().toLowerCase() === "feria") {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) {
    throw new Error(`[odepa] no se encontró fila header ("Feria") en ${url}`);
  }

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const feriaRaw = row.getCell(1).value;
    const comunaRaw = row.getCell(2).value;

    if (!feriaRaw) continue;
    const feriaStr = String(feriaRaw).trim();
    if (feriaStr.toLowerCase().startsWith("fuente")) break;
    if (!comunaRaw) continue;
    const comunaStr = String(comunaRaw).trim();
    if (!comunaStr) continue;

    // feria en nuestra tabla = comuna (identifica ubicación geográfica).
    // El "Feria" del XLSX (Tattersall/Fegosa/Agricultores) es el operador del remate.
    const feriaSlug = slugFeria(comunaStr);

    for (const { col, categoria } of COL_CATEGORIA) {
      const precioKg = toNumberOrNull(row.getCell(col).value);
      if (precioKg === null) continue;
      filas.push({
        fuente: FUENTE,
        feria: feriaSlug,
        categoria,
        peso_rango: null,
        fecha: fechaIso,
        precio_kg_clp: precioKg,
        precio_cabeza_clp: null,
        moneda: "CLP",
        url_fuente: url,
      });
    }
  }

  return filas;
}

// ─────────────────────────────────────────────
// FETCH ODEPA (fuente real)
// ─────────────────────────────────────────────

interface FetchOpts {
  desde?: Date;
  max?: number;
}

async function intentarFetchOdepaReal(opts: FetchOpts = {}): Promise<FilaPrecio[]> {
  console.log(`[odepa] fetching índice ${URL_INDICE}`);
  const links = await fetchIndice();
  console.log(`[odepa] ${links.length} boletines disponibles en el índice`);

  const desdeIso = opts.desde ? opts.desde.toISOString().slice(0, 10) : null;
  const filtrados = links.filter((l) => (desdeIso ? l.fechaIso >= desdeIso : true));

  const aProcesar = opts.max ? filtrados.slice(0, opts.max) : filtrados;
  console.log(
    `[odepa] ${aProcesar.length} boletines a procesar${desdeIso ? ` (desde ${desdeIso})` : ""}${opts.max ? ` (max ${opts.max})` : ""}`
  );

  const out: FilaPrecio[] = [];
  let ok = 0;
  let fail = 0;

  for (const link of aProcesar) {
    try {
      const buf = await descargarXlsx(link.url);
      const filas = await parsearBoletin(buf, link.url, link.fechaIso);
      out.push(...filas);
      ok++;
      if (ok % 10 === 0) {
        console.log(
          `[odepa]   ${ok}/${aProcesar.length} procesados (${out.length} filas acumuladas)`
        );
      }
      // Throttling ligero: 300 ms entre descargas
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      fail++;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[odepa]   skip ${link.url}: ${msg}`);
    }
  }

  console.log(`[odepa] ${ok} OK, ${fail} fallidos, ${out.length} filas totales`);
  return out;
}

// ─────────────────────────────────────────────
// UPSERT
// ─────────────────────────────────────────────

async function upsertBatch(filas: FilaPrecio[]): Promise<number> {
  if (filas.length === 0) return 0;

  let insertadas = 0;
  const CHUNK = 500;

  for (let i = 0; i < filas.length; i += CHUNK) {
    const batch = filas.slice(i, i + CHUNK);

    for (const f of batch) {
      const res = await db.execute(sql`
        INSERT INTO precios_feria
          (fuente, feria, categoria, peso_rango, fecha, precio_kg_clp, precio_cabeza_clp, moneda, url_fuente)
        SELECT
          ${f.fuente}, ${f.feria}, ${f.categoria}, ${f.peso_rango},
          ${f.fecha}::date, ${f.precio_kg_clp}, ${f.precio_cabeza_clp},
          ${f.moneda}, ${f.url_fuente}
        WHERE NOT EXISTS (
          SELECT 1 FROM precios_feria
          WHERE fuente = ${f.fuente}
            AND feria = ${f.feria}
            AND categoria = ${f.categoria}
            AND COALESCE(peso_rango, '') = COALESCE(${f.peso_rango}, '')
            AND fecha = ${f.fecha}::date
        )
      `);
      insertadas += (res as { rowCount?: number }).rowCount ?? 0;
    }
  }

  return insertadas;
}

// ─────────────────────────────────────────────
// API PÚBLICA
// ─────────────────────────────────────────────

/**
 * Importa precios ODEPA.
 * Si `desde` no viene, detecta MAX(fecha) en DB y trae desde (MAX - 14 días).
 * Si la tabla está vacía, trae todos los boletines disponibles.
 */
export async function importOdepa(
  opts: { desde?: Date; max?: number } = {}
): Promise<number> {
  let desdeResuelto: Date | undefined;
  if (opts.desde) {
    desdeResuelto = opts.desde;
  } else {
    const maxRow = await db.execute(
      sql`SELECT MAX(fecha) AS max_fecha FROM precios_feria WHERE fuente = ${FUENTE}`
    );
    const maxFecha = (maxRow.rows[0] as { max_fecha: string | null } | undefined)?.max_fecha;
    if (maxFecha) {
      const d = new Date(maxFecha);
      d.setUTCDate(d.getUTCDate() - 14);
      desdeResuelto = d;
    }
  }

  console.log(
    `[odepa] importando${desdeResuelto ? ` desde ${desdeResuelto.toISOString().slice(0, 10)}` : " (full backfill)"}`
  );

  const filas = await intentarFetchOdepaReal({ desde: desdeResuelto, max: opts.max });

  if (filas.length === 0) {
    console.warn("[odepa] 0 filas obtenidas — no hay boletines nuevos o la fuente falló");
    return 0;
  }

  console.log(`[odepa] ${filas.length} filas candidatas`);
  const insertadas = await upsertBatch(filas);
  console.log(`[odepa] ${insertadas} filas nuevas insertadas (resto ya existía)`);

  return insertadas;
}

/**
 * Importa precios Tattersall. Stub — sin fuente pública agregada viable.
 * (Los portales de remate son SPAs sin endpoint agregado semanal.)
 */
export async function importTattersall(): Promise<number> {
  console.log("[tattersall] sin fuente pública viable — skip");
  return 0;
}

// ─────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const historico = args.includes("--historico");
  let desde: Date | undefined;
  let max: number | undefined;

  for (const a of args) {
    const mDesde = a.match(/^--desde=(\d{4}-\d{2}-\d{2})$/);
    if (mDesde) desde = new Date(`${mDesde[1]}T00:00:00Z`);
    const mMax = a.match(/^--max=(\d+)$/);
    if (mMax) max = Number(mMax[1]);
  }

  return { historico, desde, max };
}

async function main() {
  const { historico, desde, max } = parseArgs();
  const desdeFinal = historico ? undefined : desde;

  const odepa = await importOdepa({ desde: desdeFinal, max });
  const tattersall = await importTattersall();

  console.log(
    `\n✓ ETL precios feria completado: odepa=${odepa} tattersall=${tattersall} total=${odepa + tattersall}`
  );
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("import-precios-feria.ts")) {
  main().catch((err) => {
    console.error("[etl] error fatal:", err);
    process.exit(1);
  });
}
