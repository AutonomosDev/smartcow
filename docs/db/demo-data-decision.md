# AUT-316 — Decisión: datos demo en `smartcow_local`

**Fecha**: 2026-04-27  
**Contexto**: `smartcow_local` (127.0.0.1:5440) mezcla datos reales de JP Ferrada (predios 1-13, org 1) con datos demo (predios 14-26, org 99 "Fundo Demo"). Este documento presenta el inventario y opciones para que Cesar decida.

---

## 1. Mapa de predios

| Rango | Org | Nombre | Descripción |
|-------|-----|--------|-------------|
| 1–13 | 1 — JP Ferrada | Aguas Buenas, feedlot, Mollendo, San Pedro, etc. | Datos reales de producción |
| 14–26 | 99 — Fundo Demo | Predio Demo 1 … Predio Demo 13 | Datos demo (solo 12 de 13 tienen datos) |

---

## 2. Inventario de filas por tabla

| Tabla | Reales (predios 1-13) | Demo (predios 14-26) | Total | Demo % |
|-------|----------------------|---------------------|-------|--------|
| animales | 38,525 | 38,525 | 77,050 | 50% |
| pesajes | 39,924 | 39,924 | 79,848 | 50% |
| partos | 13,594 | 5,522 | 19,116 | 29% |
| bajas | 32,632 | 32,632 | 65,264 | 50% |
| tratamientos | 73,576 | 32,727 | 106,303 | 31% |
| inseminaciones | 4,822 | 0 | 4,822 | 0% |
| ecografias | 2,732 | 0 | 2,732 | 0% |
| areteos | 1,384 | 0 | 1,384 | 0% |
| ventas | 31,204 | 0 | 31,204 | 0% |
| lotes | 0 | 0 | 0 | — |
| potreros | 0 | 0 | 0 | — |
| movimientos_potrero | 0 | 0 | 0 | — |
| **TOTAL** | **238,393** | **149,330** | **387,723** | **39%** |

### Hallazgos clave del inventario

- **Espejo exacto confirmado**: los animales demo (predios 15-26) tienen la misma distribución por conteo que los reales (predios 2-13). Son un duplicado 1:1 generado por la ETL de importación AgroApp que corrió dos veces (una por predio real, una por predio demo).
- **DIIOs no se solapan**: 0 DIIOs en común entre predios reales y demo. Los registros son distintos en `animales.id` pero replican el contenido.
- **Dependencias internas**: los registros demo de `pesajes`, `bajas` y `tratamientos` apuntan a `animales.id` del rango demo. No hay cruces entre reales y demo. El grafo de FK es autónomo por org.
- **Tablas 100% reales**: inseminaciones, ecografias, areteos, ventas no tienen datos demo.
- **partos y tratamientos**: demo parcial — solo algunos predios demo tienen datos (no espejo exacto).

---

## 3. Opciones

### Opción A — Purgar predios 14-26 completamente

**Qué implica**: DELETE en cascada de todos los registros con `predio_id BETWEEN 14 AND 26` o con `animal_id` apuntando a animales de esos predios. Luego DELETE de los predios y la org 99.

**Tablas afectadas**: animales, pesajes, bajas, tratamientos, partos → 149,330 filas eliminadas. También predios 14-26 y org 99.

**Ventajas**:
- `smartcow_local` pasa a ser reflejo fiel de producción
- Queries de análisis no necesitan filtro `org_id != 99`
- Sin riesgo de contaminar métricas con datos ficticios

**Desventajas**:
- Los datos demo se pierden (tendrían que regenerarse para pruebas futuras)
- Operación irreversible sin backup

**Esfuerzo**: bajo — 1 script SQL con DELETEs en orden correcto (respetar FK).

---

### Opción B — Segregar con flag `is_demo` en cada tabla

**Qué implica**: añadir columna `is_demo boolean DEFAULT false` a las tablas de dominio, marcar los 149,330 registros demo, y actualizar todas las queries para filtrar `WHERE NOT is_demo`.

**Ventajas**:
- Preserva datos demo para pruebas
- Reversible

**Desventajas**:
- Migration Drizzle en todas las tablas de dominio (schema change)
- Todas las queries existentes (incluyendo `query_db` del chat y ETLs) deben actualizarse
- El riesgo de olvidar el filtro en alguna query es alto
- Agrega complejidad permanente al schema

**Esfuerzo**: alto — 9+ migraciones + actualizar `ejecutarTool()`, `query_db`, y queries de analytics.

---

### Opción C — Dejar mezclado pero documentado

**Qué implica**: no cambiar nada en la DB. Anotar en CLAUDE.md que `org_id = 99` son datos demo.

**Ventajas**:
- Cero esfuerzo ahora

**Desventajas**:
- `smartcow_local` no es "la verdad operativa" — duplica ~39% de las filas con ficticios
- Cualquier query de análisis agregado (totales, promedios, tendencias) debe filtrar `predio_id <= 13` o `org_id = 1` — fácil de olvidar
- El chat ganadero en local puede devolver datos mezclados al usuario si el `predio_id` no está correctamente acotado

**Esfuerzo**: ninguno ahora, pero costo operativo permanente.

---

## 4. Recomendación

**Opción A — Purgar**.

Razón: los datos demo son un espejo exacto de producción sin valor diferencial. Ya existe la ETL para regenerarlos si se necesitan en el futuro (`import-agroapp-excel.ts`). El costo de mantener 149,330 filas ficticias mezcladas en la DB local es permanente (queries contaminadas, análisis distorsionados, riesgo en el chat). La purga es un script SQL de ~10 líneas, toma menos de 5 minutos, y convierte local en fuente de verdad limpia.

**Prerequisito antes de ejecutar**: backup de `smartcow_local` (`pg_dump`) por si Fundo Demo se necesita restaurar.

**Orden de DELETE** (respetar FKs):
1. pesajes, bajas, tratamientos, inseminaciones, ecografias, areteos, ventas (referencian animales)
2. partos (madre_id → animales, cria_id → animales)
3. animales
4. predios 14-26
5. org 99

---

*Documento generado por análisis de DB local — no commitear hasta que Cesar decida.*
