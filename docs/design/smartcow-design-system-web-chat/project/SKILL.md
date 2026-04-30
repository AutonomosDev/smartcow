---
name: SmartCow Design System
description: Use this skill when designing any SmartCow surface — mobile app screens, web chat console, marketing material, reports. Covers JP owner and Jaime operario personas, DM Sans type, forest-green palette, Chilean Spanish voice.
---

# SmartCow — how to design for this product

SmartCow is a Chilean AgriTech mobile app for livestock feedlot operations. You are designing for **two personas in the same app**: _JP_ (dueño del fundo, strategic overview) and _Jaime_ (operario en terreno, task-first, offline-capable, works with gloves).

## Before you start
1. Read `README.md` — that's the system of record.
2. Read `colors_and_type.css` — tokens + semantic classes, copy these verbatim.
3. Look at `ui_kits/mobile/index.html` for component vocabulary and flow examples.
4. If you need icons, use Lucide (`https://unpkg.com/lucide@latest`).
5. If you need hero photography, use `assets/hero_cows.jpg`.

## Three rules that matter most
1. **DM Sans only.** Weights 400 / 500 / 600. No other face.
2. **Forest green `#1e3a2f` + cream `#f8f6f1`.** No purple. No gradients except glassmorphism over hero photos. Semantic reds/oranges only inside badges.
3. **Copy is in Chilean Spanish, operationally framed.** Sentence case. No exclamation marks. No friendly AI warmth. Dry, declarative, data-first. Verbatim terms: `Fundo`, `Lote`, `Potrero`, `DIIO`, `GDP`, `ODEPA`, `bastón XRS2i`, `faena`, `preñez`, `destete`.

## Mobile screen anatomy
Dynamic island (86×22) → status bar → header (back 22px + right slot + title 15/600 + sub 10/400 #999) → hero verde (if identity-strong) OR first card → tabs → cards (white, 14 radius, 12×14 padding, flat, 6–8px gap) → CTA bar fixed at bottom with `#f8f6f1` gradient fade.

## Don't
- Title Case. Marketing voice. Exclamation points. "Great question!"
- 24px card radii (superseded). Tailwind `brand-dark #06200F` from old extraction (superseded).
- Purple, magenta, neon, dark-mode. Emoji in body copy. Stock corporate imagery.
- Shadows on cards (mobile is flat-first). Hover states (this is a mobile app first).

## When asked to design something new
- **New screen?** Pick the right skeleton from `ui_kits/mobile/index.html` (hero-photo home, hero-verde identity, list-of-cards, or task-with-fixed-CTA).
- **New component?** Build it inside an existing card/hero before proposing a new surface pattern.
- **Variations?** Always offer 2–3. Vary layout, information density, voice register — not color palette.
