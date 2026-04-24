/**
 * scripts/mine-observaciones.ts
 *
 * Extrae y clasifica contenido no estructurado del campo "Observaciones"
 * en todos los xlsx AgroApp. Busca patrones que sugieran:
 *   - Precio ($, pesos, clp, usd)
 *   - Peso ingreso (kg específico)
 *   - Fechas de compra (date + "compra" / "ingreso")
 *   - RUP (Rol Único Pecuario — típicamente 8+ dígitos)
 *   - RUT (XX.XXX.XXX-X)
 *   - N° Guía SAG
 *
 * Read-only. Output: stdout con conteos + samples.
 */

import ExcelJS from "exceljs";
import path from "path";
import { readdirSync } from "fs";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");

const PATTERNS = {
  precio_dolar: /\$\s?\d[\d.,]*/g,
  precio_clp: /\b\d[\d.,]*\s*(clp|pesos?|chile|chilenos?)\b/gi,
  precio_usd: /\b(?:us\$|usd|u\$s)\s?\d[\d.,]*/gi,
  precio_unitario: /\b\d[\d.,]*\s*(?:\/kg|por kg|x kg|c\/u)/gi,
  peso_kg: /\b\d{2,4}\s*k(?:g|ilos?)\b/gi,
  rut: /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9kK]\b/g,
  rup: /\brup[:\s-]+\d{4,}/gi,
  rup_numero: /\b\d{8,12}\b/g, // potenciales, alto ruido
  guia_sag: /\bgu[íi]a\s*(?:sag|n[°º]?)?\s*[:\-]?\s*\d+/gi,
  fecha_compra: /\b(?:compra|ingreso|recibido|llegada)\w*\s+(?:\d{1,2}[-/]\d{1,2}(?:[-/]\d{2,4})?)/gi,
  precio_num_grande: /\b\d{6,}\b/g, // números de 6+ dígitos podrían ser precios en CLP
};

interface FileStats {
  file: string;
  totalRows: number;
  withObs: number;
  obsColIdx: number;
  samples: string[];
  matches: Record<string, string[]>;
}

async function analyze(file: string): Promise<FileStats | null> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(XLSX_DIR, file));
  const ws = wb.worksheets[0];
  if (!ws) return null;

  // Find Observaciones column
  const header = ws.getRow(1);
  let obsColIdx = -1;
  header.eachCell({ includeEmpty: false }, (cell, colIdx) => {
    const name = String(cell.value ?? "").trim().toLowerCase();
    if (name === "observaciones" || name === "detalle") {
      obsColIdx = colIdx;
    }
  });
  if (obsColIdx < 0) return null;

  const stats: FileStats = {
    file,
    totalRows: ws.rowCount - 1,
    withObs: 0,
    obsColIdx,
    samples: [],
    matches: {},
  };
  for (const k of Object.keys(PATTERNS)) stats.matches[k] = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const raw = ws.getRow(r).getCell(obsColIdx).value;
    const obs = String(raw ?? "").trim();
    if (!obs) continue;
    stats.withObs += 1;

    for (const [name, re] of Object.entries(PATTERNS)) {
      const m = obs.match(re);
      if (m && m.length) {
        // capturar contexto (line con match + obs corta)
        if (stats.matches[name].length < 8) {
          stats.matches[name].push(`${m[0]}   ⟵ "${obs.slice(0, 80)}"`);
        }
      }
    }

    if (stats.samples.length < 10 && obs.length >= 10) {
      stats.samples.push(obs.slice(0, 120));
    }
  }

  return stats;
}

async function main() {
  const files = readdirSync(XLSX_DIR)
    .filter((f) => f.endsWith(".xlsx"))
    .sort();

  for (const file of files) {
    const s = await analyze(file);
    if (!s) continue;

    console.log(`\n━━━ ${file} ━━━`);
    console.log(
      `   filas=${s.totalRows}  con observaciones=${s.withObs}  (${((s.withObs / s.totalRows) * 100).toFixed(1)}%)`
    );

    for (const [name, hits] of Object.entries(s.matches)) {
      if (hits.length === 0) continue;
      console.log(`\n   🔍 ${name} — ${hits.length} matches`);
      for (const h of hits.slice(0, 5)) console.log(`      ${h}`);
    }

    if (s.samples.length > 0) {
      console.log(`\n   📝 Samples (primeras 5):`);
      for (const sm of s.samples.slice(0, 5)) {
        console.log(`      • ${sm}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
