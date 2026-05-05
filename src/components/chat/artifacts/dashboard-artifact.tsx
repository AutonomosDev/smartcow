"use client";

import React from "react";

export interface CategoriaSegment {
  nombre: string;
  count: number;
}

export interface PredioDistribucion {
  predioId: number;
  predioNombre: string;
  segments: CategoriaSegment[];
}

export interface DashboardData {
  predios: PredioDistribucion[];
}

const fmt = (n: number) => n.toLocaleString("es-CL");
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100);

// Tokens canónicos del DS — docs/design/smartcow-design-system-web-chat
const C = {
  ink1: "#1a1a1a",
  ink2: "#888888",
  ink3: "#bbbbbb",
  cream: "#ebe9e3",
  note: "#fafaf7",
  noteBd: "#e8e5dd",
  green: "#1e3a2f",
  leaf: "#7ecfa0",
  blueFg: "#1a5276",
  warnFg: "#9b5e1a",
};

// Paleta oficial del DS para charts (chat_web.html .art-chart .fill / .leaf / .blue / .warn / .ink)
const PALETTE = [C.green, C.leaf, C.blueFg, C.warnFg, C.ink2, C.ink3];

const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

export function DashboardArtifact({ data }: { data: DashboardData }) {
  const predios = data.predios.filter(
    (p) => p.segments.some((s) => s.count > 0)
  );

  if (predios.length === 0) {
    return (
      <div
        style={{
          background: C.note,
          border: `.5px solid ${C.noteBd}`,
          borderRadius: 8,
          padding: "14px 16px",
          fontFamily: FONT_SANS,
          fontSize: 13,
          color: C.ink2,
          maxWidth: 360,
        }}
      >
        Sin animales vivos.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
      {predios.map((p) => (
        <DonutBlock key={p.predioId} predio={p} />
      ))}
    </div>
  );
}

function DonutBlock({ predio }: { predio: PredioDistribucion }) {
  const segments = predio.segments.filter((s) => s.count > 0);
  const total = segments.reduce((a, s) => a + s.count, 0);

  const size = 140;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  let acumulado = 0;
  const arcs = segments.map((s, i) => {
    const fraction = s.count / total;
    const dash = fraction * circumference;
    const offset = -acumulado;
    acumulado += dash;
    return {
      ...s,
      color: PALETTE[i % PALETTE.length],
      pct: pct(s.count, total),
      dash,
      gap: circumference - dash,
      offset,
    };
  });

  return (
    <div
      style={{
        background: C.note,
        border: `.5px solid ${C.noteBd}`,
        borderRadius: 8,
        padding: "14px 16px",
        fontFamily: FONT_SANS,
        color: C.ink1,
        maxWidth: 460,
      }}
    >
      <div
        style={{
          fontFamily: FONT_SANS,
          fontSize: 14,
          fontWeight: 600,
          color: C.ink1,
          marginBottom: 10,
        }}
      >
        {predio.predioNombre}
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.cream} strokeWidth={stroke} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcs.map((a) => (
              <circle
                key={a.nombre}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={a.color}
                strokeWidth={stroke}
                strokeDasharray={`${a.dash} ${a.gap}`}
                strokeDashoffset={a.offset}
              />
            ))}
          </g>
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            style={{
              fontFamily: FONT_SANS,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.3,
              fill: C.ink1,
            }}
          >
            {fmt(total)}
          </text>
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            style={{
              fontFamily: FONT_SANS,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 0.3,
              textTransform: "uppercase",
              fill: C.ink2,
            }}
          >
            vivos
          </text>
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          {arcs.map((a) => (
            <div
              key={a.nombre}
              style={{
                display: "grid",
                gridTemplateColumns: "9px 1fr auto auto",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: a.color,
                }}
              />
              <span style={{ color: C.ink1, fontWeight: 500 }}>{a.nombre}</span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: C.ink2,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                }}
              >
                {fmt(a.count)}
              </span>
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  fontWeight: 400,
                  color: C.ink3,
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "right",
                  minWidth: 32,
                }}
              >
                {a.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
