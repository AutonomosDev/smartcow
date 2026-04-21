"use client";

/**
 * ChartDonut — Wrapper tipado para gráficos de donut SmartCow.
 * Usa CHART_THEME. No acepta props de estilo.
 * Ticket: AUT-269
 */

import React, { useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_THEME, SERIES_PALETTE, DM } from "./theme";

export interface ChartDonutDataPoint {
  label: string;
  value: number;
}

export interface ChartDonutProps {
  data: ChartDonutDataPoint[];
  height?: number;
}

function EmptyState() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", color: CHART_THEME.colors.muted, fontFamily: DM,
      fontSize: 13,
    }}>
      Sin datos
    </div>
  );
}

export function ChartDonut({ data, height = 260 }: ChartDonutProps) {
  const hasData = data && data.length > 0;

  const rechartData = hasData
    ? data.map((d) => ({ name: d.label, value: d.value }))
    : [];

  const total = rechartData.reduce((acc, d) => acc + d.value, 0);

  const CustomTooltip = useCallback(({ active, payload }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
    const pct = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : "0";
    return (
      <div style={{
        background: CHART_THEME.colors.card,
        border: `.5px solid ${CHART_THEME.colors.cardBd}`,
        borderRadius: CHART_THEME.tooltip.borderRadius,
        boxShadow: CHART_THEME.tooltip.boxShadow,
        padding: "8px 12px",
        fontFamily: DM,
        fontSize: CHART_THEME.tooltip.fontSize,
        color: CHART_THEME.colors.ink,
      }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].name}</div>
        <div>{payload[0].value.toLocaleString("es-CL")} ({pct}%)</div>
      </div>
    );
  }, [total]);

  const handleDownload = useCallback(() => {
    const svg = document.querySelector(".cw-chartdonut svg") as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "chart.svg"; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <button
        onClick={handleDownload}
        title="Descargar gráfico"
        style={{
          position: "absolute", top: 0, right: 0, zIndex: 1,
          background: "none", border: "none", cursor: "pointer",
          color: CHART_THEME.colors.ink3, padding: "2px 4px",
          fontFamily: DM, fontSize: 11,
        }}
      >
        ↓
      </button>
      <div className="cw-chartdonut" style={{ width: "100%", height }}>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rechartData}
                dataKey="value"
                nameKey="name"
                innerRadius={CHART_THEME.donut.innerRadius}
                outerRadius={CHART_THEME.donut.outerRadius}
                paddingAngle={CHART_THEME.donut.paddingAngle}
                startAngle={90}
                endAngle={-270}
              >
                {rechartData.map((_entry, i) => (
                  <Cell
                    key={i}
                    fill={SERIES_PALETTE[i % SERIES_PALETTE.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontFamily: DM,
                  fontSize: 12,
                  color: CHART_THEME.colors.ink2,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
