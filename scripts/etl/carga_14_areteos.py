#!/usr/bin/env python3
"""carga_14_areteos.py — Placeholder.

NO hay archivo fuente disponible para areteos. La tabla queda vacía
hasta que el cliente entregue el dump.
"""
import logging


def run() -> dict:
    log = logging.getLogger("carga_14_areteos")
    log.warning("areteos: fuente no disponible — skip")
    return {"tabla": "areteos", "skipped": True, "razon": "fuente no disponible"}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
