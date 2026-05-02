#!/usr/bin/env python3
"""carga_09_ventas.py — Carga ventas históricas (846 filas).

Schema actualizado (AUT-390):
  · animal_id NULLABLE
  · animales_lote jsonb {tipo_ganado: count}

Estrategia:
  · DIIO presente → animal_id real, animales_lote NULL
  · Sin DIIO → animal_id NULL, animales_lote parseado de "Tipo ganado"
"""
import json
import logging
import re
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Ventas_Historial_18-04-2026_1_raw.csv"


def parse_lote_desglose(tipo_ganado: str | None) -> dict[str, int] | None:
    """Parsea 'Novillo: 10, Vaquilla: 5' o 'Novillo: 10\\nVaquilla: 5' → dict."""
    if not tipo_ganado or pd.isna(tipo_ganado):
        return None
    s = str(tipo_ganado).strip()
    if not s:
        return None
    out: dict[str, int] = {}
    for line in re.split(r"[\n,;]+", s):
        m = re.match(r"\s*([A-Za-záéíóúñÁÉÍÓÚÑ]+)\s*:\s*(\d+)", line)
        if m:
            out[m.group(1).strip()] = int(m.group(2))
    return out or None


def run() -> dict:
    log = logging.getLogger("carga_09_ventas")
    if not SOURCE.exists():
        return {"tabla": "ventas", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha venta")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "fecha_invalida": 0, "predio_externo": 0,
             "individual": 0, "lote": 0, "validos": 0}

    with connect() as conn:
        with conn.cursor() as cur:
            diio_to_id = get_animales_diio_to_id(cur)
            insertables: list[tuple] = []
            for _, row in df.iterrows():
                fecha = parse_fecha_iso(row.get("Fecha venta"))
                if not fecha:
                    stats["fecha_invalida"] += 1
                    continue
                predio_id = map_fundo_a_predio(row.get("Fundo"))
                if predio_id is None:
                    stats["predio_externo"] += 1
                    continue

                # Individual: si tiene DIIO real
                diio = normalizar_diio(row.get("Diio") if "Diio" in df.columns else None)
                animal_id = diio_to_id.get(diio) if diio else None
                animales_lote = None

                if animal_id is None:
                    # Es lote: parseamos animales_lote de Tipo ganado
                    animales_lote = parse_lote_desglose(row.get("Tipo ganado"))
                    stats["lote"] += 1
                else:
                    stats["individual"] += 1

                try:
                    peso = float(row.get("Peso (kg)")) if not pd.isna(row.get("Peso (kg)")) else None
                except (TypeError, ValueError):
                    peso = None
                try:
                    n_animales = int(row.get("Animales")) if not pd.isna(row.get("Animales")) else None
                except (TypeError, ValueError):
                    n_animales = None
                destino = str(row.get("Destino", "") or "")[:500] or None

                insertables.append((
                    predio_id, animal_id, fecha, peso, n_animales, destino,
                    json.dumps(animales_lote) if animales_lote else None,
                ))
            stats["validos"] = len(insertables)
            log.info("filtrado → válidos=%d (individual=%d lote=%d)",
                     stats["validos"], stats["individual"], stats["lote"])
            inserted = insert_many(
                cur, "ventas",
                ["predio_id", "animal_id", "fecha", "peso_kg",
                 "n_animales_rampa", "destino", "animales_lote"],
                insertables,
            )
            conn.commit()
            total = count(cur, "ventas")
    log.info("ventas: insertados=%d total=%d", inserted, total)
    return {"tabla": "ventas", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
