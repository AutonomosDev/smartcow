/**
 * scripts/extract-full-agroapp.ts
 *
 * AUT-296 — Extracción EXHAUSTIVA de los 10 xlsx AgroApp.
 *
 * Dos salidas por archivo xlsx:
 *
 *   1) docs/export_agroapp/extract/<nombre>_raw.csv
 *      → Todas las filas, todas las columnas, sin modificar.
 *        CSV plano para que Cesar pueda grep/abrir en Excel.
 *
 *   2) docs/export_agroapp/extract/<nombre>_obs_parsed.csv
 *      → Una fila por Observación no vacía, con:
 *        row_id, fundo/predio, obs_raw, y columnas extraídas por regex:
 *          - diios_encontrados   (lista)
 *          - ruts_encontrados    (lista)
 *          - pesos_kg            (lista)
 *          - numeros_7digitos    (lista — potenciales guías/precios)
 *          - cantidades_animales (lista — "22 vaquillas", "106 terneros")
 *          - fechas_texto        ("1 de marzo", etc)
 *          - camiones_patentes   ("camión: frvb42")
 *          - personas_candidatas (nombre propio + RUT)
 *          - posibles_precios    ("$XXXXX", "N kilos", etc)
 *          - obs_lines           (splits por newline, para mejor parseo)
 *
 *   3) docs/export_agroapp/extract/RESUMEN.md
 *      → Resumen agregado: cuántos DIIOs extraídos por archivo,
 *        cuántos RUTs únicos, cuántos patrones por tipo.
 *
 * Read-only sobre xlsx. No toca DB.
 *
 * Uso:
 *   npx tsx scripts/extract-full-agroapp.ts
 */

import ExcelJS from "exceljs";
import path from "path";
import { readdirSync, writeFileSync, mkdirSync, existsSync } from "fs";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");
const OUT_DIR = path.join(XLSX_DIR, "extract");

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// REGEX de extracción — se aplican a cada observación cruda.
// ─────────────────────────────────────────────────────────────────────────────
const RX = {
  // DIIO: 7-9 dígitos típicamente, precedido por "Diio" o suelto en contexto de animal
  diio: /\b\d{7,9}\b/g,

  // RUT chileno XX.XXX.XXX-X
  rut: /\b\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]\b/g,

  // Pesos explícitos
  pesos_kg: /\b[\d.,]+\s*(?:kg|kilos?|kgs|kilogramos?)\b/gi,
  pesos_pv: /\b[\d.,]+\s*k(?:g|ilos?)\s*(?:pv|peso\s*vivo)\b/gi,

  // N° Guía (Tattersall / SAG / interno)
  guia: /\b(?:gu[íi]a|guías?)\s*(?:n[°º]?|num(?:ero)?|#)?\s*:?\s*\d{4,}/gi,

  // Precios explícitos con $ o pesos
  precio_dollar: /\$\s*[\d.,]+/g,
  precio_texto: /\b[\d.,]+\s*(?:pesos?|clp|chile|chilenos?)\b/gi,
  precio_kg: /\b[\d.,]+\s*\/\s*kg\b/gi,
  precio_unitario: /\b[\d.,]+\s*(?:por|x|c\/u|cu)\s*(?:cabeza|animal|kg|kilo)/gi,

  // Cantidades + categoría animal
  cantidad_animal:
    /\b\d+\s+(?:vacas?|vaquillas?|terneros?|terneras?|novillos?|toros?|terneros?)/gi,

  // Fechas
  fecha_dd_mm_yyyy: /\b\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?\b/g,
  fecha_texto: /\b\d{1,2}\s+(?:de\s+)?(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi,

  // Patente de camión (Chile: AA-BB-CC o AAAA-BB o FRVB42 / JK4101)
  patente_auto: /\b[A-Z]{2,4}[-\s]?\d{2,4}[-\s]?\d{0,2}\b/g,
  camion_prefix: /\bcami[óo]n\s*:?\s*[\w\d-]+/gi,
  carro_prefix: /\bcarro\s*:?\s*[\w\d-]+/gi,

  // Keywords relevantes
  kw_compra: /\b(?:compra|ingreso|recibido|llegada|ingres[óo])/gi,
  kw_venta: /\b(?:venta|salida|despacho|entrega)/gi,
  kw_traslado: /\b(?:traslado|mov[io](?:miento|do)?)/gi,
  kw_tratamiento: /\b(?:cc|mg|ml|dosis|aplicaci[óo]n|tratamiento)/gi,

  // Posible nombre de persona: 2+ palabras capitalizadas consecutivas
  nombre_propio:
    /\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})?\b/g,

  // URL / referencia externa
  url: /https?:\/\/\S+/g,

  // Porcentajes
  porcentaje: /\b\d{1,3}\s*%/g,
};

type ExtractKey = keyof typeof RX;

function extractAll(text: string): Record<ExtractKey, string[]> {
  const out = {} as Record<ExtractKey, string[]>;
  for (const [name, re] of Object.entries(RX)) {
    const matches = text.match(re) ?? [];
    out[name as ExtractKey] = [...new Set(matches.map((m) => m.trim()))];
  }
  return out;
}

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function valueToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    // ExcelJS ricos: RichText / Hyperlink
    const obj = v as { richText?: Array<{ text: string }>; text?: string; result?: unknown };
    if (Array.isArray(obj.richText)) return obj.richText.map((r) => r.text).join("");
    if (obj.text) return obj.text;
    if (obj.result != null) return String(obj.result);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

interface FileOutcome {
  file: string;
  rowCount: number;
  withObs: number;
  uniquesByPattern: Record<string, Set<string>>;
}

async function processFile(file: string): Promise<FileOutcome | null> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(XLSX_DIR, file));
  const ws = wb.worksheets[0];
  if (!ws) return null;

  // Extraer headers
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell) => {
    headers.push(valueToString(cell.value).trim());
  });
  const obsIdx = headers.findIndex(
    (h) => h.toLowerCase() === "observaciones" || h.toLowerCase() === "detalle"
  );
  const fundoIdx = headers.findIndex((h) => ["fundo", "origen", "destino"].includes(h.toLowerCase()));

  const rowCount = ws.rowCount - 1;

  // Output 1: raw CSV (todos los datos)
  const rawLines: string[] = [headers.map(csvEscape).join(",")];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= headers.length; c++) {
      cells.push(csvEscape(valueToString(row.getCell(c).value)));
    }
    rawLines.push(cells.join(","));
  }
  const baseName = file.replace(/\.xlsx$/, "");
  writeFileSync(path.join(OUT_DIR, `${baseName}_raw.csv`), rawLines.join("\n") + "\n", "utf8");

  // Output 2: observaciones parseadas (solo si el archivo tiene Obs)
  const uniques: Record<string, Set<string>> = {};
  for (const k of Object.keys(RX)) uniques[k] = new Set();

  let withObs = 0;
  if (obsIdx >= 0) {
    const parsedCols = [
      "row_num",
      "fundo_u_origen",
      "obs_raw_flat",
      ...Object.keys(RX).map((k) => `rx_${k}`),
      "obs_lines_joined",
    ];
    const parsedLines: string[] = [parsedCols.map(csvEscape).join(",")];

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const rawObs = valueToString(row.getCell(obsIdx + 1).value).trim();
      if (!rawObs) continue;
      withObs += 1;

      const fundo = fundoIdx >= 0 ? valueToString(row.getCell(fundoIdx + 1).value).trim() : "";
      const flat = rawObs.replace(/\s+/g, " ").trim();
      const perLine = rawObs.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

      const extracted = extractAll(flat);
      for (const [k, arr] of Object.entries(extracted)) {
        for (const v of arr) uniques[k].add(v);
      }

      const cells: string[] = [
        String(r),
        fundo,
        flat,
        ...Object.keys(RX).map((k) => extracted[k as ExtractKey].join(" | ")),
        perLine.join(" ‖ "),
      ];
      parsedLines.push(cells.map(csvEscape).join(","));
    }

    writeFileSync(
      path.join(OUT_DIR, `${baseName}_obs_parsed.csv`),
      parsedLines.join("\n") + "\n",
      "utf8"
    );
  }

  return { file, rowCount, withObs, uniquesByPattern: uniques };
}

async function main() {
  const files = readdirSync(XLSX_DIR)
    .filter((f) => f.endsWith(".xlsx"))
    .sort();

  console.log(`[extract] ${files.length} archivos → ${OUT_DIR}\n`);
  const outcomes: FileOutcome[] = [];
  for (const f of files) {
    process.stdout.write(`[..] ${f.padEnd(50)}`);
    const outcome = await processFile(f);
    if (outcome) {
      outcomes.push(outcome);
      console.log(` rows=${outcome.rowCount.toString().padStart(6)}  obs=${outcome.withObs.toString().padStart(5)}`);
    } else {
      console.log(` (sin hojas)`);
    }
  }

  // Resumen Markdown
  const mdLines: string[] = [];
  mdLines.push("# Extracción exhaustiva AgroApp — 2026-04-22 (AUT-296)");
  mdLines.push("");
  mdLines.push("Generado por `scripts/extract-full-agroapp.ts`.");
  mdLines.push("");
  mdLines.push("## Archivos procesados");
  mdLines.push("");
  mdLines.push("| archivo | filas | con observaciones | % |");
  mdLines.push("|---------|------:|------------------:|--:|");
  for (const o of outcomes) {
    const pct = o.rowCount > 0 ? ((o.withObs / o.rowCount) * 100).toFixed(1) : "0";
    mdLines.push(`| ${o.file} | ${o.rowCount} | ${o.withObs} | ${pct}% |`);
  }

  mdLines.push("");
  mdLines.push("## Patrones únicos extraídos por archivo");
  mdLines.push("");
  for (const o of outcomes) {
    if (o.withObs === 0) continue;
    mdLines.push(`### ${o.file}`);
    mdLines.push("");
    mdLines.push(`| patrón | únicos |`);
    mdLines.push(`|--------|------:|`);
    for (const [k, set] of Object.entries(o.uniquesByPattern)) {
      if (set.size === 0) continue;
      mdLines.push(`| \`${k}\` | ${set.size} |`);
    }
    mdLines.push("");
    // Top 10 samples por patrón más interesantes
    for (const k of ["rut", "diio", "pesos_kg", "guia", "precio_dollar", "precio_texto", "nombre_propio"]) {
      const set = o.uniquesByPattern[k];
      if (!set || set.size === 0) continue;
      mdLines.push(`**${k}** (top 15 únicos):`);
      mdLines.push("");
      for (const v of [...set].slice(0, 15)) {
        mdLines.push(`- \`${v}\``);
      }
      mdLines.push("");
    }
    mdLines.push("---");
    mdLines.push("");
  }

  mdLines.push("## Archivos de salida");
  mdLines.push("");
  for (const o of outcomes) {
    const base = o.file.replace(/\.xlsx$/, "");
    mdLines.push(`- [${base}_raw.csv](${base}_raw.csv) — toda la data cruda`);
    if (o.withObs > 0) {
      mdLines.push(`- [${base}_obs_parsed.csv](${base}_obs_parsed.csv) — observaciones + patrones extraídos`);
    }
  }

  writeFileSync(path.join(OUT_DIR, "RESUMEN.md"), mdLines.join("\n"), "utf8");
  console.log(`\n[out] ${path.join(OUT_DIR, "RESUMEN.md")}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
