#!/usr/bin/env python3
"""carga_13_ecografias.py — Placeholder.

NO hay archivo fuente disponible para ecografias en agroapp-data ni
docs/export_agroapp. La tabla queda vacía hasta que el cliente entregue
el dump.
"""
import logging


def run() -> dict:
    log = logging.getLogger("carga_13_ecografias")
    log.warning("ecografias: fuente no disponible — skip")
    return {"tabla": "ecografias", "skipped": True, "razon": "fuente no disponible"}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
