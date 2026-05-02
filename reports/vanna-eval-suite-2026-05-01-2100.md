# Vanna eval suite — 2026-05-01 21:02

_20 queries · 175.2s · OK 16 · parcial 2 · fail 2 · acierto **80%**_

| # | Pregunta | Tabla esperada | Score | Issues |
| --- | --- | --- | :-: | --- |
| 1 | ¿cuántas vacas activas hay en Agrícola? | `animales` | 🟢 | — |
| 2 | ¿cuántos animales hay en feedlot por etapa? | `animales` | 🟢 | — |
| 3 | ¿cuántos toros hay en total? | `animales` | 🟢 | — |
| 4 | ¿cuál es el peso promedio de animales en engorda en feedlot? | `pesajes` | 🟢 | — |
| 5 | ¿cuántos pesajes se hicieron en enero 2026? | `pesajes` | 🟢 | — |
| 6 | ¿qué animales tienen peso menor a 10 kg (outliers)? | `pesajes` | 🟢 | — |
| 7 | ¿cuántos partos hubo en 2024? | `partos` | 🔴 | sql_error:operator does not exist: numeric - interval
LINE 1 |
| 8 | ¿cuántos partos resultaron muertos? | `partos` | 🟢 | — |
| 9 | ¿cuántas inseminaciones se hicieron este año? | `inseminaciones` | 🟢 | — |
| 10 | top 5 diagnósticos más comunes en tratamientos | `tratamientos` | 🟢 | — |
| 11 | ¿cuántos tratamientos por neumonía hay? | `tratamientos` | 🟢 | — |
| 12 | ¿cuál es el motivo más común de bajas? | `bajas` | 🟢 | — |
| 13 | ¿a qué destinos se vende más ganado? | `ventas` | 🔴 | sql_error:syntax error at or near "LIMIT"
LINE 1: ... 1 GROU |
| 14 | ¿cuántas ventas son por lote sin DIIO? | `ventas` | 🟢 | — |
| 15 | ¿cuántos traslados se registraron este año? | `traslados` | 🟢 | — |
| 16 | ¿cuántos inventarios físicos se hicieron? | `inventarios` | 🟢 | — |
| 17 | precio promedio kg de novillo engorda en bulnes este año | `precios_feria` | 🟡 | missing_table:precios_feria |
| 18 | ¿cuántos animales sin pesar hace 60 días en feedlot? | `kpi_diario` | 🟡 | missing_table:kpi_diario |
| 19 | animales listos para venta con peso > 450kg en feedlot | `pesajes+animales` | 🟢 | — |
| 20 | tasa de preñez actual de vacas en Agrícola | `animales+estado_reproductivo` | 🟢 | — |

---

## Detalle por query

### 1. 🟢 ¿cuántas vacas activas hay en Agrícola?

- predio_id: `1` · tabla esperada: `animales`
- rows: 1 · elapsed: 6937ms

```sql
SELECT COUNT(a.id) FROM animales a WHERE a.predio_id = 1 AND a.estado = 'activo' AND a.tipo_ganado_id = (SELECT id FROM tipo_ganado WHERE nombre = 'Vaca')
```

### 2. 🟢 ¿cuántos animales hay en feedlot por etapa?

- predio_id: `2` · tabla esperada: `animales`
- rows: 2 · elapsed: 5437ms

```sql
SELECT etapa, COUNT(id) AS total_animales FROM animales WHERE predio_id = 2 GROUP BY etapa
```

### 3. 🟢 ¿cuántos toros hay en total?

- predio_id: `1` · tabla esperada: `animales`
- rows: 1 · elapsed: 6077ms

```sql
SELECT COUNT(id) FROM animales WHERE predio_id = 1 AND tipo_ganado_id = 3 AND estado = 'activo'
```

### 4. 🟢 ¿cuál es el peso promedio de animales en engorda en feedlot?

- predio_id: `2` · tabla esperada: `pesajes`
- rows: 1 · elapsed: 9863ms

```sql
WITH ult AS (SELECT DISTINCT ON (animal_id) animal_id, peso_kg FROM pesajes WHERE outlier_peso=false ORDER BY animal_id, fecha DESC) SELECT ROUND(AVG(u.peso_kg)::numeric, 1) AS peso_avg FROM animales a JOIN ult u ON u.animal_id=a.id WHERE a.etapa='engorda' AND a.predio_id=2
```

### 5. 🟢 ¿cuántos pesajes se hicieron en enero 2026?

- predio_id: `2` · tabla esperada: `pesajes`
- rows: 1 · elapsed: 7400ms

```sql
SELECT COUNT(id) FROM pesajes WHERE predio_id = 2 AND fecha >= date_trunc('month', CURRENT_DATE - INTERVAL '1 year' - INTERVAL '11 months') AND fecha < date_trunc('month', CURRENT_DATE - INTERVAL '1 year')
```

### 6. 🟢 ¿qué animales tienen peso menor a 10 kg (outliers)?

- predio_id: `1` · tabla esperada: `pesajes`
- rows: 1 · elapsed: 8394ms

```sql
SELECT a.diio, p.peso_kg, p.fecha FROM animales a JOIN pesajes p ON a.id = p.animal_id WHERE p.outlier_peso = TRUE AND a.predio_id = 1 LIMIT 100
```

### 7. 🔴 ¿cuántos partos hubo en 2024?

- predio_id: `1` · tabla esperada: `partos`
- rows: 0 · elapsed: 6422ms
- issues: sql_error:operator does not exist: numeric - interval
LINE 1: ...EAR FROM fecha) = EXTRACT, rows_validator_failed

```sql
SELECT COUNT(id) FROM partos WHERE predio_id = 1 AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE) - INTERVAL '1 year'
```

### 8. 🟢 ¿cuántos partos resultaron muertos?

- predio_id: `1` · tabla esperada: `partos`
- rows: 1 · elapsed: 4315ms

```sql
SELECT COUNT(id) FROM partos WHERE predio_id = 1 AND resultado = 'muerto'
```

### 9. 🟢 ¿cuántas inseminaciones se hicieron este año?

- predio_id: `1` · tabla esperada: `inseminaciones`
- rows: 1 · elapsed: 6574ms

```sql
SELECT COUNT(id) FROM inseminaciones WHERE predio_id = 1 AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
```

### 10. 🟢 top 5 diagnósticos más comunes en tratamientos

- predio_id: `1` · tabla esperada: `tratamientos`
- rows: 5 · elapsed: 5974ms

```sql
SELECT diagnostico, COUNT(*) AS n FROM tratamientos WHERE predio_id = 1 AND diagnostico IS NOT NULL GROUP BY diagnostico ORDER BY n DESC LIMIT 5
```

### 11. 🟢 ¿cuántos tratamientos por neumonía hay?

- predio_id: `1` · tabla esperada: `tratamientos`
- rows: 1 · elapsed: 4962ms

```sql
SELECT COUNT(id) FROM tratamientos WHERE predio_id = 1 AND diagnostico ILIKE '%neumonía%'
```

### 12. 🟢 ¿cuál es el motivo más común de bajas?

- predio_id: `1` · tabla esperada: `bajas`
- rows: 1 · elapsed: 7461ms

```sql
SELECT bm.nombre, COUNT(b.id) AS n FROM bajas b JOIN baja_motivo bm ON bm.id=b.motivo_id WHERE b.predio_id = 1 GROUP BY bm.nombre ORDER BY n DESC LIMIT 5
```

### 13. 🔴 ¿a qué destinos se vende más ganado?

- predio_id: `1` · tabla esperada: `ventas`
- rows: 0 · elapsed: 5736ms
- issues: sql_error:syntax error at or near "LIMIT"
LINE 1: ... 1 GROUP BY destino ORDER BY n_ventas, rows_validator_failed

```sql
SELECT destino, COUNT(*) AS n_ventas, SUM(n_animales_rampa) AS animales_totales FROM ventas WHERE predio_id = 1 GROUP BY destino ORDER BY n_ventas DESC LIMIT 10 LIMIT 20
```

### 14. 🟢 ¿cuántas ventas son por lote sin DIIO?

- predio_id: `1` · tabla esperada: `ventas`
- rows: 1 · elapsed: 10062ms

```sql
SELECT COUNT(id) AS n_ventas_lote FROM ventas WHERE predio_id = 1 AND animal_id IS NULL AND animales_lote IS NOT NULL
```

### 15. 🟢 ¿cuántos traslados se registraron este año?

- predio_id: `1` · tabla esperada: `traslados`
- rows: 1 · elapsed: 12062ms

```sql
SELECT COUNT(id) FROM traslados WHERE predio_origen_id = 1 AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
```

### 16. 🟢 ¿cuántos inventarios físicos se hicieron?

- predio_id: `1` · tabla esperada: `inventarios`
- rows: 1 · elapsed: 3768ms

```sql
SELECT COUNT(id) FROM inventarios WHERE predio_id = 1
```

### 17. 🟡 precio promedio kg de novillo engorda en bulnes este año

- predio_id: `1` · tabla esperada: `precios_feria`
- rows: 1 · elapsed: 25537ms
- issues: missing_table:precios_feria

```sql
WITH ult_pesajes AS (SELECT DISTINCT ON (animal_id) animal_id, peso_kg, fecha FROM pesajes WHERE outlier_peso=false ORDER BY animal_id, fecha DESC) SELECT ROUND(AVG(CASE WHEN tg.nombre = 'Novillo' THEN u.peso_kg ELSE NULL END)::numeric, 2) AS peso_promedio_kg FROM animales a JOIN ult_pesajes u ON u.animal_id = a.id JOIN tipo_ganado tg ON tg.id = a.tipo_ganado_id WHERE a.predio_id = 1 AND a.etapa = 'engorda' AND tg.nombre = 'Novillo' AND u.fecha >= date_trunc('year', CURRENT_DATE) AND u.fecha <= CURRENT_DATE
```

### 18. 🟡 ¿cuántos animales sin pesar hace 60 días en feedlot?

- predio_id: `2` · tabla esperada: `kpi_diario`
- rows: 26 · elapsed: 8322ms
- issues: missing_table:kpi_diario

```sql
SELECT a.diio FROM animales a WHERE a.predio_id = 2 AND a.estado = 'activo' AND NOT EXISTS (SELECT 1 FROM pesajes p WHERE p.animal_id = a.id AND p.fecha >= CURRENT_DATE - INTERVAL '60 days') LIMIT 100
```

### 19. 🟢 animales listos para venta con peso > 450kg en feedlot

- predio_id: `2` · tabla esperada: `pesajes+animales`
- rows: 6 · elapsed: 11980ms

```sql
WITH ult AS (SELECT DISTINCT ON (animal_id) animal_id, peso_kg FROM pesajes WHERE outlier_peso=false ORDER BY animal_id, fecha DESC) SELECT a.diio, u.peso_kg FROM animales a JOIN ult u ON u.animal_id=a.id WHERE a.etapa='engorda' AND a.predio_id=2 AND a.estado='activo' AND u.peso_kg > 450 ORDER BY u.peso_kg DESC LIMIT 50
```

### 20. 🟢 tasa de preñez actual de vacas en Agrícola

- predio_id: `1` · tabla esperada: `animales+estado_reproductivo`
- rows: 1 · elapsed: 17836ms

```sql
SELECT
       COUNT(*) FILTER (WHERE er.nombre ILIKE '%pren%') AS vacas_prenadas,
       COUNT(*) FILTER (WHERE er.nombre ILIKE '%vac%')  AS vacas_vacias,
       COUNT(*) AS total_vacas,
       ROUND(100.0 * COUNT(*) FILTER (WHERE er.nombre ILIKE '%pren%')
             / NULLIF(COUNT(*), 0), 1) AS tasa_preñez_pct
FROM animales a
JOIN tipo_ganado tg ON tg.id=a.tipo_ganado_id
LEFT JOIN estado_reproductivo er ON er.id=a.estado_reproductivo_id
WHERE a.predio_id = 1
  AND tg.nombre IN ('Vaca', 'Vaquilla')
  AND a.estado = 'activo'
```
