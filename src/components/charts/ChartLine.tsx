"use client";

/**
 * ChartLine — Wrapper tipado para gráficos de línea SmartCow.
 * Usa CHART_THEME. No acepta props de estilo.
 * Ticket: AUT-269
 */

import React, { useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_THEME, DM } from "./theme";

export interface ChartLineDataPoint {
  x: string | number;
  y: number;
}

export interface ChartLineProps {
  data: ChartLineDataPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
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

export function ChartLine({ data, xLabel, yLabel, height = 260 }: ChartLineProps) {
  const hasData = data && data.length > 0;

  const CustomTooltip = useCallback(({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
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
        <div>{typeof payload[0].value === "number" ? payload[0].value.toLocaleString("es-CL") : payload[0].value}</div>
      </div>
    );
  }, []);

  const handleDownload = useCallback(() => {
    const svg = document.querySelector(".cw-chartline svg") as SVGSVGElement | null;
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
      <div className="cw-chartline" style={{ width: "100%", height }}>
        {!hasData ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 4 }}
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
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: gridColor }} />
              <Line
                type="monotone"
                dataKey="y"
                stroke={CHART_THEME.colors.primary}
                strokeWidth={CHART_THEME.stroke.width}
                dot={{ fill: CHART_THEME.colors.primary, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
