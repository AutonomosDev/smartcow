# Análisis root cause — linkeo cria_id en partos

Generado: 2026-04-27 | AUT-312  
DB: `smartcow_local` (pg16 puerto 5440)

---

## Resumen ejecutivo

**El 80% target de AUT-313 es inalcanzable con la data actual.**

El tope real es **12.4%** (2,335 / 18,814 partos vivos). No es un bug del script — es un límite impuesto por lo que AgroApp exporta en el Excel de Partos.

---

## Root cause confirmado

### Hipótesis descartada

El plan original planteaba: "partos.diio_cria existe pero no matchea por formato".

**FALSO** — la columna `partos.diio_cria` NO EXISTE en el schema:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'partos';
-- id, predio_id, madre_id, fecha, resultado, cria_id,
-- tipo_ganado_cria_id, tipo_parto_id, subtipo_parto_id,
-- semen_id, inseminador_id, numero_partos, observaciones,
-- usuario_id, creado_en
-- → no diio_cria
```

### Root cause real: AgroApp no exporta el DIIO de la cría

El Excel `Partos_Historial` de AgroApp incluye: DIIO de la madre, fecha, tipo parto, sexo de la cría. **No incluye el DIIO del ternero nacido.**

El ETL (`src/etl/import-agroapp-excel.ts:563-574`) usa un post-proceso que busca la cría por:

```sql
UPDATE partos p
SET cria_id = a.id
FROM animales a
WHERE a.predio_id = p.predio_id
  AND a.fecha_nacimiento = p.fecha        -- ternero nacido en fecha del parto
  AND a.diio_madre = (SELECT diio FROM animales WHERE id = p.madre_id)
  AND p.cria_id IS NULL AND p.resultado = 'vivo'
```

Esta estrategia tiene dos puntos de falla:

---

## Fallo 1 — diio_madre no matchea (47.47%)

De los 18,814 partos vivos sin cria_id, la mayoría tienen `madre_id` cuyo animal tiene `diio_madre = NULL` o un valor que no existe en `animales.diio` del mismo predio:

```
animales WHERE diio_madre IS NOT NULL → 2,888
sin match en mismo predio → 1,371 (47.47%)
```

Sin match en `diio_madre`, el UPDATE nunca encuentra la cría.

---

## Fallo 2 — Ambigüedad por fecha (99.3%)

```
partos sin cria_id:             16,480
misma fecha + mismo predio:     16,357  (99.3%)
```

Cuando múltiples partos ocurren el mismo día en el mismo predio, el update podría asignar el ternero al parto incorrecto. Por eso AUT-309 usó la condición estricta de diio_madre.

---

## Intentos de match extendido

| Estrategia | Candidatos | No-ambiguos |
|-----------|-----------|------------|
| Exact: `fecha_nacimiento = partos.fecha` + `diio_madre` match | 0 | 0 (ya aplicados en AUT-309) |
| ±3 días: `fecha_nacimiento BETWEEN fecha-3 AND fecha+3` + `diio_madre` | 10 | **1** |
| Solo por fecha + predio (sin diio_madre) | — | demasiado ambiguo |

---

## Por qué staging tenía 2,334 vs prod's 996

Staging recibió múltiples imports de partos en diferentes runs del ETL. Cada run importaba un subset del Excel, y si en ese subset aparecía tanto el parto como el registro del ternero (como animal en la tabla animales), el post-proceso los vinculaba inmediatamente. Esto permitió 2,334 links. Los 16,480 restantes son casos donde el ternero nunca fue importado como animal individual, o donde el `diio_madre` no matchea.

---

## SQL de backfill propuesto (1 candidato no-ambiguo)

```sql
-- Aplicar el único candidato unambiguo ±3 días
WITH candidates AS (
  SELECT p.id as parto_id, a.id as cria_id
  FROM partos p
  JOIN animales a ON a.predio_id = p.predio_id
    AND a.fecha_nacimiento BETWEEN p.fecha - 3 AND p.fecha + 3
    AND a.diio_madre = (SELECT diio FROM animales WHERE id = p.madre_id)
  WHERE p.cria_id IS NULL AND p.resultado = 'vivo'
),
unambiguous AS (
  SELECT parto_id, cria_id
  FROM candidates
  WHERE (SELECT COUNT(*) FROM candidates c2 WHERE c2.cria_id = candidates.cria_id) = 1
    AND (SELECT COUNT(*) FROM candidates c3 WHERE c3.parto_id = candidates.parto_id) = 1
)
UPDATE partos SET cria_id = u.cria_id
FROM unambiguous u
WHERE partos.id = u.parto_id;
-- Expected: 1 row updated
```

---

## Estimación de recuperación

| Estrategia | Rows recuperables | % linkeo resultante |
|-----------|------------------|---------------------|
| ±3 días no-ambiguos | 1 | 12.4% (2,335/18,814) |
| ±7 días no-ambiguos | estimado ~2-3 | ~12.4% |
| Sin DIIO de cría (AgroApp) | 0 adicionales | **12.4% es el tope real** |

**El tope real justificado es 12.4%.** Para superar este tope sería necesario:
- Obtener el DIIO de la cría directamente de AgroApp API (no está en el Excel)
- O enriquecer el Excel con datos del módulo "Terneros" de AgroApp si existe

---

## Conclusión para AUT-313

El target del 80% no es alcanzable. El script de backfill aplicará el 1 candidato no-ambiguo y documentará el tope real de datos. No hay más matches válidos sin inventar datos.
