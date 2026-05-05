#!/usr/bin/env python3
"""carga_07_tratamientos.py — Carga histórico tratamientos (74.777 filas).

Source: Tratamientos_Historial_18-04-2026_1_raw.csv

Schema destino:
  predio_id, animal_id, fecha, diagnostico, observaciones,
  medicamentos (jsonb: [{nombre, via, resguardo_carne_dias, resguardo_leche_dias}])
"""
import json
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, parse_resguardo_dias, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Tratamientos_Historial_18-04-2026_1_raw.csv"


def run() -> dict:
    log = logging.getLogger("carga_07_tratamientos")
    if not SOURCE.exists():
        return {"tabla": "tratamientos", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha tratamiento")
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
                fecha = parse_fecha_iso(row.get("Fecha tratamiento"))
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
                diagnostico = str(row.get("Diagnóstico", "") or "")[:200] or None
                obs = str(row.get("Observaciones", "") or "")[:500] or None
                med = {
                    "nombre": str(row.get("Medicamento-Reg. SAG", "") or "").strip() or None,
                    "via": str(row.get("Vía", "") or "").strip() or None,
                    "resguardo_leche_dias": parse_resguardo_dias(row.get("Resguardo leche")),
                    "resguardo_carne_dias": parse_resguardo_dias(row.get("Resguardo carne")),
                }
                medicamentos_json = json.dumps([med], ensure_ascii=False) if med["nombre"] else None
                insertables.append((predio_id, animal_id, fecha, diagnostico, obs, medicamentos_json))

            stats["validos"] = len(insertables)
            log.info("filtrado → válidos=%d (huerf=%d)", stats["validos"], stats["huerfanos"])
            inserted = insert_many(
                cur, "tratamientos",
                ["predio_id", "animal_id", "fecha", "diagnostico", "observaciones", "medicamentos"],
                insertables,
                page_size=2000,
            )
            conn.commit()
            total = count(cur, "tratamientos")
    log.info("tratamientos: insertados=%d total=%d", inserted, total)
    return {"tabla": "tratamientos", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
