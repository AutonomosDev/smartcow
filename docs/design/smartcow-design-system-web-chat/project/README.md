# SmartCow Design System

SmartCow is an **AgriTech mobile application** for livestock farms in southern Chile (Región de Los Lagos). It helps farm owners (_"JP"_ persona) and field workers (_"Jaime"_ persona) manage feedlot cattle operations — pesajes, sanidad, feedlot, alimentación, movimientos, partos, destete, egreso — plus an AI assistant (*SmartCow AI*) that surfaces alerts and answers natural-language operational questions.

Target users: livestock farm owners and field workers in Chile. **Native mobile-first, Android**; there is also a companion Next.js web chat console.

## Sources

| Source | Location | Notes |
|---|---|---|
| GitHub — production | `github.com/AutonomosDev/smartcow_prod` | Monorepo. `apps/mobile/` (Expo React Native) + `app/` (Next.js web chat). **Private** — imported on demand. |
| Design tokens spec | `uploads/design_tokens_extraction.md` | Earlier AgriTech Premium direction (Inter + forest-green), partially superseded. |
| Canonical DS page | `uploads/design-system.html` | **Source of truth** — v1.0 approved 11 abril 2026 by César. All tokens in this project derive from this file. |
| Screen mockups | `uploads/smartcow_*.html` | 15+ hand-built HTML mockups for specific AUT-XXX tickets. |
| UI reference PNGs | `uploads/Screenshot 2026-04-13 at *.png` | Ticket mockups (AUT-140 through AUT-175). |

> Note: the `globals.css` and Tailwind config in the repo reference an earlier Inter-based direction (brand-dark `#06200F`, farm-base `#F4F6F5`). The **mobile app and approved design system use `#1e3a2f` forest green + DM Sans** — this is the version used throughout this system.

---

## Index

Root files:
- `README.md` — this file
- `colors_and_type.css` — all tokens as CSS vars + semantic classes
- `SKILL.md` — agent-skill manifest

Folders:
- `assets/` — logos, hero imagery, reference screenshots
- `preview/` — individual design-system cards (colors, type, components) registered in the Design System tab
- `ui_kits/mobile/` — high-fidelity recreation of the mobile app. JP Owner + Jaime Operario flows, fully interactive.

---

## CONTENT FUNDAMENTALS

Language is **Chilean Spanish**. Copy is **functional, direct, operationally framed** — no marketing fluff, no exclamation points, no AI-assistant friendliness. This product talks like a farm supervisor talking to another farm supervisor.

**Tone & casing**
- Sentence case everywhere — never Title Case. "Ver mapa del fundo", not "Ver Mapa Del Fundo".
- Uppercase labels used sparingly for hero micro-labels (9–10px): `ESTADO DEL FUNDO`, `IDENTIFICACIÓN`, `DIIO ESCANEADO`.
- Badges are capitalized-first: `Urgente`, `Atención`, `OK`, `Info`.

**Voice**
- Second person is implicit, not stated. "Guardar nacimiento", not "Guarda tu nacimiento".
- Greetings are dry: "Buenos días, JP". "Lunes 14 abril · Fundo San Pedro". No exclamation.
- AI assistant speaks in short, declarative, data-first sentences. Example from Chat: _"Resumen de tus 4 lotes. Lote Central preocupa — GDP cayó esta semana."_ Never "Great question!" or "Let me help you with that."

**Units & formatting**
- Chilean pesos: `$938`, `$31.8M`, `$1.840/día`. Periods as thousands separators (`$38.420`).
- Weight: `kg` / `Ton` (no space before unit on KPIs: `387 kg`).
- GDP (Ganancia Diaria de Peso): `1.8 kg/d`. Always with trend arrow: `↑`, `↓`, `→`.
- Temperature: `6°C` with `°` as superscript in hero, `6°` elsewhere.
- Dates: `14 abr 2026 · 06:30 AM` — month abbreviated, day first.
- DIIO (animal ID): 15-digit number, often truncated to last 6 with leading `...`: `...581198`.

**Domain vocabulary** (use verbatim)
- `Fundo` (farm) · `Predio` (property) · `Potrero` (paddock) · `Lote` (batch) · `Corral` (pen)
- `Manga` (cattle chute) · `Bastón XRS2i` (RFID wand)
- `Destete` (weaning) · `Faena` (slaughter) · `Egreso` (exit) · `Preñez` (pregnancy)
- `Nacimiento` · `Pesaje` · `Vacunación` · `Movimiento potrero`
- `JP` (owner persona, Juan Pablo) · `Jaime` (operario persona) · `ODEPA` (price reference)

**Emoji** — avoid in body copy. Used only for: weather icons (`🌧 ⛅ ☀️`), chip decorators (`🚨 ⚠️`), artifact headers in chat (`📊 💰 🚨`). Never as a substitute for proper iconography in production UI. **Lucide icons are the preferred system** (see ICONOGRAPHY).

---

## VISUAL FOUNDATIONS

**Color**
- Palette anchored in deep forest green `#1e3a2f` (primary, hero cards, CTAs) against off-white cream `#f8f6f1` (all screens). Accent green `#7ecfa0` used only on dark backgrounds for positive values.
- Semantic reds/oranges/blues only inside badges — never as primary surface colors. No bluish-purple gradients. No purple at all.
- On hero-photo screens, bottom gradient is a deep forest-tinted black `rgba(5,18,10,0.96)` — not pure black.

**Type** — DM Sans exclusively, weights 400 / 500 / 600. No other faces. Tight leading (`lineHeight: 18` for 13px body, `letter-spacing: -0.3` for large titles).

**Spacing** — 4 / 8 / 12 / 16 / 24 / 32. **Padding lateral de pantalla siempre 16px**. Cards have internal padding 12px top/bottom, 14px left/right — the card is tight.

**Backgrounds**
- 95% of screens: flat `#f8f6f1`, no texture or pattern.
- Hero / welcome screen: full-bleed photograph of cattle (warm green-tinted, dusk light, shallow DOF) with dark gradient overlays. No illustration, no abstract graphic.
- No repeating patterns, no grain, no blur effects except **glassmorphism** on the Home hero stack (photo bg + `backdrop-filter: blur(16px)` on stacked info cards).

**Animation** — minimal. No bounces, no parallax. CSS transitions of 150–300ms `ease` for hover/press; `transform: scale(1.05)` on Smart Tile image hover only. No page transitions defined.

**States**
- Hover (web): no dedicated styling — the mobile app doesn't have hover; web ports inherit press states.
- Press / active: `activeOpacity: 0.7–0.85` in RN. On web, use `opacity: .85` or a subtle darker background.
- Selected (tab/segment): background fills to `#1e3a2f`, text becomes white. Non-selected stays `#fff` bg + `#888` text.

**Borders** — hairlines everywhere: `0.5px solid #e8e5df` on cards when a border is shown. Dividers inside cards: `0.5px solid #f0ede8`. Never thicker than 1.5px (only on segmented buttons).

**Shadows** — almost none on mobile. Cards are flat white on cream. Shadows appear only on:
- Weather strip floating over hero: `0 2px 6px rgba(0,0,0,0.06)`
- TaskCard in richer context: `0 2px 5px rgba(0,0,0,0.05)`
- iPhone bezel mocks: deep ambient shadow `0 24px 60px rgba(0,0,0,0.35)` (mock-only, not product).

**Transparency & blur** — reserved for the Home hero, where photo is the background. Info cards stack with `rgba(5,22,12,0.52–0.65)` + `backdrop-filter: blur(16px)`. Used nowhere else.

**Corner radii** — **un solo radio: 8px en TODA la app.** Cards, hero cards, botones, chips, inputs, iconos contenedores, alerts — todo 8. Lo único excepcional es `border-radius: 50%` para círculos reales (avatars, dots de estado). Los valores 12 / 14 / 16 / 20 / pill están prohibidos (dirección antigua, superseded).

**Card anatomy** — white bg · **8px radius** · 12×14 padding · no shadow · no border (unless hairline `#e8e5df` hairline when adjacent to other whites). Cards are **flat and adjacent**, separated by 6–8px gap — not floating.

**Layout rules**
- Dynamic Island (90×24, bg `#1c1c1e`, radius `0 0 16px 16px`) on every screen (mock-only; native handles this in production).
- Status bar (11px/600, `#1a1a1a` on light, `rgba(255,255,255,0.9)` on dark).
- Header row: back button (24×24 circle, bg `#ebe9e3`) + optional right-side icon/badge, then title (16px/600), then subtitle (10–11px/400, `#999`).
- CTA always at the bottom of the screen, full width minus 16px padding, primary forest-green.

**Imagery vibe** — warm, naturalistic, overcast or dusk light. Angus cattle in grass. No studio photography, no cool-toned corporate stock, no illustration. When real imagery isn't available, use a flat forest-green hero card instead — don't fabricate it.

---

## ICONOGRAPHY

The codebase uses **`lucide-react-native`** on mobile (imports like `import { Bell, LogOut, ChevronLeft } from 'lucide-react-native'`). This is the only icon system in production — thin 1.5–2px stroke, rounded linecaps, monochrome.

**Rules**
- All UI icons: Lucide. 13–18px sized. Stroke `#1a1a1a` (on light) or `#fff` (on dark hero).
- No icon fonts, no sprite sheets, no custom SVG icon sets beyond Lucide.
- Chip decorators in operational alerts may use native emoji (`🚨 ⚠️ ✓`) — this is a deliberate shorthand in operational contexts where color-coded urgency matters more than icon consistency.
- Weather: native emoji (`🌧 ⛅ ☀️ 🌦`). Production is OK with this.
- The Dynamic Island dots (`●●●`) in the status bar are literal text, not icons.

**This project loads Lucide from the CDN** (`https://unpkg.com/lucide@latest`) in UI kits — see `ui_kits/mobile/index.html`. No icon substitution needed.

**Assets in `assets/`**
- `hero_cows.jpg` — Angus herd in Los Lagos foothills. Replaces `public/hero_cows.jpg` (empty in repo) and `public/1.jpg` used by `HomeScreen.tsx`.
- `ref_*.png` — reference screenshots from the ticket mockups.

---

## VISUAL ELEMENTS CHECKLIST

| Element | Status |
|---|---|
| Logo / wordmark | ⚠️ Not provided. Placeholder "SmartCow" wordmark in DM Sans 600. **Please supply `.svg` logo.** |
| Hero imagery | ✅ `hero_cows.jpg` |
| Icon system | ✅ Lucide (CDN) |
| Color tokens | ✅ 15 colors, hardcoded |
| Type scale | ✅ 8 steps, DM Sans |
| Component recreations | ✅ in `ui_kits/mobile/` |

---

## Next steps / asks

1. **Provide the SmartCow logo** — wordmark SVG + monogram if separate. Currently placeholdered.
2. Confirm: is the `design_tokens_extraction.md` direction (Inter + 24px cards, `#06200F`) still in play anywhere, or fully superseded by the DM Sans / `#1e3a2f` / 14px direction? This system assumes the latter.
3. If there's a real `hero_cows.jpg` in-house, drop it in — current image is the uploaded `pantall_1.jpg`.
