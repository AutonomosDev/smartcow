/**
 * claude.ts — Cliente Anthropic SDK con tool use para consultas ganaderas.
 * Ticket: AUT-112
 *
 * Tools disponibles:
 *   query_animales           — Lista animales de un predio con filtros
 *   query_pesajes            — Historial de pesajes de un animal o predio
 *   query_partos             — Historial de partos en un rango de fechas
 *   query_indices_reproductivos — Resumen reproductivo del predio
 *   registrar_pesaje         — Registra un nuevo pesaje (escritura)
 *   registrar_parto          — Registra un nuevo parto (escritura)
 *
 * Reglas:
 *   - No PII en logs
 *   - No exponer datos de otros predios (predioId siempre validado upstream)
 *   - Tool calls de escritura requieren rol >= operador (validado en route)
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/src/db/client";
import {
  animales,
  pesajes,
  partos,
  tipoGanado,
  razas,
  estadoReproductivo,
} from "@/src/db/schema/index";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import type { SmartCowSession } from "./auth";

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
// TOOL DEFINITIONS (Anthropic format)
// ─────────────────────────────────────────────

export const CATTLE_TOOLS: Anthropic.Tool[] = [
  {
    name: "query_animales",
    description:
      "Consulta la lista de animales activos en el predio. Permite filtrar por tipo de ganado, estado reproductivo y estado del animal. Retorna hasta 50 animales por defecto.",
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
        filtros: {
          type: "object",
          properties: {
            tipo_ganado: {
              type: "string",
              description: "Tipo de ganado (ej: vaca, novilla, ternero)",
            },
            estado_reproductivo: {
              type: "string",
              description: "Estado reproductivo (ej: preñada, vacía, inseminada)",
            },
            estado: {
              type: "string",
              enum: ["activo", "baja", "desecho"],
              description: "Estado del animal en el hato",
            },
            limite: {
              type: "number",
              description: "Máximo de resultados (default 50, max 200)",
            },
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
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
        animal_id: {
          type: "number",
          description: "ID del animal (opcional — si se omite, retorna todos los pesajes del predio)",
        },
        rango_fechas: {
          type: "object",
          properties: {
            inicio: {
              type: "string",
              description: "Fecha inicio YYYY-MM-DD",
            },
            fin: {
              type: "string",
              description: "Fecha fin YYYY-MM-DD",
            },
          },
        },
        limite: {
          type: "number",
          description: "Máximo de resultados (default 100)",
        },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_partos",
    description:
      "Consulta el historial de partos en el predio dentro de un rango de fechas.",
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
        rango_fechas: {
          type: "object",
          properties: {
            inicio: {
              type: "string",
              description: "Fecha inicio YYYY-MM-DD",
            },
            fin: {
              type: "string",
              description: "Fecha fin YYYY-MM-DD",
            },
          },
        },
        limite: {
          type: "number",
          description: "Máximo de resultados (default 50)",
        },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "query_indices_reproductivos",
    description:
      "Calcula y retorna los índices reproductivos del predio: total animales, total partos últimos 12 meses, tasa de concepción estimada, animales preñadas, vacías e inseminadas.",
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
      },
      required: ["predio_id"],
    },
  },
  {
    name: "registrar_pesaje",
    description:
      "Registra un nuevo pesaje para un animal identificado por su EID (tag electrónico). Requiere rol operador o superior.",
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
        eid: {
          type: "string",
          description: "EID / tag electrónico del animal",
        },
        peso_kg: {
          type: "number",
          description: "Peso en kilogramos",
        },
        fecha: {
          type: "string",
          description: "Fecha del pesaje YYYY-MM-DD (default: hoy)",
        },
      },
      required: ["predio_id", "eid", "peso_kg"],
    },
  },
  {
    name: "registrar_parto",
    description:
      "Registra un nuevo parto para una madre identificada por su EID. Requiere rol operador o superior.",
    input_schema: {
      type: "object" as const,
      properties: {
        predio_id: {
          type: "number",
          description: "ID del predio (obligatorio)",
        },
        madre_eid: {
          type: "string",
          description: "EID / tag electrónico de la madre",
        },
        resultado: {
          type: "string",
          enum: ["vivo", "muerto", "aborto", "gemelar"],
          description: "Resultado del parto",
        },
        fecha: {
          type: "string",
          description: "Fecha del parto YYYY-MM-DD (default: hoy)",
        },
        observaciones: {
          type: "string",
          description: "Observaciones adicionales (opcional)",
        },
      },
      required: ["predio_id", "madre_eid", "resultado"],
    },
  },
];

// ─────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────

/**
 * Ejecuta el tool_use solicitado por Claude.
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

  // Verificar que el predio_id solicitado está entre los permitidos del usuario
  // (superadmin y admin_org pasan con prediosPermitidos = [] como señal de acceso total)
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

    case "registrar_pesaje": {
      if (rolRank < 1) {
        return { error: "Se requiere rol operador o superior para registrar pesajes", code: "FORBIDDEN" };
      }
      return registrarPesaje(predioId, {
        eid: String(toolInput["eid"]),
        peso_kg: Number(toolInput["peso_kg"]),
        fecha: toolInput["fecha"] as string | undefined,
      }, userId);
    }

    case "registrar_parto": {
      if (rolRank < 1) {
        return { error: "Se requiere rol operador o superior para registrar partos", code: "FORBIDDEN" };
      }
      return registrarParto(predioId, {
        madre_eid: String(toolInput["madre_eid"]),
        resultado: toolInput["resultado"] as DatosRegistrarParto["resultado"],
        fecha: toolInput["fecha"] as string | undefined,
        observaciones: toolInput["observaciones"] as string | undefined,
      }, userId);
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
        filtros?.tipo_ganado
          ? eq(tipoGanado.nombre, filtros.tipo_ganado)
          : undefined,
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

async function registrarPesaje(
  predioId: number,
  datos: DatosRegistrarPesaje,
  usuarioId: number
) {
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

async function registrarParto(
  predioId: number,
  datos: DatosRegistrarParto,
  usuarioId: number
) {
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

// ─────────────────────────────────────────────
// CLIENTE + SYSTEM PROMPT
// ─────────────────────────────────────────────

/**
 * Construye el system prompt con contexto del predio y usuario autenticado.
 * No incluir PII ni datos sensibles en el prompt.
 */
export function buildSystemPrompt(session: SmartCowSession, predioId: number): string {
  const { nombre, rol, modulos, predios } = session.user;
  const modulosActivos = Object.entries(modulos)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  return `Eres el asistente ganadero de SmartCow, una plataforma de gestión de hatos bovinos.

Contexto del usuario:
- Nombre: ${nombre}
- Rol: ${rol}
- Predio activo: ${predioId}
- Predios con acceso: ${predios.join(", ")}
- Módulos activos: ${modulosActivos || "ninguno"}

Reglas de comportamiento:
1. Solo puedes consultar datos del predio ${predioId}. Nunca accedas a datos de otros predios.
2. Para escrituras (registrar_pesaje, registrar_parto), confirma los datos antes de ejecutar si hay ambigüedad.
3. Responde en español, de forma concisa y directa.
4. No inventes datos. Si no encuentras información, dilo claramente.
5. Para consultas de animales, usa los filtros disponibles para acotar resultados.
6. Los pesos van en kilogramos. Las fechas en formato YYYY-MM-DD.
7. DIIO = identificador visual del arete. EID = tag electrónico RFID.`;
}

/**
 * Crea y retorna el cliente Anthropic configurado.
 * Lanza error si ANTHROPIC_API_KEY no está definida.
 */
export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no configurada");
  }
  return new Anthropic({ apiKey });
}
