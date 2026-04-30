# SmartCow — Data Quality Report

Generated: 2026-04-27 (post-consolidación AUT-310)  
DB: `smartcow_local` (pg16 local 5440) — base prod + staging partos merge  
Prod audit original: 2026-04-27 via SSH tunnel 5435  
Scope: tablas dominio ganadero (animales, pesajes, partos, bajas, tratamientos, ventas, inseminaciones, ecografías, areteos)

---

## Resumen ejecutivo (post-consolidación)

| Dimensión | Score | Severidad mayor |
|-----------|-------|-----------------|
| Integridad referencial | ⚠️ 73% | HIGH — diio_madre sin match |
| Consistencia de negocio | ✅ RESUELTO | CRITICAL-1 ✅ · CRITICAL-2 parcial (12.4% linked) |
| Completitud | ⚠️ 85% | MEDIUM — activos sin pesaje |
| Integridad de fechas | ✅ 100% | OK |
| Duplicados | ✅ 100% | OK |
| Rangos / Outliers | ✅ 100% | OK |

---

## Row counts (snapshot 2026-04-27)

| Tabla | Filas |
|-------|-------|
| pesajes | 79,848 |
| animales | 77,050 |
| tratamientos | 65,454 |
| ventas | 31,204 |
| precios_feria | 14,196 |
| partos | 11,044 |
| inseminaciones | 4,822 |
| ecografias | 2,732 |
| areteos | 1,384 |
| **bajas** | **0** |
| lotes | 0 |
| lote_animales | 0 |
| potreros | 0 |
| movimientos_potrero | 0 |

`animales` por estado: 65,264 `baja` · 11,786 `activo`

---

## Hallazgos

---

### ✅ CRITICAL-1 — RESUELTO — Tabla `bajas` poblada (AUT-309)

**Dimensión**: Consistencia de negocio  
**Severidad**: ~~CRITICAL~~ → ✅ RESUELTO (AUT-309)

**Estado post-fix**:
```
bajas.count = 65,264
animales WHERE estado = 'baja' → 65,264 filas
animales WITH estado='baja' AND NOT EXISTS(bajas) → 0  ✅
```

**Fix aplicado** (AUT-309, 2026-04-27):
1. ETL retroactivo via `importBajas` v2: inserción de 65,264 registros en `bajas` a partir de `animales.estado='baja'`
2. `import-agroapp-excel.ts` actualizado con `ensureBajaEvento()` idempotente — los imports futuros crean el registro de baja automáticamente cuando crean un animal stub con `estado='baja'`.

---

### ⚠️ CRITICAL-2 — PARCIALMENTE RESUELTO — partos `resultado='vivo'` sin `cria_id`

**Dimensión**: Consistencia de negocio  
**Severidad**: ~~CRITICAL~~ → ⚠️ PARCIAL (AUT-309 + AUT-310)

**Estado post-fix** (smartcow_local):
```
partos total              → 19,116 (11,044 prod + 8,072 staging)
partos cria_id NOT NULL   → 2,334 (12.4% de 18,814 vivos)
partos cria_id IS NULL    → 16,480 — unresolvable sin más datos genealógicos
```

**Fix aplicado** (AUT-309, 2026-04-27):
- Backfill SQL cruzando `partos.fecha = animales.fecha_nacimiento + animales.diio_madre` → 996 cria_id linked en prod
- Merge de staging partos (8,072 records con 1,338 cria_id adicionales) en `smartcow_local` (AUT-310)

**Residual documentado en AUT-305**: 10,048 partos en prod sin cria_id posible — la alternativa vía `animales.diio_madre` tiene 47.47% sin match en el mismo predio. No resolvable sin más genealogía externa.

---

### 🟠 HIGH-1 — 47.47% de `diio_madre` sin match en predio (1,371 de 2,888)

**Dimensión**: Integridad referencial implícita  
**Severidad**: HIGH

**Evidencia**:
```
animales WHERE diio_madre IS NOT NULL → 2,888
sin match en animales.diio (mismo predio) → 1,371 (47.47%)
```

**Causa**: La genealogía se almacena como texto libre en `animales.diio_madre`. Las madres referenciadas pueden:
1. Estar dadas de baja (estado='baja') antes de la ventana de importación
2. Pertenecer a otro predio
3. Ser datos incompletos de AgroApp

**Impacto**: La alternativa de genealogía vía `diio_madre` (join-paths.md — "Genealogy Join using implicit diio_madre") tiene tasa de éxito del 52.53%.

**Fix sugerido**: Documentar como expected behavior de datos AgroApp. El join-path vía `partos` (FK-backed) es más confiable cuando esté disponible.

---

### 🟡 MEDIUM-1 — 2,922 animales `activo` sin ningún pesaje

**Dimensión**: Completitud  
**Severidad**: MEDIUM

**Evidencia**:
```
animales WHERE estado='activo' AND no pesajes → 2,922
Desglose por tipo_ganado:
  Ternero   1,160
  Ternera     996
  Vaca        354
  Novillo     328
  Vaquilla     82
  Toro          2
```

**Causa probable**: Animales importados recientemente o terneros nacidos que aún no han pasado por báscula. Los terneros/terneras (2,156 de 2,922) son los más frecuentes — es normal que recién nacidos no tengan pesaje inicial.

**Impacto**: GDP no calculable para estos animales. El chat ganadero responde "sin datos de peso" para estas consultas.

---

### 🟡 MEDIUM-2 — `inseminaciones.resultado` = 100% `'pendiente'` (4,822 registros)

**Dimensión**: Completitud  
**Severidad**: MEDIUM

**Evidencia**:
```
SELECT DISTINCT resultado FROM inseminaciones → {'pendiente'}
Total inseminaciones → 4,822
```

**Causa**: El campo `resultado` nunca fue actualizado después del registro inicial. La confirmación de preñez se hace via `ecografias` (tabla separada, 2,732 registros), pero el campo `inseminaciones.resultado` permanece en su valor default.

**Impacto**: Tasa de concepción directa desde `inseminaciones.resultado` = no calculable. Hay que cruzar con `ecografias` para inferirlo.

---

### 🟡 MEDIUM-3 — Módulos feedlot y crianza sin datos operativos (4 tablas vacías)

**Dimensión**: Completitud  
**Severidad**: MEDIUM (informativo)

**Evidencia**:
```
lotes                = 0 filas
lote_animales        = 0 filas
potreros             = 0 filas
movimientos_potrero  = 0 filas
```

**Causa**: Los módulos feedlot y crianza están en el schema y en el código, pero no han sido habilitados operativamente para ningún predio/org todavía.

**Impacto**: Las queries del chat ganadero sobre lotes, GDP feedlot y ubicación en potreros retornarán vacío.

---

## Checks sin hallazgos (OK ✅)

| Check | Resultado |
|-------|-----------|
| Pesajes huérfanos (sin animal) | 0 |
| Animales `activo` con registro en bajas | 0 |
| Pesajes futuros | 0 |
| Partos futuros | 0 |
| Nacimientos futuros | 0 |
| fecha_nacimiento > primer pesaje | 0 |
| Parto con madre ya dada de baja | 0 |
| DIIOs duplicados en mismo predio | 0 |
| Pesajes duplicados (mismo animal, fecha, peso) | 0 |
| Pesajes mismo animal mismo día distinto peso | 0 |
| Peso fuera de rango (≤0 o >1500 kg) | 0 |
| Partos con numero_partos > 20 | 0 |
| Tratamientos con liberacion_carne > fecha+365d | 0 |
| Tratamientos con medicamentos null/vacío | 0 |
| Animales activos sin fecha_nacimiento | 0 |
| Animales mediería sin mediero_id | 0 |

### Rango de pesos (sanity)

```
min: 0.30 kg  |  max: 940 kg  |  avg: 458.2 kg
p01: 180 kg   |  p99: 634 kg
```

Rango dentro de valores bovinos normales (ternero recién nacido ~30 kg mínimo real, pero 0.30 kg podría ser entrada de arete sin pesaje real — revisar si es dato AgroApp).

---

## Impacto en el chat ganadero (query_db)

| Pregunta | ¿Funciona? | Motivo |
|----------|-----------|--------|
| "¿Cuántos animales activos hay?" | ✅ | |
| "¿Cuál es el GDP de los novillos?" | ✅ parcial | Solo animales con ≥2 pesajes |
| "¿Cuáles fueron las bajas del último año?" | 🔴 NO | bajas table vacía |
| "¿Cuántos partos hubo esta temporada?" | ✅ | partos table OK |
| "¿Qué terneros nacieron de la vaca X?" | ⚠️ solo vía diio_madre | cria_id siempre NULL |
| "¿Qué animales están en resguardo de carne?" | ✅ | tratamientos.liberacion_carne_max OK |
| "Tasa de preñez por IA" | ⚠️ | Requiere cruzar con ecografias |
| "Animales en lote X" | 🔴 NO | lote_animales vacío |

---

## Acciones recomendadas

| Prioridad | Acción | Impacto |
|-----------|--------|---------|
| P0 | ETL retroactivo `bajas`: poblar tabla `bajas` desde `animales.estado='baja'` + datos AgroApp | Desbloquea análisis de mortalidad/ventas |
| P0 | Poblar `partos.cria_id` retroactivamente cruzando por fecha_nacimiento + diio_madre | Desbloquea genealogía y performance de crías |
| P1 | Documentar que `inseminaciones.resultado` requiere update manual post-IA | Evita confusión en consultas reproductivas |
| P2 | Investigar los 2,922 activos sin pesaje — ¿son importaciones recientes? | Completitud para GDP |
| P3 | Mínimo 1 pesaje de referencia para el 0.30 kg outlier | Calidad de dato extremo |
