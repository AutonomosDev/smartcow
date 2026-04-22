/**
 * src/etl/fundo-resolver.ts
 *
 * AUT-296 (W1) — Entregable core: tabla de equivalencia
 * "Nombre AgroApp" → tipo (predio | mediero | origen_externo) → id SmartCow
 *
 * AgroApp mezcla en la columna "Fundo" (y en Origen/Destino de Traslados)
 * tres cosas distintas:
 *
 *   1. Predios del cliente           → tabla `predios`
 *   2. Medierías / hotelerías        → tabla `medieros`
 *   3. Predios de terceros           → NO se persiste como entidad,
 *      (origen previo del animal)      se guarda como texto histórico.
 *
 * Este módulo es la fuente de verdad para ese mapeo + normalizador de typos
 * detectados en los 10 xlsx del 18-04-2026 (78 valores distintos).
 *
 * USO desde los ETL (W2..W5):
 *
 *   import { resolveFundo } from "@/src/etl/fundo-resolver";
 *
 *   const res = resolveFundo("Oscar hitschfeld");
 *   // → { kind: "externo", canonical: "Oscar Hitschfeld" }
 *
 *   const res = resolveFundo("San Pedro");
 *   // → { kind: "predio", canonical: "San Pedro" }
 *   // el ID se resuelve contra DB en runtime (por nombre).
 *
 * Clasificación confirmada por Cesar (2026-04-22):
 *   - predios propios  : San Pedro, feedlot, Recría Feedlot, Recría FT
 *   - arriendos        : Arriendo Santa Isabel, Arriendo las quebradas
 *   - medierías        : Medieria FT, Medieria Frival, Medieria Oller, Corrales del Sur
 *   - hotelería        : Mollendo
 *   - externos (cola)  : resto (67 valores de origen previo de animales)
 */

export type FundoKind = "predio" | "mediero" | "externo";

export type FundoResolution =
  | {
      kind: "predio";
      canonical: string;
      tipoTenencia: "propio" | "arriendo";
    }
  | {
      kind: "mediero";
      canonical: string;
      tipoNegocio: "medieria" | "hoteleria";
    }
  | {
      kind: "externo";
      canonical: string;
    };

// ─────────────────────────────────────────────────────────────────────────────
// Predios propios del cliente (tabla `predios`, tipo_tenencia)
// ─────────────────────────────────────────────────────────────────────────────
const PREDIOS: Record<string, { canonical: string; tipo: "propio" | "arriendo" }> = {
  "san pedro": { canonical: "San Pedro", tipo: "propio" },
  "feedlot": { canonical: "feedlot", tipo: "propio" },
  "recria feedlot": { canonical: "Recría Feedlot", tipo: "propio" },
  "recría feedlot": { canonical: "Recría Feedlot", tipo: "propio" },
  "recria ft": { canonical: "Recría FT", tipo: "propio" },
  "recría ft": { canonical: "Recría FT", tipo: "propio" },
  "arriendo santa isabel": { canonical: "Arriendo Santa Isabel", tipo: "arriendo" },
  "arriendo las quebradas": { canonical: "Arriendo las quebradas", tipo: "arriendo" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Medieros + hoteleros (tabla `medieros`, tipo_negocio)
// ─────────────────────────────────────────────────────────────────────────────
const MEDIEROS: Record<string, { canonical: string; tipo: "medieria" | "hoteleria" }> = {
  "medieria ft": { canonical: "Medieria FT", tipo: "medieria" },
  "medieria frival": { canonical: "Medieria Frival", tipo: "medieria" },
  "medieria oller": { canonical: "Medieria Oller", tipo: "medieria" },
  "corrales del sur": { canonical: "Corrales del Sur", tipo: "medieria" },
  "mollendo": { canonical: "Mollendo", tipo: "hoteleria" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Origen externo: predios de terceros detectados en GanadoActual::Origen
// y Traslados::Origen. Se listan para:
//   1) confirmar que el resolver los reconoce (no falsos positivos como predio).
//   2) normalizar typos al nombre canónico.
//
// NO se crea entidad en DB. El ETL los guarda como texto en
// `animales.origen_previo` o `traslados.origen_externo`.
// ─────────────────────────────────────────────────────────────────────────────
const EXTERNOS_CANONICOS: Record<string, string> = {
  // Oscar Hitschfeld y variantes
  "oscar hitschfeld": "Oscar Hitschfeld",
  "oscar hitschafeld": "Oscar Hitschfeld",
  "oscar hitschafeldt": "Oscar Hitschfeld",
  "oscar h. bugueno": "Oscar Hitschfeld", // mismo dueño, razón social distinta
  // Puerto Varas
  "pto varas": "Puerto Varas",
  "puerto varas": "Puerto Varas",
  "tattersall puerto varas": "Tattersall Puerto Varas",
  // Puerto Montt
  "pto montt": "Puerto Montt",
  "puerto montt": "Puerto Montt",
  "fegosa puerto montt": "Fegosa Puerto Montt",
  "fegosa pto montt": "Fegosa Puerto Montt",
  "fegosa puerto montt (1)": "Fegosa Puerto Montt",
  "fegosa puerto montt (2)": "Fegosa Puerto Montt",
  // Mantos Verdes (+9 variantes detectadas)
  "mantos verdes": "Mantos Verdes",
  "mantos verdes (1)": "Mantos Verdes",
  "mantos verdes (2)": "Mantos Verdes",
  "mantos verdes 1": "Mantos Verdes",
  "mantos verdes 2": "Mantos Verdes",
  "mantos verdes (12-03-26)": "Mantos Verdes",
  "agrícola mantos verdes": "Mantos Verdes",
  "ag mantos verdes": "Mantos Verdes",
  "ag mantos verdes (1)": "Mantos Verdes",
  "ag mantos verdes (2)": "Mantos Verdes",
  "ag. mantos verdes": "Mantos Verdes",
  // Santa Isabel (terceros, no confundir con "Arriendo Santa Isabel")
  "santa isabel (1)": "Santa Isabel",
  "santa isabel (2)": "Santa Isabel",
  "sta isabel": "Santa Isabel",
  "ag santa isabel": "Santa Isabel",
  // Agrícola Gondesende
  "agrícola gondesende": "Agrícola Gondesende",
  "agrícola gondesende (1)": "Agrícola Gondesende",
  "agrícola gondesende (2)": "Agrícola Gondesende",
  // Santa Alejandra
  "ag santa alejandra": "Agrícola Santa Alejandra",
  "ag santa alejandra (1)": "Agrícola Santa Alejandra",
  "ag santa alejandra (2)": "Agrícola Santa Alejandra",
  // Doña Charo
  "doña charo (1)": "Doña Charo",
  "doña charo (2)": "Doña Charo",
  // Rayen Lafquen
  "rayen lafquen": "Rayen Lafquen",
  "ag. rayen lafquen": "Rayen Lafquen",
  "ag rayen lafquen": "Rayen Lafquen",
  // El Pampero
  "el pampero": "El Pampero",
  "ganadera el pampero": "El Pampero",
  // Mollendo 12-03 (aparece además del Mollendo-hotelería;
  // esta variante con fecha es un lote específico, lo mapeamos al cliente mediería/hotelería)
  // → IMPORTANTE: NO cae aquí porque "mollendo" está en MEDIEROS.
  // El sufijo "12-03" lo detectamos abajo con el normalizador regex.

  // Resto catálogo 1-a-1
  "aguas buenas": "Aguas Buenas",
  "chacaipulli": "Chacaipulli",
  "medieria chacaipulli": "Chacaipulli", // dudoso — misma zona, probable mismo origen
  "agrícola valdivia": "Agrícola Valdivia",
  "pta arena": "Punta Arenas",
  "fegosa purranque": "Fegosa Purranque",
  "fegosa purranque osorno": "Fegosa Purranque",
  "fegosa purranque & osorno": "Fegosa Purranque",
  "fegosa osorno": "Fegosa Osorno",
  "fegosa paillaco": "Fegosa Paillaco",
  "agrícola los lingues": "Agrícola Los Lingues",
  "mario hernandez": "Mario Hernández",
  "hugo reyes": "Hugo Reyes",
  "futrono": "Futrono",
  "inversiones el rocio": "Inversiones El Rocío",
  "tattersall coyhaique": "Tattersall Coyhaique",
  "tattersall río bueno": "Tattersall Río Bueno",
  "feria remehue": "Feria Remehue",
  "arlette fuentealba": "Arlette Fuentealba",
  "ganadera viento sur": "Ganadera Viento Sur",
  "josé steffen": "José Steffen",
  "purranque": "Purranque",
  "buena esperanza": "Buena Esperanza",
  "frutillar": "Frutillar",
  "winkler": "Winkler",
};

// Normaliza a clave de lookup: lowercase + trim + colapsa espacios.
function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

// Strip de sufijos con fecha tipo "Mollendo 12-03" o "Mantos Verdes (12-03-26)"
// que aparecen en xlsx cuando AgroApp versiona snapshots.
function stripDateSuffix(s: string): string {
  return s
    .replace(/\s*\(\d{1,2}-\d{1,2}(-\d{2,4})?\)\s*$/i, "")
    .replace(/\s+\d{1,2}-\d{1,2}(-\d{2,4})?\s*$/i, "")
    .trim();
}

/**
 * Resuelve un nombre de fundo / origen / destino crudo desde AgroApp
 * a una categoría SmartCow + nombre canónico.
 *
 * Si el nombre no está registrado, devuelve `kind: "externo"` con
 * `canonical` = el input trimmeado — se guarda tal cual en el ETL.
 */
export function resolveFundo(rawInput: string | null | undefined): FundoResolution {
  const raw = (rawInput ?? "").trim();
  if (!raw) return { kind: "externo", canonical: "" };

  // 1) Intento directo con la clave normalizada
  const k = normalizeKey(raw);
  if (k in PREDIOS) {
    const { canonical, tipo } = PREDIOS[k];
    return { kind: "predio", canonical, tipoTenencia: tipo };
  }
  if (k in MEDIEROS) {
    const { canonical, tipo } = MEDIEROS[k];
    return { kind: "mediero", canonical, tipoNegocio: tipo };
  }
  if (k in EXTERNOS_CANONICOS) {
    return { kind: "externo", canonical: EXTERNOS_CANONICOS[k] };
  }

  // 2) Retry stripping date suffix (ej: "Mollendo 12-03" → "Mollendo")
  const stripped = normalizeKey(stripDateSuffix(raw));
  if (stripped !== k) {
    if (stripped in PREDIOS) {
      const { canonical, tipo } = PREDIOS[stripped];
      return { kind: "predio", canonical, tipoTenencia: tipo };
    }
    if (stripped in MEDIEROS) {
      const { canonical, tipo } = MEDIEROS[stripped];
      return { kind: "mediero", canonical, tipoNegocio: tipo };
    }
    if (stripped in EXTERNOS_CANONICOS) {
      return { kind: "externo", canonical: EXTERNOS_CANONICOS[stripped] };
    }
  }

  // 3) Desconocido → externo con el valor original (trimmed)
  return { kind: "externo", canonical: raw };
}

/**
 * Lista de predios que deben existir post-seed AUT-296.
 * Consumida por `scripts/seed-agroapp-predios-medieros.ts`.
 */
export const PREDIOS_SEED: Array<{ nombre: string; tipoTenencia: "propio" | "arriendo" }> = [
  { nombre: "San Pedro", tipoTenencia: "propio" },
  { nombre: "feedlot", tipoTenencia: "propio" },
  { nombre: "Recría Feedlot", tipoTenencia: "propio" },
  { nombre: "Recría FT", tipoTenencia: "propio" },
  { nombre: "Arriendo Santa Isabel", tipoTenencia: "arriendo" },
  { nombre: "Arriendo las quebradas", tipoTenencia: "arriendo" },
];

/**
 * Lista de medieros / hoteleros que deben existir post-seed AUT-296.
 * Todos asociados al predio "feedlot" (físicamente operan ahí).
 */
export const MEDIEROS_SEED: Array<{
  nombre: string;
  tipoNegocio: "medieria" | "hoteleria";
  predioNombre: string;
}> = [
  { nombre: "Medieria FT", tipoNegocio: "medieria", predioNombre: "feedlot" },
  { nombre: "Medieria Frival", tipoNegocio: "medieria", predioNombre: "feedlot" },
  { nombre: "Medieria Oller", tipoNegocio: "medieria", predioNombre: "feedlot" },
  { nombre: "Corrales del Sur", tipoNegocio: "medieria", predioNombre: "feedlot" },
  { nombre: "Mollendo", tipoNegocio: "hoteleria", predioNombre: "feedlot" },
];
