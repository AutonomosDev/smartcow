/**
 * theme.ts — Única fuente de verdad para estilos de charts SmartCow.
 * Ticket: AUT-269
 *
 * Colores extraídos de PALETTE en artifacts-sidebar.tsx + packages/tokens/theme.ts.
 * DM Sans, forest #1e3a2f, palette cálida café/crema — 100% light theme.
 */

export const CHART_THEME = {
  colors: {
    primary:   "#1e3a2f",  // forest — dato principal, barras, líneas
    secondary: "#c9a961",  // ocre dorado — dato secundario
    success:   "#2d7a4f",  // verde — bueno / ok
    warning:   "#d4a547",  // amarillo — alerta
    danger:    "#b44a3e",  // rojo — malo
    neutral:   "#6b5d4f",  // marrón — referencia
    grid:      "#f0ede8",  // divider claro
    text:      "#2a2522",  // marrón oscuro (principal)
    muted:     "#8a7b6d",  // marrón claro (labels)
    ink:       "#1a1a1a",  // texto oscuro
    ink2:      "#555555",  // texto secundario
    ink3:      "#888888",  // labels
    ink4:      "#bbbbbb",  // micro-labels
    card:      "#ffffff",
    cardBd:    "#e8e5df",
    divider:   "#f0ede8",
  },
  font: {
    family: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
    sizeTick:  11,
    sizeLabel: 13,
    sizeTitle: 15,
  },
  stroke: {
    width: 2,
    cap: "round" as const,
  },
  bar: {
    radius: [4, 4, 0, 0] as [number, number, number, number],
    maxWidth: 40,
    gap: "20%",
  },
  grid: {
    strokeDasharray: "2 4",
    vertical: false,
  },
  tooltip: {
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
  },
  donut: {
    innerRadius: "55%",
    outerRadius: "78%",
    paddingAngle: 2,
  },
} as const;

export const SERIES_PALETTE = [
  "#1e3a2f", // forest
  "#c9a961", // ocre
  "#2d7a4f", // verde
  "#b44a3e", // rojo
  "#6b5d4f", // marrón
  "#d4a547", // amarillo
  "#8a7b6d", // marrón claro
  "#4a6759", // forest secundario
] as const;

export const DM = "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)";
