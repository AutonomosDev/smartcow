/**
 * src/lib/queries/query-db.ts — Dispatcher genérico para la tool query_db.
 *
 * Expone todas las tablas de dominio ganadero al LLM via una única tool.
 * Valida tabla y columnas contra whitelists para evitar SQL injection.
 * Aplica filtro fecha >= '2026-01-01' por default en tablas con columna fecha.
 *
 * Ticket: AUT-256
 */

import { db } from "@/src/db/client";
import { sql, type SQL } from "drizzle-orm";

// ─────────────────────────────────────────────
// WHITELIST DEL SCHEMA
// ─────────────────────────────────────────────

interface TablaConfig {
  columnas: Set<string>;
  hasPredioId: boolean;
  fechaCol?: string; // columna principal de fecha — usada para filtro default 2026
}

const TABLA_CONFIG: Record<string, TablaConfig> = {
  animales: {
    columnas: new Set([
      "id", "predio_id", "diio", "eid", "estado", "sexo", "fecha_nacimiento",
      "tipo_ganado_id", "raza_id", "estado_reproductivo_id", "modulo_actual",
      "tipo_propiedad", "mediero_id", "desecho", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    // Sin fechaCol: animales se consultan por estado, no por fecha de creación
  },
  pesajes: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "peso_kg", "fecha",
      "dispositivo", "usuario_id", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  partos: {
    columnas: new Set([
      "id", "predio_id", "madre_id", "fecha", "resultado",
      "cria_id", "numero_partos", "usuario_id", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  lotes: {
    columnas: new Set([
      "id", "predio_id", "org_id", "nombre", "fecha_entrada",
      "fecha_salida_estimada", "objetivo_peso_kg", "estado", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha_entrada",
  },
  lote_animales: {
    columnas: new Set([
      "id", "lote_id", "animal_id", "fecha_entrada", "fecha_salida",
      "peso_entrada_kg", "peso_salida_kg", "creado_en",
    ]),
    hasPredioId: false,
    fechaCol: "fecha_entrada",
  },
  inseminaciones: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "semen_id",
      "resultado", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  ecografias: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "resultado",
      "dias_gestacion", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  areteos: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "tipo",
      "diio_nuevo", "diio_anterior", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  bajas: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "motivo_id",
      "causa_id", "peso_kg", "observaciones", "usuario_id", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  potreros: {
    columnas: new Set([
      "id", "predio_id", "org_id", "nombre", "hectareas",
      "capacidad_animales", "tipo", "creado_en",
    ]),
    hasPredioId: true,
  },
  movimientos_potrero: {
    columnas: new Set([
      "id", "animal_id", "predio_id", "org_id", "potrero_id",
      "fecha_entrada", "fecha_salida", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha_entrada",
  },
  ventas: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "peso_kg",
      "peso_estimado", "destino", "n_animales_rampa", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  tratamientos: {
    columnas: new Set([
      "id", "predio_id", "animal_id", "fecha", "hora_registro",
      "diagnostico", "medicamentos", "observaciones", "creado_en",
    ]),
    hasPredioId: true,
    fechaCol: "fecha",
  },
  medieros: {
    columnas: new Set([
      "id", "org_id", "predio_id", "nombre", "rut",
      "contacto", "porcentaje_part", "activo", "creado_en",
    ]),
    hasPredioId: true,
  },
};

const DEFAULT_YEAR_FILTER = "2026-01-01";

// ─────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────

export interface QueryDBParams {
  tabla: string;
  filtros?: {
    predio_id?: number;
    animal_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    /** Pasar true para traer histórico completo (omite filtro default 2026) */
    historico?: boolean;
    [key: string]: unknown;
  };
  campos?: string[];
  orden?: { campo: string; direccion?: "asc" | "desc" };
  limite?: number;
  agregacion?: "count" | "sum" | "avg" | "min" | "max";
  /** Columna a agregar cuando agregacion es sum/avg/min/max */
  campo_agregacion?: string;
}

// ─────────────────────────────────────────────
// IMPLEMENTACIÓN
// ─────────────────────────────────────────────

export async function ejecutarQueryDB(
  params: QueryDBParams,
  prediosPermitidos: number[]
): Promise<unknown> {
  const { tabla, campos, orden, agregacion, campo_agregacion } = params;
  const filtros = { ...(params.filtros ?? {}) };
  const limite = Math.min(params.limite ?? 100, 500);

  // 1. Validar tabla
  const config = TABLA_CONFIG[tabla];
  if (!config) {
    const disponibles = Object.keys(TABLA_CONFIG).join(", ");
    return { error: `Tabla '${tabla}' no existe. Disponibles: ${disponibles}` };
  }

  // 2. Validar y resolver predio_id
  if (config.hasPredioId) {
    const solicitado = filtros.predio_id != null ? Number(filtros.predio_id) : null;
    if (
      solicitado !== null &&
      prediosPermitidos.length > 0 &&
      !prediosPermitidos.includes(solicitado)
    ) {
      return {
        error: `Predio ${solicitado} fuera de tu alcance. Accesibles: ${prediosPermitidos.join(", ")}`,
      };
    }
    // Si no se especificó predio_id y hay lista restringida, usar el primero
    if (solicitado === null && prediosPermitidos.length > 0) {
      filtros.predio_id = prediosPermitidos[0];
    }
  }

  // 3. Construir SELECT
  let selectCols: string;
  if (agregacion === "count") {
    selectCols = "COUNT(*) AS total";
  } else if (agregacion && campo_agregacion) {
    const colAgg = sanitizeIdentifier(campo_agregacion);
    if (!config.columnas.has(colAgg)) {
      return { error: `Columna '${colAgg}' no existe en tabla '${tabla}'` };
    }
    selectCols = `${agregacion.toUpperCase()}(${colAgg}) AS resultado`;
  } else if (campos && campos.length > 0) {
    const invalidas = campos.filter((c) => !config.columnas.has(c));
    if (invalidas.length > 0) {
      return {
        error: `Columnas inválidas: ${invalidas.join(", ")}. Disponibles en '${tabla}': ${Array.from(config.columnas).join(", ")}`,
      };
    }
    selectCols = campos.join(", ");
  } else {
    selectCols = "*";
  }

  // 4. Construir condiciones WHERE
  const conditions: SQL[] = [];
  const SPECIAL_KEYS = new Set(["predio_id", "fecha_desde", "fecha_hasta", "historico"]);

  // predio_id siempre primero
  if (config.hasPredioId && filtros.predio_id != null) {
    conditions.push(sql`predio_id = ${Number(filtros.predio_id)}`);
  }

  // Filtro default 2026 — se omite si hay fecha_desde/hasta explícito o historico=true
  const tieneFiltroDeFecha =
    filtros.fecha_desde != null || filtros.fecha_hasta != null;
  const esHistorico = filtros.historico === true || tieneFiltroDeFecha;

  if (config.fechaCol && !esHistorico) {
    conditions.push(sql.raw(`${config.fechaCol} >= '${DEFAULT_YEAR_FILTER}'`));
  }

  // fecha_desde / fecha_hasta
  if (filtros.fecha_desde != null && config.fechaCol) {
    const fechaDesde = sanitizeDate(String(filtros.fecha_desde));
    if (fechaDesde) {
      conditions.push(sql.raw(`${config.fechaCol} >= '${fechaDesde}'`));
    }
  }
  if (filtros.fecha_hasta != null && config.fechaCol) {
    const fechaHasta = sanitizeDate(String(filtros.fecha_hasta));
    if (fechaHasta) {
      conditions.push(sql.raw(`${config.fechaCol} <= '${fechaHasta}'`));
    }
  }

  // Otros filtros equality sobre columnas de la whitelist
  for (const [key, value] of Object.entries(filtros)) {
    if (SPECIAL_KEYS.has(key)) continue;
    if (value === undefined || value === null) continue;
    const col = sanitizeIdentifier(key);
    if (!config.columnas.has(col)) continue; // ignora columnas desconocidas

    if (typeof value === "string") {
      conditions.push(sql`${sql.raw(col)} = ${value}`);
    } else if (typeof value === "number") {
      conditions.push(sql`${sql.raw(col)} = ${value}`);
    } else if (typeof value === "boolean") {
      conditions.push(sql`${sql.raw(col)} = ${value}`);
    }
  }

  // 5. ORDER BY
  let orderPart = "";
  if (orden?.campo) {
    const ordenCol = sanitizeIdentifier(orden.campo);
    if (config.columnas.has(ordenCol)) {
      const dir = orden.direccion === "asc" ? "ASC" : "DESC";
      orderPart = `ORDER BY ${ordenCol} ${dir}`;
    }
  } else if (config.fechaCol) {
    orderPart = `ORDER BY ${config.fechaCol} DESC`;
  }

  // 6. Construir y ejecutar query
  const selectRaw = sql.raw(selectCols);
  const tableRaw = sql.raw(tabla);
  const orderRaw = orderPart ? sql.raw(orderPart) : sql``;

  let query: SQL;
  if (conditions.length === 0) {
    query = sql`SELECT ${selectRaw} FROM ${tableRaw} ${orderRaw} LIMIT ${limite}`;
  } else {
    const whereClause = sql.join(conditions, sql` AND `);
    query = sql`SELECT ${selectRaw} FROM ${tableRaw} WHERE ${whereClause} ${orderRaw} LIMIT ${limite}`;
  }

  const result = await db.execute(query);

  return {
    tabla,
    total: result.rows.length,
    rows: result.rows,
  };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Sanitiza un identificador a solo letras, números y guiones bajos. */
function sanitizeIdentifier(s: string): string {
  return s.replace(/[^a-z0-9_]/gi, "").toLowerCase();
}

/** Valida formato YYYY-MM-DD. Retorna el string o null si es inválido. */
function sanitizeDate(s: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

// ─────────────────────────────────────────────
// SCHEMA TEXTO — para el system prompt
// ─────────────────────────────────────────────

export const SCHEMA_TEXTO = `Tablas disponibles via query_db:
  animales           — id, predio_id, diio, eid, estado, sexo, fecha_nacimiento, tipo_ganado_id, raza_id, estado_reproductivo_id, modulo_actual, tipo_propiedad, mediero_id, desecho
  pesajes            — id, predio_id, animal_id, peso_kg, fecha, dispositivo
  partos             — id, predio_id, madre_id, fecha, resultado, cria_id, numero_partos, observaciones
  lotes              — id, predio_id, nombre, fecha_entrada, fecha_salida_estimada, objetivo_peso_kg, estado
  lote_animales      — id, lote_id, animal_id, fecha_entrada, fecha_salida, peso_entrada_kg, peso_salida_kg
  inseminaciones     — id, predio_id, animal_id, fecha, semen_id, resultado, observaciones
  ecografias         — id, predio_id, animal_id, fecha, resultado, dias_gestacion, observaciones
  areteos            — id, predio_id, animal_id, fecha, tipo, diio_nuevo, diio_anterior
  bajas              — id, predio_id, animal_id, fecha, motivo_id, causa_id, peso_kg, observaciones
  potreros           — id, predio_id, nombre, hectareas, capacidad_animales, tipo
  movimientos_potrero — id, predio_id, animal_id, potrero_id, fecha_entrada, fecha_salida
  ventas             — id, predio_id, animal_id, fecha, peso_kg, peso_estimado, destino
  tratamientos       — id, predio_id, animal_id, fecha, hora_registro, diagnostico, medicamentos, observaciones
  medieros           — id, predio_id, org_id, nombre, rut, porcentaje_part, activo`;
