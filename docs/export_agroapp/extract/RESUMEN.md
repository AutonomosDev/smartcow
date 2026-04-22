# Extracción exhaustiva AgroApp — 2026-04-22 (AUT-296)

Generado por `scripts/extract-full-agroapp.ts`.

## Archivos procesados

| archivo | filas | con observaciones | % |
|---------|------:|------------------:|--:|
| Bajas_Historial_18-04-2026.xlsx | 1431 | 1431 | 100.0% |
| GanadoActual_18-04-2026.xlsx | 6153 | 0 | 0.0% |
| Inseminaciones_Historial_18-04-2026.xlsx | 4900 | 0 | 0.0% |
| Inventarios_Historial_18-04-2026.xlsx | 27 | 0 | 0.0% |
| Partos_Historial_18-04-2026.xlsx | 8121 | 0 | 0.0% |
| Pesajes_Ganancias_18-04-2026.xlsx | 825 | 0 | 0.0% |
| Pesajes_Historial_18-04-2026_1.xlsx | 173518 | 38016 | 21.9% |
| Traslados_Historial_18-04-2026.xlsx | 198 | 138 | 69.7% |
| Tratamientos_Historial_18-04-2026_1.xlsx | 74777 | 14225 | 19.0% |
| Ventas_Historial_18-04-2026_1.xlsx | 846 | 775 | 91.6% |

## Patrones únicos extraídos por archivo

### Bajas_Historial_18-04-2026.xlsx

| patrón | únicos |
|--------|------:|
| `carro_prefix` | 1 |
| `kw_venta` | 1 |
| `kw_tratamiento` | 1 |
| `nombre_propio` | 7 |

**nombre_propio** (top 15 únicos):

- `Impactación Ruminal`
- `Enteritis Hemorrágica`
- `Torcion Intestinal`
- `Ruptura Vena Cava`
- `Eutanasia Doc Benjamin`
- `Infección Pene Post`
- `Ternero Grande`

---

### Pesajes_Historial_18-04-2026_1.xlsx

| patrón | únicos |
|--------|------:|
| `cantidad_animal` | 1 |
| `kw_venta` | 2 |
| `kw_tratamiento` | 2 |
| `nombre_propio` | 1 |

**nombre_propio** (top 15 únicos):

- `San Pedro`

---

### Traslados_Historial_18-04-2026.xlsx

| patrón | únicos |
|--------|------:|
| `diio` | 2 |
| `pesos_kg` | 5 |
| `pesos_pv` | 1 |
| `cantidad_animal` | 62 |
| `fecha_texto` | 1 |
| `patente_auto` | 1 |
| `camion_prefix` | 3 |
| `kw_compra` | 1 |
| `kw_venta` | 3 |
| `kw_traslado` | 2 |
| `nombre_propio` | 4 |

**diio** (top 15 únicos):

- `26437205`
- `22619295`

**pesos_kg** (top 15 únicos):

- `40.879 kgs`
- `230kg`
- `429 kgs`
- `36526 kgs`
- `289 kgs`

**nombre_propio** (top 15 únicos):

- `San Pedro`
- `Santa Isabel`
- `Las Quebradas`
- `Sta Isabel`

---

### Tratamientos_Historial_18-04-2026_1.xlsx

| patrón | únicos |
|--------|------:|
| `kw_tratamiento` | 4 |

---

### Ventas_Historial_18-04-2026_1.xlsx

| patrón | únicos |
|--------|------:|
| `diio` | 6 |
| `rut` | 3 |
| `pesos_kg` | 20 |
| `guia` | 1 |
| `cantidad_animal` | 164 |
| `fecha_dd_mm_yyyy` | 1 |
| `fecha_texto` | 1 |
| `camion_prefix` | 14 |
| `carro_prefix` | 1 |
| `kw_venta` | 5 |
| `kw_traslado` | 1 |
| `nombre_propio` | 134 |
| `porcentaje` | 3 |

**rut** (top 15 únicos):

- `9.871.917-2`
- `18.871.807-8`
- `8.500.689-0`

**diio** (top 15 únicos):

- `1435765`
- `1435766`
- `1429390`
- `1429392`
- `1427920`
- `1427921`

**pesos_kg** (top 15 únicos):

- `..526 kgs`
- `498 kgs`
- `17.160 kgs`
- `39.840 kgs`
- `540 kgs`
- `17.300 kgs`
- `39.160 kgs`
- `21.860 kgs`
- `546,5 kgs`
- `511 kgs`
- `590 kgs`
- `35 kgs`
- `555 kgs`
- `568 kgs`
- `536 kgs`

**guia** (top 15 únicos):

- `guías numero 1429390`

**nombre_propio** (top 15 únicos):

- `Frigorifico Temuco`
- `Tattersal Freire`
- `Venta Feria Tattersal`
- `Frigorífico Temuco`
- `Pampa Chile`
- `Venta Mollendo`
- `Venta Mollendo China`
- `Venta Mafrisur`
- `Desecho Frigorífico Temuco`
- `Venta Urgencia`
- `Venta Comercial`
- `Venta Pampa Chile`
- `Novillos Gordos Mafrisur`
- `Gordos Mollendo`
- `Gordos Para Pampa`

---

## Archivos de salida

- [Bajas_Historial_18-04-2026_raw.csv](Bajas_Historial_18-04-2026_raw.csv) — toda la data cruda
- [Bajas_Historial_18-04-2026_obs_parsed.csv](Bajas_Historial_18-04-2026_obs_parsed.csv) — observaciones + patrones extraídos
- [GanadoActual_18-04-2026_raw.csv](GanadoActual_18-04-2026_raw.csv) — toda la data cruda
- [Inseminaciones_Historial_18-04-2026_raw.csv](Inseminaciones_Historial_18-04-2026_raw.csv) — toda la data cruda
- [Inventarios_Historial_18-04-2026_raw.csv](Inventarios_Historial_18-04-2026_raw.csv) — toda la data cruda
- [Partos_Historial_18-04-2026_raw.csv](Partos_Historial_18-04-2026_raw.csv) — toda la data cruda
- [Pesajes_Ganancias_18-04-2026_raw.csv](Pesajes_Ganancias_18-04-2026_raw.csv) — toda la data cruda
- [Pesajes_Historial_18-04-2026_1_raw.csv](Pesajes_Historial_18-04-2026_1_raw.csv) — toda la data cruda
- [Pesajes_Historial_18-04-2026_1_obs_parsed.csv](Pesajes_Historial_18-04-2026_1_obs_parsed.csv) — observaciones + patrones extraídos
- [Traslados_Historial_18-04-2026_raw.csv](Traslados_Historial_18-04-2026_raw.csv) — toda la data cruda
- [Traslados_Historial_18-04-2026_obs_parsed.csv](Traslados_Historial_18-04-2026_obs_parsed.csv) — observaciones + patrones extraídos
- [Tratamientos_Historial_18-04-2026_1_raw.csv](Tratamientos_Historial_18-04-2026_1_raw.csv) — toda la data cruda
- [Tratamientos_Historial_18-04-2026_1_obs_parsed.csv](Tratamientos_Historial_18-04-2026_1_obs_parsed.csv) — observaciones + patrones extraídos
- [Ventas_Historial_18-04-2026_1_raw.csv](Ventas_Historial_18-04-2026_1_raw.csv) — toda la data cruda
- [Ventas_Historial_18-04-2026_1_obs_parsed.csv](Ventas_Historial_18-04-2026_1_obs_parsed.csv) — observaciones + patrones extraídos