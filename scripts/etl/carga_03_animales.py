#!/usr/bin/env python3
"""carga_03_animales.py — Carga los animales activos del holding desde xlsx canónicos.

Fuentes canónicas (D1 aprobado por Cesar):
  - agroapp-data/Ganado_Actual_san-pedro.xlsx   (1.402 → Agrícola crianza)
  - agroapp-data/recria-feedlot.xlsx            (1.464 → Feedlot recria/engorda)

Total esperado: 2.866 (coincide con BD actual antes de truncate).

Mapeo:
  Tipo ganado     → tipo_ganado_id (FK catálogo) + sexo enum + etapa string
  Diio            → diio (string normalizado)
  Fundo           → predio_id vía mapping/fundos.py
  Estado          → 'activo' (todos vivos)

Idempotente vía orchestrator: TRUNCATE + carga limpia.
Dedup en memoria por (predio_id, diio) antes del INSERT.
"""
import logging
import re
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many
from etl.mapping.fundos import map_fundo_a_predio

REPO = Path("/Users/autonomos_dev/Projects/smartcow")

# Fuentes canónicas (D1)
SOURCES = [
    {
        "path": "agroapp-data/Ganado_Actual_san-pedro.xlsx",
        "predio_default": 1,        # Agrícola
        "etapa_default": "crianza",
    },
    {
        "path": "agroapp-data/recria-feedlot.xlsx",
        "predio_default": 2,        # Feedlot
        "etapa_default": "recria",  # mayoría es recria; engorda se infiere por tipo
    },
]

# tipo_ganado del catálogo:  Vaca, Novillo, Toro, Ternero, Vaquilla, Ternera
# Mapeo nombre fuente → (catalogo_id, sexo_M_o_H, etapa)
TIPO_GANADO_MAP: dict[str, tuple[int, str, str]] = {
    "Vaca":       (1, "H", "crianza"),
    "Novillo":    (2, "M", "engorda"),
    "Toro":       (3, "M", "engorda"),
    "Ternero":    (4, "M", "crianza"),
    "Vaquilla":   (5, "H", "crianza"),
    "Ternera":    (6, "H", "crianza"),
}


def normalizar_diio(v) -> str | None:
    if pd.isna(v):
        return None
    s = re.sub(r"\D", "", str(v).strip())  # quitar todo lo que no sea dígito
    if not s or s == "1":
        return None
    return s


def parse_fecha(v) -> str | None:
    if pd.isna(v):
        return None
    try:
        return pd.to_datetime(v, errors="coerce").strftime("%Y-%m-%d")
    except Exception:
        return None


def run() -> dict:
    log = logging.getLogger("carga_03_animales")

    # 1) Leer fuentes
    todos: list[dict] = []
    for src in SOURCES:
        p = REPO / src["path"]
        if not p.exists():
            log.warning("fuente no existe: %s", p)
            continue
        df = pd.read_excel(p)
        log.info("leído %s: %d filas, %d cols", p.name, len(df), len(df.columns))
        for _, row in df.iterrows():
            diio = normalizar_diio(row.get("Diio"))
            if not diio:
                continue
            tipo_raw = str(row.get("Tipo ganado", "")).strip()
            mapping = TIPO_GANADO_MAP.get(tipo_raw)
            if not mapping:
                continue  # tipo desconocido → descartar (regla calidad)
            tipo_id, sexo, etapa = mapping
            # Override etapa si fuente lo indica (por ej. recria-feedlot.xlsx)
            etapa = src["etapa_default"] if etapa == "crianza" and src["predio_default"] == 2 else etapa
            # predio_id: lookup por Fundo si existe, sino default de la fuente
            fundo_raw = row.get("Fundo")
            predio_id = map_fundo_a_predio(fundo_raw) or src["predio_default"]
            todos.append({
                "predio_id": predio_id,
                "diio": diio,
                "tipo_ganado_id": tipo_id,
                "sexo": sexo,
                "etapa": etapa,
                "fecha_nacimiento": parse_fecha(row.get("Fecha nacimiento")),
                "estado": "activo",
                "raw_source_file": src["path"],
                "raw_source_row": int(_),
                "imported_at": pd.Timestamp.now().isoformat(),
            })

    # 2) Dedup por (predio_id, diio): si un animal aparece en 2 fuentes, ganar el último (más reciente)
    seen: dict[tuple[int, str], dict] = {}
    for a in todos:
        seen[(a["predio_id"], a["diio"])] = a
    animales_finales = list(seen.values())
    log.info("animales únicos a insertar: %d (de %d filas leídas)", len(animales_finales), len(todos))

    # 3) Insert bulk
    columns = [
        "predio_id", "diio", "tipo_ganado_id", "sexo", "etapa",
        "fecha_nacimiento", "estado", "raw_source_file", "raw_source_row",
        "imported_at",
    ]
    rows = [tuple(a[c] for c in columns) for a in animales_finales]
    with connect() as conn:
        with conn.cursor() as cur:
            inserted = insert_many(cur, "animales", columns, rows)
            conn.commit()
            total = count(cur, "animales")
    log.info("animales: insertados=%d total=%d", inserted, total)
    return {"tabla": "animales", "leidos": len(todos), "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
