#!/usr/bin/env python3
"""carga_12_precios_feria.py — Carga precios feria ODEPA/AFECH.

Source: docs/data/precios-feria-odepa-afech-2026-04-21.csv (14.196 filas)

Tabla autocontenida (sin FK al holding).
"""
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/data/precios-feria-odepa-afech-2026-04-21.csv"


def run() -> dict:
    log = logging.getLogger("carga_12_precios_feria")
    if not SOURCE.exists():
        return {"tabla": "precios_feria", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "fecha_invalida": 0, "validos": 0}
    insertables: list[tuple] = []
    for _, row in df.iterrows():
        fecha = pd.to_datetime(row.get("fecha"), errors="coerce")
        if pd.isna(fecha):
            stats["fecha_invalida"] += 1
            continue

        def _f(v):
            try:
                return float(v) if v is not None and not pd.isna(v) else None
            except (TypeError, ValueError):
                return None

        peso_rango = row.get("peso_rango")
        peso_rango = None if pd.isna(peso_rango) else str(peso_rango).strip() or None
        insertables.append((
            str(row.get("fuente", "") or "ODEPA"),
            str(row.get("feria", "") or ""),
            str(row.get("categoria", "") or ""),
            peso_rango,
            fecha.strftime("%Y-%m-%d"),
            _f(row.get("precio_kg_clp")),
            _f(row.get("precio_cabeza_clp")),
            "CLP",
            str(row.get("url_fuente", "") or "") or None,
        ))
    # Dedup en memoria por (fuente, feria, categoria, peso_rango, fecha) — el unique index
    # de la BD es un expression-index sobre COALESCE(peso_rango, ''), no usable con ON CONFLICT
    seen = set()
    deduped: list[tuple] = []
    for row in insertables:
        key = (row[0], row[1], row[2], row[3] or "", row[4])
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
    stats["validos"] = len(deduped)
    stats["dups_eliminados"] = len(insertables) - len(deduped)

    with connect() as conn:
        with conn.cursor() as cur:
            inserted = insert_many(
                cur, "precios_feria",
                ["fuente", "feria", "categoria", "peso_rango", "fecha",
                 "precio_kg_clp", "precio_cabeza_clp", "moneda", "url_fuente"],
                deduped,
                page_size=2000,
            )
            conn.commit()
            total = count(cur, "precios_feria")
    log.info("precios_feria: insertados=%d total=%d", inserted, total)
    return {"tabla": "precios_feria", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
