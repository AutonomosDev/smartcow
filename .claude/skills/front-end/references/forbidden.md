# SmartCow DS — Lo prohibido

Cada item tiene un `Why:` — la razón existe para que puedas juzgar edge cases, no para seguir la regla a ciegas.

---

## Colores

**Púrpura / magenta / neon**
Why: fuera de la paleta forestal. SmartCow opera en campo chileno — los colores deben evocar naturaleza y confianza, no una app de fitness o gaming.

**Gradients en UI general**
Why: el DS es flat-first. La única excepción es glassmorphism *sobre una foto hero* (`hero_cows.jpg`). En cards, botones, backgrounds: sin gradients.

**`#06200F` (brand-dark)**
Why: extracción vieja de Tailwind config, superseded. El verde correcto es `#1e3a2f`. No usar ni como variante oscura.

**Colores fuera de `references/tokens.md`**
Why: el DS tiene exactamente los colores que necesita. Inventar uno nuevo rompe la coherencia del sistema y hace que `validate-tokens.py` falle.

---

## Tipografía

**Cualquier fuente que no sea DM Sans o JetBrains Mono**
Why: consistencia tipográfica. DM Sans es la única sans del sistema. JetBrains Mono es solo para valores numéricos tabulares. No hay terceras opciones.

**Weights fuera de 400 / 500 / 600**
Why: el DS declara explícitamente solo esos tres weights. 700 (bold) y 300 (light) no están importados ni especificados.

**Letter-spacing positivo en body copy**
Why: letterspacing positivo en texto pequeño lo hace más difícil de leer. Solo `micro` lleva `letter-spacing: 0.3px`.

---

## Espaciado y layout

**border-radius > 8px** (excepto `50%` para círculos)
Why: 24px fue el radio en una versión anterior del DS, ya superseded. Un solo radio (8px) da coherencia visual total. Si ves `borderRadius: 12` o `borderRadius: 16`, está mal.

**Shadows en cards**
Why: el DS es flat-first para mobile. Las sombras son un patrón de escritorio que crea false depth en touch interfaces. Las cards se diferencian por fondo blanco sobre cream, no por elevación.

---

## Texto y voz

**Title Case**
Why: voz operacional chilena usa sentence case siempre. "Crear animal" no "Crear Animal". La excepción son siglas (DIIO, GDP, ODEPA) y nombres propios.

**Exclamation marks**
Why: el tono es seco, declarativo, data-first. "¡Registro guardado!" suena a app de gamificación para niños. "Registro guardado" es suficiente.

**AI warmth ("Great question!", "¡Excelente!", "Con gusto te ayudo")**
Why: explícitamente rechazado en el DS. Los usuarios son dueños de fundo y operarios en terreno — no quieren calidez artificial, quieren datos rápidos.

**Emoji en body copy**
Why: tono profesional ganadero. Los emojis en contenido (no en iconografía de sistema) bajan la percepción de seriedad. La única excepción es si el usuario los usa en el chat.

**Términos incorrectos**
Why: hay términos exactos definidos. Usar el incorrecto confunde al usuario de campo.

| ❌ No usar | ✅ Usar |
|-----------|--------|
| Identificador / Chip / Tag | DIIO |
| Ganancia diaria / Aumento | GDP |
| Potrero de engorda | Feedlot (cuando aplica) |
| Preñada | Preñez / En preñez |
| Destete precoz | Destete |
| Baliza / Sensor | Bastón XRS2i |

---

## Modo y tema

**Dark mode**
Why: explícitamente excluido del DS. 100% light theme. Si implementas dark mode variables, están mal.

**High contrast / accessibility overrides**
Why: no hay especificación en el DS para estos modos. No implementar sin diseño explícito.

---

## Patrones de interacción

**Hover-first patterns**
Why: SmartCow es mobile-first. El hover es una degradación en touch. Los estados interactivos se diseñan para tap, no hover. `onHover` puede existir como enhancement, pero el estado default no puede depender de él.

**Gestos complejos (multi-touch)**
Why: operarios en terreno a veces usan guantes. Tap targets mínimos 44px, acciones simples.

---

## Código

**Tailwind color classes** (`bg-blue-500`, `text-gray-200`, `border-green-700`, etc.)
Why: los tokens canónicos están en `const C` (inline styles). Mezclar Tailwind contamina el sistema — dos fuentes de verdad para colores genera divergencias. El DS usa inline styles en React, no Tailwind.

**Importar Lucide directo** (`import { X } from 'lucide-react'`)
Why: el DS tiene `chat_web_icons.jsx` con 30+ íconos custom incluyendo la vaca. Lucide importado directo puede traer íconos visualmente inconsistentes. Usar siempre `Ico.nombre()`.

**Mockups sueltos en `docs/design/` raíz**
Why: los archivos `smartcow_chat_web_v2.html`, `smartcow_jp_chat_v3.html`, etc. son drafts de exploración, algunos superseded, algunos con tokens incorrectos. El canon es `smartcow-design-system-web-chat/` únicamente.
