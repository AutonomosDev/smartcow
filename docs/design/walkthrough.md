# Walkthrough: SmartCow UX & Estrategia Visual

Hemos completado el recorrido completo de la interfaz de usuario de SmartCow, creando mockups de alta fidelidad para diversos estados del sistema sin alterar la lógica core del motor.

## 1. Mobile Home Dashboard (Pre-Chat)

Antes de entrar a conversar con la IA, el usuario recibe esta vista panorámica del estado de su fundo. Inspirado en una estética "Agri-Tech Premium".

![SmartCow Mobile Pre-Chat](mockups/mobile_home_mockup_final_1775698010837.png)

### Design System Extract (Estilo Huaso Agri-Tech)

**Tipografía:**
- Familia: `Inter`
- Jerarquía Clave: Títulos en `Bold (700)` de 26px, etiquetas en `Semibold (600)` de 10px (en mayúsculas para las alertas), textos base en `Regular (400)`.

**Paleta de Colores Exclusiva:**
- 🌿 **Verde Bosque (Acción Principal):** `#166534` - Para el *Floating Action Button (FAB)* que llama al asistente IA.
- 🐄 **Fondo Crema (Agri-Background):** `#F4F6F5` - Un tono suave, off-white que evoca lana/leche y evita el desgaste visual bajo el sol.
- ☀️ **Naranja Clima (Acentos/Alertas):** `#F97316` - Para tarjetas activas y temperatura.
- 💳 **Tarjetas Blancas (Cards):** `#FFFFFF` con sombras extremadamente suaves `box-shadow: 0 10px 20px rgba(0,0,0,0.05)`.

**Materiales UI:**
- **Glassmorphism**: Superposición en las tarjetas de clima `(background: rgba(40, 45, 40, 0.6), backdrop-filter: blur(16px))`. Brinda sofisticación.
- **Botones Píldora**: Totalmente redondeados (`rounded-full`) para seleccionar categorías de animales (Vacas Lecheras, Terneros, Engorda).

## 2. SmartCow IA Chat (Mobile)

Una vez que el "huaso" pulsa el botón flotante de la IA, ingresa a la vista de chat optimizada para interacción fluida, con herramientas interactivas (Age Plan) simulando un análisis en tiempo real.

````carousel
![Dark Mode iPhone](mockups/studio_mockup_final_1775696248191.png)
<!-- slide -->
![Light Mode iPhone con Gráfico](mockups/studio_mockup_light_final_1775696384806.png)
````

## 3. Web Dashboard (Oficina / Centro de Mando)

La experiencia conectada donde el Encargado de Fundo revisa los datos históricos, con un panel amplio y el asistente IA adherido en la columna derecha para soporte inmediato.

![SmartCow Web Pro Light](mockups/web_dashboard_light_studio_final_1775697358108.png)

## 4. Web Home "Farm Tracker" (Vista Gráfica Interactiva)

Alternativa visual de entrada web donde el usuario supervisa los potreros como grandes fichas fotográficas ("Smart Tiles"). 

![SmartCow Web Farm Tracker](mockups/web_home_dribbble_final_1775698372195.png)

### Design System Extract (Estilo Farm Tracker Web)
- **Geometría de Precisión**: La barra de búsqueda principal sobresale del hero header anclándose con fuerza visual gracias a un diseño en forma de píldora (`border-radius: 100px`) y una profunda sombra perimetral flotante.
- **Micro-Interacciones de IA**: En cada potrero fotográfico (Lote 4, Terneros, etc) incluimos un botón circular tipo "burbuja emergente" en la esquina superior derecha (`sparkles`). Este botón es el CTA perfecto para que el operador hable con SmartCow IA consultando específicamente por los parámetros de ese Lote de forma directa.
- **Tipografía de Alto Contraste**: Uso de `Inter` masivo (`54px` font-weight `700`) sobre el Hero, utilizando gradientes inferiors (`linear-gradient`) para asegurar que el texto blanco nunca pierda legibilidad ante las variaciones de la luz en la fotografía de fondo agrícola.

## 5. Mobile Ops & Detalle (Stanley Edition)

Implementación final de las vistas operativas usando la paleta oficial (`#06200F` y `#9ADF59`). Detalle de rendimiento y gestión de tareas diarias.

![SmartCow Ops Performance Studio](mockups/mobile_studio_mockup_v2_new_colors_1775699717655.png)

## 6. Arquitectura de Flujos

Hemos mapeado el ecosistema completo para asegurar una navegación fluida entre el campo y la oficina.

> [!IMPORTANT]
> **Documento de Referencia**: Ver [UX_ARCHITECTURE.md](UX_ARCHITECTURE.md) con el diagrama Mermaid y las rutas de Next.js correspondientes para cada mockup.

### Flujo Principal:
1. **Vista Home**: Diagnóstico rápido y alertas climáticas.
2. **Navegación Táctica**: Gestión de Tareas (`/tasks`) o Detalle de Lote (`/lotes/[id]`).
3. **Capa de Asistencia**: Invocación de SmartCow IA desde cualquier componente vía el botón de "Destellos".

