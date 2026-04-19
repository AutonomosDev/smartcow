/**
 * claude.ts — Declaración de CATTLE_TOOLS del chat ganadero en formato Google AI SDK
 * (@google/genai — FunctionDeclaration, Type).
 * Ticket: AUT-176
 *
 * Runtime: OpenRouter (modelo google/gemma-4-31b-it) — ver app/api/chat/route.ts.
 * Conversión a formato OpenAI function calling por toOpenAITools() en route.ts.
 *
 * Tools de lectura (9):
 *   query_animales              — Lista animales de un predio con filtros
 *   query_pesajes               — Historial de pesajes de un animal o predio
 *   query_partos                — Historial de partos en un rango de fechas
 *   query_indices_reproductivos — Resumen reproductivo del predio
 *   query_toros                 — Lista toros disponibles para inseminación
 *   query_historial_animal      — Historial completo de un animal por EID/DIIO
 *   query_feedlot               — Datos de engorda y feedlot del predio
 *
 * Tools de escritura (2):
 *   registrar_pesaje            — Registra un nuevo pesaje (escritura)
 *   registrar_parto             — Registra un nuevo parto (escritura)
 *
 * Reglas:
 *   - No PII en logs
 *   - No exponer datos de otros predios (predioId siempre validado upstream)
 *   - Tool calls de escritura requieren rol >= operador (validado en route)
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import { db } from "@/src/db/client";
import {
  animales,
  pesajes,
  partos,
  tipoGanado,
  razas,
  estadoReproductivo,
  inseminaciones,
  semen,
  tratamientos,
  traslados,
  ventas,
} from "@/src/db/schema/index";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import type { SmartCowSession } from "./auth";
import type { PredioKpis } from "@/src/lib/queries/predio";

// ─────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────

export interface FiltrosAnimales {
  tipo_ganado?: string;
  estado_reproductivo?: string;
  estado?: "activo" | "baja" | "desecho";
  limite?: number;
}

export interface FiltrosPesajes {
  animal_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  limite?: number;
}

export interface FiltrosPartos {
  fecha_inicio?: string;
  fecha_fin?: string;
  limite?: number;
}

export interface DatosRegistrarPesaje {
  eid: string;
  peso_kg: number;
  fecha?: string;
}

export interface DatosRegistrarParto {
  madre_eid: string;
  resultado: "vivo" | "muerto" | "aborto" | "gemelar";
  fecha?: string;
  observaciones?: string;
}

// ─────────────────────────────────────────────
// TOOL DEFINITIONS (Google AI FunctionDeclaration format)
// ─────────────────────────────────────────────

export const CATTLE_TOOLS: FunctionDeclaration[] = [
  {
    name: "query_animales",
    description:
      "Consulta la lista de animales activos en el predio. Permite filtrar por tipo de ganado, estado reproductivo y estado del animal. Retorna hasta 50 animales por defecto.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        filtros: {
          type: Type.OBJECT,
          description: "Filtros opcionales para acotar resultados",
          properties: {
            tipo_ganado: { type: Type.STRING, description: "Tipo de ganado (ej: vaca, novilla, ternero)" },
            estado_reproductivo: { type: Type.STRING, description: "Estado reproductivo (ej: preñada, vacía, inseminada)" },
            estado: { type: Type.STRING, description: "Estado del animal: activo, baja o desecho" },
            limite: { type: Type.NUMBER, description: "Máximo de resultados (default 50, max 200)" },
          },
        },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_pesajes",
    description:
      "Consulta el historial de pesajes de un predio o de un animal específico. Permite filtrar por rango de fechas.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        animal_id: { type: Type.NUMBER, description: "ID del animal (opcional — si se omite, retorna todos los pesajes del predio)" },
        rango_fechas: {
          type: Type.OBJECT,
          properties: {
            inicio: { type: Type.STRING, description: "Fecha inicio YYYY-MM-DD" },
            fin: { type: Type.STRING, description: "Fecha fin YYYY-MM-DD" },
          },
        },
        limite: { type: Type.NUMBER, description: "Máximo de resultados (default 100)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_partos",
    description: "Consulta el historial de partos en el predio dentro de un rango de fechas.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        rango_fechas: {
          type: Type.OBJECT,
          properties: {
            inicio: { type: Type.STRING, description: "Fecha inicio YYYY-MM-DD" },
            fin: { type: Type.STRING, description: "Fecha fin YYYY-MM-DD" },
          },
        },
        limite: { type: Type.NUMBER, description: "Máximo de resultados (default 50)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_indices_reproductivos",
    description:
      "Calcula y retorna los índices reproductivos del predio: total animales, total partos últimos 12 meses, tasa de concepción estimada, animales preñadas, vacías e inseminadas.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "registrar_pesaje",
    description:
      "Registra un nuevo pesaje para un animal identificado por su EID (tag electrónico). Requiere rol operador o superior.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        eid: { type: Type.STRING, description: "EID / tag electrónico del animal" },
        peso_kg: { type: Type.NUMBER, description: "Peso en kilogramos" },
        fecha: { type: Type.STRING, description: "Fecha del pesaje YYYY-MM-DD (default: hoy)" },
      },
      required: ["predio_id", "eid", "peso_kg"],
    },
  },
  {
    name: "query_toros",
    description:
      "Analiza el rendimiento de toros usados en inseminación artificial. Retorna ranking por número de inseminaciones, tasa de concepción, crías vendidas y peso promedio de venta. Permite comparar toros o filtrar por nombre.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        toro_nombre: { type: Type.STRING, description: "Nombre del toro para filtrar (opcional — si se omite, retorna ranking de todos los toros)" },
        rango_fechas: {
          type: Type.OBJECT,
          description: "Rango de fechas para las inseminaciones (opcional)",
          properties: {
            inicio: { type: Type.STRING, description: "Fecha inicio YYYY-MM-DD" },
            fin: { type: Type.STRING, description: "Fecha fin YYYY-MM-DD" },
          },
        },
        limite: { type: Type.NUMBER, description: "Máximo de toros en el ranking (default 20)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_historial_animal",
    description:
      "Retorna el historial completo de un animal: inseminaciones (con toro), tratamientos (con medicamentos, hora y diagnóstico), traslados entre fundos, y genealogía (padre, abuelo, madre). Usar cuando el usuario pregunta por un animal específico.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        diio: { type: Type.STRING, description: "DIIO del animal (número de arete visual)" },
        animal_id: { type: Type.NUMBER, description: "ID interno del animal (alternativo al DIIO)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_feedlot",
    description:
      "Calcula métricas de feedlot: días en engorde por animal (desde traslado de entrada hasta venta), ganancia diaria de peso (ADG) y ranking de animales por rendimiento. Usar para preguntas sobre eficiencia de engorde.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        rango_fechas: {
          type: Type.OBJECT,
          description: "Rango de fechas de ventas (opcional)",
          properties: {
            inicio: { type: Type.STRING, description: "Fecha inicio YYYY-MM-DD" },
            fin: { type: Type.STRING, description: "Fecha fin YYYY-MM-DD" },
          },
        },
        limite: { type: Type.NUMBER, description: "Máximo de animales en el ranking (default 50)" },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "registrar_parto",
    description:
      "Registra un nuevo parto para una madre identificada por su EID. Requiere rol operador o superior.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        predio_id: { type: Type.NUMBER, description: "ID del predio (obligatorio)" },
        madre_eid: { type: Type.STRING, description: "EID / tag electrónico de la madre" },
        resultado: { type: Type.STRING, description: "Resultado del parto: vivo, muerto, aborto o gemelar" },
        fecha: { type: Type.STRING, description: "Fecha del parto YYYY-MM-DD (default: hoy)" },
        observaciones: { type: Type.STRING, description: "Observaciones adicionales (opcional)" },
      },
      required: ["predio_id", "madre_eid", "resultado"],
    },
  },
];

// ─────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────

/**
 * Ejecuta el tool_use solicitado por el modelo.
 * prediosPermitidos: lista de predio_ids a los que el usuario tiene acceso.
 * userId: para registrar autoría en escrituras.
 */
export async function ejecutarTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  prediosPermitidos: number[],
  userId: number,
  rolRank: number
): Promise<unknown> {
  const predioId = Number(toolInput["predio_id"]);

  if (prediosPermitidos.length > 0 && !prediosPermitidos.includes(predioId)) {
    return { error: "Sin acceso a este predio", code: "FORBIDDEN" };
  }

  switch (toolName) {
    case "query_animales":
      return queryAnimales(predioId, toolInput["filtros"] as FiltrosAnimales | undefined);

    case "query_pesajes":
      return queryPesajes(predioId, {
        animal_id: toolInput["animal_id"] as number | undefined,
        fecha_inicio: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.inicio,
        fecha_fin: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.fin,
        limite: toolInput["limite"] as number | undefined,
      });

    case "query_partos":
      return queryPartos(predioId, {
        fecha_inicio: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.inicio,
        fecha_fin: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.fin,
        limite: toolInput["limite"] as number | undefined,
      });

    case "query_indices_reproductivos":
      return queryIndicesReproductivos(predioId);

    case "query_toros":
      return queryToros(predioId, {
        toro_nombre: toolInput["toro_nombre"] as string | undefined,
        fecha_inicio: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.inicio,
        fecha_fin: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.fin,
        limite: toolInput["limite"] as number | undefined,
      });

    case "query_historial_animal":
      return queryHistorialAnimal(predioId, {
        diio: toolInput["diio"] as string | undefined,
        animal_id: toolInput["animal_id"] as number | undefined,
      });

    case "query_feedlot":
      return queryFeedlot(predioId, {
        fecha_inicio: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.inicio,
        fecha_fin: (toolInput["rango_fechas"] as Record<string, string> | undefined)?.fin,
        limite: toolInput["limite"] as number | undefined,
      });

    case "registrar_pesaje": {
      if (rolRank < 1) {
        return { error: "Se requiere rol operador o superior para registrar pesajes", code: "FORBIDDEN" };
      }
      return registrarPesaje(
        predioId,
        {
          eid: String(toolInput["eid"]),
          peso_kg: Number(toolInput["peso_kg"]),
          fecha: toolInput["fecha"] as string | undefined,
        },
        userId
      );
    }

    case "registrar_parto": {
      if (rolRank < 1) {
        return { error: "Se requiere rol operador o superior para registrar partos", code: "FORBIDDEN" };
      }
      return registrarParto(
        predioId,
        {
          madre_eid: String(toolInput["madre_eid"]),
          resultado: toolInput["resultado"] as DatosRegistrarParto["resultado"],
          fecha: toolInput["fecha"] as string | undefined,
          observaciones: toolInput["observaciones"] as string | undefined,
        },
        userId
      );
    }

    default:
      return { error: `Tool desconocido: ${toolName}` };
  }
}

// ─────────────────────────────────────────────
// QUERIES INTERNAS
// ─────────────────────────────────────────────

async function queryAnimales(predioId: number, filtros?: FiltrosAnimales) {
  const limite = Math.min(filtros?.limite ?? 50, 200);

  const rows = await db
    .select({
      id: animales.id,
      diio: animales.diio,
      eid: animales.eid,
      sexo: animales.sexo,
      fechaNacimiento: animales.fechaNacimiento,
      estado: animales.estado,
      desecho: animales.desecho,
      observaciones: animales.observaciones,
      tipoGanado: tipoGanado.nombre,
      raza: razas.nombre,
      estadoReproductivo: estadoReproductivo.nombre,
    })
    .from(animales)
    .leftJoin(tipoGanado, eq(animales.tipoGanadoId, tipoGanado.id))
    .leftJoin(razas, eq(animales.razaId, razas.id))
    .leftJoin(estadoReproductivo, eq(animales.estadoReproductivoId, estadoReproductivo.id))
    .where(
      and(
        eq(animales.predioId, predioId),
        filtros?.estado ? eq(animales.estado, filtros.estado) : undefined,
        filtros?.tipo_ganado ? eq(tipoGanado.nombre, filtros.tipo_ganado) : undefined,
        filtros?.estado_reproductivo
          ? eq(estadoReproductivo.nombre, filtros.estado_reproductivo)
          : undefined
      )
    )
    .limit(limite);

  return { total: rows.length, animales: rows };
}

async function queryPesajes(predioId: number, filtros: FiltrosPesajes) {
  const limite = Math.min(filtros.limite ?? 100, 500);

  const condiciones = [
    eq(pesajes.predioId, predioId),
    filtros.animal_id ? eq(pesajes.animalId, filtros.animal_id) : undefined,
    filtros.fecha_inicio ? gte(pesajes.fecha, filtros.fecha_inicio) : undefined,
    filtros.fecha_fin ? lte(pesajes.fecha, filtros.fecha_fin) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select({
      id: pesajes.id,
      animalId: pesajes.animalId,
      pesoKg: pesajes.pesoKg,
      fecha: pesajes.fecha,
      dispositivo: pesajes.dispositivo,
      creadoEn: pesajes.creadoEn,
    })
    .from(pesajes)
    .where(and(...condiciones))
    .orderBy(desc(pesajes.fecha))
    .limit(limite);

  return { total: rows.length, pesajes: rows };
}

async function queryPartos(predioId: number, filtros: FiltrosPartos) {
  const limite = Math.min(filtros.limite ?? 50, 200);

  const condiciones = [
    eq(partos.predioId, predioId),
    filtros.fecha_inicio ? gte(partos.fecha, filtros.fecha_inicio) : undefined,
    filtros.fecha_fin ? lte(partos.fecha, filtros.fecha_fin) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select({
      id: partos.id,
      madreId: partos.madreId,
      fecha: partos.fecha,
      resultado: partos.resultado,
      criaId: partos.criaId,
      numeroPartos: partos.numeroPartos,
      observaciones: partos.observaciones,
      creadoEn: partos.creadoEn,
    })
    .from(partos)
    .where(and(...condiciones))
    .orderBy(desc(partos.fecha))
    .limit(limite);

  return { total: rows.length, partos: rows };
}

async function queryIndicesReproductivos(predioId: number) {
  const totalAnimalesRows = await db
    .select({ id: animales.id })
    .from(animales)
    .where(and(eq(animales.predioId, predioId), eq(animales.estado, "activo")));

  const totalAnimales = totalAnimalesRows.length;

  const hace12Meses = new Date();
  hace12Meses.setFullYear(hace12Meses.getFullYear() - 1);
  const fechaCorte = hace12Meses.toISOString().split("T")[0];

  const partosRows = await db
    .select({ id: partos.id, resultado: partos.resultado })
    .from(partos)
    .where(and(eq(partos.predioId, predioId), gte(partos.fecha, fechaCorte)));

  const totalPartos = partosRows.length;
  const partosVivos = partosRows.filter((p) => p.resultado === "vivo").length;
  const partosGemelos = partosRows.filter((p) => p.resultado === "gemelar").length;

  const estadosRows = await db
    .select({
      estadoNombre: estadoReproductivo.nombre,
      count: animales.id,
    })
    .from(animales)
    .leftJoin(estadoReproductivo, eq(animales.estadoReproductivoId, estadoReproductivo.id))
    .where(and(eq(animales.predioId, predioId), eq(animales.estado, "activo")));

  const conteoEstados: Record<string, number> = {};
  for (const row of estadosRows) {
    const key = row.estadoNombre ?? "sin_estado";
    conteoEstados[key] = (conteoEstados[key] ?? 0) + 1;
  }

  return {
    predio_id: predioId,
    total_animales_activos: totalAnimales,
    partos_ultimos_12_meses: totalPartos,
    partos_vivos: partosVivos,
    partos_gemelos: partosGemelos,
    tasa_viabilidad_pct: totalPartos > 0 ? Math.round((partosVivos / totalPartos) * 100) : null,
    conteo_por_estado_reproductivo: conteoEstados,
  };
}

async function registrarPesaje(predioId: number, datos: DatosRegistrarPesaje, usuarioId: number) {
  const animalRow = await db
    .select({ id: animales.id, diio: animales.diio })
    .from(animales)
    .where(
      and(
        eq(animales.predioId, predioId),
        eq(animales.eid, datos.eid),
        eq(animales.estado, "activo")
      )
    )
    .limit(1);

  if (!animalRow[0]) {
    return { error: `Animal con EID ${datos.eid} no encontrado en el predio`, code: "NOT_FOUND" };
  }

  const animal = animalRow[0];
  const fecha = datos.fecha ?? new Date().toISOString().split("T")[0];

  const inserted = await db
    .insert(pesajes)
    .values({
      predioId,
      animalId: animal.id,
      pesoKg: String(datos.peso_kg),
      fecha,
      usuarioId,
    })
    .returning({ id: pesajes.id });

  return {
    ok: true,
    pesaje_id: inserted[0]?.id,
    animal_id: animal.id,
    diio: animal.diio,
    peso_kg: datos.peso_kg,
    fecha,
  };
}

async function registrarParto(predioId: number, datos: DatosRegistrarParto, usuarioId: number) {
  const madreRow = await db
    .select({ id: animales.id, diio: animales.diio })
    .from(animales)
    .where(
      and(
        eq(animales.predioId, predioId),
        eq(animales.eid, datos.madre_eid),
        eq(animales.estado, "activo")
      )
    )
    .limit(1);

  if (!madreRow[0]) {
    return {
      error: `Madre con EID ${datos.madre_eid} no encontrada en el predio`,
      code: "NOT_FOUND",
    };
  }

  const madre = madreRow[0];
  const fecha = datos.fecha ?? new Date().toISOString().split("T")[0];

  const inserted = await db
    .insert(partos)
    .values({
      predioId,
      madreId: madre.id,
      fecha,
      resultado: datos.resultado,
      observaciones: datos.observaciones,
      usuarioId,
    })
    .returning({ id: partos.id });

  return {
    ok: true,
    parto_id: inserted[0]?.id,
    madre_id: madre.id,
    diio_madre: madre.diio,
    resultado: datos.resultado,
    fecha,
  };
}

interface FiltrosToros {
  toro_nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  limite?: number;
}

interface FiltrosHistorial {
  diio?: string;
  animal_id?: number;
}

interface FiltrosFeedlot {
  fecha_inicio?: string;
  fecha_fin?: string;
  limite?: number;
}

async function queryToros(predioId: number, filtros: FiltrosToros) {
  const limite = Math.min(filtros.limite ?? 20, 100);

  const condiciones = [
    eq(inseminaciones.predioId, predioId),
    filtros.fecha_inicio ? gte(inseminaciones.fecha, filtros.fecha_inicio) : undefined,
    filtros.fecha_fin ? lte(inseminaciones.fecha, filtros.fecha_fin) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const rows = await db
    .select({
      toro: semen.toro,
      total_inseminaciones: sql<number>`count(*)::int`,
      preñadas: sql<number>`count(*) filter (where ${inseminaciones.resultado} = 'preñada')::int`,
      vacias: sql<number>`count(*) filter (where ${inseminaciones.resultado} = 'vacia')::int`,
      pendientes: sql<number>`count(*) filter (where ${inseminaciones.resultado} = 'pendiente')::int`,
    })
    .from(inseminaciones)
    .innerJoin(semen, eq(inseminaciones.semenId, semen.id))
    .where(
      and(
        ...condiciones,
        filtros.toro_nombre ? sql`lower(${semen.toro}) like ${'%' + filtros.toro_nombre.toLowerCase() + '%'}` : undefined
      )
    )
    .groupBy(semen.toro)
    .orderBy(desc(sql`count(*)`))
    .limit(limite);

  // Calcular tasa de concepción
  const toros = rows.map((r) => ({
    toro: r.toro,
    total_inseminaciones: r.total_inseminaciones,
    preñadas: r.preñadas,
    vacias: r.vacias,
    pendientes: r.pendientes,
    tasa_concepcion_pct:
      r.total_inseminaciones - r.pendientes > 0
        ? Math.round((r.preñadas / (r.total_inseminaciones - r.pendientes)) * 100)
        : null,
  }));

  // Crías vendidas por toro: inseminación → parto → venta
  const ventasPorToro = await db
    .select({
      toro: semen.toro,
      crias_vendidas: sql<number>`count(distinct ${ventas.animalId})::int`,
      peso_promedio_kg: sql<number>`round(avg(${ventas.pesoKg})::numeric, 1)`,
    })
    .from(inseminaciones)
    .innerJoin(semen, eq(inseminaciones.semenId, semen.id))
    .innerJoin(partos, and(eq(partos.madreId, inseminaciones.animalId), eq(partos.predioId, predioId)))
    .innerJoin(ventas, and(eq(ventas.animalId, partos.criaId!), eq(ventas.predioId, predioId)))
    .where(eq(inseminaciones.predioId, predioId))
    .groupBy(semen.toro);

  const ventasMap = new Map(ventasPorToro.map((v) => [v.toro, v]));

  const resultado = toros.map((t) => ({
    ...t,
    crias_vendidas: ventasMap.get(t.toro)?.crias_vendidas ?? 0,
    peso_promedio_venta_kg: ventasMap.get(t.toro)?.peso_promedio_kg ?? null,
  }));

  return { total_toros: resultado.length, toros: resultado };
}

async function queryHistorialAnimal(predioId: number, filtros: FiltrosHistorial) {
  if (!filtros.diio && !filtros.animal_id) {
    return { error: "Se requiere diio o animal_id" };
  }

  const animalRow = await db
    .select({
      id: animales.id,
      diio: animales.diio,
      eid: animales.eid,
      padre: animales.padre,
      abuelo: animales.abuelo,
      diioMadre: animales.diioMadre,
      fechaNacimiento: animales.fechaNacimiento,
      estado: animales.estado,
    })
    .from(animales)
    .where(
      and(
        eq(animales.predioId, predioId),
        filtros.diio ? eq(animales.diio, filtros.diio) : eq(animales.id, filtros.animal_id!)
      )
    )
    .limit(1);

  if (!animalRow[0]) {
    return { error: "Animal no encontrado en este predio" };
  }

  const animal = animalRow[0];

  const [insems, tratos, traslAdos] = await Promise.all([
    db
      .select({
        fecha: inseminaciones.fecha,
        toro: semen.toro,
        resultado: inseminaciones.resultado,
        observaciones: inseminaciones.observaciones,
      })
      .from(inseminaciones)
      .leftJoin(semen, eq(inseminaciones.semenId, semen.id))
      .where(eq(inseminaciones.animalId, animal.id))
      .orderBy(desc(inseminaciones.fecha)),

    db
      .select({
        fecha: tratamientos.fecha,
        hora: tratamientos.horaRegistro,
        diagnostico: tratamientos.diagnostico,
        observaciones: tratamientos.observaciones,
        medicamentos: tratamientos.medicamentos,
      })
      .from(tratamientos)
      .where(eq(tratamientos.animalId, animal.id))
      .orderBy(desc(tratamientos.fecha)),

    db
      .select({
        fecha: traslados.fecha,
        fundoOrigen: traslados.fundoOrigenNombre,
        fundoDestino: traslados.fundoDestinoNombre,
        observacion: traslados.observacion,
      })
      .from(traslados)
      .where(eq(traslados.animalId, animal.id))
      .orderBy(desc(traslados.fecha)),
  ]);

  return {
    animal: {
      id: animal.id,
      diio: animal.diio,
      eid: animal.eid,
      fecha_nacimiento: animal.fechaNacimiento,
      estado: animal.estado,
      genealogia: {
        padre: animal.padre,
        abuelo: animal.abuelo,
        diio_madre: animal.diioMadre,
      },
    },
    inseminaciones: insems,
    tratamientos: tratos,
    traslados: traslAdos,
  };
}

async function queryFeedlot(predioId: number, filtros: FiltrosFeedlot) {
  const limite = Math.min(filtros.limite ?? 50, 200);

  // Animales vendidos desde este predio en el rango de fechas
  const ventasConds = [
    eq(ventas.predioId, predioId),
    filtros.fecha_inicio ? gte(ventas.fecha, filtros.fecha_inicio) : undefined,
    filtros.fecha_fin ? lte(ventas.fecha, filtros.fecha_fin) : undefined,
  ].filter(Boolean) as Parameters<typeof and>;

  const ventasRows = await db
    .select({
      animalId: ventas.animalId,
      fechaVenta: ventas.fecha,
      pesoVentaKg: ventas.pesoKg,
      destino: ventas.destino,
      diio: animales.diio,
    })
    .from(ventas)
    .innerJoin(animales, eq(ventas.animalId, animales.id))
    .where(and(...ventasConds))
    .orderBy(desc(ventas.fecha))
    .limit(limite);

  if (!ventasRows.length) {
    return { total: 0, animales: [], mensaje: "Sin ventas en el período indicado" };
  }

  const animalIds = ventasRows.map((v) => v.animalId);

  // Traslado de entrada al feedlot (primer traslado con predio_destino = predioId)
  const trasladosEntrada = await db
    .select({
      animalId: traslados.animalId,
      fechaEntrada: sql<string>`min(${traslados.fecha})`,
    })
    .from(traslados)
    .where(
      and(
        eq(traslados.predioDestinoId, predioId),
        sql`${traslados.animalId} = any(${sql.raw(`ARRAY[${animalIds.join(",")}]`)})`
      )
    )
    .groupBy(traslados.animalId);

  const entradaMap = new Map(trasladosEntrada.map((t) => [t.animalId, t.fechaEntrada]));

  // Peso de entrada: pesaje más cercano a la fecha de traslado
  const pesajesEntrada = await db
    .select({
      animalId: pesajes.animalId,
      pesoKg: pesajes.pesoKg,
      fecha: pesajes.fecha,
    })
    .from(pesajes)
    .where(
      and(
        eq(pesajes.predioId, predioId),
        sql`${pesajes.animalId} = any(${sql.raw(`ARRAY[${animalIds.join(",")}]`)})`
      )
    )
    .orderBy(pesajes.animalId, pesajes.fecha);

  const pesoEntradaMap = new Map<number, { pesoKg: string; fecha: string }>();
  for (const p of pesajesEntrada) {
    const entrada = entradaMap.get(p.animalId);
    if (!entrada) continue;
    const existing = pesoEntradaMap.get(p.animalId);
    if (!existing || Math.abs(new Date(p.fecha).getTime() - new Date(entrada).getTime()) <
        Math.abs(new Date(existing.fecha).getTime() - new Date(entrada).getTime())) {
      pesoEntradaMap.set(p.animalId, { pesoKg: p.pesoKg, fecha: p.fecha });
    }
  }

  const resultado = ventasRows.map((v) => {
    const fechaEntrada = entradaMap.get(v.animalId);
    const pesoEntrada = pesoEntradaMap.get(v.animalId);
    const diasFeedlot =
      fechaEntrada && v.fechaVenta
        ? Math.round(
            (new Date(v.fechaVenta).getTime() - new Date(fechaEntrada).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
    const adg =
      diasFeedlot && diasFeedlot > 0 && pesoEntrada && v.pesoVentaKg
        ? Math.round(
            ((Number(v.pesoVentaKg) - Number(pesoEntrada.pesoKg)) / diasFeedlot) * 1000
          ) / 1000
        : null;

    return {
      diio: v.diio,
      animal_id: v.animalId,
      fecha_venta: v.fechaVenta,
      fecha_entrada_feedlot: fechaEntrada ?? null,
      dias_feedlot: diasFeedlot,
      peso_entrada_kg: pesoEntrada ? Number(pesoEntrada.pesoKg) : null,
      peso_venta_kg: v.pesoVentaKg ? Number(v.pesoVentaKg) : null,
      adg_kg_dia: adg,
      destino: v.destino,
    };
  });

  const conAdg = resultado.filter((r) => r.adg_kg_dia !== null);
  const adgPromedio =
    conAdg.length > 0
      ? Math.round((conAdg.reduce((s, r) => s + r.adg_kg_dia!, 0) / conAdg.length) * 1000) / 1000
      : null;
  const diasPromedio =
    conAdg.length > 0
      ? Math.round(conAdg.reduce((s, r) => s + (r.dias_feedlot ?? 0), 0) / conAdg.length)
      : null;

  return {
    total: resultado.length,
    resumen: {
      adg_promedio_kg_dia: adgPromedio,
      dias_feedlot_promedio: diasPromedio,
      animales_con_datos_completos: conAdg.length,
    },
    animales: resultado,
  };
}

// ─────────────────────────────────────────────
// CLIENTE + SYSTEM PROMPT
// ─────────────────────────────────────────────

/**
 * Construye el system prompt con contexto del predio y usuario autenticado.
 */
export function buildSystemPrompt(
  session: SmartCowSession,
  predioId: number,
  ctx: { nombrePredio: string; prediosNombres: Map<number, string>; kpis: PredioKpis }
): string {
  const { nombre, rol, modulos, predios } = session.user;
  const modulosActivos = Object.entries(modulos)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  const prediosConNombres = predios
    .map((id) => `${ctx.prediosNombres.get(id) ?? `Predio ${id}`} (${id})`)
    .join(", ");

  const kpisText = [
    `Animales activos: ${ctx.kpis.totalAnimales}`,
    `Total pesajes: ${ctx.kpis.totalPesajes}  |  Total partos: ${ctx.kpis.totalPartos}`,
    ctx.kpis.ultimoPesaje
      ? `Último pesaje: ${ctx.kpis.ultimoPesaje.fecha} · ${ctx.kpis.ultimoPesaje.pesoKg} kg`
      : "Sin pesajes registrados",
  ].join("\n");

  return `Eres el asistente ganadero de SmartCow, una plataforma de gestión de hatos bovinos.

Contexto del usuario:
- Nombre: ${nombre}
- Rol: ${rol}
- Predio activo: ${ctx.nombrePredio} (ID: ${predioId})
- Predios con acceso: ${prediosConNombres}
- Módulos activos: ${modulosActivos || "ninguno"}

== DATOS REALES DEL PREDIO (consultados ahora) ==
${kpisText}

INSTRUCCIÓN: Para totales generales usa los datos de arriba directamente.
Usa tools para: historial filtrado, animales específicos, análisis de toros, feedlot, o registrar datos.

Reglas de comportamiento:
1. Solo puedes consultar datos del predio ${predioId}. Nunca accedas a datos de otros predios.
2. Para escrituras (registrar_pesaje, registrar_parto), confirma los datos antes de ejecutar si hay ambigüedad.
3. Responde en español, de forma concisa y directa.
4. No inventes datos. Si no encuentras información, dilo claramente.
5. Para consultas de animales, usa los filtros disponibles para acotar resultados.
6. Los pesos van en kilogramos. Las fechas en formato YYYY-MM-DD.
7. DIIO = identificador visual del arete. EID = tag electrónico RFID.

Guía de tools:
- query_toros: preguntas sobre toros, IA, tasa de concepción, qué toro produce más peso
- query_historial_animal: historial de un animal (inseminaciones, tratamientos, traslados, genealogía)
- query_feedlot: días en engorde, ADG, eficiencia de feedlot
- query_indices_reproductivos: resumen global del predio (preñez, partos, estados)

== ARTIFACTS (UI estructurada) ==
Cuando tu respuesta contenga datos tabulares, KPIs, listas comparativas o alertas,
emite un bloque \`\`\`artifact al FINAL con JSON válido. La app lo renderiza como tabla/gráfico.

En prosa: máximo 1-2 oraciones de contexto. NO repitas los datos que ya van en el artifact.

Tipos soportados:
- table:  {"type":"table","title":"...","rows":[{"label":"FT-1","value":"318 kg · 1.28 kg/d","color":"ok"}]}
- kpi:    {"type":"kpi","title":"...","kpis":[{"val":"1.14 kg/d","lbl":"GDP fundo","color":"ok"}],"rows":[{"label":"Animales","value":"523"}]}
- alerts: {"type":"alerts","title":"...","items":[{"level":"Urgente","text":"Animal 1234: cojera"}]}

Colores válidos: "ok" (verde), "warn" (ámbar), "bad" (rojo).
Niveles de alerts: "Info", "Atención", "Urgente".

Ejemplo de respuesta bien formada:

> El lote FT-3 está 260 g debajo del target 1.20 kg/d; los otros 3 lotes están en rango.
>
> \`\`\`artifact
> {"type":"table","title":"GDP por lote — abr 2026","rows":[
>   {"label":"FT-1","value":"1.28 kg/d","color":"ok"},
>   {"label":"FT-2","value":"1.21 kg/d","color":"ok"},
>   {"label":"FT-3","value":"0.94 kg/d","color":"bad"},
>   {"label":"FT-4","value":"1.15 kg/d","color":"warn"}
> ]}
> \`\`\`

Usa siempre artifact si hay ≥3 filas de datos o si pidieron "informe", "resumen" o "tabla".`;
}

/**
 * Crea y retorna el cliente Google AI.
 * Lanza error si GOOGLE_API_KEY no está definida.
 */
export function getGoogleAIClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY no configurada");
  }
  return new GoogleGenAI({ apiKey });
}

// ⚠️ PROHIBIDO CAMBIAR ESTOS MODELOS SIN APROBACIÓN DE CÉSAR
// HOY: gemini-2.5-flash (transitorio)
// FUTURO: Gemma 4 (gratis, opensource, multimodal) + claude-sonnet-4-20250514 para JP
export const GOOGLE_FLASH_MODEL = "gemini-2.5-flash";
export const GOOGLE_REASONING_MODEL = "gemini-2.5-flash";
