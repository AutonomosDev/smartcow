# Plan de Mockup: Detalle de Lote & Gestión de Tareas

Este plan detalla la construcción de las dos pantallas operativas clave para la experiencia móvil de SmartCow, basándonos en la nueva referencia visual proporcionada (Farming UI by Stanley).

## 1. Deconstrucción de Pantallas Referencia

### Pantalla A: Detalle de Rendimiento (Izquierda)
*   **Contexto SmartCow:** Informe de Pesos y Datos Biométricos del Lote.
*   **Componentes Clave**:
    - **Header**: Título del Lote ("Lote 4 - El Boldo") con selector de pestañas (Resumen / Notas).
    - **Hero Chart (Smart Score)**: Visualización bimodal de la ganancia de peso diaria. Reemplazaremos el "Smart Score" por un "Índice de Conversión".
    - **Grid de Características**: Tarjetas pequeñas para "Promedio Peso", "Consumo Agua", "Nivel Nutrición".
    - **CTA Principal**: Botón flotante inferior para "Ver historial completo" o "Iniciar Pesaje".

### Pantalla B: Gestión de Tareas (Derecha)
*   **Contexto SmartCow:** Operativa diaria del fundo (módulos de trabajo).
*   **Componentes Clave**:
    - **Dashboard de Tareas**: Conteo rápido de Activas, Pendientes y Terminadas.
    - **Listado Dinámico**: Cards de tareas con prioridad (Alta, Media, Baja), responsable y hora.
    - **Iconografía**: Uso de iconos específicos (jeringa para sanidad, pasto para rotación, gota para hidratación).
    - **Action Button**: Botón inferior "Nueva Tarea" en verde profundo.

## 2. Aplicación de Design Tokens (Extraídos Previamente)

*   **Fondo**: Crema suave (`#F4F6F5`).
*   **Tarjetas**: Blanco puro con bordes `rounded-[32px]`.
*   **Tipografía**: `Inter` con jerarquías Bold para métricas.
*   **Colores de Estado**: Verde Agri para "Activo", Naranja para "Media Prioridad", Rojo para "Urgente".

## 3. Ejecución del Mockup

Crearemos un archivo `mobile-detail-tasks-studio.html` que contendrá ambos dispositivos en una composición de estudio 4K.

### [NEW] `mockups/mobile-detail-tasks-studio.html` (prototipo HTML estático)

---

## Preguntas Abiertas
- En la referencia de tareas aparece un "John Smith" como responsable. ¿Prefieres que usemos nombres reales de operarios o dejamos el espacio genérico para el diseño?
- ¿El gráfico de pesos prefieres que sea de barras (como el Smart Score) o lineal?
