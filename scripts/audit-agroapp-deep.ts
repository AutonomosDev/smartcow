/**
 * scripts/audit-agroapp-deep.ts
 *
 * AUT-296 (audit profundo) — segunda pasada sobre los xlsx AgroApp.
 * Las cosas que la primera extracción no miró:
 *
 *  1) Ganado Actual:
 *     - valores distintos de `Origen` (¿match con proveedores clasificados?)
 *     - cuántos animales tienen Diio Madre / Padre / Abuelo
 *  2) Ventas:
 *     - comprador oculto en Observaciones (no hay columna Cliente)
 *     - peso unitario promedio = Peso(kg) / Animales pesados
 *     - precio_clp / $ dentro de Observaciones
 *  3) Tratamientos:
 *     - top diagnósticos, vías, resguardos
 *  4) Bajas:
 *     - top motivos + detalles
 *  5) Pesajes.Observaciones:
 *     - menciones de corral/galpón/lote
 *  6) Inventarios / Traslados multi-línea:
 *     - parsear desgloses "Novillo: 95\nTernera: 486"
 *  7) Cross-ref: DIIOs que viven en Observaciones de un módulo y no son fila propia
 *
 * Read-only. Output: stdout + archivo docs/export_agroapp/extract/AUDIT.md
 */

import ExcelJS from "exceljs";
import path from "path";
import { readdirSync, writeFileSync } from "fs";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");
const OUT = path.join(XLSX_DIR, "extract", "AUDIT.md");

type Counter = Map<string, number>;
function bump(c: Counter, k: string) {
  if (!k) return;
  c.set(k, (c.get(k) ?? 0) + 1);
}
function topN(c: Counter, n = 20): [string, number][] {
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function openWs(file: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(XLSX_DIR, file));
  return wb.worksheets[0];
}

function colIdx(ws: ExcelJS.Worksheet, name: string): number {
  let idx = -1;
  ws.getRow(1).eachCell({ includeEmpty: false }, (cell, i) => {
    if (String(cell.value ?? "").trim().toLowerCase() === name.toLowerCase()) idx = i;
  });
  return idx;
}

function str(v: ExcelJS.CellValue): string {
  if (v == null) return "";
  if (typeof v === "object" && "richText" in v) {
    return (v.richText as { text: string }[]).map((t) => t.text).join("");
  }
  return String(v);
}

function num(v: ExcelJS.CellValue): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const out: string[] = [];
function log(s = "") {
  console.log(s);
  out.push(s);
}

async function auditGanadoActual() {
  const ws = await openWs("GanadoActual_18-04-2026.xlsx");
  const ciOrigen = colIdx(ws, "Origen");
  const ciMadre = colIdx(ws, "Diio Madre");
  const ciPadre = colIdx(ws, "Padre");
  const ciAbuelo = colIdx(ws, "Abuelo");
  const ciRaza = colIdx(ws, "Raza");
  const ciPartos = colIdx(ws, "Partos");

  const origenes: Counter = new Map();
  const razas: Counter = new Map();
  let withMadre = 0, withPadre = 0, withAbuelo = 0, withPartos = 0;
  let total = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    total++;
    const o = str(ws.getRow(r).getCell(ciOrigen).value).trim();
    if (o) bump(origenes, o);
    const raza = str(ws.getRow(r).getCell(ciRaza).value).trim();
    if (raza) bump(razas, raza);
    if (str(ws.getRow(r).getCell(ciMadre).value).trim()) withMadre++;
    if (str(ws.getRow(r).getCell(ciPadre).value).trim()) withPadre++;
    if (str(ws.getRow(r).getCell(ciAbuelo).value).trim()) withAbuelo++;
    if (num(ws.getRow(r).getCell(ciPartos).value)) withPartos++;
  }

  log(`## Ganado Actual (${total} animales)`);
  log();
  log(`**Genealogía completada:**`);
  log(`- Diio Madre   → ${withMadre} animales (${((withMadre / total) * 100).toFixed(1)}%)`);
  log(`- Padre        → ${withPadre} animales (${((withPadre / total) * 100).toFixed(1)}%)`);
  log(`- Abuelo       → ${withAbuelo} animales (${((withAbuelo / total) * 100).toFixed(1)}%)`);
  log(`- Partos>0     → ${withPartos} hembras`);
  log();
  log(`**Origen (${origenes.size} valores distintos — top 25):**`);
  log();
  log("| origen | animales |");
  log("|--------|---------:|");
  for (const [k, n] of topN(origenes, 25)) {
    log(`| ${k} | ${n} |`);
  }
  log();
  log(`**Razas (${razas.size} valores distintos):**`);
  log();
  for (const [k, n] of topN(razas, 15)) {
    log(`- ${k}: ${n}`);
  }
  log();
  log("---");
  log();
}

async function auditVentas() {
  const ws = await openWs("Ventas_Historial_18-04-2026_1.xlsx");
  const ciFundo = colIdx(ws, "Fundo");
  const ciAnimales = colIdx(ws, "Animales");
  const ciAnimalesPesados = colIdx(ws, "Animales pesados");
  const ciPeso = colIdx(ws, "Peso (kg)");
  const ciObs = colIdx(ws, "Observaciones");
  const ciTipo = colIdx(ws, "Tipo ganado");

  let total = 0, withPeso = 0, totalAnim = 0, totalKg = 0;
  const fundos: Counter = new Map();
  const compradores: Counter = new Map();
  const preciosClp: Counter = new Map();
  const monedas: Counter = new Map();
  const precioPorKg: number[] = [];

  const RX_COMPRADOR = [
    /frigor[ií]fico\s+\w+/gi,
    /mafrisur/gi,
    /pampa\s+chile/gi,
    /tattersal\w*\s*\w*/gi,
    /mollendo/gi,
    /feria\s+\w+/gi,
  ];
  const RX_PRECIO_CLP = /\$\s*\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?/g;
  const RX_PRECIO_KG = /(\d{2,5})\s*\$?\s*(?:\/kg|por\s*kg|x\s*kg)/gi;
  const RX_USD = /\b(?:us\$|usd|u\$s)\s*\d[\d.,]*/gi;

  for (let r = 2; r <= ws.rowCount; r++) {
    total++;
    const row = ws.getRow(r);
    const f = str(row.getCell(ciFundo).value).trim();
    if (f) bump(fundos, f);
    const anim = num(row.getCell(ciAnimales).value) ?? 0;
    const pesoT = num(row.getCell(ciPeso).value);
    if (pesoT) {
      withPeso++;
      totalKg += pesoT;
      totalAnim += anim;
    }
    const obs = str(row.getCell(ciObs).value);
    if (!obs) continue;

    for (const rx of RX_COMPRADOR) {
      const m = obs.match(rx);
      if (m) for (const x of m) bump(compradores, x.trim().toLowerCase());
    }
    const pc = obs.match(RX_PRECIO_CLP);
    if (pc) for (const x of pc) bump(preciosClp, x);
    const pk = obs.match(RX_PRECIO_KG);
    if (pk) for (const x of pk) {
      bump(monedas, "precio_por_kg");
      const n = parseInt(x, 10);
      if (n > 100 && n < 10000) precioPorKg.push(n);
    }
    const usd = obs.match(RX_USD);
    if (usd) for (const x of usd) bump(monedas, x);
  }

  log(`## Ventas (${total} operaciones)`);
  log();
  log(`**Agregados:**`);
  log(`- Filas con peso     → ${withPeso} (${((withPeso / total) * 100).toFixed(1)}%)`);
  log(`- Total animales     → ${totalAnim.toLocaleString()}`);
  log(`- Total kg           → ${totalKg.toLocaleString()}`);
  if (totalAnim > 0) log(`- Peso promedio      → ${(totalKg / totalAnim).toFixed(1)} kg/animal`);
  log();
  log(`**Fundos origen de las ventas:**`);
  log();
  for (const [k, n] of topN(fundos, 10)) log(`- ${k}: ${n}`);
  log();
  log(`**Compradores mencionados en Observaciones (top 20):**`);
  log();
  for (const [k, n] of topN(compradores, 20)) log(`- ${k}: ${n}`);
  log();
  log(`**Precios CLP literales en Observaciones (top 20):**`);
  log();
  if (preciosClp.size === 0) log(`- ninguno detectado con regex \`\\$\\d{1,3}(?:[.,]\\d{3})+\``);
  for (const [k, n] of topN(preciosClp, 20)) log(`- ${k}: ${n}`);
  log();
  log(`**Monedas / precio/kg:**`);
  log();
  for (const [k, n] of topN(monedas, 10)) log(`- ${k}: ${n}`);
  if (precioPorKg.length) {
    precioPorKg.sort((a, b) => a - b);
    const min = precioPorKg[0];
    const max = precioPorKg[precioPorKg.length - 1];
    const med = precioPorKg[Math.floor(precioPorKg.length / 2)];
    log(`- rango precio/kg: min=${min} median=${med} max=${max} (n=${precioPorKg.length})`);
  }
  log();
  log("---");
  log();
}

async function auditTratamientos() {
  const ws = await openWs("Tratamientos_Historial_18-04-2026_1.xlsx");
  const ciDiag = colIdx(ws, "Diagnóstico");
  const ciVia = colIdx(ws, "Vía");
  const ciMed = colIdx(ws, "Medicamento-Reg. SAG");
  const ciResLeche = colIdx(ws, "Resguardo leche");
  const ciResCarne = colIdx(ws, "Resguardo carne");

  const diag: Counter = new Map();
  const via: Counter = new Map();
  const med: Counter = new Map();
  const resL: Counter = new Map();
  const resC: Counter = new Map();
  let total = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    total++;
    const row = ws.getRow(r);
    const d = str(row.getCell(ciDiag).value).trim().toLowerCase();
    if (d) bump(diag, d);
    const v = str(row.getCell(ciVia).value).trim();
    if (v) bump(via, v);
    const m = str(row.getCell(ciMed).value).trim();
    if (m) bump(med, m);
    const rl = str(row.getCell(ciResLeche).value).trim();
    if (rl) bump(resL, rl);
    const rc = str(row.getCell(ciResCarne).value).trim();
    if (rc) bump(resC, rc);
  }

  log(`## Tratamientos (${total} filas)`);
  log();
  log(`**Diagnósticos distintos:** ${diag.size}`);
  log();
  log(`Top 30:`);
  for (const [k, n] of topN(diag, 30)) log(`- ${k}: ${n}`);
  log();
  log(`**Medicamentos distintos:** ${med.size} (top 20)`);
  log();
  for (const [k, n] of topN(med, 20)) log(`- ${k}: ${n}`);
  log();
  log(`**Vías (${via.size}):**`);
  log();
  for (const [k, n] of topN(via, 10)) log(`- ${k}: ${n}`);
  log();
  log(`**Resguardo leche (${resL.size}):**`);
  log();
  for (const [k, n] of topN(resL, 10)) log(`- ${k}: ${n}`);
  log();
  log(`**Resguardo carne (${resC.size}):**`);
  log();
  for (const [k, n] of topN(resC, 10)) log(`- ${k}: ${n}`);
  log();
  log("---");
  log();
}

async function auditBajas() {
  const ws = await openWs("Bajas_Historial_18-04-2026.xlsx");
  const ciMot = colIdx(ws, "Motivo");
  const ciDet = colIdx(ws, "Detalle");
  const motivos: Counter = new Map();
  const detalles: Counter = new Map();
  let total = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    total++;
    const m = str(ws.getRow(r).getCell(ciMot).value).trim();
    const d = str(ws.getRow(r).getCell(ciDet).value).trim().toLowerCase();
    if (m) bump(motivos, m);
    if (d) bump(detalles, d);
  }
  log(`## Bajas (${total} filas)`);
  log();
  log(`**Motivo (${motivos.size}):**`);
  log();
  for (const [k, n] of topN(motivos, 10)) log(`- ${k}: ${n}`);
  log();
  log(`**Detalle (${detalles.size} — top 30):**`);
  log();
  for (const [k, n] of topN(detalles, 30)) log(`- ${k}: ${n}`);
  log();
  log("---");
  log();
}

async function auditPesajesCorrales() {
  const ws = await openWs("Pesajes_Historial_18-04-2026_1.xlsx");
  const ciObs = colIdx(ws, "Observaciones");
  const kw: Counter = new Map();
  const samples: string[] = [];
  const RX_CORRAL = /\b(corral|galp[óo]n|lote|potrero|pasillo|manga|pista|patio)\s*[:\-#]?\s*\w*/gi;
  let total = 0, withKw = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    const obs = str(ws.getRow(r).getCell(ciObs).value).trim();
    if (!obs) continue;
    total++;
    const m = obs.match(RX_CORRAL);
    if (m) {
      withKw++;
      for (const x of m) bump(kw, x.toLowerCase().trim());
      if (samples.length < 20) samples.push(obs.slice(0, 120));
    }
  }
  log(`## Pesajes.Observaciones — menciones corral/galpón/lote`);
  log();
  log(`- filas con obs: ${total.toLocaleString()}`);
  log(`- con keyword estructural: ${withKw.toLocaleString()} (${((withKw / total) * 100).toFixed(1)}%)`);
  log();
  log(`**Términos distintos (${kw.size} — top 30):**`);
  log();
  for (const [k, n] of topN(kw, 30)) log(`- \`${k}\`: ${n}`);
  log();
  log(`**Samples:**`);
  log();
  for (const s of samples) log(`- ${s}`);
  log();
  log("---");
  log();
}

async function auditInventariosDesgloseTG() {
  const ws = await openWs("Inventarios_Historial_18-04-2026.xlsx");
  const ciFundo = colIdx(ws, "Fundo");
  const ciEnc = colIdx(ws, "Encontrados");
  const ciFal = colIdx(ws, "Faltantes");
  const ciTGEnc = colIdx(ws, "T.G. Encontrados");
  const ciTGFal = colIdx(ws, "T.G. Faltantes");

  log(`## Inventarios (desglose tipo ganado multi-línea)`);
  log();
  log("| Fundo | Encontrados | Faltantes | Desglose faltantes |");
  log("|-------|------------:|----------:|--------------------|");
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const f = str(row.getCell(ciFundo).value).trim();
    const e = num(row.getCell(ciEnc).value) ?? 0;
    const fa = num(row.getCell(ciFal).value) ?? 0;
    const desg = str(row.getCell(ciTGFal).value).replace(/\n/g, " · ").trim();
    log(`| ${f} | ${e} | ${fa} | ${desg || "—"} |`);
  }
  log();
  log("---");
  log();
}

async function auditCrossRefDiios() {
  // DIIOs en Ganado Actual vs DIIOs mencionados en Observaciones de otros módulos
  const wsGA = await openWs("GanadoActual_18-04-2026.xlsx");
  const ciDiioGA = colIdx(wsGA, "Diio");
  const setGA = new Set<string>();
  for (let r = 2; r <= wsGA.rowCount; r++) {
    const d = str(wsGA.getRow(r).getCell(ciDiioGA).value).trim();
    if (d) setGA.add(d);
  }

  const diosFantasma: Counter = new Map();
  const RX_DIIO = /\b\d{7,9}\b/g;

  async function scan(file: string) {
    const ws = await openWs(file);
    const ciObs = colIdx(ws, "Observaciones");
    if (ciObs < 0) return 0;
    let hit = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const obs = str(ws.getRow(r).getCell(ciObs).value);
      if (!obs) continue;
      const m = obs.match(RX_DIIO);
      if (!m) continue;
      for (const d of m) {
        if (!setGA.has(d)) {
          bump(diosFantasma, d);
          hit++;
        }
      }
    }
    return hit;
  }

  const files = readdirSync(XLSX_DIR).filter((f) => f.endsWith(".xlsx")).sort();
  let totalHits = 0;
  for (const f of files) totalHits += await scan(f);

  log(`## Cross-ref DIIOs fantasma`);
  log();
  log(`- DIIOs distintos en Ganado Actual vivo: ${setGA.size.toLocaleString()}`);
  log(`- Menciones de DIIO en Observaciones que NO están en Ganado Actual: ${totalHits.toLocaleString()}`);
  log(`- DIIOs fantasma distintos: ${diosFantasma.size.toLocaleString()}`);
  log();
  log(`Top 20 más mencionados:`);
  log();
  for (const [k, n] of topN(diosFantasma, 20)) log(`- ${k}: ${n} menciones`);
  log();
  log(`> Nota: pueden ser animales vendidos/dados de baja, o DIIOs con tipeo. Revisar con Cesar cuáles son reales.`);
  log();
  log("---");
  log();
}

async function main() {
  log(`# Audit profundo AgroApp — 2026-04-22`);
  log();
  log(`AUT-296 audit. Segunda pasada: columnas no-Observaciones y correlaciones cruzadas.`);
  log();
  log("---");
  log();

  await auditGanadoActual();
  await auditVentas();
  await auditTratamientos();
  await auditBajas();
  await auditPesajesCorrales();
  await auditInventariosDesgloseTG();
  await auditCrossRefDiios();

  writeFileSync(OUT, out.join("\n"));
  console.log(`\n[out] ${OUT}`);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
