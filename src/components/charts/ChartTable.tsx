"use client";

/**
 * ChartTable — Wrapper tipado para tablas de datos SmartCow.
 * Usa CHART_THEME. No acepta props de estilo.
 * Ticket: AUT-269
 */

import React from "react";
import { CHART_THEME, DM } from "./theme";

export interface ChartTableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  /** "ok" | "warn" | "bad" para colorear celdas de valor */
  colorKey?: string;
}

export interface ChartTableRow {
  [key: string]: string | number | null | undefined;
}

export interface ChartTableProps {
  columns: ChartTableColumn[];
  rows: ChartTableRow[];
}

const COLOR_MAP: Record<string, string> = {
  ok:   CHART_THEME.colors.success,
  warn: CHART_THEME.colors.warning,
  bad:  CHART_THEME.colors.danger,
};

function EmptyState() {
  return (
    <tr>
      <td
        colSpan={99}
        style={{
          textAlign: "center", padding: "24px 0",
          color: CHART_THEME.colors.muted, fontFamily: DM,
          fontSize: 13,
        }}
      >
        Sin datos
      </td>
    </tr>
  );
}

export function ChartTable({ columns, rows }: ChartTableProps) {
  const hasData = rows && rows.length > 0;

  return (
    <div style={{
      width: "100%",
      overflowX: "auto",
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: DM,
        fontSize: CHART_THEME.font.sizeLabel,
      }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: col.align ?? "left",
                  padding: "0 12px 10px 0",
                  color: CHART_THEME.colors.ink3,
                  fontWeight: 500,
                  fontSize: 11,
                  letterSpacing: ".2px",
                  borderBottom: `.5px solid ${CHART_THEME.colors.divider}`,
                  fontFamily: DM,
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!hasData ? (
            <EmptyState />
          ) : (
            rows.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col, ci) => {
                  const val = row[col.key];
                  const colorVal = col.colorKey ? String(row[col.colorKey] ?? "") : undefined;
                  const color = colorVal ? (COLOR_MAP[colorVal] ?? CHART_THEME.colors.ink) : CHART_THEME.colors.ink;
                  const isLast = ri === rows.length - 1;
                  return (
                    <td
                      key={ci}
                      style={{
                        textAlign: col.align ?? "left",
                        padding: "7px 12px 7px 0",
                        color: ci > 0 ? color : CHART_THEME.colors.ink,
                        fontWeight: ci > 0 ? 600 : 400,
                        fontSize: CHART_THEME.font.sizeLabel,
                        fontFamily: DM,
                        borderBottom: isLast ? "none" : `.5px solid ${CHART_THEME.colors.divider}`,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {val != null ? String(val) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
