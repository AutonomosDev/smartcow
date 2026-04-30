# Ciclo de Vida Bovino — Referencia SmartCow

## Fuentes

- INE Chile: "Comportamiento y caracterización producción carne bovina en Chile" — https://www.ine.gob.cl/docs/default-source/documentos-de-trabajo/caracterizacion-produccion-carne-bovina-en-chile-ine.pdf
- Farmquip Chile: "Ganadería intensiva: desde la cría hasta la terminación a corral" — https://www.farmquip.cl/blog/255/ganaderia-intensiva-desde-la-cria-hasta-la-terminacion-a-corral/
- ODEPA: "Costos para bovinos de carne en etapa de crianza, recría y engorda" — https://bibliotecadigital.odepa.gob.cl/server/api/core/bitstreams/9c41a750-1847-4e9c-b5ef-5116b70c3af0/content
- Corporación de la Carne: "Producción eficiente de novillos de lechería entre 18 a 22 meses" — https://www.corporaciondelacarne.cl/2020/11/20/produccion-eficiente-de-novillos-de-lecheria-entre-18-a-22-meses-de-edad/
- Universidad Austral de Chile: "Respuesta económica del sistema cría vaca-ternero" — http://revistas.uach.cl/html/agrosur/v25n1/body/art09.htm
- Producción Animal (Argentina, aplicable región): "Cría y Recría de Bovinos" — https://www.produccion-animal.com.ar/informacion_tecnica/cria/177-TextoCriaRecria.pdf
- CONtexto Ganadero: "Ciclo de vida productivo y reproductivo de hembra bovina" — https://www.contextoganadero.com/reportaje/asi-es-el-ciclo-de-vida-productivo-y-reproductivo-de-una-hembra-bovina
- Sistemas de Producción de Carne, Demanet Filippi (UACh): https://praderasypasturas.com/rolando/01.-Catedras/02.-Produccion_de_Carne/2009/03.-Sistema_de_Crianza.pdf
- Valledor Chile: "Proceso del engorde del vacuno" — https://tienda.valledor.cl/blogs/articulo/proceso-del-engorde-del-vacuno
- SAG Chile: Programa Oficial de Trazabilidad Animal — https://www.sag.gob.cl/ambitos-de-accion/programa-oficial-de-trazabilidad-animal

---

## Diagrama del Flujo

```
PARTO
  │
  ▼
[1] CRÍA AL PIE DE LA MADRE
    0–6/8 meses │ 30–45 kg al nacer → 150–200 kg al destete
  │
  ▼ DESTETE (evento puntual: separación física madre/ternero)
[2] TERNERO DESTETADO
    6–8 meses │ 150–200 kg → inicia alimentación independiente
  │
  ▼ (puede pasar directo a recría o venderse en feria)
[3] RECRÍA
    8–18 meses │ 150–200 kg → 300–380 kg
    (pasturas, suplementación, sin feedlot)
  │
  ▼ (puede venderse a engordero o pasar a feedlot propio)
[4] ENGORDA / FEEDLOT
    18–26 meses (extensivo campo) │ 320–420 kg entrada → 480–550 kg salida
    o 60–120 días (intensivo feedlot) │ 320–420 kg entrada → 480–550 kg salida
  │
  ▼
[5] FAENA (matanza en planta frigorífica)
    Peso vivo: 480–550 kg → Canal: ~250–295 kg (rendimiento 52–55%)
  │
  ▼
CARNE EN VARA (comercialización)
```

**Nota Chile**: En el sur de Chile (región con >70% de la producción nacional), el ciclo completo desde nacimiento hasta faena supera los 24 meses en sistemas extensivos a pastoreo. Los sistemas feedlot intensivos pueden reducirlo a 18–20 meses.

---

## Etapas

### 1. Nacimiento / Cría al pie de la madre

**Nombre en inglés**: Birth / Suckling calf phase

**Duración típica**: 6–8 meses (180–240 días)

**Peso de entrada (al nacer)**: 30–45 kg (razas carne British: 35–42 kg; razas lecheras: 38–45 kg)

**Peso de salida (al destete)**: 150–200 kg
- Meta óptima Chile sur: 180–200 kg a los 8 meses (fuente: Demanet Filippi, UACh)
- Mínimo aceptable: 150 kg a los 6 meses

**Categoría animal**: Ternero/a al pie (también: "ternero de crianza", "calf")

**Alimentación**: Leche materna + pastoreo incipiente. El rumen comienza a desarrollarse desde las 3–4 semanas.

**Eventos registrados en esta etapa**:
- Parto (fecha, tipo: normal/distócico, gemelar)
- Identificación (aplicación de DIIO — obligatorio antes de los 6 meses, SAG)
- Areteo (colocación física del arete/DIIO)
- Peso al nacer
- Vacunación neonatal (clostridiales, IBR, BVD según protocolo del predio)
- Asignación de madre (link madre-cría en DB)
- Estado de salud inicial (evaluación a las 24–48h)
- Castración de machos (entre 2–6 meses, si aplica)
- Pesajes intermedios (mensual o bimestral)

**Notas Chile**:
- Las regiones de Los Lagos, Los Ríos y La Araucanía concentran >70% de la producción nacional. El clima permite pastoreo extensivo durante gran parte del año.
- Razas dominantes en cría: Hereford, Angus, Overo Colorado (dual propósito), Simmental. Mezclas predominan en pequeños productores.
- El sistema vaca-ternero es el núcleo de la ganadería chilena campesina (INDAP).
- La gestación dura 280–285 días promedio (razas europeas: ~280 días; razas cebuinas: ~285 días).

---

### 2. Destete (evento de transición)

**Nombre en inglés**: Weaning

**Definición**: Separación física y definitiva del ternero respecto a su madre. No es una etapa en sí sino un evento que marca el fin de la Cría y el inicio de la etapa siguiente.

**Edad típica de destete en Chile**: 6–8 meses
- Destete precoz: 2–3 meses (técnica especial, suplementación intensiva, libera vaca para repreñarse antes)
- Destete hiperprecoz: 30–45 días (solo en sequías o situaciones extremas)
- Destete convencional: 6–8 meses (método estándar Chile)

**Peso al destete (Chile)**:
- Mínimo: 150 kg
- Normal: 170–200 kg
- Excelente: >200 kg

**Proceso**: Separación física madre-cría por al menos 7–14 días. Se recomienda que el proceso dure al menos 2 semanas para minimizar pérdida de peso. Puede hacerse por lotes (todo el rebaño en un período de 30–60 días) o individualmente.

**Eventos registrados**:
- Fecha de destete
- Peso al destete (pesaje obligatorio en ese momento)
- Lote de destino (si pasa a recría propia o se vende en feria)
- Vacunaciones previas al traslado (si corresponde)
- Formulario de Movimiento Animal (FMA) si se traslada a otro predio

---

### 3. Recría

**Nombre en inglés**: Backgrounding / Stocker phase / Growing phase

**Duración típica**: 6–12 meses (meses 6–18 de vida)

**Peso de entrada**: 150–200 kg (al destete)

**Peso de salida**: 300–380 kg (listo para feedlot o terminación a pasto)

**Edad al inicio**: 6–8 meses

**Edad al término**: 14–20 meses

**GDP esperada en recría a pastoreo en Chile**: 0.5–0.8 kg/día
- Pradera natural del sur: 0.5–0.7 kg/día
- Con suplementación: 0.7–0.9 kg/día

**Alimentación**: Principalmente pastoreo en potreros. En Chile sur, base forrajera natural. Se suplementa con heno, silaje o concentrado en invierno o períodos de baja disponibilidad de pradera.

**Objetivo**: Lograr el desarrollo del esqueleto y tejido muscular antes de la fase de engorda. Los animales deben alcanzar un mínimo de 320–380 kg para ingresar eficientemente al feedlot.

**Eventos registrados**:
- Pesajes periódicos (mensual o bimestral para calcular GDP)
- Vacunaciones según calendario sanitario
- Tratamientos antiparasitarios (dosificación)
- Cambios de potrero (registro de movimientos)
- Tratamientos veterinarios
- Cambios de lote

**Notas Chile**:
- En el sur de Chile, la recría es principalmente extensiva a pastoreo.
- Muchos crianceros venden terneros destetados en ferias a "engorderos" especializados que hacen la recría-engorda.
- La pradera templada del sur de Chile permite buenas ganancias en primavera-verano (0.7–1.0 kg/día) que caen en invierno (<0.3–0.5 kg/día).

---

### 4. Engorda / Feedlot

**Nombre en inglés**: Finishing phase / Feedlot / Fattening

**Duración típica**:
- Feedlot intensivo (corral): 60–120 días
- Terminación a pasto (extensivo): 90–180 días adicionales post-recría

**Peso de entrada al feedlot**: 320–420 kg
- Recomendado para eficiencia: >380 kg (fuente: Corporación de la Carne Chile)
- Peso mínimo para 60–70 días de feedlot obteniendo >500 kg: 420 kg entrada

**Peso de salida (para faena)**: 480–550 kg
- Meta óptima novillo lechero terminado: >500 kg a 18–20 meses
- Meta novillo carne: 500–560 kg

**GDP en feedlot Chile**: 1.2–1.5 kg/día (normal); >1.6 kg/día (excelente)

**Conversión alimenticia (feedlot)**: 6.0–8.0 kg materia seca / kg ganancia peso vivo
- Rango eficiente: 6.0–7.0
- Rango aceptable: 7.0–8.0
- Crítico (evaluar): >8.0

**Alimentación feedlot**: Ración total mezclada (RTM) con alta proporción de granos (maíz, cebada, trigo), silaje, heno y subproductos industriales. En Chile el grano más usado es maíz o cebada según zona.

**Organización del feedlot en Chile**:
- Corrales: infraestructura de confinamiento con bebederos, comederos y sombra
- Lote (batch): grupo de animales de características similares (peso, edad, origen) que ingresan y egresan juntos
- Capacidad típica por corral: 80–150 animales (10–15 m² por cabeza)
- Un feedlot mediano chileno tiene 500–3.000 cabezas simultáneas

**Período de adaptación**: 21 días al inicio del feedlot — etapa crítica de mayor riesgo sanitario y menor ganancia de peso.

**Eventos registrados**:
- Fecha de ingreso al lote/corral
- Peso de ingreso
- Vacunaciones de ingreso (protocolo adaptación)
- Tratamientos antiparasitarios
- Pesajes intermedios (cada 21–28 días típicamente)
- Consumo de ración (si se registra por lote)
- Tratamientos veterinarios individuales
- Fecha de egreso y peso final
- Destino (planta frigorífica, o venta en pie)

**Notas Chile**:
- El feedlot intensivo es menos prevalente en Chile que en Argentina. La mayoría de la engorda chilena es semi-intensiva (pastoreo + suplementación).
- Feedlots más grandes están en regiones del Maule, Biobío y Metropolitana.

---

### 5. Faena (Matanza / Slaughter)

**Nombre en inglés**: Slaughter / Processing

**Definición**: Sacrificio del animal en planta frigorífica habilitada por el SAG, con inspección veterinaria oficial, para obtener la canal (carne en vara) y subproductos.

**Peso vivo al ingreso a planta**: 480–550 kg (novillo terminado)

**Proceso en planta**:
1. Recepción y descanso en corrales (mínimo 12–24 horas de ayuno de agua/comida)
2. Insensibilización/aturdimiento (pistola de perno cautivo o descarga eléctrica)
3. Sangrado (degüello)
4. Descuerado
5. Eviscerado (separación de vísceras rojas y blancas)
6. División en medias canales (corte longitudinal)
7. Lavado y toilette de canales
8. Clasificación y tipificación (según NCh 1306 e NCh 1423)
9. Refrigeración (0–4°C por 24–48h antes de comercialización)

**Rendimiento en vara (carcass yield)**:
- Promedio Chile: 52–55% del peso vivo
- Se requieren ~1.92 kg de animal vivo para obtener 1 kg de carne en vara
- Novillo bien terminado puede llegar a 56–58%

**Clasificación de canales (NCh 1306)**: 6 categorías — V, A, C, U, N, O
- V (Vaquilla/novillo joven): la categoría premium, mayor valor comercial
- A (Animal joven con 2–4 dientes): segunda categoría
- C, U, N, O: categorías de menor valor por mayor edad o características

**Categorías de ganado en pie (NCh 1423)**: 11 clases basadas en sexo y dentición
- Novillito (DL*/2D), Vaquilla (DL*/2D), Torito (DL*), Novillo (4–6D), Vaca joven (4–6D), Vaca adulta (8D), Vaca vieja (8D*), Toruno (2–8D*), Toro (2–8D*), Buey (8D/8D*), Ternero/a (DL)
- DL = Dientes de leche; 2D = 2 dientes permanentes; 4D = 4 dientes; 8D = 8 dientes (boca llena)

**Estadísticas Chile 2025** (INE):
- Q1 2025: 193.347 cabezas faenadas → 50.397 toneladas carne en vara
- Total 2024: ~847.000 cabezas → ~180.400 toneladas (crecimiento 4.5% vs 2023)

**Notas Chile**:
- Solo pueden faenar plantas habilitadas por el SAG con inspector oficial presente.
- La categoría V (novillos/vaquillas jóvenes) representa ~57% de la faena nacional.
- Los animales se comercializan "en vara" (colgados en la planta) o en cortes al vacío.

---

## Eventos por Etapa (tabla)

| Etapa | Evento | Frecuencia | Dato capturado |
|-------|--------|------------|----------------|
| Cría | Parto | Por evento | Fecha, tipo parto, peso madre, estado ternero |
| Cría | Areteo / DIIO | Una vez (antes 6 meses) | Número DIIO, fecha, aplicador |
| Cría | Peso al nacer | Una vez | Kg, fecha |
| Cría | Vacunación neonatal | 1–2 veces primeros meses | Producto, dosis, fecha |
| Cría | Castración | Una vez (2–6 meses) | Fecha, método |
| Cría/Recría | Pesaje periódico | Mensual o bimestral | Kg, fecha, calculado GDP |
| Destete | Destete | Una vez | Fecha, peso al destete, destino |
| Recría | Dosificación antiparasitaria | 2–4 veces/año | Producto, dosis, fecha |
| Recría | Vacunación | Según calendario | Producto, dosis, fecha |
| Recría | Tratamiento veterinario | Por evento | Diagnóstico, producto, dosis, fecha |
| Recría | Movimiento de potrero | Frecuente | Potrero origen, destino, fecha |
| Recría | Cambio de lote | Por evento | Lote anterior, lote nuevo, fecha |
| Engorda | Ingreso a feedlot/lote | Una vez | Fecha, peso, lote asignado |
| Engorda | Pesaje intermedio | Cada 21–28 días | Kg, fecha, GDP calculado |
| Engorda | Vacunación ingreso | Una vez al ingresar | Protocolo feedlot |
| Engorda | Tratamiento individual | Por evento | Diagnóstico, producto, dosis |
| Engorda | Egreso de feedlot | Una vez | Fecha, peso, destino (frigorífico/feria) |
| Faena | Faenamiento | Una vez | Fecha, planta, peso vivo, peso canal, rendimiento |
| Faena | Tipificación | Una vez | Categoría NCh 1306 (V/A/C/U/N/O) |

---

## Relación con SmartCow DB

**Tabla `animales`**:
- Campo `estado`: refleja etapa actual del animal. Valores típicos: `activo`, `baja`, posiblemente etapa productiva.
- Campo `fecha_nacimiento`: permite calcular edad y determinar etapa probable.
- Campo `sexo` + `tipo_ganado`: determina categorías de clasificación (novillo, vaquilla, toro, etc.).

**Tabla `pesajes`**:
- Registra transiciones de peso entre etapas.
- Con dos pesajes consecutivos → GDP calculable: `(peso_final - peso_inicial) / días`.
- Permite detectar animales en underperformance dentro de un lote.

**Tabla `partos`**:
- Registra nacimientos → inicio de la etapa de Cría.
- Linkea madre (ID vaca) con cría (ID ternero) via `cria_id`.
- Fecha de parto + fecha de destete → duración de cría calculable.

**Tabla `lotes`**:
- Agrupa animales por etapa/manejo (recría, engorda, etc.).
- Permite seguimiento de GDP por lote en feedlot.
- Los movimientos entre lotes reflejan cambios de etapa productiva.

**Tabla `bajas`**:
- Registra muerte, venta, faena. Cierra el ciclo del animal.
- Tipo baja `faena` = ingresó a planta frigorífica.

**Tabla `movimientos_potrero`**:
- Registra cambios de potrero → trazabilidad geográfica del animal.
- Relevante en recría extensiva para control de carga animal.

**Tabla `inseminaciones`** / **`ecografias`**:
- Aplican a hembras reproductoras (vacas de cría).
- Determinan la tasa de preñez y eficiencia reproductiva del rebaño de cría.
