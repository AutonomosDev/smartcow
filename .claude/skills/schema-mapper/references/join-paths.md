# SmartCow — Join Paths & Implicit Relationships

Generated: 2026-04-27

---

## Core Join Paths

### animales ↔ pesajes

```sql
-- All weights for an animal
SELECT a.diio, p.fecha, p.peso_kg
FROM animales a
JOIN pesajes p ON p.animal_id = a.id
WHERE a.predio_id = :predio_id
ORDER BY a.diio, p.fecha;

-- GDP (Average Daily Gain) per animal in a date range
SELECT a.diio,
       MAX(p.peso_kg) - MIN(p.peso_kg) AS ganancia_kg,
       MAX(p.fecha) - MIN(p.fecha)     AS dias,
       ROUND((MAX(p.peso_kg) - MIN(p.peso_kg)) /
             NULLIF(MAX(p.fecha) - MIN(p.fecha), 0), 3) AS gdp_kg_dia
FROM animales a
JOIN pesajes p ON p.animal_id = a.id AND p.predio_id = a.predio_id
WHERE a.predio_id = :predio_id
GROUP BY a.id, a.diio
HAVING COUNT(p.id) >= 2;
```

---

### animales ↔ partos (madre → crías)

```sql
-- Partos de una madre
SELECT a.diio AS madre_diio,
       p.fecha,
       p.resultado,
       cria.diio AS cria_diio
FROM animales a
JOIN partos p ON p.madre_id = a.id
LEFT JOIN animales cria ON cria.id = p.cria_id
WHERE a.predio_id = :predio_id
ORDER BY a.diio, p.fecha;

-- Genealogía: madre e hijas
SELECT madre.diio AS madre,
       cria.diio  AS cria,
       p.fecha    AS fecha_parto,
       p.resultado
FROM partos p
JOIN animales madre ON madre.id = p.madre_id
LEFT JOIN animales cria  ON cria.id  = p.cria_id
WHERE p.predio_id = :predio_id;
```

---

### animales ↔ lotes (feedlot)

```sql
-- Animales en un lote activo con sus pesos de entrada y salida
SELECT a.diio,
       la.fecha_entrada,
       la.fecha_salida,
       la.peso_entrada_kg,
       la.peso_salida_kg,
       la.peso_salida_kg - la.peso_entrada_kg AS ganancia_total_kg
FROM lotes l
JOIN lote_animales la ON la.lote_id = l.id
JOIN animales a       ON a.id = la.animal_id
WHERE l.id = :lote_id;

-- GDP por animal en lote
SELECT a.diio,
       la.peso_entrada_kg,
       la.peso_salida_kg,
       ROUND(
         (la.peso_salida_kg - la.peso_entrada_kg) /
         NULLIF(la.fecha_salida - la.fecha_entrada, 0), 3
       ) AS gdp_kg_dia
FROM lote_animales la
JOIN animales a ON a.id = la.animal_id
WHERE la.lote_id = :lote_id
  AND la.peso_salida_kg IS NOT NULL;

-- Lotes activos de un predio con recuento de animales
SELECT l.nombre,
       l.fecha_entrada,
       l.objetivo_peso_kg,
       COUNT(la.id) AS n_animales,
       ROUND(AVG(la.peso_entrada_kg), 1) AS peso_entrada_prom
FROM lotes l
JOIN lote_animales la ON la.lote_id = l.id AND la.fecha_salida IS NULL
WHERE l.predio_id = :predio_id AND l.estado = 'activo'
GROUP BY l.id;
```

---

### animales ↔ potreros (crianza)

```sql
-- Ubicación actual de cada animal (open movement = IS NULL)
SELECT a.diio,
       pot.nombre AS potrero_actual,
       mp.fecha_entrada AS desde
FROM animales a
JOIN movimientos_potrero mp ON mp.animal_id = a.id
JOIN potreros pot            ON pot.id = mp.potrero_id
WHERE a.predio_id = :predio_id
  AND mp.fecha_salida IS NULL
  AND a.estado = 'activo';

-- Animales en un potrero específico ahora
SELECT a.diio, a.sexo, a.estado
FROM movimientos_potrero mp
JOIN animales a ON a.id = mp.animal_id
WHERE mp.potrero_id = :potrero_id
  AND mp.fecha_salida IS NULL;
```

---

### animales ↔ tratamientos

```sql
-- Animales en resguardo de carne hoy
SELECT a.diio,
       t.diagnostico,
       t.liberacion_carne_max,
       t.liberacion_carne_max - CURRENT_DATE AS dias_restantes
FROM tratamientos t
JOIN animales a ON a.id = t.animal_id
WHERE t.predio_id = :predio_id
  AND t.liberacion_carne_max >= CURRENT_DATE
ORDER BY t.liberacion_carne_max;

-- Historial de tratamientos de un animal
SELECT t.fecha, t.diagnostico, t.medicamentos, t.liberacion_carne_max
FROM tratamientos t
WHERE t.animal_id = :animal_id
ORDER BY t.fecha DESC;
```

---

### animales ↔ inseminaciones ↔ ecografias (ciclo reproductivo)

```sql
-- Estado reproductivo de cada vaca: última inseminación + última ecografía
SELECT a.diio,
       last_ins.fecha AS ultima_ia,
       last_ins.resultado AS resultado_ia,
       last_eco.fecha AS ultima_eco,
       last_eco.resultado AS resultado_eco
FROM animales a
LEFT JOIN LATERAL (
  SELECT fecha, resultado
  FROM inseminaciones
  WHERE animal_id = a.id
  ORDER BY fecha DESC LIMIT 1
) last_ins ON true
LEFT JOIN LATERAL (
  SELECT fecha, resultado
  FROM ecografias
  WHERE animal_id = a.id
  ORDER BY fecha DESC LIMIT 1
) last_eco ON true
WHERE a.predio_id = :predio_id AND a.sexo = 'H';
```

---

### animales ↔ bajas

```sql
-- Bajas del último año con motivo y causa
SELECT a.diio,
       b.fecha,
       bm.nombre AS motivo,
       bc.nombre AS causa,
       b.peso_kg
FROM bajas b
JOIN animales a   ON a.id = b.animal_id
JOIN baja_motivo bm ON bm.id = b.motivo_id
LEFT JOIN baja_causa bc ON bc.id = b.causa_id
WHERE b.predio_id = :predio_id
  AND b.fecha >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY b.fecha DESC;
```

---

### animales ↔ ventas

```sql
-- Ventas de un predio con datos del animal
SELECT a.diio,
       v.fecha,
       v.peso_kg,
       v.destino,
       v.venta_id_agroapp AS rampa_id
FROM ventas v
JOIN animales a ON a.id = v.animal_id
WHERE v.predio_id = :predio_id
ORDER BY v.fecha DESC, v.venta_id_agroapp;

-- Ventas agrupadas por rampa (lote de venta)
SELECT v.venta_id_agroapp AS rampa,
       v.fecha,
       COUNT(*) AS n_animales,
       ROUND(AVG(v.peso_kg), 1) AS peso_prom,
       MIN(v.destino) AS destino
FROM ventas v
WHERE v.predio_id = :predio_id AND v.venta_id_agroapp IS NOT NULL
GROUP BY v.venta_id_agroapp, v.fecha
ORDER BY v.fecha DESC;
```

---

### animales ↔ areteos (historial de DIIOs)

```sql
-- Historial completo de aretes de un animal
SELECT ar.tipo, ar.fecha, ar.diio_nuevo, ar.diio_anterior
FROM areteos ar
WHERE ar.animal_id = :animal_id
ORDER BY ar.fecha;

-- Buscar animal por DIIO actual o anterior
SELECT DISTINCT a.*
FROM animales a
LEFT JOIN areteos ar ON ar.animal_id = a.id
WHERE a.predio_id = :predio_id
  AND (a.diio = :diio_buscado OR ar.diio_nuevo = :diio_buscado OR ar.diio_anterior = :diio_buscado);
```

---

### Multi-hop: animales → lotes → pesajes (GDP detallado feedlot)

```sql
-- GDP por animal en lote usando pesajes reales (no solo entrada/salida del lote)
SELECT a.diio,
       la.fecha_entrada AS ingreso_lote,
       p_entrada.peso_kg AS peso_ingreso,
       p_ultimo.peso_kg AS peso_actual,
       p_ultimo.fecha AS fecha_ultimo_pesaje,
       ROUND(
         (p_ultimo.peso_kg - p_entrada.peso_kg) /
         NULLIF(p_ultimo.fecha - la.fecha_entrada, 0), 3
       ) AS gdp_real
FROM lote_animales la
JOIN animales a ON a.id = la.animal_id
JOIN pesajes p_entrada ON p_entrada.animal_id = a.id
  AND p_entrada.fecha = (
    SELECT MIN(fecha) FROM pesajes
    WHERE animal_id = a.id AND fecha >= la.fecha_entrada
  )
JOIN pesajes p_ultimo ON p_ultimo.animal_id = a.id
  AND p_ultimo.fecha = (
    SELECT MAX(fecha) FROM pesajes
    WHERE animal_id = a.id
  )
WHERE la.lote_id = :lote_id AND la.fecha_salida IS NULL;
```

---

### Multi-hop: predio → animales → partos + pesajes (performance crianza)

```sql
-- Terneros nacidos este año con su primer pesaje
SELECT cria.diio,
       p.fecha AS fecha_nacimiento,
       madre.diio AS diio_madre,
       primer_peso.peso_kg AS peso_inicial,
       primer_peso.fecha AS fecha_peso_inicial
FROM partos p
JOIN animales madre ON madre.id = p.madre_id
JOIN animales cria  ON cria.id  = p.cria_id
LEFT JOIN LATERAL (
  SELECT peso_kg, fecha FROM pesajes
  WHERE animal_id = cria.id
  ORDER BY fecha LIMIT 1
) primer_peso ON true
WHERE p.predio_id = :predio_id
  AND p.fecha >= DATE_TRUNC('year', CURRENT_DATE)
  AND p.resultado = 'vivo';
```

---

### Multi-hop: org → chat_usage (LLM cost monitoring)

```sql
-- Gasto LLM por org este mes
SELECT o.nombre AS org,
       SUM(cu.cost_usd) AS costo_usd,
       SUM(cu.tokens_in + cu.tokens_out) AS tokens_totales,
       COUNT(*) AS requests
FROM chat_usage cu
JOIN organizaciones o ON o.id = cu.org_id
WHERE cu.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY o.id, o.nombre
ORDER BY costo_usd DESC;

-- Gasto por usuario y tier
SELECT u.email, cu.tier, cu.model_id,
       COUNT(*) AS requests,
       SUM(cu.cost_usd) AS costo_usd
FROM chat_usage cu
JOIN users u ON u.id = cu.user_id
WHERE cu.org_id = :org_id
  AND cu.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.email, cu.tier, cu.model_id
ORDER BY costo_usd DESC;
```

---

## Implicit Relationships (no FK enforced)

| Pattern | From | To | Note |
|---------|------|----|------|
| `diio_madre` | animales.diio_madre | animales.diio | Genealogy link — text match, no FK. Use for historical data from AgroApp where offspring wasn't registered as separate animal. |
| `predio_id` (chat_cache) | chat_cache.predio_id | predios.id | No FK. Cache invalidation uses this column directly. |
| `predio_id` (kb_documents) | kb_documents.predio_id | predios.id | No FK. Google Files API managed separately. |
| `predio_id` (chat_usage) | chat_usage.predio_id | predios.id | No FK. Denormalized for query speed. |
| `session_id` (chat_usage) | chat_usage.session_id | chat_sessions.id | String vs integer — not directly joinable |
| `venta_id_agroapp` | ventas.venta_id_agroapp | ventas.venta_id_agroapp | Self-join pattern to group a "rampa" (batch sale) |
| `tipo_ganado_desglose` (traslados) | traslados.tipo_ganado_desglose jsonb keys | tipo_ganado.nombre | Keys are normalized lowercase names, not integer FKs |
| `tg_encontrados/tg_faltantes` (inventarios) | inventarios jsonb keys | tipo_ganado.nombre | Same pattern as traslados |

---

## Genealogy Join (using implicit diio_madre)

```sql
-- Find mother of an animal via diio_madre (no FK — text match)
SELECT hijo.diio AS hijo,
       madre.id  AS madre_id,
       madre.diio AS madre_diio
FROM animales hijo
JOIN animales madre ON madre.diio = hijo.diio_madre
                    AND madre.predio_id = hijo.predio_id
WHERE hijo.predio_id = :predio_id;

-- Alternative via partos table (FK-backed, more reliable)
SELECT cria.diio AS hijo_diio,
       madre.diio AS madre_diio,
       p.fecha AS fecha_parto
FROM partos p
JOIN animales madre ON madre.id = p.madre_id
JOIN animales cria  ON cria.id  = p.cria_id
WHERE p.predio_id = :predio_id;
```

---

## Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `*_id` ending | FK to another table | `animal_id`, `predio_id`, `org_id` |
| `predio_id` present | Denormalized tenant key; always in WHERE | All event tables |
| `org_id` present | Cross-predio queries or tenant root | lotes, potreros, movimientos_potrero, chat_usage |
| `usuario_id` | Audit trail FK to users | pesajes, partos, bajas, etc. |
| `id_agroapp` | External system reference ID | tratamientos, traslados, inventarios, ventas |
| `*_kg` suffix | Weight in kilograms (numeric) | peso_kg, peso_entrada_kg |
| `fecha_*` prefix | Date column | fecha_nacimiento, fecha_entrada, fecha_salida |
| `creado_en` / `created_at` | Creation timestamp (mixed naming) | Both in use depending on table generation era |
| `actualizado_en` / `updated_at` | Update timestamp | Same mixed naming |
| `diio_*` | DIIO tag identifier | diio_madre, diio_nuevo, diio_anterior |
| `n_*` prefix | Count/number | n_animales, n_encontrados, n_faltantes |
| `tg_*` prefix | tipo_ganado desglose jsonb | tg_encontrados, tg_faltantes |

---

## Key Index Coverage

| Query Pattern | Index |
|---------------|-------|
| `WHERE animal_id = X AND fecha BETWEEN...` | pesajes, partos, inseminaciones, ecografias, areteos, bajas, tratamientos |
| `WHERE predio_id = X AND fecha BETWEEN...` | pesajes, partos, inseminaciones, ecografias, bajas, tratamientos, ventas |
| `WHERE predio_id = X AND estado = Y` | animales |
| `WHERE predio_id = X AND diio = Y` | animales (composite) |
| `WHERE lote_id = X` | lote_animales |
| `WHERE animal_id = X` (lote) | lote_animales |
| `WHERE animal_id = X` (movements) | movimientos_potrero |
| `WHERE potrero_id = X AND predio_id = Y` | movimientos_potrero |
| `WHERE liberacion_carne_max >= TODAY` | tratamientos |
| `WHERE categoria = X AND fecha DESC` | precios_feria |
| `WHERE feria = X AND categoria = Y AND fecha DESC` | precios_feria |
| `WHERE user_id = X AND key = Y` | user_memory (unique) |
| `WHERE venta_id_agroapp = X` | ventas.ventas_rampa_idx |
| `WHERE n_guia = X` | traslados.traslados_n_guia_idx |
