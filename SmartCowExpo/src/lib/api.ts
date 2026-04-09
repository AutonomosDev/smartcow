/**
 * src/lib/api.ts — API client mobile para endpoints REST del backend.
 * Reutiliza apiFetch() de auth-client.ts (añade Bearer automáticamente).
 */

import { apiFetch } from "./auth-client";

export interface FundoKpis {
  lotesActivos: number;
  totalAnimales: number;
  ultimoPesaje: { fecha: string; pesoKg: number } | null;
}

export interface LoteResumen {
  id: number;
  nombre: string;
  totalAnimales: number;
  fechaEntrada: string;
  objetivoPesoKg: number | null;
  estado: string;
}

export interface LoteDetalle {
  id: number;
  nombre: string;
  fechaEntrada: string;
  fechaSalidaEstimada: string | null;
  objetivoPesoKg: number | null;
  estado: string;
  totalAnimales: number;
  avgPesoActualKg: number | null;
  avgPesoEntradaKg: number | null;
  diasEnLote: number;
  gdpKgDia: number | null;
}

export async function fetchKpis(fundoId: number): Promise<FundoKpis> {
  const res = await apiFetch(`/api/fundo/${fundoId}/kpis`);
  if (!res.ok) throw new Error(`KPIs error ${res.status}`);
  return res.json() as Promise<FundoKpis>;
}

export async function fetchLotes(fundoId: number): Promise<LoteResumen[]> {
  const res = await apiFetch(`/api/fundo/${fundoId}/lotes`);
  if (!res.ok) throw new Error(`Lotes error ${res.status}`);
  return res.json() as Promise<LoteResumen[]>;
}

export async function fetchLoteDetalle(loteId: number): Promise<LoteDetalle> {
  const res = await apiFetch(`/api/lotes/${loteId}`);
  if (!res.ok) throw new Error(`Lote detalle error ${res.status}`);
  return res.json() as Promise<LoteDetalle>;
}
