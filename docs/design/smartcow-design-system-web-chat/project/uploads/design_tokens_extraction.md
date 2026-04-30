# Deconstrucción Visual y Tokens de Diseño (AgriTech Premium)
*Documento de Referencia Técnica para Implementación Frontend*

Este documento consolida la extracción matemática y visual de los lineamientos de diseño para SmartCow v6, basándose en la referencia "Organic Farm" web y móvil. 

Sirve como el **contrato de interfaz** que los desarrolladores usarán en el código (`tailwind.config.ts`, `globals.css`) y que **Claude Code** utilizará para verificar la calidad en las Pull Requests y tickets.

---

## 1. Design Tokens Principales (Fundamentales)

### 1.1 Paleta de Color Semi-Semántica
La paleta se aleja del estilo "Enterprise de oficina" para adoptar un estilo natural pero de alto contraste y legibilidad al sol.

*   **Backgrounds (Fondos):**
    *   `bg-farm-base` : `#F4F6F5` (Off-White/Cream).
    *   `bg-farm-surface` : `#FFFFFF`.
*   **Brand / Acción Principal (Stanley Edition):**
    *   `brand-dark` : `#06200F` (Verde Bosque Profundo). Cabeceras y botones primarios.
    *   `brand-light` : `#9ADF59` (Verde Limón). Acentos, KPIs positivos y elementos de resalte.
*   **Alertas / Estados:**
    *   `accent-warning` : `#F97316` (Naranja).
    *   `accent-neutral` : `#8B7280` (Gris Neutro extraído).
*   **Textos (Ink):**
    *   `ink-title` : `#111827` (Gray 900). Negro de lectura.
    *   `ink-body` : `#4B5563` (Gray 600). Textos de descripción.
    *   `ink-meta` : `#9CA3AF` (Gray 400). Letras pequeñas y 'breadcrumbs'.

### 1.2 Tipografía
Basada en un enfoque geométrico e hiperlegible, imitando tableros de maquinaria moderna.
*   **Font Family Primary**: `Inter` (Sans-serif).
*   **Scale / Jerarquía**:
    *   *Hero Display*: `text-[54px] font-bold leading-tight tracking-tight`
    *   *H1 / Section Base*: `text-2xl font-bold`
    *   *Card Title*: `text-base font-semibold`
    *   *Body Copy*: `text-sm font-normal text-gray-600`
    *   *Micro (Labels)*: `text-[10px] font-bold uppercase tracking-wider`

### 1.3 Geometría y Bordes (Radii)
El lenguaje visual exige curvas amigables, evitando esquinas "filosas".
*   `rounded-pill`: `border-radius: 9999px` (Clásico en el Floating Search Bar y Chips).
*   `rounded-card`: `border-radius: 24px` (Todas las tarjetas de Lotes y Tareas).
*   `rounded-inner`: `border-radius: 12px` (Botones internos dentro de tarjetas o modales).

### 1.4 Elevación y Espacio (Shadows & Z-Index)
Se utiliza una luz "cenital" que arroja sombras verticales grandes y desenfocadas para separar el contenido (efecto flotante).
*   `shadow-float-heavy`: `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15)` (Usado exclusivamente para el *Search Pill* central).
*   `shadow-card-soft`: `box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05)` (Usado en las tarjetas sobre el fondo gris).
*   **Glassmorphism Mute**: `bg-black/40 backdrop-blur-md` (Usado encima de imágenes para leer métricas del Lote sin oscurecer toda la foto).

---

## 2. Patrones Estructurales (UI Patterns)

### 2.1 The "Edge-to-Edge Hero" + "Floating Pill"
*   **Composición:** Una imagen 100vh o 50vh sangrada al 100% de la pantalla. Un componente interactivo "píldora" anclado matemáticamente usando `position: absolute; bottom: -36px; left: 50%; transform: translateX(-50%);`.
*   **Funcionalidad:** Crea un ancla visual indestructible en web. Es la entrada a todas las búsquedas del Fundo.

### 2.2 The "Smart Tile" (Cajón de Trabajo / Lote)
Reemplaza las tablas de datos (Datatables) por una interfaz táctil de fichas grandes.
*   **Estructura Interna:** Configurado como un flujo de columna `flex-col`.
*   **Proporción:** Foto (`h-[220px]`) + Info (`p-4`).
*   **Micro-interacción esencial (Hover):** Al poner el mouse, la imagen de fondo escala ligeramente (`transform: scale(1.05); transition: 300ms ease`) sin crecer el cajón contenedor (`overflow: hidden`).

### 2.3 The "AI Hook" (Gancho Inteligente)
El concepto de "Invocar Asistencia sobre un Bloque".
*   **Composición:** Botón blanco circular con icono verde de "Destellos" (`sparkles`), posicionado en absoluto en `top-4 right-4` de cualquier Smart Tile.
*   **Regla Funcional:** Donde sea que se vea este botón (en un Lote, en una Alerta, en una Vaca particular), pulsarlo abre el Panel IA de SmartCow alimentado *inmediatamente* con la ID y contexto de ese elemento.

---

## 3. Implementación Propuesta en Tailwind (tailwind.config.mjs)

Para aterrizar esto en código, los settings propuestos serían:

```javascript
export default {
  theme: {
    extend: {
      colors: {
        farm: {
          base: '#F4F6F5',
          surface: '#FFFFFF',
        },
        brand: {
          DEFAULT: '#16A34A',
          dark: '#166534',
        },
        accent: {
          warning: '#F97316',
          success: '#22C55E',
        }
      },
      borderRadius: {
        'card': '1.5rem', /* 24px */
      },
      boxShadow: {
        'float': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'card': '0 10px 20px -5px rgba(0,0,0,0.05)',
      }
    }
  }
}
```
