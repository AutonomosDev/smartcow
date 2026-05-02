#!/usr/bin/env python3
"""carga_02_predios.py — Inserta los 2 predios del modelo simplificado.

Decisión arquitectónica AUT-388 (Cesar 2026-04-30):
  - id=1 Agrícola → etapa crianza
  - id=2 Feedlot  → etapas recria + engorda

Los 78 fundos legacy de los archivos NO se cargan como predios:
se mapean a estos 2 vía scripts/etl/mapping/fundos.py.

Idempotente: ON CONFLICT (id) DO NOTHING.
"""
import logging

from etl.db import connect, count

ORG_ID = 1
HOLDING_ID = 1

PREDIOS = [
    (1, ORG_ID, "Agrícola", "X Región", HOLDING_ID, "propio"),
    (2, ORG_ID, "Feedlot",  "X Región", HOLDING_ID, "propio"),
]


def run() -> dict:
    log = logging.getLogger("carga_02_predios")
    inserted = 0
    with connect() as conn:
        with conn.cursor() as cur:
            for row in PREDIOS:
                cur.execute(
                    """
                    INSERT INTO predios (id, org_id, nombre, region, holding_id, tipo_tenencia)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO NOTHING;
                    """,
                    row,
                )
                inserted += cur.rowcount
            # Asegurar que el sequence avanza (sino próximo serial choca)
            cur.execute("SELECT setval('predios_id_seq', GREATEST(MAX(id), 1)) FROM predios;")
            conn.commit()
            total = count(cur, "predios")
    log.info("predios: insertados=%d total=%d", inserted, total)
    return {"tabla": "predios", "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
