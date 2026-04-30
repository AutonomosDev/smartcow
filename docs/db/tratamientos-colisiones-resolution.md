# AUT-314 — Resolución de colisiones de tratamientos staging

**Fecha**: 2026-04-27  
**DB de trabajo**: `smartcow_local` (127.0.0.1:5440)  
**Referencia**: AUT-311 (merge-tratamientos-staging)

---

## Contexto

El script AUT-311 (`scripts/merge-tratamientos-staging.ts`) excluyó **1,133 tratamientos** de staging porque su `animal_id` (rango 38543–38905) existía en `smartcow_local` pero apuntaba a animales demo (predios 14–18 "Fundo Demo"). En staging, esos mismos IDs son animales reales de predios JP Ferrada (3, 4, 9).

---

## Análisis

### 1. Distribución de los 1,133 tratamientos excluidos por predio (staging)

| predio_id | nombre                | tratamientos excluidos |
|-----------|----------------------|------------------------|
| 4         | feedlot              | 850                    |
| 9         | San Pedro            | 208                    |
| 3         | Arriendo Santa Isabel| 75                     |
| **Total** |                      | **1,133**              |

### 2. Animales afectados

- **363 animales únicos** en staging (IDs 38543–38905, predios 3/4/9)
- **333 DIIOs únicos** (un animal tiene DIIO `"1"` inválido, excluido de búsqueda)
- Todos creados el **2026-04-23** por la importación AUT-298 (re-import tratamientos con trazabilidad SAG)
- Todos en estado `baja`

### 3. Búsqueda de match DIIO en smartcow_local

**Resultado: 0 matches.**

Los 333 DIIOs del rango excluido (prefijos `1641xxxx`, `1647xxxx`, `1648xxxx`, `1808xxxx`, `2625xxxx`) **no existen en ningún predio de smartcow_local** (ni reales ni demo). Son animales que existían en producción/AgroApp pero nunca habían sido importados a smartcow_local.

Verificación adicional:
- Predios 3/4/9 en smartcow_local llegan hasta ID **38542** (max predio 9)
- Staging tiene sus animales de estos predios desde IDs bajos (~1–38542) + el rango nuevo (38543–38905) generado por AUT-298
- Los IDs del rango nuevo **no tienen duplicados DIIO** con los IDs bajos en el mismo predio

### 4. Por qué colisionaron en AUT-311

El check de AUT-311 verifica si `animal_id` existe en `animales WHERE predio_id <= 13`. Los IDs 38543–38905 en `smartcow_local` pertenecen a predios demo (16/17/18), así que el check retorna que "no pertenecen a predios reales" → excluye los tratamientos.

---

## Decisión

**Todos los 1,133 tratamientos son recuperables** mediante inserción directa, dado que:

1. Los 363 animales staging no existen en local (DIIO sin match)
2. Ningún `id_agroapp` de los 1,133 tratamientos existe ya en local
3. Los datos tienen trazabilidad SAG completa (`id_agroapp` poblado en el 100%)
4. No hay duplicados de DIIO entre el rango excluido y animales ya importados

**Estrategia implementada**: insertar los 363 animales nuevos en local (con IDs asignados por sequence, rango 77068–77430), mapear los 1,133 tratamientos a los nuevos IDs, e insertar atómicamente en una transacción.

**No hay wontfix**: todos los 1,133 tratamientos fueron recuperados.

---

## Implementación

**Script**: `scripts/resolve-tratamientos-colisiones.ts`

```
npx tsx scripts/resolve-tratamientos-colisiones.ts [--dry-run]
```

Ejecutado el **2026-04-27** en `smartcow_local`.

### Resultado

| métrica                         | valor  |
|---------------------------------|--------|
| Animales insertados             | 363    |
| Tratamientos insertados         | 1,133  |
| Tratamientos huérfanos post-op  | 0      |
| id_agroapp duplicados detectados| 0      |
| DIIOs duplicados detectados     | 0      |

### IDs asignados

- Animales nuevos: **77068–77430** (rango asignado por sequence de `smartcow_local`)
- Tratamientos nuevos: max ID post-op **107,436**

### Distribución post-insert (predios 3/4/9)

| predio_id | nombre                | animales nuevos | tratamientos recuperados |
|-----------|----------------------|-----------------|--------------------------|
| 3         | Arriendo Santa Isabel| 15              | 75                       |
| 4         | feedlot              | 304             | 850                      |
| 9         | San Pedro            | 44              | 208                      |

### Verificación de mapeo

Cross-check: animal staging 38580 (diio=`26250919`, predio 9) tenía 29 tratamientos.  
Animal local 77105 (mismo diio, predio 9) tiene 29 tratamientos. ✓

---

## Estado final

- **Recuperados**: 1,133 / 1,133 (100%)
- **Wontfix**: 0
- **typecheck**: verde (`npm run typecheck` pasa sin errores)
