# SmartCow DS — Token Reference

Fuente: `docs/design/smartcow-design-system-web-chat/project/colors_and_type.css`

---

## Colores

### Backgrounds

| Token CSS | Hex | `const C` key | Uso |
|-----------|-----|---------------|-----|
| `--sc-bg` | `#f8f6f1` | `note` | Fondo de pantalla, cards de nota |
| `--sc-card` | `#ffffff` | — | Surfaces blancas puras |
| `--sc-cream` | `#ebe9e3` | `cream` | Chips, avatares sin foto, offline |

### Brand

| Token CSS | Hex | `const C` key | Uso |
|-----------|-----|---------------|-----|
| `--sc-primary` | `#1e3a2f` | `green` | Botones CTA, hero verde, íconos activos |
| `--sc-accent` | `#7ecfa0` | `leaf` | OK, acento sobre fondo oscuro, chart fill |

### Semántica

| Token CSS | Hex | `const C` key | Uso |
|-----------|-----|---------------|-----|
| `--sc-danger` | `#e74c3c` | — | Alertas destructivas |
| `--sc-warning` | `#f39c12` | — | Advertencias |
| `--sc-info` | `#1a5276` | `blueFg` | Info, links, estados informativos |

### Ink (texto)

| Token CSS | Hex | `const C` key | Uso |
|-----------|-----|---------------|-----|
| `--sc-ink-1` | `#1a1a1a` | `ink1` | Texto primario |
| `--sc-ink-2` | `#888888` | `ink2` | Texto secundario, subtítulos, meta |
| `--sc-ink-3` | `#bbbbbb` | `ink3` | Texto muted, labels, hints |
| `--sc-ink-4` | `#f0ede8` | — | Dividers, bordes suaves |

### Badges (bg / fg pairs)

| Estado | bg | fg |
|--------|----|----|
| urgente | `#fde8e8` | `#c0392b` |
| warn | `#fdf0e6` | `#9b5e1a` (`warnFg`) |
| ok | `#e6f3ec` | `#1e3a2f` (`green`) |
| info | `#e6f0f8` | `#1a5276` (`blueFg`) |
| neutro | `#ebe9e3` | `#666666` |

### Variantes en componentes (no en CSS vars, sí en uso real)

| Hex | Uso |
|-----|-----|
| `#e8e5dd` | `noteBd` — borde de cards de nota |
| `#fafaf7` | Variante note usada en dashboard-artifact |

---

## Radio

**Un solo radio: `8px` en toda la app.**

| Token | Valor | Contexto |
|-------|-------|---------|
| `--sc-radius` | `8px` | Default |
| `--sc-r-sm` | `8px` | Small |
| `--sc-r-btn` | `8px` | Botones |
| `--sc-r-card` | `8px` | Cards |
| `--sc-r-hero` | `8px` | Hero panels |
| `--sc-r-chip` | `8px` | Chips, badges |
| `--sc-r-pill` | `8px` | Pills |
| — | `50%` | **Solo** círculos (avatares, dots) |

> `24px` fue superseded. `border-radius: 8` es la única regla.

---

## Spacing

| Token | Valor | Uso típico |
|-------|-------|-----------|
| `--sc-s-xs` | `4px` | Gap interno mínimo |
| `--sc-s-sm` | `8px` | Gap entre elementos relacionados |
| `--sc-s-md` | `12px` | Padding interno de card |
| `--sc-s-lg` | `16px` | Padding lateral de pantalla (siempre) |
| `--sc-s-xl` | `24px` | Separación entre secciones |
| `--sc-s-2xl` | `32px` | Margen de hero |

---

## Tipografía

**Fuente única: `DM Sans`** — weights 400 / 500 / 600 exclusivamente.
**Monospace: `JetBrains Mono`** — para valores numéricos (tabular-nums).

```
const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
```

| Escala | Token CSS | Weight | Size | Line-height | Uso |
|--------|-----------|--------|------|-------------|-----|
| display | `--sc-t-display` | 600 | 28px | 32px | Hero, números grandes |
| section | `--sc-t-section` | 600 | 20px | 24px | Cabeceras de sección |
| screen | `--sc-t-screen` | 600 | 16px | 20px | Títulos de pantalla |
| card | `--sc-t-card` | 600 | 14px | 18px | Títulos de card, nombre lote |
| body | `--sc-t-body` | 500 | 13px | 18px | Contenido principal |
| sub | `--sc-t-sub` | 400 | 11px | 14px | Subtítulos, metadata |
| label | `--sc-t-label` | 400 | 10px | 13px | Labels, hints |
| micro | `--sc-t-micro` | 600 | 9px | 12px | Uppercase labels en hero |

---

## Paleta de charts

```tsx
const PALETTE = ["#1e3a2f", "#7ecfa0", "#1a5276", "#9b5e1a", "#888888", "#bbbbbb"];
//               green      leaf       blueFg     warnFg     ink2       ink3
```
