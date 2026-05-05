#!/usr/bin/env python3
"""carga_06_inseminaciones.py — Carga histórico de inseminaciones.

Source: Inseminaciones_Historial_18-04-2026_raw.csv (4.900 filas)

Schema destino:
  predio_id, animal_id, fecha, resultado (enum default 'pendiente'),
  semen_id (NULL), inseminador_id (NULL), observaciones
"""
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Inseminaciones_Historial_18-04-2026_raw.csv"


def run() -> dict:
    log = logging.getLogger("carga_06_inseminaciones")
    if not SOURCE.exists():
        return {"tabla": "inseminaciones", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha inseminación")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "diio_invalido": 0, "fecha_invalida": 0,
             "predio_externo": 0, "huerfanos": 0, "validos": 0}

    with connect() as conn:
        with conn.cursor() as cur:
            diio_to_id = get_animales_diio_to_id(cur)
            insertables: list[tuple] = []
            for _, row in df.iterrows():
                diio = normalizar_diio(row.get("Diio"))
                if not diio:
                    stats["diio_invalido"] += 1
                    continue
                fecha = parse_fecha_iso(row.get("Fecha inseminación"))
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
                obs_parts = []
                for c in ("Toro", "Inseminador", "Repetido"):
                    v = row.get(c)
                    if v and not pd.isna(v):
                        obs_parts.append(f"{c}={v}")
                obs = "; ".join(obs_parts)[:500] or None
                insertables.append((predio_id, animal_id, fecha, "pendiente", obs))

            stats["validos"] = len(insertables)
            log.info("filtrado → válidos=%d (huerf=%d ext=%d)",
                     stats["validos"], stats["huerfanos"], stats["predio_externo"])
            inserted = insert_many(
                cur, "inseminaciones",
                ["predio_id", "animal_id", "fecha", "resultado", "observaciones"],
                insertables,
            )
            conn.commit()
            total = count(cur, "inseminaciones")
    log.info("inseminaciones: insertados=%d total=%d", inserted, total)
    return {"tabla": "inseminaciones", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
