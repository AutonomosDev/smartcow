#!/usr/bin/env python3
"""orchestrator.py — Carga BD smartcow_local desde 0.

Orden:
  1. TRUNCATE en orden inverso (CASCADE)
  2. carga_01_holdings
  3. carga_02_predios
  4. carga_03_animales
  5. carga_04_pesajes
  (resto de scripts se incorporan acá cuando se implementen)

Cada script registra stats. Al final genera reporte JSON + markdown.

Uso:
  cd <repo>
  PYTHONPATH=scripts .venv-vanna/bin/python -m etl.orchestrator
  PYTHONPATH=scripts .venv-vanna/bin/python -m etl.orchestrator --no-truncate
"""
import argparse
import json
import logging
import sys
import time
from pathlib import Path

REPO = Path("/Users/autonomos_dev/Projects/smartcow")

# Tablas en orden de carga (= orden de FKs)
TABLAS_CARGA = [
    "holdings",
    "predios",
    "animales",
    "pesajes",
    # (futuro) "partos", "tratamientos", "inseminaciones", etc.
]

# TRUNCATE en orden inverso de FK + CASCADE para tablas dependientes
TABLAS_TRUNCATE_ORDER = [
    "kpi_diario",
    "alertas",
    "areteos",
    "ecografias",
    "inseminaciones",
    "tratamientos",
    "partos",
    "ventas",
    "traslados",
    "inventarios",
    "bajas",
    "pesajes",
    "animales",
    "predios",
    "holdings",
]


def truncate_all(log: logging.Logger) -> None:
    from etl.db import connect, count
    with connect() as conn:
        with conn.cursor() as cur:
            log.info("TRUNCATE en orden inverso…")
            for t in TABLAS_TRUNCATE_ORDER:
                try:
                    cur.execute(f"TRUNCATE TABLE {t} RESTART IDENTITY CASCADE;")
                    log.info("  ✓ truncated %s", t)
                except Exception as e:
                    log.warning("  ⚠ skip %s: %s", t, e)
                    conn.rollback()
                    continue
            conn.commit()
            for t in ["holdings", "predios", "animales", "pesajes"]:
                log.info("  count %s = %d (post-truncate)", t, count(cur, t))


def run_carga(nombre: str, log: logging.Logger) -> dict:
    """Importa y ejecuta carga_NN_<nombre>."""
    module_name = {
        "holdings": "etl.carga_01_holdings",
        "predios": "etl.carga_02_predios",
        "animales": "etl.carga_03_animales",
        "pesajes": "etl.carga_04_pesajes",
    }[nombre]
    log.info("→ %s", module_name)
    t0 = time.time()
    mod = __import__(module_name, fromlist=["run"])
    result = mod.run()
    elapsed = time.time() - t0
    result["elapsed_s"] = round(elapsed, 1)
    log.info("← %s ok (%.1fs)", module_name, elapsed)
    return result


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-truncate", action="store_true", help="omite TRUNCATE inicial")
    parser.add_argument("--dry-run", action="store_true", help="solo log, no escribe BD")
    args = parser.parse_args(argv[1:])

    logging.basicConfig(
        level=logging.INFO,
        format="[%(asctime)s][%(name)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    log = logging.getLogger("orchestrator")

    if args.dry_run:
        log.info("DRY RUN — no se ejecuta nada")
        for t in TABLAS_CARGA:
            log.info("  → carga %s", t)
        return 0

    t0 = time.time()
    if not args.no_truncate:
        truncate_all(log)
    else:
        log.info("--no-truncate: skipping TRUNCATE")

    resultados: list[dict] = []
    for nombre in TABLAS_CARGA:
        try:
            r = run_carga(nombre, log)
            resultados.append(r)
        except Exception as e:
            log.exception("FALLÓ carga_%s: %s", nombre, e)
            resultados.append({"tabla": nombre, "error": str(e)})
            log.error("ABORTANDO orchestrator")
            break

    elapsed_total = time.time() - t0
    out_dir = REPO / "reports" / "etl-runs"
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y-%m-%d-%H%M")
    json_path = out_dir / f"run-{timestamp}.json"
    json_path.write_text(json.dumps({
        "timestamp": timestamp,
        "elapsed_total_s": round(elapsed_total, 1),
        "no_truncate": args.no_truncate,
        "resultados": resultados,
    }, indent=2, default=str), encoding="utf-8")
    log.info("✓ run completado en %.1fs · %s", elapsed_total, json_path.relative_to(REPO))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
