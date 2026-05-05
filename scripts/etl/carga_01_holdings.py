#!/usr/bin/env python3
"""carga_01_holdings.py — Inserta el único holding del modelo simplificado.

Idempotente: ON CONFLICT (id) DO NOTHING.
"""
import logging

from etl.db import connect, count

HOLDING_ID = 1
HOLDING_NOMBRE = "Agrícola Los Lagos"
ORG_ID = 1  # JP Ferrada


def run() -> dict:
    log = logging.getLogger("carga_01_holdings")
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO holdings (id, org_id, nombre)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
                """,
                (HOLDING_ID, ORG_ID, HOLDING_NOMBRE),
            )
            inserted = cur.rowcount
            conn.commit()
            total = count(cur, "holdings")
    log.info("holdings: insertados=%d total=%d", inserted, total)
    return {"tabla": "holdings", "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
