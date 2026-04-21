"use client";

/**
 * ChartBar — Wrapper tipado para gráficos de barras SmartCow.
 * Usa CHART_THEME. No acepta props de estilo (fuente única de verdad).
 * Ticket: AUT-269
 */

import React, { useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_THEME, SERIES_PALETTE, DM } from "./theme";

export interface ChartBarDataPoint {
  x: string | number;
  y?: number;
  [key: string]: string | number | undefined;
}

export interface ChartBarProps {
  data: ChartBarDataPoint[];
  /** Etiqueta del eje X */
  xLabel?: string;
  /** Etiqueta del eje Y */
  yLabel?: string;
  /** Título del gráfico (se renderiza arriba del chart, no en ArtCard) */
  title?: string;
  /** Altura en px (default 260) */
  height?: number;
  /** Si los datos tienen múltiples series (keys distintos a "x") */
  multiSeries?: boolean;
}

const axisStyle = {
  fill: CHART_THEME.colors.ink3,
  fontSize: CHART_THEME.font.sizeTick,
  fontFamily: DM,
} as const;

const gridColor = CHART_THEME.colors.grid;

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

export function ChartBar({ data, xLabel, yLabel, height = 260, multiSeries }: ChartBarProps) {
  const hasData = data && data.length > 0;

  // Detectar series automáticamente si multiSeries
  const seriesKeys = multiSeries && hasData
    ? Object.keys(data[0]).filter((k) => k !== "x")
    : ["y"];

  // Formateador de tooltip custom
  const CustomTooltip = useCallback(({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (!active || !payload || payload.length === 0) return null;
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
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {multiSeries ? `${p.name}: ` : ""}{typeof p.value === "number" ? p.value.toLocaleString("es-CL") : p.value}
          </div>
        ))}
      </div>
    );
  }, [multiSeries]);

  // Download PNG
  const handleDownload = useCallback(() => {
    const svg = document.querySelector(".cw-chartbar svg") as SVGSVGElement | null;
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
      <div className="cw-chartbar" style={{ width: "100%", height }}>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                stroke={gridColor}
                strokeDasharray={CHART_THEME.grid.strokeDasharray}
                vertical={CHART_THEME.grid.vertical}
              />
              <XAxis
                dataKey="x"
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                label={xLabel ? {
                  value: xLabel,
                  position: "insideBottom",
                  offset: -2,
                  style: { fill: CHART_THEME.colors.ink3, fontSize: 10, fontFamily: DM },
                } : undefined}
              />
              <YAxis
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                label={yLabel ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: CHART_THEME.colors.ink3, fontSize: 10, fontFamily: DM, textAnchor: "middle" },
                } : undefined}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART_THEME.colors.divider }} />
              {multiSeries && <Legend wrapperStyle={{ fontFamily: DM, fontSize: 12 }} />}
              {seriesKeys.map((key, idx) =>
                multiSeries ? (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={SERIES_PALETTE[idx % SERIES_PALETTE.length]}
                    radius={CHART_THEME.bar.radius}
                  />
                ) : (
                  <Bar key="y" dataKey="y" radius={CHART_THEME.bar.radius}>
                    {data.map((_entry, i) => (
                      <Cell key={i} fill={SERIES_PALETTE[i % SERIES_PALETTE.length]} />
                    ))}
                  </Bar>
                )
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
