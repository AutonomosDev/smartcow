/**
 * claude.ts — Declaración de CATTLE_TOOLS del chat ganadero en formato Google AI SDK
 * (@google/genai — FunctionDeclaration, Type).
 * Tickets: AUT-176 / AUT-256 / AUT-261
 *
 * Runtime: Anthropic SDK directo (@anthropic-ai/sdk). Modelo default claude-sonnet-4-6.
 * Ver app/api/chat/route.ts y .claude/references/config/llm-routing-and-budget.yaml.
 * Conversión a formato Anthropic tool por toAnthropicTools() en route.ts.
 *
 * Tool de lectura (1):
 *   query_db  — Consulta genérica a cualquier tabla del schema SmartCow
 *
 * Tools de escritura (2):
 *   registrar_pesaje — Registra un nuevo pesaje (escritura)
 *   registrar_parto  — Registra un nuevo parto (escritura)
 *
 * Reglas:
 *   - No PII en logs
 *   - predio_id validado contra prediosPermitidos en ejecutarQueryDB
 *   - Tool calls de escritura requieren rol >= operador (validado en route)
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import { db } from "@/src/db/client";
import { animales, pesajes, partos, chatAttachments } from "@/src/db/schema/index";
import { eq, and, sql } from "drizzle-orm";
import type { SmartCowSession } from "./auth";
import type { PredioKpis, PesajePorLote } from "@/src/lib/queries/predio";
import { ejecutarQueryDB, type QueryDBParams, SCHEMA_TEXTO } from "@/src/lib/queries/query-db";
import { invalidatePredio } from "@/src/lib/cache";

// ─────────────────────────────────────────────
// TIPOS INTERNOS
// ─────────────────────────────────────────────

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
    name: "query_db",
    description:
      "Consulta cualquier tabla del schema SmartCow. Úsala para leer animales, pesajes, partos, lotes, inseminaciones, ecografías, areteos, bajas, potreros, movimientos, ventas, tratamientos y medieros. Por default filtra datos de 2026; pasa historico:true para traer todo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        tabla: {
          type: Type.STRING,
          description:
            "Tabla a consultar: animales | pesajes | partos | lotes | lote_animales | inseminaciones | ecografias | areteos | bajas | potreros | movimientos_potrero | ventas | tratamientos | medieros",
        },
        filtros: {
          type: Type.OBJECT,
          description:
            "Filtros opcionales. Campos especiales: predio_id (número), fecha_desde (YYYY-MM-DD), fecha_hasta (YYYY-MM-DD), historico (boolean — omite filtro 2026). Cualquier otra clave se trata como equality filter sobre esa columna.",
          properties: {
            predio_id: { type: Type.NUMBER, description: "ID del predio" },
            fecha_desde: { type: Type.STRING, description: "Fecha inicio YYYY-MM-DD" },
            fecha_hasta: { type: Type.STRING, description: "Fecha fin YYYY-MM-DD" },
            historico: {
              type: Type.BOOLEAN,
              description: "True para traer datos anteriores a 2026",
            },
            estado: { type: Type.STRING, description: "Para animales: activo | baja | desecho" },
            animal_id: { type: Type.NUMBER, description: "ID del animal" },
            resultado: {
              type: Type.STRING,
              description:
                "Para partos: vivo|muerto|aborto|gemelar. Para inseminaciones: preñada|vacia|pendiente. Para ecografías: preñada|vacia|dudosa.",
            },
            modulo_actual: {
              type: Type.STRING,
              description: "Para animales: feedlot | crianza | ambos",
            },
          },
        },
        campos: {
          type: Type.ARRAY,
          description: "Columnas a retornar (SELECT). Si se omite retorna todas.",
          items: { type: Type.STRING },
        },
        orden: {
          type: Type.OBJECT,
          description: "Ordenamiento del resultado",
          properties: {
            campo: { type: Type.STRING, description: "Nombre de la columna" },
            direccion: { type: Type.STRING, description: "asc o desc (default desc)" },
          },
        },
        limite: {
          type: Type.NUMBER,
          description: "Máximo de filas a retornar (default 100, max 500)",
        },
        agregacion: {
          type: Type.STRING,
          description: "count | sum | avg | min | max. Para count no necesitas campo_agregacion.",
        },
        campo_agregacion: {
          type: Type.STRING,
          description: "Columna numérica para sum/avg/min/max",
        },
      },
      required: ["tabla"],
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
  {
    name: "consultar_archivo",
    description:
      "Consulta datos de un archivo CSV o XLSX que el usuario subió en esta sesión. Usa el attachment_id devuelto al cargar el archivo. Puedes filtrar por columna y limitar filas.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        attachment_id: {
          type: Type.NUMBER,
          description: "ID del archivo subido (devuelto al cargar)",
        },
        filtros: {
          type: Type.OBJECT,
          description: "Filtros opcionales: { columna: valor }. Solo equality filters.",
        },
        columnas: {
          type: Type.ARRAY,
          description: "Columnas a retornar. Si se omite retorna todas.",
          items: { type: Type.STRING },
        },
        limite: {
          type: Type.NUMBER,
          description: "Máximo de filas a retornar (default 100, max 500)",
        },
        agregacion: {
          type: Type.STRING,
          description: "count | sum | avg | min | max sobre una columna numérica",
        },
        campo_agregacion: {
          type: Type.STRING,
          description: "Columna numérica para sum/avg/min/max",
        },
      },
      required: ["attachment_id"],
    },
  },
  {
    name: "comparar_precio_feria",
    description:
      "Compara el precio actual de una categoría de ganado en feria contra un precio histórico (ej: hace un año). Devuelve precio_hoy, precio_referencia, variación en % y en CLP. Fuente: tabla precios_feria (ODEPA/Tattersall). Usa esto en vez de inventar precios.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        categoria: {
          type: Type.STRING,
          description:
            "Categoría: novillo_gordo | vaca_gorda | vaquilla | ternero | toro",
        },
        fecha_referencia: {
          type: Type.STRING,
          description:
            "Fecha de referencia YYYY-MM-DD (ej: hace 1 año). Compara contra la fecha más reciente disponible.",
        },
        feria: {
          type: Type.STRING,
          description:
            "Opcional: feria específica (osorno | temuco | los_angeles | puerto_montt | talca). Si se omite, promedia todas.",
        },
      },
      required: ["categoria", "fecha_referencia"],
    },
  },
  {
    name: "web_search",
    description:
      "Busca información en internet. SOLO usar cuando el usuario pide explícitamente datos externos (precios de mercado actuales, noticias, regulaciones, clima, etc). No usar para datos del predio — usa query_db para eso.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Búsqueda en lenguaje natural. Ser específico (incluir 'Chile', año actual si aplica).",
        },
        max_results: {
          type: Type.NUMBER,
          description: "Número de resultados (default 5, máx 10)",
        },
      },
      required: ["query"],
    },
  },
];

// ─────────────────────────────────────────────
// TOOL HANDLERS
// ─────────────────────────────────────────────

/**
 * Ejecuta el tool_use solicitado por el modelo.
 * prediosPermitidos: lista de predio_ids a los que el usuario tiene acceso
 *   (vacío = acceso total, ej. admin_org).
 * userId: para registrar autoría en escrituras.
 */
export async function ejecutarTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  prediosPermitidos: number[],
  userId: number,
  rolRank: number
): Promise<unknown> {
  switch (toolName) {
    case "query_db": {
      return ejecutarQueryDB(toolInput as unknown as QueryDBParams, prediosPermitidos);
    }

    case "registrar_pesaje": {
      if (rolRank < 1) {
        return { error: "Se requiere rol operador o superior para registrar pesajes", code: "FORBIDDEN" };
      }
      const predioId = Number(toolInput["predio_id"]);
      if (prediosPermitidos.length > 0 && !prediosPermitidos.includes(predioId)) {
        return { error: "Sin acceso a este predio", code: "FORBIDDEN" };
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
      const predioId = Number(toolInput["predio_id"]);
      if (prediosPermitidos.length > 0 && !prediosPermitidos.includes(predioId)) {
        return { error: "Sin acceso a este predio", code: "FORBIDDEN" };
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

    case "consultar_archivo": {
      return consultarArchivo(
        Number(toolInput["attachment_id"]),
        (toolInput["filtros"] as Record<string, unknown> | undefined) ?? {},
        (toolInput["columnas"] as string[] | undefined) ?? [],
        Math.min(Number(toolInput["limite"] ?? 100), 500),
        toolInput["agregacion"] as string | undefined,
        toolInput["campo_agregacion"] as string | undefined,
        prediosPermitidos
      );
    }

    case "web_search": {
      return buscarWeb(
        String(toolInput["query"] ?? ""),
        Number(toolInput["max_results"] ?? 5)
      );
    }

    case "comparar_precio_feria": {
      return compararPrecioFeria(
        String(toolInput["categoria"] ?? ""),
        String(toolInput["fecha_referencia"] ?? ""),
        toolInput["feria"] as string | undefined
      );
    }

    default:
      return { error: `Tool desconocido: ${toolName}` };
  }
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

  // Invalidar query cache del predio (AUT-265)
  await invalidatePredio(predioId).catch((err) =>
    console.warn("[cache] invalidatePredio (pesaje) failed:", err instanceof Error ? err.message : err)
  );

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

  // Invalidar query cache del predio (AUT-265)
  await invalidatePredio(predioId).catch((err) =>
    console.warn("[cache] invalidatePredio (parto) failed:", err instanceof Error ? err.message : err)
  );

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
// CONSULTAR ARCHIVO (attachment CSV/XLSX)
// ─────────────────────────────────────────────

async function consultarArchivo(
  attachmentId: number,
  filtros: Record<string, unknown>,
  columnas: string[],
  limite: number,
  agregacion: string | undefined,
  campoAgregacion: string | undefined,
  prediosPermitidos: number[]
) {
  if (!attachmentId || isNaN(attachmentId)) {
    return { error: "attachment_id inválido" };
  }

  const rows = await db
    .select()
    .from(chatAttachments)
    .where(eq(chatAttachments.id, attachmentId))
    .limit(1);

  if (!rows[0]) {
    return { error: `Archivo ${attachmentId} no encontrado` };
  }

  const attachment = rows[0];

  // Validar acceso al predio del archivo
  if (prediosPermitidos.length > 0 && !prediosPermitidos.includes(attachment.predioId)) {
    return { error: "Sin acceso a este archivo", code: "FORBIDDEN" };
  }

  const data = attachment.contenidoJson as Record<string, unknown>[];
  if (!Array.isArray(data)) {
    return { error: "Contenido del archivo no es un array" };
  }

  // Aplicar filtros equality
  let filtered = data;
  for (const [key, val] of Object.entries(filtros)) {
    if (val !== undefined && val !== null) {
      filtered = filtered.filter((row) => String(row[key]) === String(val));
    }
  }

  // Proyección de columnas
  if (columnas.length > 0) {
    filtered = filtered.map((row) => {
      const projected: Record<string, unknown> = {};
      for (const col of columnas) {
        projected[col] = row[col];
      }
      return projected;
    });
  }

  // Agregación
  if (agregacion) {
    if (agregacion === "count") {
      return { resultado: filtered.length, tipo: "count", filas_filtradas: filtered.length };
    }
    if (campoAgregacion) {
      const numVals = filtered
        .map((r) => Number(r[campoAgregacion]))
        .filter((n) => !isNaN(n));
      if (numVals.length === 0) {
        return { resultado: null, tipo: agregacion, campo: campoAgregacion, nota: "sin valores numéricos" };
      }
      let resultado: number;
      switch (agregacion) {
        case "sum": resultado = numVals.reduce((a, b) => a + b, 0); break;
        case "avg": resultado = numVals.reduce((a, b) => a + b, 0) / numVals.length; break;
        case "min": resultado = Math.min(...numVals); break;
        case "max": resultado = Math.max(...numVals); break;
        default: resultado = 0;
      }
      return { resultado: Math.round(resultado * 1000) / 1000, tipo: agregacion, campo: campoAgregacion, n: numVals.length };
    }
  }

  return {
    archivo: attachment.filename,
    columnas: attachment.columnas,
    filas_totales: attachment.filasCount,
    filas_filtradas: filtered.length,
    datos: filtered.slice(0, limite),
  };
}

// ─────────────────────────────────────────────
// COMPARAR PRECIO FERIA (AUT-267)
// ─────────────────────────────────────────────

/**
 * Compara el precio actual de una categoría contra un precio histórico.
 * Usa la tabla precios_feria (ODEPA/Tattersall) para obtener valores reales.
 */
async function compararPrecioFeria(
  categoria: string,
  fechaReferencia: string,
  feria?: string
): Promise<unknown> {
  const cat = categoria.trim().toLowerCase();
  if (!/^(novillo_gordo|vaca_gorda|vaquilla|ternero|toro)$/.test(cat)) {
    return {
      error: `Categoría inválida: ${categoria}. Usa: novillo_gordo, vaca_gorda, vaquilla, ternero, toro`,
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaReferencia)) {
    return { error: `fecha_referencia inválida: ${fechaReferencia}. Usa YYYY-MM-DD.` };
  }
  const feriaFiltro = feria?.trim().toLowerCase() || null;

  // precio "hoy" = promedio ponderado de los precios más recientes (últimos 14 días)
  // precio "referencia" = promedio de ±7 días alrededor de fechaReferencia
  const filtroFeria = feriaFiltro ? `AND feria = '${feriaFiltro.replace(/'/g, "''")}'` : "";

  const queryHoy = `
    SELECT AVG(precio_kg_clp) AS precio_prom, MAX(fecha) AS fecha_max, COUNT(*) AS n
    FROM precios_feria
    WHERE categoria = '${cat}'
      ${filtroFeria}
      AND fecha >= (SELECT COALESCE(MAX(fecha), CURRENT_DATE) FROM precios_feria WHERE categoria = '${cat}') - INTERVAL '14 days'
  `;

  const queryRef = `
    SELECT AVG(precio_kg_clp) AS precio_prom, COUNT(*) AS n
    FROM precios_feria
    WHERE categoria = '${cat}'
      ${filtroFeria}
      AND fecha BETWEEN ('${fechaReferencia}'::date - INTERVAL '7 days')
                    AND ('${fechaReferencia}'::date + INTERVAL '7 days')
  `;

  try {
    const [resHoy, resRef] = await Promise.all([
      db.execute(sql.raw(queryHoy)),
      db.execute(sql.raw(queryRef)),
    ]);

    const rowHoy = resHoy.rows[0] as
      | { precio_prom: string | null; fecha_max: string | null; n: string | number }
      | undefined;
    const rowRef = resRef.rows[0] as
      | { precio_prom: string | null; n: string | number }
      | undefined;

    const precioHoy = rowHoy?.precio_prom != null ? Number(rowHoy.precio_prom) : null;
    const precioRef = rowRef?.precio_prom != null ? Number(rowRef.precio_prom) : null;
    const fechaHoy = rowHoy?.fecha_max ?? null;
    const nHoy = Number(rowHoy?.n ?? 0);
    const nRef = Number(rowRef?.n ?? 0);

    if (precioHoy == null || precioRef == null || nHoy === 0 || nRef === 0) {
      return {
        error: "Sin datos suficientes para la comparación",
        categoria: cat,
        feria: feriaFiltro,
        fecha_referencia: fechaReferencia,
        n_hoy: nHoy,
        n_referencia: nRef,
        sugerencia: "Ejecuta npm run etl:precios-feria para poblar la tabla precios_feria.",
      };
    }

    const variacionClp = Math.round(precioHoy - precioRef);
    const variacionPct = ((precioHoy - precioRef) / precioRef) * 100;

    const dias =
      fechaHoy != null
        ? Math.round(
            (new Date(fechaHoy).getTime() - new Date(fechaReferencia).getTime()) / 86400000
          )
        : null;

    return {
      categoria: cat,
      feria: feriaFiltro ?? "todas",
      precio_hoy: Math.round(precioHoy),
      precio_referencia: Math.round(precioRef),
      variacion_clp: variacionClp,
      variacion_pct: Math.round(variacionPct * 10) / 10,
      dias,
      fecha_hoy: fechaHoy,
      fecha_referencia: fechaReferencia,
      moneda: "CLP",
      n_hoy: nHoy,
      n_referencia: nRef,
      fuente: "precios_feria (ODEPA/Tattersall)",
    };
  } catch (err) {
    return {
      error: `Error consultando precios_feria: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─────────────────────────────────────────────
// WEB SEARCH (Tavily)
// ─────────────────────────────────────────────

async function buscarWeb(query: string, maxResults: number) {
  if (!query.trim()) return { error: "query vacía" };

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { error: "Búsqueda web no disponible en este entorno" };

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: query.trim(),
        search_depth: "basic",
        include_answer: false,
        max_results: Math.min(Math.max(1, maxResults), 10),
        country: "chile",
      }),
    });

    if (!res.ok) return { error: `Tavily error ${res.status}` };

    const data = (await res.json()) as { results: { title: string; url: string; content: string; score: number }[] };
    return {
      resultados: data.results.map((r) => ({
        titulo: r.title,
        url: r.url,
        fragmento: r.content,
        relevancia: r.score,
      })),
    };
  } catch (err) {
    return { error: `Error al buscar: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─────────────────────────────────────────────
// CLIENTE + SYSTEM PROMPT
// ─────────────────────────────────────────────

/**
 * Construye el system prompt con contexto del predio y usuario autenticado.
 * Ticket: AUT-256 — acceso total a la DB via query_db, default 2026, pesajes prioritarios.
 */
export interface AttachmentMeta {
  id: number;
  filename: string;
  columnas: string[];
  filasCount: number;
}

export function buildSystemPrompt(
  session: SmartCowSession,
  predioId: number,
  ctx: {
    nombrePredio: string;
    prediosNombres: Map<number, string>;
    kpis: PredioKpis;
    ultimoPesajePorLote?: PesajePorLote[];
    attachmentsMeta?: AttachmentMeta[];
    webSearch?: boolean;
  }
): string {
  const { nombre, rol, modulos, predios } = session.user;
  const modulosActivos = Object.entries(modulos)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  // Listar predios por nombre real. Para admin_org (predios=[]), el caller pasa en
  // ctx.prediosNombres el Map con TODOS los predios de la org. Para usuarios normales,
  // ctx.prediosNombres viene scoped a session.user.predios. En ambos casos iteramos
  // el Map — fuente de verdad única.
  const prediosConNombres =
    ctx.prediosNombres.size > 0
      ? Array.from(ctx.prediosNombres.entries())
          .map(([id, nombre]) => `${nombre} (${id})`)
          .join(", ")
      : predios.length > 0
        ? predios.map((id) => `Predio ${id}`).join(", ")
        : "todos los predios de la organización";

  const kpisText = [
    `Animales activos: ${ctx.kpis.totalAnimales}`,
    `Total pesajes: ${ctx.kpis.totalPesajes}  |  Total partos: ${ctx.kpis.totalPartos}`,
    ctx.kpis.ultimoPesaje
      ? `Último pesaje (global): ${ctx.kpis.ultimoPesaje.fecha} · ${ctx.kpis.ultimoPesaje.pesoKg} kg`
      : "Sin pesajes registrados",
  ].join("\n");

  const pesajePorLoteText =
    ctx.ultimoPesajePorLote && ctx.ultimoPesajePorLote.length > 0
      ? `\nÚltimo pesaje por lote activo:\n` +
        ctx.ultimoPesajePorLote
          .map((l) => {
            const gdp = l.gdpKgDia !== null ? ` · GDP ${l.gdpKgDia.toFixed(3)} kg/d` : "";
            return `  ${l.loteNombre}: ${l.pesoPromedioKg.toFixed(1)} kg (${l.fecha})${gdp}`;
          })
          .join("\n")
      : "";

  const attachmentsText =
    ctx.attachmentsMeta && ctx.attachmentsMeta.length > 0
      ? `\n\n== ARCHIVOS CARGADOS EN ESTA SESIÓN ==\n` +
        ctx.attachmentsMeta
          .map((a) => `- attachment_id ${a.id}: "${a.filename}" (${a.filasCount} filas, columnas: ${a.columnas.join(", ")})`)
          .join("\n") +
        `\n\nUsa \`consultar_archivo\` con el id correspondiente para acceder a estos datos.`
      : "";

  return `Eres el asistente ganadero de SmartCow, una plataforma de gestión de hatos bovinos.

Contexto del usuario:
- Nombre: ${nombre}
- Rol: ${rol}
- Predio activo: ${ctx.nombrePredio} (ID: ${predioId})
- Predios con acceso: ${prediosConNombres}
- Módulos activos: ${modulosActivos || "ninguno"}

== DATOS REALES DEL PREDIO (consultados ahora) ==
${kpisText}${pesajePorLoteText}

INSTRUCCIÓN: Para totales globales usa los datos de arriba directamente.
Usa query_db para: historial detallado, filtros específicos, comparaciones, o cualquier dato no listado arriba.

== ACCESO A LA BASE DE DATOS ==
Tienes acceso completo al schema SmartCow via la tool query_db.

${SCHEMA_TEXTO}

REGLA DE FECHA: por default query_db filtra datos del año 2026 en tablas con columna fecha.
Solo agrega historico:true si el usuario pide explícitamente "histórico", "todos", "desde [año anterior]".

REGLA DE ACCESO: consulta solo predios accesibles (${prediosConNombres}).
Si el usuario pide un predio fuera de lista, díselo y ofrece los accesibles.

PESAJES son el dato más crítico — JP mide productividad por GDP (ganancia diaria de peso).
Por default incluye GDP en respuestas sobre pesajes cuando lo puedas calcular.
Para calcular GDP: query_db tabla:lote_animales (peso_entrada_kg) + tabla:pesajes (últimos pesos).

Reglas de comportamiento:
1. Responde en español, de forma concisa y directa.
2. No inventes datos. Si no encuentras información, díselo claramente.
3. Para escrituras (registrar_pesaje, registrar_parto), confirma los datos antes si hay ambigüedad.
4. Los pesos van en kilogramos. Las fechas en formato YYYY-MM-DD.
5. DIIO = identificador visual del arete. EID = tag electrónico RFID.
6. Puedes hacer múltiples llamadas a query_db para responder preguntas complejas.
7. NUNCA menciones el nombre del predio ni su ID en la respuesta a menos que el usuario
   compare predios explícitamente o pregunte en cuál está. El usuario ya lo ve en el breadcrumb.
   MAL: "En el predio <NOMBRE> (ID) se registran 9 novillos."
   BIEN: "Se registran 9 novillos."
   NO INVENTES nombres de predios. Solo puedes usar nombres que aparecen literalmente en
   "Predios con acceso" arriba. Cualquier otro nombre es alucinación → no lo escribas.
8. AUTONOMÍA ANALÍTICA — Para preguntas de análisis (distribución, histograma, rango, promedio,
   ranking, comparación, "cómo están distribuidos", "cuántos por rango"): EJECUTA directamente
   con query_db + agregación o buckets razonables. NO preguntes "¿quieres que lo haga?",
   "¿conviene comparar?", "¿te gustaría ver?". El usuario ya pidió el análisis.
   - Si faltan buckets → proponlos tú (pesos: 50 kg, edad: meses, GDP: 0.2 kg/d).
   - Si comparación N-way → itera TODOS los items, no resumas con "y otros".
   - Siempre emite el artifact correspondiente (table, kpi, alerts, o chart).
   MAL: "¿Te gustaría que analice la distribución?"
   BIEN: [ejecuta query_db con buckets y emite artifact tipo chart]

== ARTIFACTS (UI estructurada) ==
Cuando tu respuesta contenga datos tabulares, KPIs, listas comparativas o alertas,
emite un bloque \`\`\`artifact al FINAL con JSON válido. La app lo renderiza como tabla/gráfico.

En prosa: máximo 1-2 oraciones de contexto. NO repitas los datos que ya van en el artifact.

Tipos soportados:
- table:  {"type":"table","title":"...","rows":[{"label":"FT-1","value":"318 kg · 1.28 kg/d","color":"ok"}]}
- kpi:    {"type":"kpi","title":"...","kpis":[{"val":"1.14 kg/d","lbl":"GDP fundo","color":"ok"}],"rows":[{"label":"Animales","value":"523"}]}
- alerts: {"type":"alerts","title":"...","items":[{"level":"Urgente","text":"Animal 1234: cojera"}]}
- chart:  {"type":"chart","variant":"bar|histogram|line","title":"...","xLabel":"...","yLabel":"...","data":[{"x":"250-300","y":45},{"x":"300-350","y":89}]}

Colores válidos: "ok" (verde), "warn" (ámbar), "bad" (rojo).
Niveles de alerts: "Info", "Atención", "Urgente".
Chart variants:
  - "bar":       categorías comparadas (predios, razas, lotes) → x = nombre, y = valor
  - "histogram": distribución con buckets (peso, edad, GDP) → x = rango como "250-300", y = conteo
  - "line":      evolución temporal (pesajes por mes, partos por mes) → x = fecha/mes, y = valor

Cuando el usuario pida "distribución", "histograma", "cómo están repartidos" → usa chart variant=histogram.
Cuando pida "evolución", "tendencia", "por mes" → usa chart variant=line.
Cuando compare N items (predios, razas, lotes) → puedes usar table O chart variant=bar.

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

Usa siempre artifact si hay ≥3 filas de datos o si pidieron "informe", "resumen" o "tabla".${attachmentsText}${ctx.webSearch ? `\n\n== BÚSQUEDA WEB ACTIVA ==\nEl usuario activó búsqueda web. Puedes usar \`web_search\` cuando la pregunta requiera datos externos (precios actuales del ganado, noticias del sector, regulaciones SAG, clima, etc). NO uses web_search para datos del predio — usa query_db para eso.` : ""}`;
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
