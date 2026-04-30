# KPIs Ganaderos — Referencia SmartCow

## Fuentes

- CONtexto Ganadero: "Ganancia diaria de peso en bovinos" — https://www.contextoganadero.com/ganaderia-sostenible/aprenda-calcular-la-ganancia-diaria-de-peso-en-bovinos
- HerdSecure: "GDP en bovinos: cuánto debería ganar por día" — https://www.herdsecure.mx/post/ganancia-diaria-de-peso-en-bovinos-gdp
- CONtexto Ganadero: "Importancia de calcular la tasa de preñez" — https://www.contextoganadero.com/ganaderia-sostenible/la-importancia-de-calcular-la-tasa-de-prenez-en-el-hato-ganadero
- CONtexto Ganadero: "Tasas de morbilidad y mortalidad" — https://www.contextoganadero.com/ganaderia-sostenible/analice-las-tasas-de-morbilidad-y-mortalidad-de-su-hato
- Intagri: "Conversión alimenticia en bovinos" — https://www.intagri.com/articulos/ganaderia/conversion-alimenticia-en-bovinos
- ScIELO Chile: "Características bovinos faenados Xa Región" — https://www.scielo.cl/scielo.php?script=sci_arttext&pid=S0301-732X1999000100008
- ODEPA: Boletín carne bovina marzo 2025 — https://opia.fia.cl/601/articles-128471_archivo_01.pdf
- INE Chile: Producción carne en vara Q1 2025 — https://www.ine.gob.cl/sala-de-prensa/prensa/general/noticia/2025/05/06/
- Universidad Austral Chile: "Respuesta económica sistema cría vaca-ternero" — http://revistas.uach.cl/html/agrosur/v25n1/body/art09.htm
- MLA Agri-Benchmark: "How are global and Australian beef feedlots performing?" — https://www.mla.com.au/globalassets/mla-corporate/prices--markets/documents/trends--analysis/agri-benchmark/mla-agribenchmark-feedlot-results-report-jan-2019.pdf
- USDA FAS Argentina: Livestock Products Annual 2025 — https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=Livestock+and+Products+Annual_Buenos+Aires_Argentina_AR2025-0014.pdf
- Producción Animal AR: "Conversión alimenticia como herramienta" — https://www.produccion-animal.com.ar/informacion_tecnica/invernada_o_engorde_en_general/105-Conversion_decision_engordes.pdf
- WOAH: "Bienestar animal en bovinos de carne" — https://www.woah.org/fileadmin/Home/esp/Health_standards/tahc/current/es_chapitre_aw_beef_cattle.htm

---

## Tabla Maestra de KPIs

| KPI | Nombre EN | Fórmula | Malo | Normal Chile | Bueno | Frecuencia |
|-----|-----------|---------|------|--------------|-------|------------|
| GDP | ADG | (P_final - P_ini) / días | <0.9 kg/d | 1.2–1.5 kg/d | >1.6 kg/d | Por lote / pesaje |
| Tasa preñez | Pregnancy rate | (preñadas / expuestas) × 100 | <50% | 60–75% | >80% | Por temporada |
| Tasa destete | Weaning rate | (destetados / vacas expuestas) × 100 | <55% | 65–75% | >80% | Anual |
| Mortalidad | Mortality rate | (muertes / cabezas inicio) × 100 | >3% | <2% | <1% | Por período/lote |
| Conversión alim. | FCR / Feed Conv. Ratio | kg MS alim. / kg PV ganado | >8.0 | 6.0–8.0 | <6.0 | Por lote feedlot |
| Peso faena | Slaughter weight | Kg vivos al ingreso planta | <430 kg | 480–550 kg | >550 kg | Por animal |
| Rendimiento vara | Dressing/Carcass % | (kg canal / kg vivo) × 100 | <50% | 52–55% | >56% | Por faena |
| Días en feedlot | Days on Feed | fecha_egreso - fecha_ingreso | >150 d | 60–120 d | 60–90 d | Por lote |
| Efic. reproductiva | Reproductive efficiency | terneros destetados / vaca/año | <0.55 | 0.65–0.75 | >0.80 | Anual |

---

## Detalle por KPI

---

### 1. GDP — Ganancia Diaria de Peso
**Average Daily Gain (ADG)**

**Definición**: Kilogramos de peso vivo ganados por el animal en promedio por día, calculado entre dos pesajes.

**Fórmula exacta**:
```
GDP (kg/día) = (Peso_final_kg - Peso_inicial_kg) / Días_entre_pesajes
```

**Ejemplo**: Animal pesado el día 0 en 350 kg y el día 28 en 389.6 kg:
GDP = (389.6 - 350) / 28 = 1.414 kg/día

**Rangos Chile**:
| Contexto | Malo | Normal | Excelente |
|---------|------|--------|-----------|
| Feedlot intensivo | <0.9 kg/d | 1.2–1.5 kg/d | >1.6 kg/d |
| Recría a pastoreo (sur Chile) | <0.4 kg/d | 0.5–0.8 kg/d | >0.9 kg/d |
| Recría con suplementación | <0.5 kg/d | 0.7–1.0 kg/d | >1.1 kg/d |
| Ternero al pie pradera primaveral | <0.6 kg/d | 0.7–1.0 kg/d | >1.1 kg/d |

**Referencia benchmark internacional**: En un estudio con 160 novillos Angus comerciales (352 kg entrada), GDP promedio feedlot = 1.52 kg/día (fuente: CONtexto Ganadero). EE.UU. promedio feedlot = ~2.1 kg/día (MLA Agri-Benchmark 2019). Argentina y LatAm: 1.3–1.5 kg/día.

**Frecuencia de medición**: Por pesaje. En feedlot cada 21–28 días. En recría mensual o bimestral.

**Advertencia**: El GDP puede ser negativo en los primeros días post-destete o post-ingreso a feedlot (estrés de adaptación). Un GDP negativo por más de 7 días = señal de alerta sanitaria.

**Cómo calcularlo en SmartCow**:
```sql
SELECT
  a.id AS animal_id,
  p2.peso - p1.peso AS ganancia_kg,
  p2.fecha - p1.fecha AS dias,
  ROUND((p2.peso - p1.peso)::numeric / NULLIF((p2.fecha - p1.fecha), 0), 3) AS gdp_kg_dia
FROM pesajes p1
JOIN pesajes p2 ON p1.animal_id = p2.animal_id AND p2.fecha > p1.fecha
JOIN animales a ON a.id = p1.animal_id
WHERE a.predio_id = :predio_id
ORDER BY p1.animal_id, p1.fecha;
```

---

### 2. Tasa de Preñez
**Pregnancy Rate (PR)**

**Definición**: Porcentaje de hembras en el rebaño que quedan preñadas en un período determinado (generalmente 21 días = un ciclo estral), calculado sobre el total de hembras aptas/expuestas.

**Fórmula exacta**:
```
Tasa Preñez (%) = (N° Hembras Preñadas / N° Hembras Expuestas a Servicio) × 100
```

**Fórmula alternativa (21 días)**:
```
Tasa Preñez 21d = Tasa de Servicio (%) × Tasa de Concepción (%)
```
- Tasa Servicio: % de vacas que ciclan y reciben IA o monta en 21 días
- Tasa Concepción: % de vacas inseminadas/servidas que quedan preñadas

**Rangos Chile/LatAm**:
| Contexto | Malo | Normal | Excelente |
|---------|------|--------|-----------|
| Rodeo cría extensivo campo sur | <50% | 60–75% | >80% |
| Con IATF (protocolo sincronización) | <40% | 53–65% | >70% |
| IA convencional (detección celo) | <35% | 50–60% | >65% |
| Monta natural controlada | <50% | 65–80% | >85% |

**Nota contradicción fuente**: Algunas fuentes generalistas latinoamericanas citan promedios de 12–14% para tasa de preñez de 21 días (que es una métrica distinta, más exigente). La tasa de preñez por temporada completa en Chile oscila entre 60–80% en predios bien manejados.

**Dato Chile IATF** (estudio UChile, Melipilla): Protocolo IATF obtuvo 54% preñez promedio. Vacas con condición corporal >3 tuvieron OR=3.52 mayor probabilidad de preñez vs CC <2.75. Temporada 2014: 70%; temporada 2015: 40% (variabilidad por condición corporal y manejo).

**Frecuencia de medición**: Por temporada reproductiva. En Chile la temporada de servicio típica es octubre–febrero (primavera-verano austral). La confirmación por ecografía ocurre 30–45 días post-servicio.

**Relación con tabla SmartCow**:
- Tabla `inseminaciones`: registra el servicio (fecha, método, toro/pajuela)
- Tabla `ecografias`: registra el diagnóstico de preñez (resultado: positivo/negativo, días de gestación)
- Cruce de ambas permite calcular tasa de concepción por método/temporada

---

### 3. Tasa de Destete
**Weaning Rate**

**Definición**: Número de terneros efectivamente destetados expresado como porcentaje de las vacas presentes al inicio de la temporada reproductiva (o vacas servidas). Es el indicador más práctico de la eficiencia reproductiva de un rodeo de cría.

**Fórmula exacta**:
```
Tasa Destete (%) = (N° Terneros Destetados / N° Vacas Expuestas al Servicio) × 100
```

**Diferencia con tasa de preñez**: La tasa de destete es siempre menor o igual a la tasa de preñez porque incluye las pérdidas por abortos, mortinatos, y mortalidad predestete (terneros que mueren antes del destete).

**Rangos Chile**:
| Contexto | Malo | Normal | Excelente |
|---------|------|--------|-----------|
| Sistema extensivo sur Chile | <55% | 65–75% | >80% |
| Sistema intensivo con suplementación | <65% | 75–85% | >87% |
| Meta óptima (UACh, Agrosur) | | 68–72% | |

**Referencia**: Un estudio de la Universidad Austral de Chile (Agrosur v25n1) establece que con 68% de destete dos sistemas de producción (alta carga y baja carga) presentan margen bruto similar, indicando que este es el punto de equilibrio económico referencial en Chile.

**Frecuencia de medición**: Anual (una vez terminada la temporada de destete). Se compara año a año.

**Relación SmartCow**:
- Tabla `partos`: cuenta nacimientos
- Tabla `pesajes` con fecha de destete: confirma destete realizado
- Diferencia entre partos registrados y destetes registrados = mortalidad predestete

---

### 4. Mortalidad
**Mortality Rate**

**Definición**: Porcentaje de animales que mueren sobre el total del inventario en un período determinado.

**Fórmula exacta**:
```
Mortalidad (%) = (N° Muertes en Período / N° Animales al Inicio del Período) × 100
```

**Rangos por categoría**:
| Categoría | Malo | Normal | Excelente |
|-----------|------|--------|-----------|
| Terneros (0–6 meses) | >8% | 3–5% | <2% |
| Feedlot (general) | >3% | 1–2% | <1% |
| Feedlot (primeros 30 días) | >5% | 2–4% | <1.5% |
| Rodeo adulto | >3% | <2% | <1% |

**Causa principal en feedlot**: Enfermedades respiratorias (complejo respiratorio bovino, BRD) durante el período de adaptación (primeros 21–30 días). La causa de muerte más frecuente en feedlots LatAm.

**Nota**: La mortalidad >3% en cualquier categoría se considera una señal de alerta que requiere investigación veterinaria. En feedlot, la mortalidad del 1–2% es el estándar de manejo aceptable (WOAH, Código Sanitario Animales Terrestres).

**Frecuencia de medición**: Mensual o por lote (feedlot). Anual en rodeos extensivos.

**Relación SmartCow**:
- Tabla `bajas` con `tipo = 'muerte'`: registra cada muerte
- Permite calcular mortalidad por lote, período, potrero, y causa

---

### 5. Conversión Alimenticia (ICE)
**Feed Conversion Ratio (FCR)**

**Nombre en Chile**: ICE (Índice de Conversión) o Conversión Alimenticia

**Definición**: Kilogramos de materia seca de alimento consumidos para producir 1 kg de ganancia de peso vivo. A MENOR valor, MEJOR eficiencia (al revés que GDP).

**Fórmula exacta**:
```
ICE = kg Materia Seca consumida / kg Peso Vivo Ganado
```

**Ejemplo**: Lote consume 2.100 kg MS en 30 días y gana 300 kg PV en total:
ICE = 2.100 / 300 = 7.0 kg MS / kg PV

**Rangos feedlot**:
| Contexto | Malo (ineficiente) | Normal | Bueno (eficiente) |
|---------|-----------|--------|-----------|
| Feedlot granos (novillos) | >8.0 | 6.5–8.0 | <6.5 |
| Feedlot granos (novillos, target óptimo) | | | 6.0–7.0 |
| Feedlot pastoreo suplementado | >10.0 | 8.0–10.0 | <8.0 |

**Nota**: El ICE se expresa en kg MS. Algunos productores lo expresan en kg alimento tal como ofrecido (base húmeda), lo cual da valores distintos. Siempre especificar la base.

**Impacto económico**: El costo del alimento representa 70–90% de los costos directos en feedlot. Un ICE de 7.0 vs 8.0 puede significar diferencias de costo de $50–100 USD/animal en ciclos de 90 días.

**Nota Chile**: No existe un benchmark nacional oficial publicado por ODEPA. Los valores citados son del consenso de la industria regional (Argentina/Chile). La mayoría de feedlots chilenos no publica ICE públicamente.

**Frecuencia de medición**: Por lote, al cierre del ciclo de engorda. Requiere registro del consumo de alimento por lote (no siempre disponible en predios pequeños).

**Relación SmartCow**: No hay tabla específica de consumo de alimento. El ICE solo puede calcularse si se registra el consumo por lote de forma externa y se combina con los pesajes de la tabla `pesajes`.

---

### 6. Peso al Faenamiento
**Slaughter Weight**

**Definición**: Peso vivo del animal (en kg) al momento de ingresar a la planta frigorífica. Determina directamente los kg de carne obtenidos y el ingreso bruto del productor.

**Rangos Chile**:
| Categoría | Mínimo rentable | Normal | Óptimo |
|-----------|----------------|--------|--------|
| Novillo terminado | 430 kg | 480–520 kg | >520–560 kg |
| Vaquilla terminada | 380 kg | 420–460 kg | >460 kg |
| Toro (descarte) | variable | 500–650 kg | — |
| Vaca (descarte) | variable | 400–550 kg | — |

**Dato Chile 2025**: Promedio peso vivo novillos a faena: ~529 kg (2024) y 535 kg (2025 YTD) según datos del sector ganadero. El peso de canal promedio: ~290 kg (fuente: Blasina y Asociados, datos compartidos con sector LatAm).

**Frecuencia de medición**: Por animal, al momento de faena. La planta registra peso en pie (balanza ante-mortem) y peso de canal (balanza post-mortem).

**Relación SmartCow**: Campo en tabla `bajas` cuando el tipo es faena. O en tabla `pesajes` si se registra el pesaje de salida antes del traslado a planta.

---

### 7. Rendimiento en Vara (Carcass Yield %)
**Dressing Percentage**

**Definición**: Porcentaje del peso vivo del animal que se convierte en canal (carne en vara) tras el proceso de faena. Incluye músculo, hueso y grasa de la canal; excluye cuero, vísceras, sangre, cabeza y extremidades (patas).

**Fórmula exacta**:
```
Rendimiento en Vara (%) = (Peso Canal Caliente kg / Peso Vivo Ante-mortem kg) × 100
```

**Equivalente inverso**:
```
kg vivos necesarios = kg canal deseados / (Rendimiento / 100)
```
Ejemplo: Para 280 kg canal con 54% rendimiento → se necesitan 518 kg vivos.

**Rangos Chile**:
| Categoría | Malo | Normal | Excelente |
|-----------|------|--------|-----------|
| Novillo terminado | <50% | 52–55% | >56% |
| Vaquilla terminada | <48% | 50–53% | >54% |
| Toro entero | <48% | 50–54% | >55% |
| Promedio nacional Chile | | ~52% | |

**Dato Chile**: Se requieren ~1.92 kg de animal vivo para obtener 1 kg de carne en vara (implica ~52% rendimiento). Fuente: ODEPA cadena carne bovina.

**Factores que afectan el rendimiento**:
- Mayor terminación (grasa dorsal): aumenta rendimiento
- Mayor tiempo en ayuno antes de faena: aumenta rendimiento (rumen vacío)
- Raza: Bos taurus europeas tienen mejor rendimiento que cruzas cebuinas en Chile
- Condición corporal: CC 3–3.5 (escala 1–5) = rendimiento óptimo

**Categorías de tipificación (NCh 1306)**:
- V: vaquillas/novillos jóvenes (DL o 2D permanentes) — mayor valor
- A: animales con 2–4 dientes — segunda categoría
- C, U, N, O: mayor edad, menor valor comercial

**Frecuencia de medición**: Por faena, en planta. Los datos los emite la planta frigorífica.

---

### 8. Días en Feedlot
**Days on Feed (DOF)**

**Definición**: Número de días que un animal (o lote) permanece en el feedlot desde el ingreso hasta el egreso para faena o venta.

**Fórmula exacta**:
```
Días en Feedlot = Fecha_Egreso - Fecha_Ingreso
```

**Rangos Chile**:
| Contexto | Mínimo viable | Normal | Máximo eficiente |
|---------|--------------|--------|-----------------|
| Feedlot intensivo (ración completa) | 45 días | 60–90 días | 120 días |
| Terminación a pasto + suplemento | 60 días | 90–120 días | 150 días |
| Terneros lecheros (180–200 kg entrada) | 90 días | 110–130 días | 150 días |

**Nota**: Más días no siempre es mejor. Después de los 120 días en feedlot intensivo, la conversión alimenticia empeora significativamente (el animal deposita más grasa, que es metabólicamente cara). El objetivo es alcanzar el peso de faena objetivo en el mínimo de días.

**Dato Corporación de la Carne Chile**: Para novillos de lechería que ingresan con 420 kg, 60–70 días de feedlot son suficientes para alcanzar >500 kg de faena.

**Frecuencia de medición**: Por lote, al cierre del ciclo.

**Relación SmartCow**: Diferencia entre `fecha_ingreso_lote` y `fecha_egreso_lote` en tabla `lotes`. O entre el primer y último pesaje de un animal en un lote de feedlot.

---

### 9. Eficiencia Reproductiva
**Reproductive Efficiency**

**Definición**: Medida integral del desempeño reproductivo del rebaño. En sistemas de cría se expresa como el número de terneros destetados por vaca por año.

**Fórmulas relevantes**:
```
Eficiencia Reproductiva = Terneros Destetados / Vacas del Rebaño
(resultado como ratio: 0.70 = 70 terneros cada 100 vacas)

Intervalo entre partos (IEP) = promedio de días entre parto anterior y siguiente parto
IEP óptimo = 365 días (1 ternero/vaca/año)
IEP real Chile = 380–420 días (promedio sistemas no tecnificados)

Días abiertos = días entre parto y concepción siguiente
Días abiertos óptimos: 80–90 días
Días abiertos normales Chile: 100–130 días
```

**Rangos Chile**:
| Indicador | Malo | Normal | Excelente |
|-----------|------|--------|-----------|
| Terneros destetados/vaca/año | <0.55 | 0.65–0.75 | >0.80 |
| Intervalo entre partos (días) | >420 | 380–420 | <380 |
| Días abiertos | >150 | 100–130 | <90 |

**Nota**: El IEP >400 días significa que el rebaño no logra un ternero por vaca por año, reduciendo la productividad global del sistema.

**Frecuencia de medición**: Anual. Se calcula comparando los registros de partos de dos temporadas consecutivas.

**Relación SmartCow**:
- Tabla `partos`: con `animal_id` (madre) permite calcular IEP entre partos sucesivos
- Tabla `inseminaciones` + `ecografias`: permite calcular días abiertos (fecha parto → fecha diagnóstico preñez positivo)

---

## KPIs Adicionales Relevantes para SmartCow

### Condición Corporal (CC / Body Condition Score, BCS)
**Escala**: 1 (flaca extrema) a 5 (obesa) — escala utilizada en Chile/LatAm para vacas de carne
**Rango óptimo vaca servicio**: CC 2.75–3.5
**Impacto**: CC <2.5 al servicio reduce drásticamente la tasa de preñez (factor OR=3.52 según estudio UChile)
**Cuándo medir**: Al parto, al servicio, al destete

### Relación Vaca:Toro (Cow-to-Bull Ratio)
**Monta natural controlada**: 1 toro por 25–30 vacas (campo) o 1:15–20 (feedlot/corral)
**Fertilidad del toro**: debe evaluarse con examen andrológico anual

### Carga Animal (Stocking Rate)
**Definición**: Unidades animales por hectárea (UA/ha)
**1 UA** = vaca de 400 kg
**Referencia Chile sur**: 0.6–1.5 UA/ha según tipo de pradera y manejo
**Overgrazing**: >2 UA/ha en pradera natural = degradación

---

## Fórmulas de Referencia Rápida

```
GDP          = (Peso_final - Peso_inicial) / Días
ICE          = kg_MS_consumidos / kg_PV_ganados
Tasa preñez  = (Preñadas / Expuestas) × 100
Tasa destete = (Destetados / Vacas_servidas) × 100
Mortalidad   = (Muertes / Inventario_inicio) × 100
Rdto vara    = (kg_canal / kg_vivo) × 100
IEP          = Fecha_parto_N+1 - Fecha_parto_N   [en días]
Días abiertos= Fecha_concepción - Fecha_parto_anterior
```
