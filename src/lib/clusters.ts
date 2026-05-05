/**
 * clusters.ts — Resolutores de clusters lógicos de predios.
 * AUT-333: un "cluster" agrupa predios relacionados por jerarquía operacional.
 *
 * CLUSTER_FEEDLOT: la operación Feedlot (predio_id=14) + sus unidades de negocio hijas.
 */

import { db } from "@/src/db/client";
import { predios } from "@/src/db/schema/index";
import { eq, or } from "drizzle-orm";

export const OPERACION_FEEDLOT_PREDIO_ID = 14;

export interface ClusterPredioDef {
  id: number;
  nombre: string;
  tipoEntidad: string;
  tipoNegocio: string | null;
}

export const CLUSTER_FEEDLOT = {
  /**
   * Retorna la operación Feedlot + todas sus unidades de negocio (parent_predio_id=14).
   * Filtra por org_id para evitar cross-tenant.
   */
  resolve: async (orgId: number): Promise<ClusterPredioDef[]> => {
    const rows = await db
      .select({
        id: predios.id,
        nombre: predios.nombre,
        tipoEntidad: predios.tipoEntidad,
        tipoNegocio: predios.tipoNegocio,
      })
      .from(predios)
      .where(
        or(
          eq(predios.id, OPERACION_FEEDLOT_PREDIO_ID),
          eq(predios.parentPredioId, OPERACION_FEEDLOT_PREDIO_ID)
        )
      );

    return rows.filter((r) => r.tipoEntidad !== undefined) as ClusterPredioDef[];
  },

  /**
   * Solo los IDs del cluster (operación + unidades de negocio).
   * Útil para queries WHERE predio_id IN (...).
   */
  resolveIds: async (orgId: number): Promise<number[]> => {
    const rows = await CLUSTER_FEEDLOT.resolve(orgId);
    return rows.map((r) => r.id);
  },

  /**
   * IDs de unidades de negocio PROPIAS del feedlot (excluye mediería/hotelería).
   * Usados en armar_ofrecimiento_venta para resguardo: solo interno + recria_propia.
   */
  resolveUnidadesPropias: async (orgId: number): Promise<number[]> => {
    const rows = await CLUSTER_FEEDLOT.resolve(orgId);
    return rows
      .filter((r) =>
        r.tipoNegocio === "interno" || r.tipoNegocio === "recria_propia"
      )
      .map((r) => r.id);
  },
};
