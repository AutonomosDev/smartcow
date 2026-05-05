#!/usr/bin/env python3
"""carga_08_bajas.py — Carga histórico de bajas + actualiza estado animales.

Source: Bajas_Historial_18-04-2026_raw.csv (1.431 filas)

Side effects:
  1. Pobla catálogo baja_motivo con motivos únicos del CSV
  2. UPDATE animales SET estado='baja' WHERE id IN (...)
"""
import logging
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio
from etl._common import normalizar_diio, parse_fecha_iso, clean_date_column

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Bajas_Historial_18-04-2026_raw.csv"


def poblar_motivos(cur, motivos: set[str]) -> dict[str, int]:
    """Inserta motivos únicos a baja_motivo y devuelve lookup nombre→id."""
    for m in motivos:
        cur.execute("INSERT INTO baja_motivo (nombre) VALUES (%s) ON CONFLICT (nombre) DO NOTHING;", (m,))
    cur.execute("SELECT id, nombre FROM baja_motivo;")
    return {nombre: mid for mid, nombre in cur.fetchall()}


def run() -> dict:
    log = logging.getLogger("carga_08_bajas")
    if not SOURCE.exists():
        return {"tabla": "bajas", "error": "fuente no existe"}
    df = pd.read_csv(SOURCE, low_memory=False)
    clean_date_column(df, "Fecha baja")
    log.info("leído: %d filas", len(df))

    stats = {"leidos": len(df), "diio_invalido": 0, "fecha_invalida": 0,
             "predio_externo": 0, "huerfanos": 0, "validos": 0}

    motivos_unicos = {str(m).strip() for m in df["Motivo"].dropna().unique() if str(m).strip()}

    with connect() as conn:
        with conn.cursor() as cur:
            motivo_to_id = poblar_motivos(cur, motivos_unicos)
            log.info("baja_motivo poblada: %d motivos", len(motivo_to_id))
            diio_to_id = get_animales_diio_to_id(cur)
            insertables: list[tuple] = []
            animales_a_marcar: set[int] = set()
            for _, row in df.iterrows():
                diio = normalizar_diio(row.get("Diio"))
                if not diio:
                    stats["diio_invalido"] += 1
                    continue
                fecha = parse_fecha_iso(row.get("Fecha baja"))
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
                motivo = str(row.get("Motivo", "") or "").strip()
                motivo_id = motivo_to_id.get(motivo)
                if motivo_id is None:
                    continue
                obs = str(row.get("Detalle", "") or "")[:500] or None
                insertables.append((predio_id, animal_id, fecha, motivo_id, obs))
                animales_a_marcar.add(animal_id)

            stats["validos"] = len(insertables)
            log.info("filtrado → válidos=%d (huerfanos descartados=%d)",
                     stats["validos"], stats["huerfanos"])
            inserted = insert_many(
                cur, "bajas",
                ["predio_id", "animal_id", "fecha", "motivo_id", "observaciones"],
                insertables,
            )

            # Side effect: marcar animales como 'baja'
            if animales_a_marcar:
                cur.execute(
                    "UPDATE animales SET estado='baja' WHERE id = ANY(%s);",
                    (list(animales_a_marcar),),
                )
                marcados = cur.rowcount
            else:
                marcados = 0
            log.info("animales marcados como baja: %d", marcados)

            conn.commit()
            total = count(cur, "bajas")
    log.info("bajas: insertados=%d total=%d animales_baja=%d", inserted, total, marcados)
    return {"tabla": "bajas", **stats, "insertados": inserted, "total": total,
            "animales_marcados_baja": marcados}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
