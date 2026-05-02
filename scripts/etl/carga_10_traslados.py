#!/usr/bin/env python3
"""carga_10_traslados.py — Carga traslados (movimientos de lote o individual).

Source: Traslados_Historial_18-04-2026_raw.csv (198 filas)

Schema permite animal_id NULL → carga AGREGADA por lote correctamente.
"""
import json
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Traslados_Historial_18-04-2026_raw.csv"


def run() -> dict:
    log = logging.getLogger("carga_10_traslados")
    if not SOURCE.exists():
        return {"tabla": "traslados", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha traslado")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "fecha_invalida": 0, "validos": 0}
    insertables: list[tuple] = []
    for _, row in df.iterrows():
        fecha = parse_fecha_iso(row.get("Fecha traslado"))
        if not fecha:
            stats["fecha_invalida"] += 1
            continue
        origen_nombre = str(row.get("Origen", "") or "").strip() or None
        destino_nombre = str(row.get("Destino", "") or "").strip() or None
        predio_origen_id = map_fundo_a_predio(origen_nombre)
        predio_destino_id = map_fundo_a_predio(destino_nombre)
        try:
            n_animales = int(row.get("Animales")) if not pd.isna(row.get("Animales")) else None
        except (TypeError, ValueError):
            n_animales = None
        tipo_ganado_str = str(row.get("Tipo ganado", "") or "")
        # Parsea tipo_ganado_desglose como jsonb si viene estructurado
        tg_desglose = None
        if ":" in tipo_ganado_str and tipo_ganado_str:
            tg_desglose = json.dumps({"raw": tipo_ganado_str})
        n_guia = str(row.get("N° Guía", "") or "")[:50] or None
        observacion = str(row.get("Observaciones", "") or "")[:500] or None
        estado = str(row.get("Estado", "") or "")[:50] or None
        id_agroapp = str(row.get("ID", "") or "") or None

        insertables.append((
            None, fecha, id_agroapp, predio_origen_id, predio_destino_id,
            origen_nombre, destino_nombre, observacion, n_animales,
            tg_desglose, n_guia, estado,
        ))
    stats["validos"] = len(insertables)
    log.info("filtrado → válidos=%d", stats["validos"])

    with connect() as conn:
        with conn.cursor() as cur:
            inserted = insert_many(
                cur, "traslados",
                ["animal_id", "fecha", "id_agroapp",
                 "predio_origen_id", "predio_destino_id",
                 "fundo_origen_nombre", "fundo_destino_nombre",
                 "observacion", "n_animales",
                 "tipo_ganado_desglose", "n_guia", "estado"],
                insertables,
            )
            conn.commit()
            total = count(cur, "traslados")
    log.info("traslados: insertados=%d total=%d", inserted, total)
    return {"tabla": "traslados", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
