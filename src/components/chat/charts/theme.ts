/**
 * theme.ts — Design tokens canónicos para charts / tablas / KPIs del chat SmartCow.
 * Ticket: AUT-269 (visual dashboard mode).
 *
 * Fuente única de verdad. Todos los wrappers de `src/components/chat/charts/`
 * y el artifact renderer en `artifacts-sidebar.tsx` deben consumir estos tokens.
 * No aceptar overrides por prop — si algo no encaja, ajustar este archivo.
 *
 * Alineado con:
 *  - `app/globals.css` (@theme + `--cw-*` vars, forest #1e3a2f)
 *  - `apps/mobile/src/components/generative/ArtifactRenderer.tsx` (paleta mobile)
 */

export const CHART_THEME = {
  colors: {
    primary: "#1e3a2f",    // forest — dato principal / acento positivo
    secondary: "#c9a961",  // ocre — dato secundario / objetivo
    success: "#2d7a4f",    // verde medio — "bueno"
    warning: "#d4a547",    // amarillo — alerta suave
    danger: "#b44a3e",     // rojo terroso — "malo"
    neutral: "#6b5d4f",    // marrón — referencia
    grid: "#f0ede8",       // divider claro (== --cw-fog)
    cardBorder: "#e8e5df", // borde de card
    card: "#ffffff",
    text: "#1a1a1a",       // texto principal
    textMuted: "#555555",
    textSubtle: "#888888",
    textFaint: "#bbbbbb",
  },
  font: {
    family: "var(--font-dm-sans, 'DM Sans', system-ui, sans-serif)",
    sizeTick: 11,
    sizeLabel: 13,
    sizeTitle: 15,
    sizeKpi: 24,
    sizeKpiLabel: 11,
  },
  stroke: {
    width: 2,
    cap: "round" as const,
  },
  bar: {
    radius: 4,
    maxWidth: 40,
    categoryGap: "20%",
    histogramGap: "4%",
  },
  grid: {
    strokeDasharray: "2 4",
    vertical: false,
  },
  card: {
    radius: 12,
    padding: 16,
    headerPadding: "10px 16px",
    headerFontSize: 13,
    maxWidth: 640,
  },
  chart: {
    height: 260,
    margin: { top: 8, right: 12, left: 0, bottom: 4 },
  },
  tooltip: {
    borderRadius: 8,
    shadow: "0 2px 8px rgba(0,0,0,.08)",
    fontSize: 12,
  },
} as const;

/**
 * Paleta ordenada para series múltiples (N series, N colores).
 * Índice 0 = color primary (forest). Usa SERIES_PALETTE[i % SERIES_PALETTE.length].
 */
export const SERIES_PALETTE = [
  "#1e3a2f", // forest (primary)
  "#c9a961", // ocre (secondary)
  "#2d7a4f", // verde medio
  "#b44a3e", // rojo terroso
  "#6b5d4f", // marrón
  "#d4a547", // amarillo
  "#8a7b6d", // gris terroso
  "#4a6759", // verde-gris
] as const;

/**
 * Estados semánticos para rows/KPIs (color coding de tabla/kpi).
 */
export const STATE_COLOR: Record<string, string> = {
  ok: CHART_THEME.colors.primary,
  good: CHART_THEME.colors.success,
  warn: CHART_THEME.colors.warning,
  bad: CHART_THEME.colors.danger,
  orange: CHART_THEME.colors.warning,
  neutral: CHART_THEME.colors.text,
};

/**
 * Helper: resolver un color semántico. Default = text.
 */
export function resolveStateColor(state?: string): string {
  if (!state) return CHART_THEME.colors.text;
  return STATE_COLOR[state] ?? CHART_THEME.colors.text;
}
