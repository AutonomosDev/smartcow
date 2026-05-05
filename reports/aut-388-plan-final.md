# AUT-388 — Plan de carga BD smartcow_local (final)

**Fecha:** 2026-05-01
**Branch:** `lf/aut-388-plan-carga-bd`
**Status run inicial:** ✅ holdings(1) + predios(2) + animales(2.636) + pesajes(6.309)

---

## 0. Decisiones arquitectónicas (aprobadas Cesar)

| # | Decisión | Detalle |
|---|---|---|
| D1 | Canónico animales | `Ganado_Actual_san-pedro.xlsx` (1.402 → Agrícola) + `recria-feedlot.xlsx` (1.234 → Feedlot) |
| D2 | TRUNCATE pre-carga | Orchestrator hace `TRUNCATE … RESTART IDENTITY CASCADE` antes de cargar. Idempotencia vía clean slate. |
| D3 | Mapeo fundos | 78 fundos legacy → 2 predios (`scripts/etl/mapping/fundos.py`). Externos (ferias/compradores) descartados en eventos internos. |
| D4 | Histórico completo | Sin filtro temporal. Carga 2018→2026. |

## 1. Mapeo COMPLETO 78 fundos legacy → predios reales

`scripts/etl/mapping/fundos.py`:

- **20 INTERNOS** (mapean a predio_id):
  - Feedlot (id=2): `feedlot`, `Feedlot`, `Medieria FT`, `Medieria Frival`, `Medieria Oller`, `Recría FT`, `Recría Feedlot`, `Corrales del Sur`
  - Agrícola (id=1): `San Pedro`, `Mollendo`, `Mollendo 12-03`, `Aguas Buenas`, `Arriendo Santa Isabel`, `Ag Santa Isabel`, `Santa Isabel (1)`, `Santa Isabel (2)`, `sta isabel`, `Chacaipulli`, `Medieria Chacaipulli`, `Arriendo las quebradas`

- **58 EXTERNOS** (descartados en eventos internos, van como string en ventas/traslados):
  - Ferias: Tattersall (3 variantes), Fegosa (10 variantes), Feria Remehue
  - Localidades: Pto Montt/Varas, Pta Arena, Frutillar, Purranque, Futrono
  - Otras agrícolas: Mantos Verdes (10 variantes), Agrícola Gondesende (3), Doña Charo (2), Ag Santa Alejandra (3), El Pampero, Ganadera Viento Sur, Inversiones El Rocio, Rayen Lafquen (3 variantes), Agrícola Valdivia, los Lingues
  - Personas (compradores): Hugo Reyes, Mario Hernandez, Oscar Hitschfeld (4 typos), José Steffen, Arlette Fuentealba, Winkler

## 2. Orden de carga (dependencias FK)

| # | Tabla | Depende de | Filas reales | Estado |
|---|---|---|---:|---|
| 1 | holdings | — | 1 | ✅ implementado |
| 2 | predios | holdings, organizaciones | 2 | ✅ implementado |
| 3 | animales | predios, tipo_ganado | 2.636 | ✅ implementado |
| 4 | pesajes | animales, predios | 6.309 (de 173k filas, 167k huérfanos) | ✅ implementado |
| 5 | partos | animales | ~8.121 (filtrar huérfanos) | 🟡 spec lista |
| 6 | inseminaciones | animales | ~4.900 | 🟡 spec lista |
| 7 | tratamientos | animales | ~74.777 | 🟡 spec lista |
| 8 | bajas | animales | ~1.431 | 🟡 spec lista |
| 9 | ventas | animales (NULL si lote) | ~846 | 🟡 spec lista |
| 10 | traslados | animales, predios | ~198 | 🟡 spec lista |
| 11 | inventarios | predios | ~27 | 🟡 spec lista |
| 12 | ecografias | animales | ~2.732 | 🟡 spec lista |
| 13 | areteos | animales | ~1.384 | 🟡 spec lista |
| 14 | precios_feria | — | ~14.196 | 🟡 spec lista |
| 15 | kpi_diario | calculado | 1 por (fecha, predio) | 🟡 spec lista |

## 3. Scripts implementados (4 de 14)

```
scripts/etl/
├── __init__.py
├── db.py                          # helper conn psycopg2 + insert_many
├── mapping/
│   ├── __init__.py
│   └── fundos.py                  # 78 fundos → 2 predios + externos
├── carga_01_holdings.py           ✅
├── carga_02_predios.py            ✅
├── carga_03_animales.py           ✅
├── carga_04_pesajes.py            ✅
└── orchestrator.py                ✅ orquesta + TRUNCATE + JSON output
```

## 4. Specs de los 10 scripts restantes

Patrón común para todos:

```python
# carga_NN_<tabla>.py
import logging, re
from pathlib import Path
import pandas as pd
from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "<path csv canónico>"

def normalizar_diio(v): ...
def parse_fecha_iso(v): ...

def run() -> dict:
    df = pd.read_csv(SOURCE)
    if "Fecha <X>" in df.columns:
        df["Fecha <X>"] = df["Fecha <X>"].astype(str).str.strip('"')
    # Filtros: diio_invalido, fecha_invalida, fecha_futura, predio_externo, huerfano
    # Insert bulk con/sin ON CONFLICT
```

### partos
- Source: `docs/export_agroapp/extract/Partos_Historial_18-04-2026_raw.csv`
- Cols: Diio, Fundo, Fecha parto, Tipo parto, Subtipo parto, Sexo, Total partos
- FK: `animal_id` lookup; `tipo_parto_id` lookup en catálogo `tipo_parto`
- Reglas: Diio=1 descartar; Fecha futura descartar; huérfano descartar; Sexo cría → enum

### inseminaciones
- Source: `Inseminaciones_Historial_18-04-2026_raw.csv` (4.900 filas)
- Cols: Diio, Fundo, Fecha inseminación, Toro, Inseminador, Estado leche, Repetido
- FK: `animal_id`; `inseminador_id` lookup tabla inseminadores

### tratamientos
- Source: `Tratamientos_Historial_18-04-2026_1_raw.csv` (74.777 filas)
- Cols: Diio, Diagnóstico, Medicamento-Reg. SAG, Vía, Resguardo leche, Resguardo carne, Fecha tratamiento
- Parser texto a int días: `r"(\d+)\s*[Dd]ías?"`
- Reglas: huérfano descartar (con count agregado en alertas)

### bajas
- Source: `Bajas_Historial_18-04-2026_raw.csv` (1.431 filas)
- Cols: Diio, Fundo origen, Fecha baja, Motivo, Detalle, Tipo ganado
- FK: `animal_id`. Si huérfano, NO se carga (no podemos dar de baja a algo que no existe)
- Side effect: UPDATE animales SET estado='baja' para los DIIO con baja

### ventas
- Source: `Ventas_Historial_18-04-2026_1_raw.csv` (846 filas)
- 91% son ventas por LOTE sin DIIO individual → `animal_id` NULL, `destino` string
- Cols: Fundo, Fecha venta, Peso (kg), Tipo ganado, Animales (count), Destino
- Para destino externo: guardar string libre

### traslados
- Source: `Traslados_Historial_18-04-2026_raw.csv` (198 filas)
- Cols: Origen, Destino, Fecha traslado, Animales, Tipo ganado
- Si origen O destino externo → no es traslado interno, descartar o guardar como salida

### inventarios
- Source: `Inventarios_Historial_18-04-2026_raw.csv` (27 filas)
- Cols: Fundo, Encontrados, Faltantes, T.G. Faltantes (texto estructurado), Fecha creado
- Parser de `T.G. Faltantes`: regex `r"(\w+):\s*(\d+)"` → dict por tipo_ganado

### ecografias
- Source: `agroapp-data/Ecografias_*.xlsx` (existe, no en dossier inicial — ver listado)
- ~2.732 filas estimadas

### areteos
- Source: `agroapp-data/Areteos_*.xlsx` (existe)
- ~1.384 filas

### precios_feria
- Source: `docs/data/precios-feria-odepa-afech-2026-04-21.csv` (14.196 filas, 5.7MB)
- Cols: fecha, feria, categoria, precio_kg_clp, fuente
- Sin FK al holding — autocontenida. Carga directa.

### kpi_diario
- NO carga desde archivo. Calcula con SQL post-carga:
  ```sql
  INSERT INTO kpi_diario (fecha, predio_id, total_animales, vacas_prenadas, ...)
  SELECT CURRENT_DATE, predio_id, COUNT(*), ... FROM animales WHERE estado='activo' GROUP BY predio_id;
  ```

## 5. Plan de rollback

Implementado en `orchestrator.truncate_all()`. Orden inverso de FK + CASCADE:

```
kpi_diario → alertas → areteos → ecografias → inseminaciones →
tratamientos → partos → ventas → traslados → inventarios →
bajas → pesajes → animales → predios → holdings
```

Comando manual:
```bash
PYTHONPATH=scripts .venv-vanna/bin/python -c "
from etl.orchestrator import truncate_all
import logging
logging.basicConfig(level=logging.INFO)
truncate_all(logging.getLogger('rollback'))
"
```

## 6. Checksums esperados (post-carga full)

| Tabla | COUNT esperado | Notas |
|---|---:|---|
| holdings | 1 | Agrícola Los Lagos |
| predios | 2 | Agrícola, Feedlot |
| animales | 2.636 | san-pedro 1.402 + recria-feedlot 1.234 |
| pesajes | ~6.300 | filtrado huérfanos, solo de los 2.636 animales activos |
| partos | ~estimado 1k-2k | filtrado huérfanos |
| inseminaciones | ~estimado <1k | filtrado huérfanos |
| tratamientos | ~estimado <5k | filtrado huérfanos |
| bajas | 0 | (los 1.431 son DIIOs ya retirados, no están en `animales`) |
| ventas | ~846 | mayoría por lote (animal_id NULL) |
| traslados | ~150 | filtrado externos |
| inventarios | 27 | sin filtro |
| precios_feria | 14.196 | autocontenida |
| ecografias | TBD | depende del archivo |
| areteos | TBD | depende del archivo |
| kpi_diario | 2 | 1 por predio |

## 7. Observaciones del run inicial

🟡 **167.000 pesajes huérfanos** (97% del total)
Estos son pesajes históricos de animales que ya NO están en el holding (vendidos, muertos, dados de baja años atrás). El plan los descarta correctamente. Si en el futuro se quiere preservar trazabilidad de animales históricos, hay que crear `animales` con `estado='baja'` ANTES de cargar pesajes.

🟡 **209 DIIO inválidos** (DIIO=1 o no numérico)
Centinelas/basura como esperaba el manual smartcow. Filtrados.

🟡 **Outliers de calidad**
- 7 pesos < 10 kg (probable error decimal, marcados con `outlier_peso=true`)
- 22 edades > 300 meses (>25 años, imposible — probable error fecha_nacimiento)

## 8. Comandos para uso

```bash
# Full carga desde 0 (TRUNCATE + load)
PYTHONPATH=scripts .venv-vanna/bin/python -m etl.orchestrator

# Re-run sin truncate (incremental, requiere UNIQUE constraints)
PYTHONPATH=scripts .venv-vanna/bin/python -m etl.orchestrator --no-truncate

# Dry run (solo log)
PYTHONPATH=scripts .venv-vanna/bin/python -m etl.orchestrator --dry-run

# Tabla individual
PYTHONPATH=scripts .venv-vanna/bin/python -m etl.carga_03_animales
```

## 9. Próximos pasos

1. ✅ AUT-388 entrega los 4 scripts críticos + plan completo de los 10 restantes
2. → AUT-389 (a crear) implementa carga_05 a carga_15
3. Después de carga full, correr Vanna eval contra BD para validar consultas NL→SQL
4. Generar `kpi_diario` con cron diario
