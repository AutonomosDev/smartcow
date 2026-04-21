"use client";

/**
 * ChartKpi — Wrapper tipado para KPIs SmartCow.
 * Usa CHART_THEME. No acepta props de estilo.
 * Ticket: AUT-269
 */

import React from "react";
import { CHART_THEME, DM } from "./theme";

export interface ChartKpiItem {
  value: string | number;
  label: string;
  /** "ok" | "warn" | "bad" */
  color?: "ok" | "warn" | "bad";
  /** Delta en % (ej: 8.5 = +8.5%, -3.2 = -3.2%) */
  delta?: number;
}

export interface ChartKpiRow {
  label: string;
  value: string | number;
}

export interface ChartKpiProps {
  /** KPIs destacados (números grandes) */
  kpis: ChartKpiItem[];
  /** Filas de detalle debajo de los KPIs */
  rows?: ChartKpiRow[];
}

const COLOR_MAP: Record<string, string> = {
  ok:   CHART_THEME.colors.success,
  warn: CHART_THEME.colors.warning,
  bad:  CHART_THEME.colors.danger,
};

function DeltaBadge({ delta }: { delta: number }) {
  const isPos = delta >= 0;
  const color = isPos ? CHART_THEME.colors.success : CHART_THEME.colors.danger;
  const bg = isPos ? "#e6f3ec" : "#fde8e8";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      background: bg,
      color,
      borderRadius: 20,
      padding: "2px 7px",
      fontSize: 11,
      fontWeight: 600,
      fontFamily: DM,
      marginTop: 4,
    }}>
      {isPos ? "+" : ""}{delta.toFixed(1)}%
    </span>
  );
}

export function ChartKpi({ kpis, rows = [] }: ChartKpiProps) {
  const hasKpis = kpis && kpis.length > 0;

  if (!hasKpis) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 0", color: CHART_THEME.colors.muted,
        fontFamily: DM, fontSize: 13,
      }}>
        Sin datos
      </div>
    );
  }

  const cols = Math.min(kpis.length, 4);

  return (
    <div>
      {/* KPIs grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 12,
        marginBottom: rows.length > 0 ? 16 : 0,
      }}>
        {kpis.map((kpi, i) => {
          const color = kpi.color ? (COLOR_MAP[kpi.color] ?? CHART_THEME.colors.ink) : CHART_THEME.colors.ink;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: DM,
                fontSize: 26,
                fontWeight: 600,
                color,
                letterSpacing: "-.3px",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1.1,
              }}>
                {kpi.value}
              </div>
              {kpi.delta !== undefined && <DeltaBadge delta={kpi.delta} />}
              <div style={{
                fontFamily: DM,
                fontSize: 11,
                fontWeight: 400,
                color: CHART_THEME.colors.ink4,
                marginTop: kpi.delta !== undefined ? 4 : 6,
              }}>
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider + rows */}
      {rows.length > 0 && (
        <>
          <div style={{ height: ".5px", background: CHART_THEME.colors.divider, margin: "4px 0 12px" }} />
          {rows.map((row, i) => (
            <div key={i}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 0",
              }}>
                <span style={{
                  fontFamily: DM, fontSize: CHART_THEME.font.sizeLabel,
                  fontWeight: 400, color: CHART_THEME.colors.ink3,
                }}>
                  {row.label}
                </span>
                <span style={{
                  fontFamily: DM, fontSize: CHART_THEME.font.sizeLabel,
                  fontWeight: 600, color: CHART_THEME.colors.ink,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {row.value}
                </span>
              </div>
              {i < rows.length - 1 && (
                <div style={{ height: ".5px", background: CHART_THEME.colors.divider, margin: "2px 0" }} />
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
