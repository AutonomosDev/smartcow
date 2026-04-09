/**
 * constants/colors.ts — Design tokens Stanley Edition (SmartCow)
 * Mirrors web globals.css @theme block
 */

export const Colors = {
  brand: {
    dark: "#06200F",
    light: "#9ADF59",
  },
  farm: {
    base: "#F4F6F5",
    surface: "#FFFFFF",
  },
  accent: {
    warning: "#F97316",
    neutral: "#8B7280",
  },
  ink: {
    title: "#111827",
    body: "#4B5563",
    meta: "#9CA3AF",
  },
  priority: {
    high: "#EF4444",
    medium: "#F97316",
    low: "#22C55E",
  },
} as const;
