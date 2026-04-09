/**
 * modules.ts — Helper de feature flags por organización.
 * Ticket: AUT-129
 *
 * hasModule(orgId, 'feedlot') → boolean
 * Usado en middleware/server actions antes de exponer endpoints de módulo.
 *
 * Comportamiento definido en ticket:
 *   org.modulos.feedlot = false → UI no muestra sección feedlot
 *   org.modulos.crianza = false → UI no muestra reproductivo
 */

import { db } from "@/src/db/client";
import { organizaciones } from "@/src/db/schema/index";
import { eq } from "drizzle-orm";

export type ModuloKey = "feedlot" | "crianza";

/**
 * Verifica si una organización tiene habilitado un módulo específico.
 * Retorna false si la org no existe, si el módulo no está definido,
 * o si está explícitamente en false.
 *
 * @param orgId - ID de la organización
 * @param modulo - Clave del módulo a verificar ('feedlot' | 'crianza')
 */
export async function hasModule(orgId: number, modulo: ModuloKey): Promise<boolean> {
  const result = await db
    .select({ modulos: organizaciones.modulos })
    .from(organizaciones)
    .where(eq(organizaciones.id, orgId))
    .limit(1);

  const org = result[0];
  if (!org?.modulos) return false;

  return org.modulos[modulo] === true;
}
