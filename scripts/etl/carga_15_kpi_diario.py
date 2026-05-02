#!/usr/bin/env python3
"""carga_15_kpi_diario.py — Placeholder.

La tabla kpi_diario NO existe en la BD viva. Requiere migration
(scope fuera de AUT-389).

Cuando exista, este script calculará 1 fila por (fecha, predio_id) con:
  · total_animales
  · vacas_prenadas
  · vacas_vacias
  · animales_listos_venta
  · peso_promedio_engorda
  · pesajes_dia
  · outliers_detectados
"""
import logging


def run() -> dict:
    log = logging.getLogger("carga_15_kpi_diario")
    log.warning("kpi_diario: tabla no existe en BD — requiere migration")
    return {"tabla": "kpi_diario", "skipped": True, "razon": "tabla no existe"}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
