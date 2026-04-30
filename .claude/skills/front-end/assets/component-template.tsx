"use client";

import React from "react";

// Tokens canónicos DS — docs/design/smartcow-design-system-web-chat
const C = {
  ink1:   "#1a1a1a",
  ink2:   "#888888",
  ink3:   "#bbbbbb",
  cream:  "#ebe9e3",
  note:   "#f8f6f1",
  noteBd: "#e8e5dd",
  green:  "#1e3a2f",
  leaf:   "#7ecfa0",
  blueFg: "#1a5276",
  warnFg: "#9b5e1a",
};

// Solo para valores numéricos tabulares (conteos, kg, %, fechas)
const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

// Paleta para charts/donuts — en orden de uso
// const PALETTE = [C.green, C.leaf, C.blueFg, C.warnFg, C.ink2, C.ink3];

// ─── Props ────────────────────────────────────────────────────────────────────

interface NombreProps {
  // definir aquí — nombres en español cuando sean domain-specific
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function NombreComponente({ }: NombreProps) {
  return (
    <div
      style={{
        background: C.note,
        border: `.5px solid ${C.noteBd}`,
        borderRadius: 8,
        padding: "14px 16px",
        fontFamily: FONT_SANS,
        color: C.ink1,
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: C.ink1,
          marginBottom: 10,
        }}
      >
        Título del componente
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: C.ink2,
        }}
      >
        contenido
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
// Definir aquí sub-componentes privados (no exportar salvo necesidad)
