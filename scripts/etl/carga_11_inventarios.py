#!/usr/bin/env python3
"""carga_11_inventarios.py — Carga inventarios físicos (27 filas).

Source: Inventarios_Historial_18-04-2026_raw.csv

T.G. Encontrados / Faltantes vienen como texto estructurado:
  "Vaca: 100\\nNovillo: 50" → jsonb {Vaca: 100, Novillo: 50}
"""
import json
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import parse_fecha_iso, parse_tg_estructurado, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Inventarios_Historial_18-04-2026_raw.csv"


def run() -> dict:
    log = logging.getLogger("carga_11_inventarios")
    if not SOURCE.exists():
        return {"tabla": "inventarios", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha creado")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "fecha_invalida": 0, "predio_externo": 0, "validos": 0}
    insertables: list[tuple] = []
    for _, row in df.iterrows():
        fecha = parse_fecha_iso(row.get("Fecha creado"))
        if not fecha:
            stats["fecha_invalida"] += 1
            continue
        predio_id = map_fundo_a_predio(row.get("Fundo"))
        if predio_id is None:
            stats["predio_externo"] += 1
            continue
        try:
            n_enc = int(row.get("Encontrados")) if not pd.isna(row.get("Encontrados")) else None
        except (TypeError, ValueError):
            n_enc = None
        try:
            n_falt = int(row.get("Faltantes")) if not pd.isna(row.get("Faltantes")) else None
        except (TypeError, ValueError):
            n_falt = None
        tg_enc = parse_tg_estructurado(row.get("T.G. Encontrados"))
        tg_falt = parse_tg_estructurado(row.get("T.G. Faltantes"))
        estado = str(row.get("Estado", "") or "")[:50] or None
        id_agroapp = str(row.get("ID", "") or "") or None

        insertables.append((
            id_agroapp, predio_id, fecha,
            n_enc, json.dumps(tg_enc) if tg_enc else None,
            n_falt, json.dumps(tg_falt) if tg_falt else None,
            estado,
        ))
    stats["validos"] = len(insertables)

    with connect() as conn:
        with conn.cursor() as cur:
            inserted = insert_many(
                cur, "inventarios",
                ["id_agroapp", "predio_id", "fecha",
                 "n_encontrados", "tg_encontrados",
                 "n_faltantes", "tg_faltantes", "estado"],
                insertables,
            )
            conn.commit()
            total = count(cur, "inventarios")
    log.info("inventarios: insertados=%d total=%d", inserted, total)
    return {"tabla": "inventarios", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
