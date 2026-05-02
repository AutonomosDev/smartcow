#!/usr/bin/env python3
"""carga_09_ventas.py — Carga ventas históricas.

Source: Ventas_Historial_18-04-2026_1_raw.csv (846 filas)

Limitación schema: ventas.animal_id NOT NULL pero 91% de las ventas
son por LOTE sin DIIO individual. Estrategia:
  · Si hay DIIO válido: cargar normal
  · Si no hay DIIO: descartar (documentar, requiere rediseño schema)

Por eso este script SOLO carga ventas con DIIO real (~74 filas).
"""
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Ventas_Historial_18-04-2026_1_raw.csv"


def run() -> dict:
    log = logging.getLogger("carga_09_ventas")
    if not SOURCE.exists():
        return {"tabla": "ventas", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha venta")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "sin_diio": 0, "fecha_invalida": 0,
             "predio_externo": 0, "huerfanos": 0, "validos": 0}

    with connect() as conn:
        with conn.cursor() as cur:
            diio_to_id = get_animales_diio_to_id(cur)
            insertables: list[tuple] = []
            for _, row in df.iterrows():
                diio = normalizar_diio(row.get("Diio") if "Diio" in df.columns else None)
                if not diio:
                    stats["sin_diio"] += 1
                    continue
                fecha = parse_fecha_iso(row.get("Fecha venta"))
                if not fecha:
                    stats["fecha_invalida"] += 1
                    continue
                predio_id = map_fundo_a_predio(row.get("Fundo"))
                if predio_id is None:
                    stats["predio_externo"] += 1
                    continue
                animal_id = diio_to_id.get(diio)
                if animal_id is None:
                    stats["huerfanos"] += 1
                    continue
                try:
                    peso = float(row.get("Peso (kg)")) if not pd.isna(row.get("Peso (kg)")) else None
                except (TypeError, ValueError):
                    peso = None
                destino = str(row.get("Destino", "") or "")[:200] or None
                try:
                    n_animales = int(row.get("Animales")) if not pd.isna(row.get("Animales")) else 1
                except (TypeError, ValueError):
                    n_animales = 1

                insertables.append((predio_id, animal_id, fecha, peso, n_animales, destino))

            stats["validos"] = len(insertables)
            log.info("filtrado → válidos=%d sin_diio=%d", stats["validos"], stats["sin_diio"])
            inserted = insert_many(
                cur, "ventas",
                ["predio_id", "animal_id", "fecha", "peso_kg", "n_animales_rampa", "destino"],
                insertables,
            )
            conn.commit()
            total = count(cur, "ventas")
    log.info("ventas: insertados=%d total=%d", inserted, total)
    return {"tabla": "ventas", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
