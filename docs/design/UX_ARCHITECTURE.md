# Arquitectura UX y Flujos de Navegación (SmartCow v6)

Este documento define el mapa de navegación y la lógica de interacción de la plataforma SmartCow, alineando los mockups de diseño con la estructura de rutas de Next.js.

---

## 1. El User Journey (Flujo del Huaso)

El sistema está diseñado para ser "Mobile First" en el campo y "Desktop First" en la oficina de administración.

```mermaid
graph TD
    A[Inicio / Login] --> B{Rol de Usuario}
    B -- Encargado Fundo --> C[Dashboard Principal / Studio]
    B -- Operario Campo --> D[Home "Farming App" / Alertas]
    
    C --> E[Exploración de Datos]
    C --> F[Consultar SmartCow IA]
    
    D --> G[Detalle de Lote / Rendimiento]
    D --> H[Gestión de Tareas Diarias]
    
    G --> F
    H --> F
    
    F --> I[Resolución / Acción]
```

---

## 2. Mapa de Pantallas (Mapping)

### 2.1 Fase de Entrada
| Pantalla | Ruta | Descripción |
| :--- | :--- | :--- |
| **Login** | `/login` | Acceso biométrico o vía PIN. |
| **Home "Farm Tracker"** | `/` | Vista de alta fidelidad con KPIs, Clima y Grilla de Lotes. |

### 2.2 Fase de Operación (Móvil)
| Pantalla | Ruta | Acción Clave / Componente |
| :--- | :--- | :--- |
| **Gestión de Tareas** | `/tasks` | Listado de tareas diarias con prioridad (#Urgente, #Pendiente). |
| **Detalle de Lote** | `/lotes/[id]` | Gráfico bimodal de peso y métricas de pastoreo. |

### 2.3 Fase de Administración (Web)
| Pantalla | Ruta | Acción Clave / Componente |
| :--- | :--- | :--- |
| **Studio Dashboard** | `/dashboard` | Centro de mando 4-columnas con métricas globales y chat lateral. |

### 2.4 Fase de Asistencia (Capas Transversales)
| Pantalla | Ruta | Descripción |
| :--- | :--- | :--- |
| **SmartCow Chat** | `/chat` | Interfaz conversacional SSE para soporte 24/7. |

---

## 3. Lógica de Intercambio (Transitions)

### A. El "IA Trigger" (Botón de Destellos)
*   **Comportamiento**: Presente en todas las "Smart Tiles" de lotes o tareas.
*   **Destino**: Abre el `/chat` inyectando el `context_id` del elemento seleccionado.
*   **Transición**: Slide-in lateral (Web) o Modal Overlay Fullscreen (Mobile).

### B. El "Live Feed" de Pesaje
*   **Desde**: Pantalla de Detalle de Lote (`/lotes/[id]`).
*   **Hacia**: Interfaz de registro de peso instantáneo.
*   **Trigger**: Botón FAB *"Iniciar Nuevo Pesaje"*.

---

## 4. Visualización de Referencia (Hall Of Fame)

Consultar los siguientes documentos de diseño para la implementación de UI:
1.  **[Tokens de Diseño](design_tokens_extraction.md)**: Colores HEX oficiales y tipografía.
2.  **[Walkthrough Visual](walkthrough.md)**: Capturas de alta definición de cada pantalla mencionada arriba.
