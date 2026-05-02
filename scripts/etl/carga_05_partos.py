#!/usr/bin/env python3
"""carga_05_partos.py — Carga histórico de partos desde csv raw.

Source: docs/export_agroapp/extract/Partos_Historial_18-04-2026_raw.csv (8.121 filas)

Cols destino:
  predio_id, madre_id (FK animales), fecha, resultado (enum: nacido_vivo|muerto|aborto)
  numero_partos, observaciones

Reglas:
  · DIIO=1 descartar
  · fecha futura descartar
  · predio externo descartar
  · huérfano (DIIO no en animales) descartar
"""
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Partos_Historial_18-04-2026_raw.csv"


def map_resultado(row: pd.Series) -> str:
    """Infiere resultado del parto. Enum: vivo|muerto|aborto|gemelar."""
    estado = str(row.get("Estado", "") or "").lower()
    subtipo = str(row.get("Subtipo parto", "") or "").lower()
    if "muerto" in estado or "muerto" in subtipo:
        return "muerto"
    if "aborto" in estado or "aborto" in subtipo:
        return "aborto"
    if "gemel" in subtipo:
        return "gemelar"
    return "vivo"


def run() -> dict:
    log = logging.getLogger("carga_05_partos")
    if not SOURCE.exists():
        log.error("fuente no existe: %s", SOURCE)
        return {"tabla": "partos", "error": "fuente no existe"}

    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha parto")
    log.info("leído: %d filas, %d cols", len(df), len(df.columns))

    stats = {
        "leidos": len(df),
        "diio_invalido": 0,
        "fecha_invalida": 0,
        "predio_externo": 0,
        "huerfanos": 0,
        "validos": 0,
    }

    with connect() as conn:
        with conn.cursor() as cur:
            diio_to_id = get_animales_diio_to_id(cur)

            insertables: list[tuple] = []
            for idx, row in df.iterrows():
                diio = normalizar_diio(row.get("Diio"))
                if not diio:
                    stats["diio_invalido"] += 1
                    continue
                fecha = parse_fecha_iso(row.get("Fecha parto"))
                if not fecha:
                    stats["fecha_invalida"] += 1
                    continue
                predio_id = map_fundo_a_predio(row.get("Fundo"))
                if predio_id is None:
                    stats["predio_externo"] += 1
                    continue
                madre_id = diio_to_id.get(diio)
                if madre_id is None:
                    stats["huerfanos"] += 1
                    continue
                resultado = map_resultado(row)
                numero = row.get("Total partos")
                try:
                    numero = int(numero) if numero and not pd.isna(numero) else None
                except (TypeError, ValueError):
                    numero = None
                obs = str(row.get("Observaciones", "") or "")[:500] or None

                insertables.append((predio_id, madre_id, fecha, resultado, numero, obs))

            stats["validos"] = len(insertables)
            log.info(
                "filtrado: invalido=%d fecha_inv=%d ext=%d huerf=%d → válidos=%d",
                stats["diio_invalido"], stats["fecha_invalida"],
                stats["predio_externo"], stats["huerfanos"], stats["validos"],
            )

            inserted = insert_many(
                cur, "partos",
                ["predio_id", "madre_id", "fecha", "resultado", "numero_partos", "observaciones"],
                insertables,
            )
            conn.commit()
            total = count(cur, "partos")

    log.info("partos: insertados=%d total=%d", inserted, total)
    return {"tabla": "partos", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
