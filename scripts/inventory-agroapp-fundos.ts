/**
 * scripts/inventory-agroapp-fundos.ts
 *
 * AUT-296 (W1) — Paso 1: inventariar los valores distintos de "Fundo",
 * "Origen" y "Destino" en los 10 xlsx exportados de AgroApp el 18-04-2026,
 * contar filas por cada valor y generar tabla para clasificar en
 * cliente / predio / mediería.
 *
 * Read-only. No toca DB.
 *
 * Run:
 *   npx tsx scripts/inventory-agroapp-fundos.ts
 *
 * Output:
 *   - stdout: tabla y árbol
 *   - docs/export_agroapp/fundos-classification.csv
 *     (plantilla editable con tipo vacío para que Cesar complete)
 */

import ExcelJS from "exceljs";
import path from "path";
import { readdirSync, writeFileSync } from "fs";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");
const OUT_CSV = path.join(XLSX_DIR, "fundos-classification.csv");

// Columnas a inspeccionar. AgroApp usa distintos nombres según módulo:
//   Fundo        → Bajas, Ganado Actual, Inseminaciones, Partos, Pesajes,
//                  Tratamientos, Ventas, Inventarios, Pesajes_Ganancias
//   Origen       → Traslados
//   Destino      → Traslados
const TARGET_COLS = ["Fundo", "Origen", "Destino"];

interface Entry {
  fundo: string;
  byTag: Record<string, number>;
  total: number;
}

async function main() {
  const files = readdirSync(XLSX_DIR)
    .filter((f) => f.endsWith(".xlsx"))
    .sort();

  console.log(`[scan] ${files.length} archivos en ${XLSX_DIR}\n`);

  const byValue: Record<string, Record<string, number>> = {};

  for (const file of files) {
    const full = path.join(XLSX_DIR, file);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(full);
    const ws = wb.worksheets[0];
    if (!ws) {
      console.log(`[skip] ${file} — sin hojas`);
      continue;
    }

    // Header en fila 1: mapear col name → col index
    const headerRow = ws.getRow(1);
    const headerMap: Record<string, number> = {};
    headerRow.eachCell((cell, colIdx) => {
      const name = String(cell.value ?? "").trim();
      if (TARGET_COLS.includes(name)) {
        headerMap[name] = colIdx;
      }
    });

    if (Object.keys(headerMap).length === 0) {
      console.log(`[skip] ${file} — sin columnas Fundo/Origen/Destino`);
      continue;
    }

    const dataRows = ws.rowCount - 1;
    console.log(
      `[read] ${file.padEnd(42)} ${dataRows.toString().padStart(7)} filas  cols=[${Object.keys(headerMap).join(",")}]`
    );

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      for (const [colName, colIdx] of Object.entries(headerMap)) {
        const raw = row.getCell(colIdx).value;
        const val = String(raw ?? "").trim();
        if (!val) continue;
        const tag = `${file}::${colName}`;
        byValue[val] ??= {};
        byValue[val][tag] = (byValue[val][tag] ?? 0) + 1;
      }
    }
  }

  // Agregar y ordenar por total desc
  const entries: Entry[] = Object.entries(byValue)
    .map(([fundo, byTag]) => ({
      fundo,
      byTag,
      total: Object.values(byTag).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.total - a.total);

  console.log(`\n=== ${entries.length} VALORES DISTINTOS ENCONTRADOS ===\n`);

  for (const e of entries) {
    console.log(`── "${e.fundo}"  (total ${e.total.toLocaleString()})`);
    const sortedTags = Object.entries(e.byTag).sort((a, b) => b[1] - a[1]);
    for (const [tag, n] of sortedTags) {
      console.log(`     ${n.toString().padStart(7).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}  ${tag}`);
    }
    console.log("");
  }

  // Plantilla CSV para clasificación manual
  const lines: string[] = [];
  lines.push("nombre_agroapp,total_filas,tipo,notas");
  for (const e of entries) {
    const safeName = e.fundo.includes(",") ? `"${e.fundo}"` : e.fundo;
    lines.push(`${safeName},${e.total},,`);
  }
  writeFileSync(OUT_CSV, lines.join("\n") + "\n", "utf8");
  console.log(`[out] ${OUT_CSV}`);

  // Tabla markdown amigable a Linear
  console.log("\n=== TABLA MARKDOWN (para Linear / Cesar) ===\n");
  console.log("| # | Nombre AgroApp                 | Total filas | Tipo (cliente/predio/mediería) |");
  console.log("|---|--------------------------------|------------:|--------------------------------|");
  entries.forEach((e, i) => {
    const n = (i + 1).toString().padStart(2);
    const name = e.fundo.padEnd(30);
    const total = e.total.toLocaleString().padStart(11);
    console.log(`| ${n} | ${name} | ${total} |                                |`);
  });
  console.log();

  process.exit(0);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
