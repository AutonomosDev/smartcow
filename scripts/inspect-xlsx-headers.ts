/**
 * scripts/inspect-xlsx-headers.ts
 *
 * One-shot: imprime headers + 2 filas de muestra de cada xlsx AgroApp.
 * Read-only. Usado para responder preguntas puntuales de Cesar sobre
 * qué campos vienen en cada módulo.
 */

import ExcelJS from "exceljs";
import path from "path";
import { readdirSync } from "fs";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");

async function main() {
  const target = process.argv[2]; // opcional: filtro por nombre
  const files = readdirSync(XLSX_DIR)
    .filter((f) => f.endsWith(".xlsx"))
    .filter((f) => (target ? f.toLowerCase().includes(target.toLowerCase()) : true))
    .sort();

  for (const file of files) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path.join(XLSX_DIR, file));
    const ws = wb.worksheets[0];
    if (!ws) continue;

    console.log(`\n━━━ ${file} ━━━ (${ws.rowCount - 1} filas)`);
    const headers: string[] = [];
    const header = ws.getRow(1);
    header.eachCell({ includeEmpty: false }, (cell) => {
      headers.push(String(cell.value ?? "").trim());
    });
    console.log(`\nCOLUMNAS (${headers.length}):`);
    headers.forEach((h, i) => console.log(`  ${String(i + 1).padStart(2)}. ${h}`));

    console.log(`\nMUESTRA (primeras 2 filas):`);
    for (let r = 2; r <= Math.min(3, ws.rowCount); r++) {
      const row = ws.getRow(r);
      const values: string[] = [];
      for (let c = 1; c <= headers.length; c++) {
        const v = row.getCell(c).value;
        const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        values.push(s.slice(0, 40));
      }
      console.log(`  [row ${r}]`);
      headers.forEach((h, i) => {
        if (values[i]) console.log(`      ${h.padEnd(24)} = ${values[i]}`);
      });
    }
  }
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
