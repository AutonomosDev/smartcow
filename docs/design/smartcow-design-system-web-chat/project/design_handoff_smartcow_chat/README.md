# Handoff: SmartCow — Chat Web & Chat Mobile

## Overview

SmartCow es un asistente conversacional AI para productores ganaderos chilenos. Se conecta a las fuentes de datos del productor (AgroApp, Excel, Google Sheets) y responde preguntas operativas + genera informes/planes sobre el rebaño.

Este handoff entrega **dos superficies**:

1. **Chat Web** — interfaz desktop estilo Claude Code (window chrome, chat + panel artifact a la derecha)
2. **Chat Mobile** — iPhone con panel chat + panel de informe que entra desde la derecha (swipe-back para volver)

Usuario tipo: **JP (Juan Pablo Ferrada)**, productor ganadero en Los Aromos (VII Región, Chile). Interactúa con el asistente para preguntar por partos, vacunaciones, pesajes, tratamientos, etc.

## ⚠️ REGLAS ESTRICTAS — LEER ANTES DE CODEAR

**Este NO es un mockup de referencia. Es el diseño final aprobado.**

1. **El código se adapta a la UI, no al revés.** Si el componente del design system interno no matchea exactamente lo que muestra el mock, se extiende/ajusta/reemplaza el componente. NO se ajusta el diseño al componente.
2. **No cambiar colores.** Los hex codes de este README son los oficiales. Ni un shade más claro, ni un shade más oscuro. Si `#f3f5f0` se ve "muy claro" → es el que va.
3. **No cambiar tipografías.** DM Sans + JetBrains Mono. Nada de system-ui fallback que rompa el look. Cargar ambas con `@font-face` o importarlas de Google Fonts; garantizar que estén disponibles antes de render (font-display: swap con fallback mínimo).
4. **No cambiar tamaños.** Los font-sizes de 11px, 11.5px, 12px, 13.5px, etc. son deliberados. No redondear a 12/14/16 "porque es más clean".
5. **No cambiar spacing.** Padding `10px 12px 44px` del composer mobile está así porque JP se confundía con el home indicator. No es decoración.
6. **No inventar estados hover/focus.** Los que están documentados son los únicos. Si un botón no tiene hover documentado, es porque no lleva hover.
7. **No agregar animaciones.** Las transiciones están listadas en la tabla. No agregar bounces, fades, slides decorativos, skeleton loaders con shimmer, etc.
8. **No agregar emoji.** En ningún lado. Ni en labels, ni en toasts, ni en empty states.
9. **No agregar iconografía nueva.** Si un elemento del mock no tiene ícono, no lleva ícono. No "pongamos un ícono de info acá porque queda lindo".
10. **No reorganizar layout "para que sea más responsive".** Web es 1200px+ desktop. Mobile es 390px iPhone. No hay breakpoint intermedio, no hay tablet, no hay "mobile-first responsive".
11. **El chip oficial SmartCow es sagrado.** Mint `#f3f5f0`/`#2b6a4a`, JetBrains Mono 12px, radius 6px, padding `6px 12–14px`. Aplica a: mensajes del usuario, botones primarios, slash chips, botón "Ver informe completo", chip "Plan" reabrir. No hacer variantes.
12. **Las fuentes DEBEN ser exactas:**
    - `DM Sans` pesos 400/500/600/700
    - `JetBrains Mono` pesos 400/500/600
    - Si Google Fonts está bloqueado en el entorno, self-hostear las fuentes. NO usar Inter, Roboto, SF Pro, system-ui como "equivalente cercano".

**Si hay ambigüedad, preguntar al diseño. No improvisar.**

## About the Design Files

Los HTML/JSX en este bundle NO son "prototipos inspiracionales". Son la **fuente de verdad visual**. Valores medidos pixel por pixel, decisiones tomadas explícitamente con el usuario, iteradas sobre feedback real.

Se recrean en el stack del equipo (**React + TypeScript + Tailwind CSS + Framer Motion** si no hay stack previo), pero respetando milimétricamente las specs de este README. El desarrollador NO tiene licencia creativa sobre el look, el spacing, los colores, las tipografías, ni las interacciones documentadas.

Lo que SÍ puede (y debe) adaptar el dev:
- Estructura de componentes React (cómo se divide el árbol, props, memo, etc.)
- Gestión de estado (zustand, context, redux — lo que use el equipo)
- Integración con el backend real (API calls, streaming, etc.)
- Accesibilidad (ARIA, keyboard nav, focus management) — AGREGAR, no quitar
- Performance (lazy loading, virtualización de listas largas)

## Fidelity

**Hi-fi pixel-perfecto. Vinculante.**

---

## Design Tokens

### Colores

```css
/* Neutros */
--ink-1: #1a1a1a;   /* texto principal */
--ink-2: #666;      /* secundario */
--ink-3: #999;      /* terciario (metadatos, timestamps) */
--ink-4: #bbb;      /* placeholder */
--ink-5: #e0ddd8;   /* borders sutiles */

/* Fondos */
--bg-page:   #e8e4dc;   /* fondo exterior (desktop OS) */
--bg-canvas: #fff;      /* superficie chat */
--bg-cream:  #ebe9e3;   /* hover states */
--bg-fog:    #f0ede8;   /* dividers */
--bg-note:   #fafaf7;   /* note blocks */
--bg-report: #fdfcf8;   /* fondo del artifact/informe */

/* Marca SmartCow (verde bosque) */
--green-ink:  #1e3a2f;   /* verde profundo, rara vez */
--green-chip-bg: #f3f5f0;   /* chip mint claro (OFICIAL) */
--green-chip-fg: #2b6a4a;   /* chip mint texto (OFICIAL) */
--green-chip-hover-bg: #e8ede2;
--green-chip-hover-bd: rgba(43,106,74,.2);
--green-leaf: #7ecfa0;   /* accent */
--green-moss: #e6f3ec;   /* fondo suave */

/* Semánticos */
--blue-bg:   #eaf0f7;  --blue-fg:   #1a5276;   /* info, código */
--warn-bg:   #fdf0e6;  --warn-fg:   #9b5e1a;   /* warning/alerta */
--red-bg:    #fbefef;  --red-fg:    #c23030;   /* error / código destacado rojo */

/* Claude Code inline code color */
--code-red-bg: #fce3dc;
--code-red-fg: #c74634;
```

### Tipografía

```css
--font-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, Menlo, 'SF Mono', monospace;
```

Weights usados: 400, 500, 600, 700.

**Reglas:**
- UI general y prosa → DM Sans
- Código, chips, slash commands, metadatos, números tabulares, títulos técnicos → JetBrains Mono
- Números en tablas → monospace + `font-variant-numeric: tabular-nums`

Escala base:
- 11px mono → metadatos, labels uppercase
- 12px mono → chips, code inline
- 13.5–14px sans → body messages
- 15px sans → títulos de sección
- 20px sans → títulos de artifact
- 24px+ sans → h1 de informe (en desktop)

### Spacing / Radii

```css
radius-sm: 6px    /* chips, buttons oficiales */
radius-md: 8px    /* inputs, cards pequeñas */
radius-lg: 12px   /* modales, paneles */
radius-xl: 16px   /* kpi cards, image frames */
radius-2xl: 20px  /* report cards grandes */
```

Gaps típicos: 4, 6, 8, 10, 12, 16, 20, 24.

### Shadows

```css
--shadow-modal: 0 20px 60px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.1);
--shadow-panel-right: -12px 0 40px rgba(0,0,0,.12);   /* report panel mobile */
--shadow-phone: 0 40px 80px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.12);
--shadow-window: 0 20px 60px rgba(0,0,0,.12);
```

---

## The Official Button / User Message Style

**Este es el lenguaje visual central del producto.** Todos los botones primarios del chat, chips slash, y mensajes del usuario usan EXACTAMENTE este estilo:

```css
.smartcow-chip {
  display: inline-flex;
  align-items: center;
  gap: 6–8px;
  background: #f3f5f0;
  color: #2b6a4a;
  padding: 6px 12–14px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.2px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background .12s, border-color .12s;
}
.smartcow-chip:hover {
  background: #e8ede2;
  border-color: rgba(43,106,74,.2);
}
```

**Se aplica a:**
- Mensajes del usuario (Human pill) — `align-self: flex-start` (NO derecha)
- Slash-command chips en el composer (`/informe`, `/plan`, etc.)
- Botón "Ver informe completo" en mobile
- Chip "Plan" en la titlebar web para reabrir el artifact
- Quick actions dentro de las respuestas del asistente

No se usan burbujas clásicas de chat (user vs AI con colores diferentes). Todo es monospace, técnico, unificado.

---

## Surface 1 — Chat Web (Desktop)

### Layout

Ventana simulada de macOS (traffic lights, título centrado). Split vertical:
- Sidebar: overlay izquierda, 280px, slides in sobre el chat (no empuja)
- Chat pane: flex 1 (izquierda)
- Divider: drag horizontal 1px
- Artifact pane: derecha, default 560px, ocultable con X

### Window Chrome (Titlebar)

Altura 37–38px. Orden de izquierda a derecha:

1. **Traffic lights** (macOS): dots 12px, gap 8px, colores `#ff5f57` / `#febc2e` / `#28c840`
2. **Hamburger** (toggle sidebar) — ícono 15px, 24×24 clickable
3. **Chevron nav** ← → — disabled styling
4. **Título centrado**: `📁 smartcow_prod / Initialize project setup ▾` (DM Sans 13px, "Initialize project setup" es el nombre de la sesión actual)
5. **Chip "Plan"** (aparece solo cuando el panel artifact está cerrado) — estilo chip oficial verde mint
6. **Search** 14px ícono

Border-bottom: `1px solid #ececec`.

### Sidebar (overlay)

Slide-in desde la izquierda con backdrop semitransparente. Contenido:
- Tabs row: "Chats" / "Projects" / "Files"
- Top menu: "Nueva conversación" (+), "Buscar"
- Scroll area: lista de sesiones agrupadas por fecha (Hoy, Ayer, Esta semana, etc.) — cada item con título, snippet, timestamp
- Footer: usuario actual (avatar + nombre + rol) + "Configuración"

Anchura 280px. Backdrop cierra al click.

### Chat Pane

**Contenido (centrado con max-width ~720px, padding horizontal 48px):**

1. **User message**: chip oficial verde mint alineado a la izquierda
2. **Assistant prose**: DM Sans 14px, line-height 1.65, `text-wrap: pretty`. Puede contener:
   - Inline code: `background: #fce3dc; color: #c74634; font-family: mono; padding: 1px 6px; border-radius: 4px` (estilo Claude Code)
   - Listas con bullets custom
   - Bloques de código en contenedor mono con header gris
3. **Notebook block** (SEMANA — LOS AROMOS, DIAGNÓSTICO ETL, etc.): fondo `#fafaf7`, border dashed, font-family mono, pequeño label uppercase arriba
4. **Tabla de resumen**: estilo técnico sin background, bordes 1px `#eee`, headers uppercase 11px mono, data rows 13px mono. Números con `text-align: right` y `tabular-nums`
5. **"Ran N commands"** rows colapsables: fondo gris claro, chevron ▶, cuando expande muestra lista de comandos mono
6. **Artifact cards**: al asistente "crear un plan", aparece una card grande con preview del artifact; click abre el panel derecho

### Bottom Bar (Composer + Git strip)

Altura ~110px. Dos filas:

**Fila 1 (strip git):**
- `main ← main` (branch actual ← base), mono 11px
- `+2,678 −10` (diff summary)
- `Create PR ▾` botón

**Fila 2 (composer):**
- Input: `Type / for commands` (placeholder), mono 12px, altura 36px
- Botones icon a la derecha: paperclip, mic
- Send button: chip verde mint oficial

**Fila 3 (strip modelo):**
- `Bypass permissions` chip ámbar pequeño
- Icons `⊕ ⊕ ⚡`
- `Sonnet 4.6 Medium ›` pill con spinner azul cuando está streameando

### Artifact Pane (derecha)

Width default 560px, redimensionable. Borde izquierdo `1px solid #eaeaea`.

**Top bar** (altura 44px):
- Kind label: `Plan` / `Informe` / `Ticket` (mono 11px uppercase)
- Actions derecha: folder ▾ (Guardar), copy (Copiar), X (cerrar), sidebar-right ▾ (Layout)

**Comment hint bar:**  
"ⓘ Select any text to leave a comment for Claude" — fondo `#fafafa`, border-bottom, mono 11px, color `#999`.

**Body:**
- Título H1 20px bold
- Sub mono 11px con contexto
- Secciones con H2 13px
- Listas numeradas anidadas, inline code estilo Claude Code
- KPI rows (3 cards en grid)
- Tablas mono

### Modales (Guardar / Copiar)

Disparados desde icons del top del artifact.

**Guardar:** 5 opciones con íconos de color suave y subtexto
1. Guardar como PDF (rojo)
2. Enviar por WhatsApp a JP (verde) — muestra `+56 9 5432 1876`
3. Guardar en Google Drive (azul)
4. Enviar por email (ámbar)
5. Guardar como routine (verde)

**Copiar:** 5 opciones:
1. Copiar como Markdown
2. Copiar como texto enriquecido
3. Copiar link compartible
4. Exportar a Excel/CSV
5. Enviar a Notion

Cada opción al clickear: muestra spinner en el ícono por 1.8s y cierra modal.

Estructura:
- Backdrop `rgba(20,20,20,.38)` + `backdrop-filter: blur(2px)`
- Modal 440px, radius 12px, shadow-modal
- Animación entrada: `scale(.94) translateY(8px) → scale(1)`, 180ms
- Footer: mono 11.5px con dot verde + contador de palabras

---

## Surface 2 — Chat Mobile (iOS)

### Device Frame

iPhone Pro: 390×812, radius 52px, padding 10px black bezel. Screen 370×792, radius 44px.
- Dynamic Island: 120×35, top 18px, centered, `#000` radius 22px
- Home indicator: 130×4.5, bottom 8px, `rgba(0,0,0,.25)` radius 3px
- Status bar: height 54px, padding-top 20px — hora izquierda, señal/wifi/batería derecha. Font bold 15px.

### Two Panels (overlayed)

Ambos paneles tienen `position: absolute; inset: 0` dentro de `.panels` wrapper. Se animan con `transform`:

**Panel Chat** (siempre presente, z-index 1):
- Default: `translateX(0)`
- Con report abierto: `translateX(-18%) filter: brightness(.94)` (parallax opcional)

**Panel Report** (z-index 2):
- Default: `translateX(100%)` (oculto a la derecha)
- Abierto: `translateX(0)`
- Box-shadow izquierdo cuando visible: `-12px 0 40px rgba(0,0,0,.12)`

Transition: `transform .32s cubic-bezier(.2,.7,.2,1)`.

### Chat Panel — Top Bar

Altura ~78px (incluye status bar padding). Layout:
- **Avatar cow-robot**: 36×36, fondo transparente (se funde con blanco), `object-fit: contain`, imagen de `assets/cow_robot.png`
- **Info**: "SmartCow" (14px bold) + subtitle "Los Aromos · jferrada" (11px mono, color ink-3)
- **Actions**: search 18px, menu 18px

Border-bottom `0.5px #f0ede8`.

### Chat Panel — Body

Padding 16px, gap 14px entre mensajes, scrollable. Estructura:

1. **Saludo inicial** del asistente (prose corta)
2. **User pill** "¿Cómo va la semana en Los Aromos?" — chip oficial verde mint
3. **Respuesta**: prose + notebook block + botón "Ver informe completo →" (estilo chip oficial verde mint)
4. **User pill** "/plan vacunación"
5. **Respuesta**: prose + lista + botón "Ver plan vacunación →"

**Notebook block** (en mobile):
- Fondo `#fafaf7`
- Border `.5px dashed #e8e5dd`
- Border-radius 10px
- Padding 11px 13px
- Label uppercase 9px mono
- Contenido mono 11px line-height 1.55

**Tags inline:**
- `.tag.ok` — `#e6f3ec` bg / `#1e5a3e` fg
- `.tag.warn` — `#fdf0e6` bg / `#9b5e1a` fg

### Chat Panel — Composer

Padding `10px 12px 44px` (bottom alto para no confundirse con home indicator).

Dos componentes stack vertical:

1. **Data source pill**: `📎 Los Aromos → Partos 2024 · +8 filas` (mono 11px, border `.5px #e0ddd8`, radius 8px)
2. **Slash row**: scroll horizontal, chips `/informe /plan /resumen /pesaje /partos /tratamientos /feedlot` en blue-bg
3. **Input box**: border `.5px #e0ddd8`, radius 8px, min-height 44px
   - Placeholder "Preguntá algo a SmartCow…" (mono 12px)
   - Botones derecha: paperclip, mic (circulares cream 28px), send (verde con ícono arrow-up blanco)

### Report Panel

**Top bar:**
- Back chevron (30×30)
- Info: kind label uppercase 9.5px + título 14px (truncate con ellipsis)
- Actions: share, save, more (3 dots)

Padding `62px 14px 10px` (padding-top alto para status bar).

**Body (scrollable):**
- Padding `16px 18px 140px` (padding-bottom MUY alto para que el contenido final no lo tape el FAB)
- H1 20px bold
- Sub mono 11px
- Chips de metadata (fuentes, filas, timestamp)
- KPI row: 3 cards grid, `background: #fff`, border `.5px`, radius 8px
- Blocks: cards blancas con label uppercase mono arriba
- Tablas: `border-bottom: .5px dashed`, mono 11px, header 9.5px uppercase
- Alertas: `#fdf0e6` con `border-left: 2px solid #9b5e1a`, radius 8px

**FAB (Chat return):**
- Position absolute bottom-right
- 56×56 circle, background verde `#1e3a2f`, shadow
- Ícono chat blanco
- Badge "2" en top-right con notif count

### Swipe-Back Gesture

**Implementación:**

```js
// Pointerdown en los primeros 28px del borde izquierdo del panel report
// Drag horizontal > 80px → cerrar report
// Mientras arrastra: aplicar translateX(dx) al report panel + parallax reverse al chat
// Si suelta con dx < 80: snap back
// Si suelta con dx ≥ 80: animar a translateX(100%) y setReportOpen(false)
```

Compatible con touch + mouse (pointer events).

Al abrir report: pequeño "edge-hint" en el borde izquierdo del panel pulsa por 2s la primera vez.

### Generación (loading state)

Al clickear "Ver informe completo" o enviar slash-command:
1. Si `autoOpen: true`: abre panel con overlay de loading
2. Muestra spinner + texto "Armando informe… leyendo AgroApp · Partos · Tratamientos"
3. Tras 1.6s: muestra el contenido del informe

---

## Animations / Transitions

| Elemento | Transition | Easing | Duración |
|---|---|---|---|
| Sidebar in/out | `transform` | `cubic-bezier(.2,.7,.2,1)` | 280ms |
| Artifact panel resize (drag) | — | — | live |
| Modal entrada | `transform + opacity` | `cubic-bezier(.2,.7,.2,1.1)` | 180ms |
| Report panel slide | `transform` | `cubic-bezier(.2,.7,.2,1)` | 320ms |
| Chat parallax | `transform + filter` | mismo | mismo |
| Chip hover | `background + border` | ease | 120ms |
| Spinner loading | `rotate 360deg` | linear | 1s loop |
| Typing dots | `opacity pulse` | ease-in-out | 1.2s loop |

---

## State Management

### Chat Web

```ts
{
  sbOpen: boolean,                    // sidebar overlay
  artVisible: boolean,                // panel artifact derecha
  artWidth: number,                   // 320–900, drag
  tweaksOpen: boolean,                // panel dev tweaks
  editMode: boolean,                  // modo edición
  saveOpen: boolean,                  // modal guardar
  copyOpen: boolean,                  // modal copiar
  saving: string | null,              // key de opción siendo procesada
  copied: string | null,              // idem
  activeSession: string,              // id de sesión actual
  sessions: Session[],                // listado en sidebar
  streaming: boolean,                 // "Sonnet 4.6 Medium ›" con spinner
}
```

### Chat Mobile

```ts
{
  reportOpen: boolean,
  reportKind: 'informe' | 'plan' | 'ticket',
  generating: boolean,                // spinner overlay
  mode: 'puro' | 'hibrido',           // notebook 100% mono vs DM Sans prosa
  parallax: boolean,                  // tweak
  autoOpen: boolean,                  // tweak: abrir automáticamente al generar
  drag: { active, startX, dx },       // swipe-back gesture
}
```

### Persistencia (localStorage)

- `sc_mobile_mode` → modo puro/híbrido
- `sc_web_art_width` → ancho del panel artifact
- `sc_web_active_session` → última sesión abierta

---

## Interacciones clave — flujos

### Flujo 1: JP pregunta por la semana (mobile)

1. JP abre la app, ve saludo inicial del asistente
2. Tap en slash chip `/resumen`
3. Composer se llena con "/resumen semana"
4. Tap send → user pill aparece en el chat
5. Asistente responde: prose "Semana buena en Los Aromos" + notebook block con métricas + botón "Ver informe completo →"
6. Tap en el botón → panel report slide-in desde la derecha
7. Spinner "Armando informe…" por 1.6s
8. Informe completo visible, scrollable
9. Swipe desde borde izquierdo → vuelve al chat
10. FAB verde bottom-right también permite volver

### Flujo 2: JP genera plan de vacunación (mobile)

1. Continúa chat
2. Tap en `/plan`
3. Composer completa "/plan vacunación"
4. Send
5. Respuesta: prose corta + lista numerada de pasos + botón "Ver plan completo →"
6. Tap → panel report con el plan detallado
7. Tap en ícono compartir (top-right del report) → iOS share sheet

### Flujo 3: Desktop — chequear informe y exportar

1. Usuario escribe en composer "informe semanal Los Aromos"
2. Press Enter
3. Respuesta aparece en chat, incluye card de artifact con preview
4. Artifact card click → abre/enfoca panel derecho con el informe
5. Click en folder ▾ (top del artifact) → modal "Guardar o compartir"
6. Click "Enviar por WhatsApp a JP" → spinner 1.8s → modal cierra
7. Click en X del artifact → panel se cierra, aparece chip "Plan" en titlebar
8. Chip "Plan" click → reabre artifact

---

## Assets

### Imágenes incluidas

- `assets/cow_robot.png` — Avatar SmartCow (vaca robot cibernética). 810×810. Fondo blanco; se usa con `object-fit: contain` sobre fondo transparente para que "flote".

### Iconografía

Todos los íconos están en `chat_web_icons.jsx` exportados como objeto `I` con funciones que reciben `{s, left, right}`. Son SVGs inline con `stroke="currentColor"`, `strokeWidth:1.6` (estilo Lucide-like).

Íconos usados:
- `chevron` (left/right/up/down)
- `search`, `hamburger`, `x`, `folder`, `copy`
- `sidebarRight`, `send`, `paperclip`, `mic`
- `cow` (deprecated, reemplazado por `cow_robot.png`)

Recomendación: en el codebase real, usar **Lucide React** para todos los íconos.

---

## Files (design sources)

Incluidos en este handoff:

```
design_handoff_smartcow_chat/
├── README.md                     ← este archivo
├── chat_web.html                 ← desktop entrypoint
├── chat_web_app.jsx              ← App shell + titlebar + split layout
├── chat_web_sidebar.jsx          ← overlay sidebar
├── chat_web_messages.jsx         ← chat body (prose, notebook, tables)
├── chat_web_artifact.jsx         ← panel artifact + modales Guardar/Copiar
├── chat_web_icons.jsx            ← set de íconos SVG
├── chat_mobile.html              ← mobile entrypoint
├── chat_mobile_app.jsx           ← phone frame + two-panel + swipe-back
├── colors_and_type.css           ← referencia de tokens
└── assets/
    └── cow_robot.png
```

Para verlo funcionando: abrir `chat_web.html` y `chat_mobile.html` en un navegador.

---

## Checklist de archivos (actualizados al cierre del diseño)

Todos los archivos fuente están **sincronizados con el diseño final**:

- ✅ `chat_web.html` — incluye chip `reopen-btn`, `u-msg` con estilo chip oficial, modal base con blur
- ✅ `chat_web_app.jsx` — hamburger a la izquierda, flujo sidebar, reopen button
- ✅ `chat_web_artifact.jsx` — modales Guardar/Copiar completos con 5 opciones cada uno, spinners
- ✅ `chat_web_messages.jsx` — tabla con `tabular-nums` alineada a la derecha
- ✅ `chat_web_sidebar.jsx` — sin border separador header/body
- ✅ `chat_web_icons.jsx` — set final de íconos
- ✅ `chat_mobile.html` — avatar transparente (object-fit:contain), open-report-btn con chip oficial, comp-wrap padding-bottom 44px, rpt-body padding-bottom 140px
- ✅ `chat_mobile_app.jsx` — avatar con img de cow_robot.png, swipe-back completo, two-panel
- ✅ `assets/cow_robot.png` — versión final aprobada
- ✅ `colors_and_type.css` — tokens fuente

Si algún archivo abre con look distinto al README, el README MANDA y se corrige el archivo.

## Notas de implementación

- **No reinventar el chip oficial.** Todos los botones de acción y mensajes de usuario DEBEN usar el estilo `.smartcow-chip` documentado arriba. Esta decisión fue tomada explícitamente por el equipo.
- **No usar emoji.** El diseño es técnico/monospace; los emojis rompen la estética.
- **Data sources son first-class.** En el composer siempre debe ser visible qué fuente está activa ("Los Aromos → Partos 2024"). Esto le da confianza a JP que la respuesta viene de su data real, no inventada.
- **Animaciones sutiles.** El producto debe sentirse rápido y preciso. Nada de bounces exagerados ni easings overdone. `cubic-bezier(.2,.7,.2,1)` es la curva estándar.
- **Tabular-nums siempre.** Todas las tablas con números deben usar `font-variant-numeric: tabular-nums` y `text-align: right` para columnas numéricas.
- **Mobile-first sí, pero no responsive naive.** El desktop es un producto distinto (window chrome, artifact pane lateral). No intentar una sola vista que se adapte: son dos superficies separadas con filosofía propia.
- **Accesibilidad**: usar roles ARIA en el sidebar overlay (`role="dialog"`), focus trap en modales, labels en botones icon-only.
