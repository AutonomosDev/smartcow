---
name: front-end
description: >
  Activar cuando se pida cualquier trabajo de UI, componente React, pantalla,
  color, layout, botón, card, dashboard, artifact, hero, modal, formulario,
  sidebar, chat panel, o diseño visual para SmartCow. SIEMPRE usar este skill.
  Nunca inventar tokens ni importar design systems externos.
---

# SmartCow — Front-End Design System

Fuente canónica **única**:
`docs/design/smartcow-design-system-web-chat/project/`

Cualquier otro HTML en `docs/design/` raíz (smartcow_chat_web_v2.html, v3.html, etc.)
son drafts descartados. **No usarlos**.

---

## Antes de escribir una línea de código

1. Leer `references/tokens.md` — tokens de color, tipo y espaciado
2. Leer `references/forbidden.md` — si algo está ahí, no se hace
3. Para componente nuevo: leer `assets/component-template.tsx` + `assets/gold-standard.tsx`
4. Para pantalla nueva: mirar `docs/design/smartcow-design-system-web-chat/project/preview/`

---

## Tres reglas que no se negocian

1. **DM Sans únicamente** — weights 400 / 500 / 600. Sin excepciones.
2. **Verde bosque `#1e3a2f` + cream `#f8f6f1`** — sin púrpura, sin degradados (excepto glassmorphism sobre foto hero).
3. **Español chileno operacional** — sentence case, sin exclamaciones, sin calidez de IA. Términos exactos: `Fundo`, `Lote`, `Potrero`, `DIIO`, `GDP`, `ODEPA`, `bastón XRS2i`, `faena`, `preñez`, `destete`.

---

## Patrón de output obligatorio

Todo componente React/TSX debe:

```tsx
// Tokens canónicos DS — docs/design/smartcow-design-system-web-chat
const C = {
  ink1: "#1a1a1a",
  ink2: "#888888",
  ink3: "#bbbbbb",
  cream: "#ebe9e3",
  note: "#f8f6f1",
  noteBd: "#e8e5dd",
  green: "#1e3a2f",
  leaf: "#7ecfa0",
  blueFg: "#1a5276",
  warnFg: "#9b5e1a",
};
const FONT_SANS = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
```

**Nunca** Tailwind classes de color (`bg-blue-500`, `text-gray-300`).
**Siempre** inline styles con tokens de `C`.

---

## Componentes canónicos — cuándo usar cada uno

Ver `references/components.md` para el índice completo.

Mapa rápido:
- **Shell chat**: `chat_web_app.jsx` — no duplicar
- **Mensajes/tablas inline**: `chat_web_messages.jsx`
- **Panel artifact (reporte, dashboard, KPI)**: `chat_web_artifact.jsx`
- **Nav lateral**: `chat_web_sidebar.jsx`
- **Íconos**: `chat_web_icons.jsx` → `Ico.nombre()` — nunca Lucide directo
- **Componentes aislados**: `preview/component-*.html` — 13 disponibles

---

## Radio, espaciado y tipografía

- **Radio**: 8px en toda la app. Sin excepciones. Círculos: `border-radius: 50%`.
- **Spacing**: xs 4 / sm 8 / md 12 / lg 16 / xl 24 / 2xl 32
- **Tipografía** (weight · size):
  - Display: 600 · 28px (hero, números grandes)
  - Section: 600 · 20px
  - Screen: 600 · 16px
  - Card title: 600 · 14px
  - Body: 500 · 13px
  - Sub: 400 · 11px
  - Label: 400 · 10px
  - Micro: 600 · 9px uppercase

---

## Badges semánticos

| Estado | bg | fg |
|--------|----|----|
| urgente | `#fde8e8` | `#c0392b` |
| warn | `#fdf0e6` | `#9b5e1a` |
| ok | `#e6f3ec` | `#1e3a2f` |
| info | `#e6f0f8` | `#1a5276` |
| neutro | `#ebe9e3` | `#666666` |

---

## Paleta de charts

```tsx
const PALETTE = ["#1e3a2f", "#7ecfa0", "#1a5276", "#9b5e1a", "#888888", "#bbbbbb"];
```

---

## Verificación post-implementación

```bash
python .claude/skills/front-end/scripts/validate-tokens.py <archivo.tsx>
# Exit 0 = sin violaciones. Exit 1 = lista de infracciones.
```

Si hay violaciones → corregir antes de reportar done.
