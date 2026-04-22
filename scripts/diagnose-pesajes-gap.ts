/**
 * scripts/diagnose-pesajes-gap.ts
 *
 * AUT-297 (W2) — Diagnóstico del gap de pesajes.
 * Pregunta: ¿por qué sólo 10.545 de 173.519 pesajes en DB?
 *
 * Hipótesis a validar:
 *  H1: los DIIOs del xlsx no están en `animales` (FK falla silenciosamente)
 *  H2: `Fecha creado` es null en muchas filas
 *  H3: `Peso` null
 *  H4: duplicados idempotentes (onConflictDoNothing con clave implícita)
 *
 * Read-only. Output: stdout con counts + samples.
 * Usa sólo los xlsx de AgroApp — no toca DB.
 */
import ExcelJS from "exceljs";
import path from "path";

const XLSX_DIR = path.resolve(process.cwd(), "docs/export_agroapp");

async function rowsOf(file: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(XLSX_DIR, file));
  const ws = wb.worksheets[0];
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: false }, (c) => headers.push(String(c.value ?? "").trim()));

  const rows: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj: Record<string, unknown> = {};
    for (let c = 1; c <= headers.length; c++) {
      obj[headers[c - 1]] = row.getCell(c).value;
    }
    rows.push(obj);
  }
  return { headers, rows };
}

function normDiio(v: unknown): string {
  return String(v ?? "").replace(/\.0$/, "").trim();
}

async function main() {
  console.log(`━━━ DIAGNÓSTICO PESAJES GAP ━━━\n`);

  // 1) Cargar DIIOs vivos (GanadoActual) y de bajas
  const ga = await rowsOf("GanadoActual_18-04-2026.xlsx");
  const bj = await rowsOf("Bajas_Historial_18-04-2026.xlsx");
  const vn = await rowsOf("Ventas_Historial_18-04-2026_1.xlsx");

  const diosVivos = new Set<string>();
  for (const r of ga.rows) {
    const d = normDiio(r["Diio"]);
    if (d) diosVivos.add(d);
  }
  const diosBaja = new Set<string>();
  for (const r of bj.rows) {
    const d = normDiio(r["Diio"]);
    if (d) diosBaja.add(d);
  }

  console.log(`DIIOs ganado actual (vivos): ${diosVivos.size.toLocaleString()}`);
  console.log(`DIIOs bajas:                  ${diosBaja.size.toLocaleString()}`);
  console.log(`Intersección bajas∩vivos:     ${[...diosBaja].filter(d => diosVivos.has(d)).length.toLocaleString()}`);
  console.log(`Ventas xlsx filas:            ${vn.rows.length.toLocaleString()} (sin DIIO por-fila, son lotes)`);
  console.log();

  const diosRegistrados = new Set<string>([...diosVivos, ...diosBaja]);
  console.log(`DIIOs registrados totales (vivos ∪ bajas): ${diosRegistrados.size.toLocaleString()}`);
  console.log();

  // 2) Procesar Pesajes_Historial
  console.log(`Leyendo Pesajes_Historial_18-04-2026_1.xlsx ...`);
  const ps = await rowsOf("Pesajes_Historial_18-04-2026_1.xlsx");
  console.log(`Filas: ${ps.rows.length.toLocaleString()}`);
  console.log(`Columnas: ${ps.headers.join(", ")}`);
  console.log();

  let noDiio = 0,
    noFecha = 0,
    noPeso = 0,
    sinAnimalRegistrado = 0,
    obsPesajeDesdeVenta = 0;

  const diosPesajes = new Set<string>();
  const diosPesajesSinRegistro = new Set<string>();
  const fundosPesajes = new Map<string, number>();
  const sampleSinRegistro: string[] = [];

  for (const r of ps.rows) {
    const d = normDiio(r["Diio"]);
    if (!d) { noDiio++; continue; }
    diosPesajes.add(d);

    const fecha = r["Fecha creado"];
    if (!fecha) noFecha++;
    if (r["Peso"] == null || r["Peso"] === "") noPeso++;

    const fundo = String(r["Fundo"] ?? "").trim();
    if (fundo) fundosPesajes.set(fundo, (fundosPesajes.get(fundo) ?? 0) + 1);

    const obs = String(r["Observaciones"] ?? "");
    if (/pesaje\s*desde\s*venta/i.test(obs)) obsPesajeDesdeVenta++;

    if (!diosRegistrados.has(d)) {
      sinAnimalRegistrado++;
      diosPesajesSinRegistro.add(d);
      if (sampleSinRegistro.length < 10) {
        sampleSinRegistro.push(`diio=${d} fundo=${fundo} fecha=${fecha} peso=${r["Peso"]}`);
      }
    }
  }

  console.log(`━━━ ANÁLISIS ━━━`);
  console.log(`DIIOs únicos en Pesajes:        ${diosPesajes.size.toLocaleString()}`);
  console.log(`DIIOs en Pesajes sin registro:  ${diosPesajesSinRegistro.size.toLocaleString()}  (${((diosPesajesSinRegistro.size / diosPesajes.size) * 100).toFixed(1)}%)`);
  console.log();
  console.log(`━━━ CAUSAS DE SKIP EN ETL ACTUAL ━━━`);
  console.log(`Sin DIIO:                       ${noDiio.toLocaleString()}`);
  console.log(`Sin fecha:                      ${noFecha.toLocaleString()}`);
  console.log(`Sin peso:                       ${noPeso.toLocaleString()}`);
  console.log(`DIIO no-registrado (noAnimal):  ${sinAnimalRegistrado.toLocaleString()}  ← principal sospecha`);
  console.log();
  console.log(`DIIOs registrados usables:      ${ps.rows.length - sinAnimalRegistrado - noDiio - noFecha - noPeso} (estimado superior)`);
  console.log();
  console.log(`━━━ MARCADORES OBS ━━━`);
  console.log(`"PESAJE DESDE VENTA":           ${obsPesajeDesdeVenta.toLocaleString()}  (${((obsPesajeDesdeVenta / ps.rows.length) * 100).toFixed(2)}%)`);
  console.log();

  console.log(`━━━ FUNDOS MÁS FRECUENTES EN PESAJES ━━━`);
  const fundosTop = [...fundosPesajes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  for (const [f, n] of fundosTop) {
    console.log(`  ${String(n).padStart(7)}  ${f}`);
  }
  console.log();

  console.log(`━━━ SAMPLES SIN REGISTRO ━━━`);
  for (const s of sampleSinRegistro) console.log(`  ${s}`);
  console.log();

  // 3) Revisar si los DIIOs sin registro pueden estar en ventas detalle (DB agroapp API)
  // Como no podemos consultar prod, estimamos: los DIIOs sin registro que no están en Bajas
  // probablemente son animales vendidos (en `ventas_detalle` vía API) que no están en xlsx.
  console.log(`━━━ HIPÓTESIS FINAL ━━━`);
  const ratio = ((sinAnimalRegistrado / ps.rows.length) * 100).toFixed(1);
  console.log(`~${ratio}% de filas en Pesajes corresponden a DIIOs que no están`);
  console.log(`en GanadoActual ni en Bajas. Son animales ya vendidos.`);
  console.log();
  console.log(`Solución: importar animales desde ventas_detalle antes de pesajes,`);
  console.log(`o crear animales on-demand durante importPesajes con estado=baja.`);
}

main().catch((err) => {
  console.error("[error]", err);
  process.exit(1);
});
