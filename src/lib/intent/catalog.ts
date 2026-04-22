/**
 * catalog.ts — Catálogo runtime de intents interceptables pre-LLM (AUT-287).
 *
 * Fuente conceptual: .claude/references/config/chat-queries-catalog.yaml (AUT-266).
 * Aquí vive solo el subset top-N con handler determinístico implementado.
 *
 * Para agregar un intent nuevo:
 *  1. Agregar entrada en INTENTS con variantes (frases naturales)
 *  2. Agregar handler en src/lib/intent/handlers/
 *  3. Registrar handler en src/lib/intent/handlers/index.ts
 */

export interface IntentDefinition {
  id: string;
  categoria: string;
  variantes: string[];
  inputs: ("predio_id" | "lote_id" | "potrero_id" | "animal_id" | "fecha_desde" | "fecha_hasta")[];
  tipo: "sql_directo" | "tool_calculo";
  /** Nombre del handler en QUICK_HANDLERS (src/lib/intent/handlers.ts). */
  handler: string;
}

export const INTENTS: readonly IntentDefinition[] = [
  {
    id: "cantidad_animales_total",
    categoria: "conteos",
    variantes: [
      "cuántos animales tengo",
      "cuantos animales tengo",
      "total de animales",
      "total de animales en el fundo",
      "número de cabezas",
      "numero de cabezas",
      "cuántas cabezas de ganado",
      "cuantas cabezas de ganado",
      "total del hato",
      "cuántos animales vivos",
      "cuantos animales vivos",
      "cuántos animales activos",
      "cuantos animales activos",
      "cuántas hembras tengo",
      "cuantas hembras tengo",
      "total de vacas",
      "total de hembras",
      "cuántas vacas hay",
      "cuantas vacas hay",
      "cuántos machos tengo",
      "cuantos machos tengo",
      "total de toros",
      "total de machos",
      "cuántos toros",
      "cuantos toros",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "animales",
  },
  {
    id: "lotes_activos",
    categoria: "feedlot_gestion",
    variantes: [
      "cuántos lotes tengo",
      "cuantos lotes tengo",
      "cuántos lotes estoy corriendo",
      "cuantos lotes estoy corriendo",
      "lotes en producción",
      "lotes en produccion",
      "lotes activos",
      "lotes abiertos",
      "número de lotes activos",
      "numero de lotes activos",
      "lotes del predio",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "lotes",
  },
  {
    id: "ocupacion_feedlot",
    categoria: "feedlot_gestion",
    variantes: [
      "cuántos animales hay en el feedlot",
      "cuantos animales hay en el feedlot",
      "ocupación actual",
      "ocupacion actual",
      "animales en engorde",
      "animales en feedlot",
      "capacidad utilizada",
      "estado del feedlot",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "feedlot",
  },
  {
    id: "pesajes_recientes",
    categoria: "pesajes_gdp",
    variantes: [
      "últimos pesajes",
      "ultimos pesajes",
      "pesajes recientes",
      "últimos 20 pesajes",
      "ultimos 20 pesajes",
      "pesajes del mes",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "pesajes",
  },
  {
    id: "animales_enfermos",
    categoria: "sanidad_tratamientos",
    variantes: [
      "cuáles están enfermos",
      "cuales estan enfermos",
      "animales enfermos",
      "animales en tratamiento",
      "qué animales tienen problemas",
      "que animales tienen problemas",
      "lista de enfermos",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "enfermos",
  },
  {
    id: "partos_periodo",
    categoria: "reproduccion",
    variantes: [
      "cuántos partos tuve este mes",
      "cuantos partos tuve este mes",
      "partos del mes",
      "total de partos",
      "crías nacidas",
      "crias nacidas",
      "partos este mes",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "partos",
  },
  {
    id: "bajas_periodo",
    categoria: "conteos",
    variantes: [
      "bajas del mes",
      "cuántas bajas tuve",
      "cuantas bajas tuve",
      "animales muertos este mes",
      "descartes del mes",
      "mortalidad del mes",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "bajas",
  },
  {
    id: "ventas_periodo",
    categoria: "ventas_destino",
    variantes: [
      "ventas del mes",
      "cuánto vendí este mes",
      "cuanto vendi este mes",
      "total de ventas este mes",
      "ventas este mes",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "ventas",
  },
  {
    id: "tratamientos_frecuentes",
    categoria: "sanidad_tratamientos",
    variantes: [
      "tratamientos más frecuentes",
      "tratamientos mas frecuentes",
      "qué enfermedades son más comunes",
      "que enfermedades son mas comunes",
      "diagnósticos más frecuentes",
      "diagnosticos mas frecuentes",
      "tratamientos recientes",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "tratamientos",
  },
  {
    id: "tasa_prenez",
    categoria: "reproduccion",
    variantes: [
      "tasa de preñez",
      "tasa de prenez",
      "cuántas vacas se preñaron",
      "cuantas vacas se prenaron",
      "porcentaje de preñadas",
      "porcentaje de prenadas",
      "éxito reproductivo",
      "exito reproductivo",
      "vacas preñadas",
      "vacas prenadas",
    ],
    inputs: ["predio_id"],
    tipo: "sql_directo",
    handler: "preñez",
  },
];

/** Normaliza texto para matching: lower, trim, colapsa espacios, remueve acentos. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
