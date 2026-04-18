/**
 * download-agroapp.ts — Descarga todos los Excels de AgroApp via API directa.
 *
 * Uso:
 *   npx tsx src/etl/download-agroapp.ts [--out docs/export_agroapp]
 *
 * Descarga en orden: GanadoActual, Bajas, Inseminaciones, Tratamientos, Partos, Pesajes
 * Cada export genera una URL temporal en /ExcelWeb/ que se descarga inmediatamente.
 */
import { writeFile } from "fs/promises";
import { join } from "path";

const BASE = "http://agroapp.cl:8080/AgroAppWebV18";
const EXCEL_BASE = "http://agroapp.cl:8080/ExcelWeb";
const USER = process.env.AGROAPP_USER ?? "jferrada";
const PASS = process.env.AGROAPP_PASSWORD ?? "";
const OUT_DIR = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "docs/export_agroapp";

const TODAY = new Date().toISOString().slice(0, 10);
const DESDE = "2000-01-01";

type ModuloConfig = {
  nombre: string;
  servlet: string;
  service: string;
  filtros: Record<string, unknown>;
  outFile: string;
};

const MODULOS: ModuloConfig[] = [
  {
    nombre: "GanadoActual",
    servlet: "GanadoActual",
    service: "generarExcel",
    filtros: {
      tipo_ganado: "Todos",
      raza_id: 0,
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      desecho: "Todos",
      observaciones: "Todos",
      fundos: [169, 193, 194, 110, 395, 366, 396, 416, 53],
      fecha: TODAY,
      order: "Ascendente",
      tipo_order: "Diio",
      cbInventario: false,
      cbFechaNacimiento: true,
      cbTipoGanado: true,
      cbRaza: true,
      cbFundo: true,
      cbEstadoReproductivo: true,
      cbEstadoLeche: true,
      cbDesecho: false,
      cbObservaciones: true,
      cbDiasGestacion: false,
      cbProximoParto: false,
      cbUltimoParto: false,
      cbPartos: true,
      cbUltimaEcografia: false,
      cbUltimaInseminacion: false,
      cbUltimoInseminador: false,
      cbToro: false,
      cbTotalIA: false,
      cbDiasEnLeche: false,
      cbUltimoSecado: false,
      cbDiasSeca: false,
      cbDiioMadre: true,
      cbPadre: true,
      cbAbuelo: true,
      cbOrigen: true,
      cbFechaCreado: true,
      cbUltimoControlLeche: false,
      cbUltimoLitros: false,
      cbUltimoRCS: false,
      cbUltimoGrasa: false,
      cbUltimoProteina: false,
      cbUltimoUrea: false,
      cbPromedioLitros: false,
      cbPromedioRCS: false,
      cbPromedioGrasa: false,
      cbPromedioProteina: false,
      cbPromedioUrea: false,
      cbPesaje: false,
    },
    outFile: `GanadoActual_${TODAY}.xlsx`,
  },
  {
    nombre: "Bajas",
    servlet: "Baja",
    service: "generarExcelHistorial",
    filtros: {
      fundo_id: 0,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      baja_motivo_org_id: 0,
      baja_causa_org_id: 0,
      usuario_id: 0,
      order: "Ascendente",
      tipo_order: "Fecha baja",
      desde: DESDE,
      hasta: TODAY,
    },
    outFile: `Bajas_Historial_${TODAY}.xlsx`,
  },
  {
    nombre: "Inseminaciones",
    servlet: "Inseminacion",
    service: "generarExcelHistorial",
    filtros: {
      fundo_id: 0,
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      estado_leche: "Todos",
      inseminacion_semen_id: 0,
      inseminacion_inseminador_id: 0,
      desecho: "Todos",
      toro_id: 0,
      usuario_id: 0,
      order: "Ascendente",
      tipo_order: "Fecha creado",
      desde: DESDE,
      hasta: TODAY,
    },
    outFile: `Inseminaciones_Historial_${TODAY}.xlsx`,
  },
  {
    nombre: "Tratamientos",
    servlet: "Tratamiento",
    service: "generarExcelHistorial",
    filtros: {
      fundo_id: 0,
      tipo_ganado: "Todos",
      tratamiento_diagnostico_id: 0,
      medicamento_id: 0,
      medicamento_serie_id: 0,
      descripcion: "Todos",
      groupById: true,
      usuario_id: 0,
      order: "Ascendente",
      tipo_order: "Fecha creado",
      desde: DESDE,
      hasta: TODAY,
    },
    outFile: `Tratamientos_Historial_${TODAY}.xlsx`,
  },
  {
    nombre: "Partos",
    servlet: "Parto",
    service: "generarExcelHistorial",
    filtros: {
      fundo_id: 0,
      tipo_ganado: "Todos",
      estado: "Todos",
      sexo: "Todos",
      partos: 0,
      tipo_parto_id: 0,
      subtipo_parto_id: 0,
      usuario_id: 0,
      order: "Ascendente",
      tipo_order: "Fecha creado",
      desde: DESDE,
      hasta: TODAY,
    },
    outFile: `Partos_Historial_${TODAY}.xlsx`,
  },
  {
    nombre: "Pesajes",
    servlet: "Pesaje2",
    service: "generarExcelHistorial",
    filtros: {
      tipo_ganado: "Todos",
      estado_reproductivo: "Todos",
      fundo_id: 0,
      descripcion: "Todos",
      usuario_id: 0,
      order: "Ascendente",
      tipo_order: "Fecha creado",
      desde: DESDE,
      hasta: TODAY,
    },
    outFile: `Pesajes_Historial_${TODAY}.xlsx`,
  },
];

async function downloadModulo(m: ModuloConfig): Promise<string> {
  const params = new URLSearchParams({
    usuario: USER,
    clave: PASS,
    service: m.service,
    jsonFiltros: JSON.stringify(m.filtros),
  });
  const url = `${BASE}/${m.servlet}?${params.toString()}`;

  console.log(`[${m.nombre}] Solicitando export...`);
  const t0 = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${m.servlet}`);

  const body = (await res.json()) as { status_code: number; ruta_dl?: string; message?: string };
  if (body.status_code !== 200 || !body.ruta_dl) {
    throw new Error(`AgroApp error en ${m.nombre}: ${body.message ?? JSON.stringify(body)}`);
  }

  const fileName = body.ruta_dl.split("/").pop()!;
  const excelUrl = `${EXCEL_BASE}/${fileName}`;
  const excelRes = await fetch(excelUrl);
  if (!excelRes.ok) throw new Error(`HTTP ${excelRes.status} descargando ${fileName}`);

  const buf = await excelRes.arrayBuffer();
  const outPath = join(OUT_DIR, m.outFile);
  await writeFile(outPath, Buffer.from(buf));

  const kb = Math.round(buf.byteLength / 1024);
  console.log(`[${m.nombre}] ✓ ${m.outFile} — ${kb} KB (${Date.now() - t0}ms)`);
  return outPath;
}

async function main() {
  if (!PASS) {
    console.error("AGROAPP_PASSWORD no configurada");
    process.exit(1);
  }

  console.log(`Descargando ${MODULOS.length} módulos → ${OUT_DIR}/\n`);

  for (const m of MODULOS) {
    try {
      await downloadModulo(m);
    } catch (err) {
      console.error(`[${m.nombre}] ERROR:`, (err as Error).message);
    }
  }

  console.log("\nDone. Siguiente paso:");
  console.log("  npx tsx src/etl/import-agroapp-excel.ts ganado " + `docs/export_agroapp/GanadoActual_${TODAY}.xlsx`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
