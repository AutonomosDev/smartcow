# Auditoría de Calidad de Datos — DB Local SmartCow

**Fecha:** 2026-04-27  
**Ticket:** AUT-315  
**Base de datos:** `smartcow_local` (127.0.0.1:5440)  
**Auditor:** Claude Code / AG  

---

## Resumen Ejecutivo

| Tabla | Filas | CRITICAL | HIGH | MEDIUM | LOW | Estado |
|-------|------:|:--------:|:----:|:------:|:---:|--------|
| `pesajes` | 79,848 | 1 | 1 | 1 | 1 | 🔴 Crítico |
| `inseminaciones` | 4,822 | 1 | 1 | — | — | 🔴 Crítico |
| `ecografias` | 2,732 | — | — | — | — | 🟢 Limpio |
| `areteos` | 1,384 | — | — | 1 | — | 🟡 Revisar |
| `lotes` | 0 | — | — | — | 1 | ⚪ Vacía |
| `potreros` | 0 | — | — | — | 1 | ⚪ Vacía |
| `movimientos_potrero` | 0 | — | — | — | 1 | ⚪ Vacía |

**Total hallazgos: 2 CRITICAL · 2 HIGH · 2 MEDIUM · 3 LOW**

---

## Hallazgos CRITICAL y HIGH

### CRITICAL-1 — `inseminaciones`: 100% resultado = 'pendiente'

**Tabla:** `inseminaciones`  
**Evidencia:**
```sql
SELECT resultado::text, COUNT(*), ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),1) AS pct
FROM inseminaciones GROUP BY resultado;
-- resultado | count | pct
-- pendiente | 4,822 | 100.0%
```

**Impacto:** La columna `resultado` (tipo enum: `preñada`, `vacia`, `pendiente`) no contiene ningún resultado real. El campo está en el schema como NOT NULL pero el ETL de AgroApp importó todas las inseminaciones con estado `pendiente`. Esto significa que el campo es inutilizable para análisis reproductivos: tasa de preñez, efectividad de semen, evaluación de inseminadores. **Toda query que filtre por resultado != 'pendiente' retornará cero filas.**

**Causa probable:** La API de AgroApp no expone el resultado de inseminación, o el ETL no mapeó el campo. Confirmar con AgroApp si el dato existe.

---

### CRITICAL-2 — `inseminaciones`: 100% semen_id = NULL

**Tabla:** `inseminaciones`  
**Evidencia:**
```sql
SELECT COUNT(*) FILTER (WHERE semen_id IS NULL) AS null_semen_id FROM inseminaciones;
-- null_semen_id: 4,822 (100%)
```

**Impacto:** La FK a `semen` está vacía para la totalidad de los registros. No es posible determinar qué semen/toro se usó en ninguna inseminación. Análisis de paternidad, índices reproductivos por toro y trazabilidad genética están completamente bloqueados. Combinado con CRITICAL-1, los registros de `inseminaciones` son poco más que timestamps de cuándo se inseminó un animal.

---

### HIGH-1 — `pesajes`: datos duplicados org1/org99 (39,924 filas espejo)

**Tabla:** `pesajes`  
**Evidencia:**
```sql
SELECT pr.org_id, COUNT(p.id) AS total_pesajes
FROM pesajes p JOIN predios pr ON pr.id = p.predio_id
GROUP BY pr.org_id;
-- org_id 1  → 39,924 pesajes
-- org_id 99 → 39,924 pesajes (IDs 39925–79848)
```

**Detalle:** La tabla contiene 79,848 filas, exactamente el doble de los pesajes reales. Los primeros 39,924 (IDs 1–39924) pertenecen a predios org1 (producción). Los siguientes 39,924 (IDs 39925–79848) son una copia espejo en predios demo org99, con los mismos pesos, fechas y estadísticas pero animales distintos (con prefijo DIIO `DEMO-`).

**Distribución por predio:** Los predios org1 y sus equivalentes org99 tienen stats idénticas:
```
feedlot (org1, predio 4)    ↔ Predio Demo 4 (org99, predio 17): 17,954 pesajes c/u
Mollendo (org1, predio 6)   ↔ Predio Demo 6 (org99, predio 19):  6,919 pesajes c/u
San Pedro (org1, predio 9)  ↔ Predio Demo 9 (org99, predio 22):  6,188 pesajes c/u
Medieria FT (org1, predio 5)↔ Predio Demo 5 (org99, predio 18):  5,557 pesajes c/u
```

**Impacto:** Cualquier query sin filtro de org_id contará el doble de pesajes. Métricas de ganancia de peso promedio del sistema estarían correctas (org99 tiene DIIOs distintos, no son filas iguales), pero el volumen total de la tabla es engañoso. Se espera este comportamiento si la org99 es el entorno demo/trial, pero debe estar documentado.

**Nota:** Los registros org99 NO son duplicados exactos (animal_ids distintos, DIIOs distintos). Son datos de demostración deliberadamente generados con el mismo patrón estadístico. Sin embargo: **el ETL de inseminaciones solo importó org1** (4,822 registros, todos en predios org1: predio 9, 3, 2). Esto crea asimetría: org99 tiene pesajes pero no inseminaciones ni ecografías.

---

### HIGH-2 — `inseminaciones`: 8 registros con fechas futuras (2030–2053)

**Tabla:** `inseminaciones`  
**Evidencia:**
```sql
SELECT id, animal_id, predio_id, fecha FROM inseminaciones WHERE fecha > CURRENT_DATE ORDER BY fecha;
-- id 542  | animal 5018  | predio 3 | 2030-06-10
-- id 475  | animal 4829  | predio 9 | 2031-04-17
-- id 332  | animal 5145  | predio 9 | 2031-05-11
-- id 382  | animal 4990  | predio 9 | 2031-05-11
-- id 457  | animal 4341  | predio 9 | 2031-05-11
-- id 273  | animal  181  | predio 3 | 2031-06-10
-- id 217  | animal 3603  | predio 3 | 2031-06-10
-- id  57  | animal   24  | predio 3 | 2053-04-17
```

**Impacto:** 8 registros (0.17%) con fechas en 2030–2053. El caso `id=57` con fecha 2053-04-17 es claramente un error de tipeo (probablemente 2023-04-17). Los otros 7 pueden ser años mal ingresados (2031 → 2021, 2030 → 2020). Afectan queries que filtran por rango de fechas y corrompen cálculos de "última inseminación" del animal.

---

## Hallazgos por Tabla (Detalle Completo)

---

### `pesajes` (79,848 filas)

**Distribución por predio:**
```
predio 4/17 (feedlot/Demo4):   17,954 pesajes c/u | rango 2019-07-19 → 2026-04-14
predio 6/19 (Mollendo/Demo6):   6,919 pesajes c/u | rango 2024-07-10 → 2026-04-07
predio 9/22 (San Pedro/Demo9):  6,188 pesajes c/u | rango 2018-06-12 → 2026-04-13
predio 5/18 (Medieria FT/D5):   5,557 pesajes c/u | rango 2025-03-19 → 2026-04-08
predio 10/23 (Medieria Fri):    1,468 pesajes c/u | rango 2024-08-26 → 2024-11-26
predio 8/21 (Recría FT):          711 pesajes c/u | rango 2025-11-20 → 2026-03-19
predio 7/20 (Recría Feedlot):     512 pesajes c/u | rango 2025-04-22 → 2025-09-17
```

**Nulls en columnas críticas:**
```
peso_kg:    0 nulls (OK)
fecha:      0 nulls (OK)
animal_id:  0 nulls (OK)
predio_id:  0 nulls (OK)
edad_meses: 79,848 nulls (100%) — nunca poblado por ETL
usuario_id: 79,848 nulls (100%) — nunca poblado por ETL
```

**[MEDIUM] edad_meses y usuario_id al 100% NULL:** Dos columnas que existen en el schema no fueron pobladas en el ETL. `edad_meses` podría calcularse desde `animales.fecha_nacimiento`, pero no está calculada. `usuario_id` es expected para datos importados de AgroApp (no hay usuario Web asociado).

**[LOW] es_peso_llegada = false en el 100% de los registros:** El campo booleano que indica si el pesaje es el peso de llegada al predio nunca fue `true`. En un feedlot con entradas de lotes, se esperaría al menos algunos. Puede ser correcto si AgroApp no maneja este concepto, pero merece verificación.

**Outliers de peso:**
```
peso <= 0:   0 registros (OK)
peso > 1500: 0 registros (OK)
peso < 10:   2 registros — animal 4295 (DIIO: 18085919) y 42837 (DEMO-004295): 0.30 kg, 2020-07-01
```

**[MEDIUM] 2 pesajes con peso 0.30 kg:** Un animal hembra con edad_aprox=0 años pesando 0.30 kg es físicamente imposible (ni siquiera un ternero recién nacido pesa menos de 20 kg). Probable error de entrada de datos en AgroApp (0.30 en lugar de 300 o 30). El registro DEMO-004295 es la copia org99 del mismo error.

**Fechas:** sin registros futuros ni anteriores a 2000. Rango válido: 2018-06-12 → 2026-04-14.

**FKs:** 0 referencias rotas a `animales`. 

**Duplicados (mismo animal + fecha):** ninguno.

**Consistencia predio animal:** 0 mismatches entre `pesajes.predio_id` y `animales.predio_id`.

---

### `inseminaciones` (4,822 filas)

**Distribución por predio:**
```
San Pedro (predio 9, org1):           4,213 registros | rango 2017-10-10 → 2031-05-11
Arriendo Santa Isabel (predio 3, org1):  599 registros | rango 2018-10-02 → 2053-04-17
Arriendo las quebradas (predio 2, org1):  10 registros | rango 2021-11-12 → 2021-11-12
```

**Nota:** Solo org1. Org99 (demo) no tiene inseminaciones.

**Nulls:**
```
animal_id:       0 nulls (OK)
fecha:           0 nulls (OK)
resultado:       0 nulls (pero 100% = 'pendiente') — ver CRITICAL-1
semen_id:        4,822 nulls (100%) — ver CRITICAL-2
inseminador_id:  4,822 nulls (100%)
```

**[CRITICAL] resultado = 'pendiente' en 100%:** Ver sección de hallazgos CRITICAL.

**[CRITICAL] semen_id = NULL en 100%:** Ver sección de hallazgos CRITICAL.

**[MEDIUM/nota] inseminador_id = NULL en 100%:** Sin referencia al inseminador en ningún registro. No bloquea funcionalidad básica pero impide análisis de performance por inseminador.

**[HIGH] 8 fechas futuras:** Ver sección HIGH-2.

**FKs:** 0 referencias rotas a `animales`.

**Duplicados:** ninguno (mismo animal + fecha).

**Sexo:** 0 inseminaciones en animales machos.

---

### `ecografias` (2,732 filas)

**Distribución por predio:**
```
San Pedro (predio 9, org1):            2,427 registros
Arriendo Santa Isabel (predio 3, org1):  129 registros
Recría Feedlot (predio 7, org1):         107 registros
feedlot (predio 4, org1):                 42 registros
Mollendo (predio 6, org1):                27 registros
```

**Nota:** Solo org1. Org99 no tiene ecografías.

**Distribución de `resultado`:**
```
vacia:   1,462 (53.5%)
preñada: 1,269 (46.4%)
dudosa:      1  (0.0%)
```

Distribución biológicamente plausible para un hato en manejo reproductivo.

**Nulls:** 0 en todas las columnas críticas (animal_id, fecha, resultado, dias_gestacion).

**Outliers dias_gestacion:** min=0, max=275, avg=64. Rango válido para bovinos (gestación ~283 días). El valor 0 días puede representar diagnóstico temprano, no necesariamente un error.

**Fechas:** sin registros futuros ni anteriores a 2000.

**FKs:** 0 referencias rotas.

**Duplicados:** ninguno.

**Sexo:** 0 ecografías en animales machos.

**Resultado: tabla limpia. Sin hallazgos.**

---

### `areteos` (1,384 filas)

**Distribución:**
```
San Pedro (predio 9): 1,384 registros (100%)
Rango: 2018-07-12 → 2026-03-13
```

**[MEDIUM] Tipo único = 'alta':** El enum `tipo_areteo` tiene tres valores: `alta`, `aparicion`, `cambio_diio`. El 100% de los registros son `alta`. No hay ningún `cambio_diio` ni `aparicion`. Puede ser correcto si AgroApp no registró cambios de DIIO, pero impide rastrear historia de identificación del animal.

**Nulls:** 0 en todas las columnas críticas.

**Fechas:** sin registros futuros ni anteriores a 2000.

**FKs:** 0 referencias rotas a `animales`.

**Duplicados:** ninguno.

**Consistencia DIIO:** `areteos.diio_nuevo` coincide con `animales.diio` en el 100% de los casos (0 mismatches). Señal de integridad referencial correcta.

---

### `lotes` (0 filas)

**[LOW] Tabla vacía.** El módulo feedlot requiere lotes para agrupar animales. La ausencia puede ser intencional si el cliente no usa lotes en AgroApp, o puede indicar que el ETL de lotes no existe todavía. Verificar con el ticket de feedlot si esto es esperado.

---

### `potreros` (0 filas)

**[LOW] Tabla vacía.** Sin potreros definidos, los movimientos de animales entre potreros no pueden registrarse. Puede ser módulo pendiente de implementación.

---

### `movimientos_potrero` (0 filas)

**[LOW] Tabla vacía.** Dependiente de `potreros`. Esperado si `potreros` está vacía.

---

## Índice de Hallazgos

| ID | Severidad | Tabla | Descripción |
|----|-----------|-------|-------------|
| F-01 | CRITICAL | `inseminaciones` | 100% de resultados = 'pendiente'. Campo inutilizable para análisis reproductivo. |
| F-02 | CRITICAL | `inseminaciones` | 100% semen_id = NULL. Trazabilidad genética imposible. |
| F-03 | HIGH | `pesajes` | Volumen doble: 39,924 pesajes org99 espejo de org1. Queries sin filtro de org retornan el doble. |
| F-04 | HIGH | `inseminaciones` | 8 registros con fechas futuras (2030–2053). Incluye un caso en 2053 (error tipeo). |
| F-05 | MEDIUM | `pesajes` | edad_meses y usuario_id al 100% NULL (79,848 filas). Campos nunca poblados por ETL. |
| F-06 | MEDIUM | `pesajes` | 2 pesajes con peso 0.30 kg (imposible biológicamente). IDs 9091 y 72754. |
| F-07 | MEDIUM | `areteos` | tipo = 'alta' en 100% de registros. tipos 'cambio_diio' y 'aparicion' nunca importados. |
| F-08 | LOW | `pesajes` | es_peso_llegada = false en 100% de los 79,848 registros. Nunca marcado como peso de llegada. |
| F-09 | LOW | `lotes` | Tabla vacía. Módulo feedlot por lotes sin datos. |
| F-10 | LOW | `potreros` | Tabla vacía. Gestión de potreros sin datos. |
| F-11 | LOW | `movimientos_potrero` | Tabla vacía (dependiente de potreros). |

---

## Datos en buen estado (sin hallazgos)

- **FKs rotas:** 0 en todas las tablas auditadas. Todas las referencias a `animales.id` son válidas.
- **Duplicados:** 0 registros duplicados (mismo animal + misma fecha) en pesajes, inseminaciones, ecografías y areteos.
- **Fechas inválidas:** Solo en inseminaciones (HIGH-2). Pesajes, ecografías y areteos tienen fechas limpias.
- **Outliers de peso:** Solo 2 registros sub-10kg (0.003% del total). El rango general (29–940 kg) es biológicamente plausible.
- **Consistencia de sexo:** 0 inseminaciones ni ecografías en animales machos.
- **ecografias.dias_gestacion:** Rango válido (0–275 días). Sin outliers imposibles.
- **areteos.diio_nuevo:** 0 mismatches con `animales.diio` (100% consistente).

---

## Notas de contexto

- **Org99 (demo):** La base de datos local contiene un entorno de demostración completo (org99) con ~38,525 animales y 39,924 pesajes. Es una copia intencional con DIIOs distintos (prefijo `DEMO-`) para la org trial. Esto explica la duplicación de volumen. **No es un bug de ETL.** Sin embargo, la asimetría (org99 tiene pesajes pero no inseminaciones/ecografías/areteos) debe documentarse como estado esperado o corregirse.
- **AgroApp como fuente:** Los problemas F-01 y F-02 en `inseminaciones` apuntan a limitaciones del API de AgroApp, no a errores del ETL de SmartCow. Confirmar si AgroApp expone `resultado` y `semen_id` antes de planificar corrección.
- **Scope de esta auditoría:** No se auditaron `partos`, `tratamientos`, `bajas`, `animales` (campos individuales), `ventas`, `traslados` ni tablas de sistema.
