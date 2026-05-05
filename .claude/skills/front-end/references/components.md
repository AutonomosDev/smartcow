# SmartCow DS — Component Index

Fuente canónica: `docs/design/smartcow-design-system-web-chat/project/`

---

## Componentes JSX principales

| Archivo | Componente | Cuándo usar |
|---------|-----------|-------------|
| `chat_web_app.jsx` | `App` | Shell principal del chat (layout, drag split, state global). **No duplicar.** |
| `chat_web_messages.jsx` | `Messages` | Bubbles de usuario, respuestas del asistente, tablas de datos inline, `.chat-note` para KPIs |
| `chat_web_artifact.jsx` | `Artifact` | Panel derecho — reportes, dashboards, KPIs, tablas expandidas |
| `chat_web_sidebar.jsx` | `Sidebar` | Nav lateral — historial de sesiones, proyectos, comandos pin |
| `chat_web_icons.jsx` | `Ico.*` | Todos los íconos SVG. **Siempre `Ico.nombre()`, nunca importar Lucide directo** |

### Íconos disponibles en `Ico`

hamburger, sidebar, sidebarRight, folder, chevron, plus, zap, database,
chat, sliders, copy, refresh, branch, arrowRight, share, save, download,
x, more, plug, paperclip, mic, bookmark, eye, alert, play, search,
**cow** (logo SmartCow custom)

---

## Componentes preview aislados

`docs/design/smartcow-design-system-web-chat/project/preview/`

| Archivo | Qué muestra | Notas clave |
|---------|-------------|-------------|
| `component-card.html` | Card base | padding 12px/14px, radius 8px, sin sombra, fondo blanco |
| `component-buttons.html` | CTA / sec / danger | 3 variantes. Altura 44px mínimo (tap target) |
| `component-badges.html` | `.sc-badge--*` | 5 estados semánticos con bg+fg pairs |
| `component-stats.html` | Stats / métricas | Números grandes (display 28/600), sub en ink2 |
| `component-status-rows.html` | Filas con estado | Lista de lotes/animales con badge + meta |
| `component-alert.html` | Alertas inline | Usa colores semánticos, sin iconos externos |
| `component-chips.html` | Chips / filtros | radius 8px, bg cream, texto ink1 |
| `component-input.html` | Inputs de texto | border ink4, focus ring verde, label 10px |
| `component-fields.html` | Campos de form | Grupos label+input, error state danger |
| `component-progress.html` | Barra de progreso | Altura 4px, fill green, track cream |
| `component-segmented.html` | Segmented control | Tab-style, sin underline, bg cream activo |
| `component-header-tabs.html` | Header + tabs | Sticky header, tab row con indicator verde |
| `component-hero.html` | Hero verde | bg green, texto blanco, micro uppercase |
| `component-chat.html` | Chat layout | Burbuja usuario (right), asistente (left+tabla) |

### Archivos de referencia de sistema

| Archivo | Qué muestra |
|---------|-------------|
| `type-scale.html` | Las 8 escalas tipográficas con specimens |
| `type-micro.html` | Texto micro 9px uppercase |
| `colors-brand.html` | Swatches primary + accent |
| `colors-ink.html` | 4 niveles de ink |
| `colors-semantic.html` | Danger / warning / info |
| `colors-badges.html` | Las 5 combinaciones de badge |
| `radii.html` | 8px en todos los contextos |
| `spacing-scale.html` | xs → 2xl con visual |
| `elevation.html` | Sin sombra (flat-first) |
| `brand-wordmark.html` | Logo SmartCow |
| `brand-icons.html` | Librería de íconos |
| `brand-imagery.html` | Fotografía hero |

---

## Anatomía de pantalla mobile

```
Dynamic island (86×22)
Status bar
Header: [back 22px] [título 15/600] [slot derecho]
Hero verde (si pantalla de identidad) ─┐
  O                                     ├ elegir uno
Primera card (si pantalla de lista) ───┘
Tabs (si aplica)
Cards [bg blanco, radius 8, padding 12/14, gap 6–8px]
  ...
CTA bar fija al fondo [fade #f8f6f1 → blanco]
```

---

## Anatomía de chat web

```
Window chrome (titlebar macOS)
└── body
    ├── pane-left (chat)
    │   ├── chat-scroll → chat-inner (max-w 760px)
    │   │   ├── .u-msg (bubble usuario, right)
    │   │   ├── response (asistente, left)
    │   │   └── .chat-note (tabla/KPI inline)
    │   └── input bar (fijo abajo)
    └── pane-right (artifact panel, draggable)
        ├── .art-top (toolbar: kind, save, copy, close)
        └── .art-scroll → .art-inner (contenido)
```
