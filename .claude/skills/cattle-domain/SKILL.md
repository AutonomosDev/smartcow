---
name: cattle-domain
description: >
  Activar para CUALQUIER pregunta o tarea que involucre ganadería bovina en SmartCow:
  KPIs (GDP, preñez, destete, mortalidad), ciclo de vida del animal, terminología
  ganadera, interpretación de datos de pesajes/partos/inseminaciones/ecografías,
  análisis de lotes feedlot, precios ODEPA, regulación SAG, o cuando se necesita
  entender QUÉ significa un dato antes de calcularlo. También activar cuando el
  chat ganadero deba responder sobre indicadores productivos o reproductivos.
  SIEMPRE cargar este skill antes de escribir queries o respuestas sobre ganado.
---

# SmartCow — Dominio Ganadero Bovino

Fuente de investigación: `references/` (1,771 líneas, 88 KB, fuentes primarias Chile/LatAm)

---

## Ciclo de vida — mapa rápido

```
PARTO
 │
 ▼ [1] CRÍA AL PIE  0–8 meses │ 30–45 kg → 150–200 kg al destete
 │
 ▼ DESTETE (separación física madre/ternero — evento registrado en SmartCow)
 │
 ▼ [2] RECRÍA  8–18 meses │ 150–200 kg → 300–380 kg (pasturas, sin feedlot)
 │
 ▼ [3] ENGORDA/FEEDLOT  60–120 días intensivo │ 320–420 kg entrada → 480–550 kg salida
 │
 ▼ [4] FAENA  480–550 kg vivo → ~250–295 kg canal (rendimiento 52–55%)
 │
 ▼ CARNE EN VARA
```

→ Detalle completo (18 eventos, frecuencias, tabla SmartCow): `references/lifecycle.md`

---

## Tabla KPIs — valores rápidos Chile

| KPI | Fórmula | Malo | Normal | Bueno |
|-----|---------|------|--------|-------|
| **GDP** | (P_final − P_ini) / días | <0.9 | 1.2–1.5 kg/d | >1.6 kg/d |
| **Tasa preñez** | (preñadas / expuestas) × 100 | <50% | 60–75% | >80% |
| **Tasa destete** | (destetados / vacas expuestas) × 100 | <55% | 65–75% | >80% |
| **Mortalidad** | (muertes / cabezas inicio) × 100 | >3% | <2% | <1% |
| **Conversión alim.** | kg MS / kg PV ganado | >8.0 | 6.0–8.0 | <6.0 |
| **Rendimiento vara** | (kg canal / kg vivo) × 100 | <50% | 52–55% | >56% |
| **Días feedlot** | fecha_egreso − fecha_ingreso | >150d | 60–120d | 60–90d |

→ Fórmulas SQL, fuentes, benchmarks internacionales: `references/kpis.md`

---

## Mapeo tabla SmartCow → concepto ganadero

| Tabla | Qué representa | Trampas conocidas |
|-------|---------------|-------------------|
| `animales` | Cualquier bovino en el sistema. `estado='baja'` = muerto o vendido | `estado='baja'` ≠ `bajas` (tabla de eventos) |
| `pesajes` | Registros de peso individual. Base para calcular GDP | Sin pesajes no hay GDP. Gap > 60d = dato sospechoso |
| `partos` | Evento de nacimiento: madre + fecha. `cria_id` = link al animal ternero | **cria_id solo 12.4% linkeado** — limitación AgroApp, no bug |
| `inseminaciones` | IA registradas por animal | **resultado = siempre 'pendiente'** — AgroApp no exporta resultado. **semen_id = siempre NULL**. NO usar para calcular preñez |
| `ecografias` | Diagnóstico real de preñez | **ESTA es la fuente correcta para tasa de preñez**, no inseminaciones |
| `bajas` | Eventos de muerte/salida (quién, cuándo, causa) | `animales.estado='baja'` debe coincidir. Si no coincide = dato sucio |
| `tratamientos` | Medicamentos SAG aplicados. Con trazabilidad post-AUT-298 | 100% tienen data SAG post-merge local |
| `lotes` | Grupos de animales en feedlot (batch). Entrada/salida/peso | Lote ≠ potrero. Lote es grouping temporal de engorda |
| `movimientos_potrero` | Trazabilidad espacial: qué animal en qué potrero y cuándo | Para mapas y uso de pasturas |
| `potreros` | Espacios físicos del predio | Potrero (campo) ≠ Corral (feedlot) ≠ Lote (batch) |

---

## Reglas de negocio críticas (nunca inventar)

**Identificación:**
- **DIIO** = identificador visual del arete (código ISO 11784: 152 + establecimiento + nº)
- **EID** = chip RFID electrónico leído con bastón XRS2i
- DIIO ≠ animal_id. Son sistemas paralelos. Nunca intercambiarlos.
- Un animal puede tener DIIO sin EID y viceversa

**Preñez:**
- Fuente correcta: `ecografias` — diagnóstico por ultrasonido
- `inseminaciones.resultado` = siempre 'pendiente' — IGNORAR para calcular preñez
- Una inseminación confirmada = ecografía positiva en los 30–60 días siguientes
- Tasa IATF (inseminación a tiempo fijo) promedio Chile: ~54% (UChile Melipilla)

**Pesajes y GDP:**
- Sin peso de entrada Y peso de salida no hay GDP calculable
- Intervalo normal de pesaje en feedlot: 28 días
- GDP negativo = error de datos o enfermedad seria → flag, no calcular

**Bajas:**
- `animales.estado = 'baja'` debe tener evento correspondiente en tabla `bajas`
- Si estado='baja' sin evento en `bajas` = zombie (bug, reportar)
- Causas válidas: muerte natural, faena, venta, robo, pérdida

**Lotes feedlot:**
- Un animal puede pertenecer a UN lote activo a la vez
- Lote cerrado = todos los animales salieron (faena o venta)
- GDP del lote = promedio GDP individual de todos los animales del lote

**Categorías de animales (NCh 1423 + NCh 1306):**
- Ternero/a: < 1 año, sin dientes permanentes
- Novillo: macho castrado 1–3 años
- Torito: macho entero < 2 años
- Toro: macho entero > 2 años
- Vaquilla: hembra 1–3 años, sin parto
- Vaca: hembra adulta con al menos un parto

---

## Términos que SE CONFUNDEN — distinguir siempre

| Se dice | Significa | Diferencia clave |
|---------|-----------|-----------------|
| Potrero | Campo / paddock | Espacio físico de pastoreo, no feedlot |
| Lote | Batch de feedlot | Grupo de animales en engorda, no espacio |
| Corral | Encierro en feedlot | Espacio físico dentro del feedlot |
| DIIO | Nº visual del arete | Solo visual — leerlo con el ojo |
| EID | Chip RFID | Solo electrónico — leerlo con el bastón |
| Fundo | Estancia / rancho | Unidad de producción (= `predios` en DB) |
| Predio | Propiedad catastral | Puede tener múltiples potreros y fundos |
| Faena | Matanza en frigorífico | No es baja por muerte — es baja por producción |
| Preñez | Gestación confirmada | Se confirma con ecografía, no con inseminación |
| Destete | Separación madre/cría | Evento físico, no edad fija |

---

## SQL rápido — consultas frecuentes

**GDP de un lote:**
```sql
SELECT
  a.id, a.nombre, a.diio,
  (p2.peso_kg - p1.peso_kg)::float / (p2.fecha - p1.fecha) AS gdp_kg_dia
FROM animales a
JOIN pesajes p1 ON p1.animal_id = a.id
JOIN pesajes p2 ON p2.animal_id = a.id AND p2.fecha > p1.fecha
WHERE a.lote_id = :lote_id
  AND p1.fecha = (SELECT MIN(fecha) FROM pesajes WHERE animal_id = a.id)
  AND p2.fecha = (SELECT MAX(fecha) FROM pesajes WHERE animal_id = a.id)
```

**Tasa de preñez (fuente correcta):**
```sql
-- CORRECTO: usar ecografias
SELECT
  COUNT(CASE WHEN e.resultado = 'prenada' THEN 1 END)::float / COUNT(*) * 100 AS tasa_prenez
FROM animales a
LEFT JOIN ecografias e ON e.animal_id = a.id
WHERE a.predio_id = :predio_id
  AND a.estado = 'activo'
  AND a.sexo = 'hembra'

-- INCORRECTO: NO usar inseminaciones.resultado (siempre 'pendiente')
```

**Animales sin pesaje reciente (>60 días):**
```sql
SELECT a.id, a.diio, MAX(p.fecha) as ultimo_pesaje
FROM animales a
LEFT JOIN pesajes p ON p.animal_id = a.id
WHERE a.estado = 'activo'
GROUP BY a.id, a.diio
HAVING MAX(p.fecha) < NOW() - INTERVAL '60 days' OR MAX(p.fecha) IS NULL
```

---

## Contexto regulatorio Chile (resumen)

- **SAG**: Sistema de Trazabilidad Animal (SIPEC). Obligatorio registrar nacimientos, movimientos, muertes con DIIO. Resolución 3.022/2001.
- **ODEPA**: Publica precios de ganado semanalmente. Categorías: novillo, vaquilla, vaca, toro (CLP/kg vivo).
- **Guía de movimiento**: Documento obligatorio SAG para traslado entre predios.
- **FMA** (Formulario de Movimiento Animal): registro digital en SIPEC.

→ Obligaciones legales completas, sanciones, precios feb. 2026: `references/regulatory-context.md`

---

## Cuándo cargar cada referencia

| Referencia | Cargar cuando |
|-----------|--------------|
| `references/lifecycle.md` | Preguntas sobre etapas del animal, eventos de registro, mapeo tabla→etapa |
| `references/kpis.md` | Necesitas fórmula exacta, rangos precisos, SQL de KPI, fuentes citables |
| `references/glossary.md` | Término desconocido, duda bilingüe, definición SAG de categoría animal |
| `references/regulatory-context.md` | Normativa SAG, precios ODEPA, obligaciones legales, benchmarks |
