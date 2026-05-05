#!/usr/bin/env python3
"""carga_04_pesajes.py — Carga histórico completo de pesajes desde csv raw.

Fuente canónica:
  docs/export_agroapp/extract/Pesajes_Historial_18-04-2026_1_raw.csv (173.518 filas)

Reglas de calidad pre-insert:
  · Diio inválido (=1, vacío, no numérico) → descartar
  · peso_kg < 10 → flag outlier_peso=true (NO descartar)
  · edad_meses > 300 → flag outlier_edad=true (NO descartar)
  · fecha futura → descartar
  · Diio no encontrado en animales → descartar (huérfano), agregado a alerta count

Idempotente vía orchestrator: TRUNCATE + carga limpia.
La tabla pesajes SÍ tiene UNIQUE (animal_id, fecha, peso_kg) por lo que
ON CONFLICT funciona para re-runs incrementales.
"""
import logging
import re
from pathlib import Path

import pandas as pd

from etl.db import connect, count, insert_many, get_animales_diio_to_id
from etl.mapping.fundos import map_fundo_a_predio

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
SOURCE = REPO / "docs/export_agroapp/extract/Pesajes_Historial_18-04-2026_1_raw.csv"


def normalizar_diio(v) -> str | None:
    if pd.isna(v):
        return None
    s = re.sub(r"\D", "", str(v).strip())
    if not s or s == "1":
        return None
    return s


def run() -> dict:
    log = logging.getLogger("carga_04_pesajes")
    if not SOURCE.exists():
        log.error("fuente no existe: %s", SOURCE)
        return {"tabla": "pesajes", "error": "fuente no existe"}

    log.info("leyendo %s ...", SOURCE.name)
    df = pd.read_csv(SOURCE, low_memory=False)
    log.info("leído: %d filas, %d cols", len(df), len(df.columns))
    # Las fechas vienen con comillas DENTRO del string: '"2026-04-18T00:00:00.000Z"'
    if "Fecha creado" in df.columns:
        df["Fecha creado"] = df["Fecha creado"].astype(str).str.strip('"')

    # Stats de filtrado
    stats = {
        "leidos": len(df),
        "diio_invalido": 0,
        "fecha_invalida": 0,
        "fecha_futura": 0,
        "predio_externo": 0,
        "huerfanos": 0,
        "outlier_peso": 0,
        "outlier_edad": 0,
        "validos": 0,
    }

    hoy = pd.Timestamp.now().normalize()
    rows_validas: list[dict] = []

    for idx, row in df.iterrows():
        diio = normalizar_diio(row.get("Diio"))
        if not diio:
            stats["diio_invalido"] += 1
            continue
        # Fecha
        fecha = pd.to_datetime(row.get("Fecha creado"), errors="coerce", utc=True)
        if pd.isna(fecha):
            stats["fecha_invalida"] += 1
            continue
        # comparación naive vs aware: convertir a naive
        fecha_naive = fecha.tz_convert(None) if fecha.tzinfo else fecha
        if fecha_naive > hoy:
            stats["fecha_futura"] += 1
            continue
        # Predio
        predio_id = map_fundo_a_predio(row.get("Fundo"))
        if predio_id is None:
            stats["predio_externo"] += 1
            continue
        # Peso
        try:
            peso = float(row.get("Peso"))
        except (TypeError, ValueError):
            continue
        if peso <= 0:
            continue
        outlier_peso = peso < 10
        if outlier_peso:
            stats["outlier_peso"] += 1
        # Edad
        edad = row.get("Edad (meses)")
        try:
            edad = float(edad) if edad and not pd.isna(edad) else None
        except (TypeError, ValueError):
            edad = None
        outlier_edad = bool(edad and edad > 300)
        if outlier_edad:
            stats["outlier_edad"] += 1

        rows_validas.append({
            "diio": diio,
            "predio_id": predio_id,
            "fecha": fecha.strftime("%Y-%m-%d"),
            "peso_kg": peso,
            "edad_meses": edad,
            "outlier_peso": outlier_peso,
            "outlier_edad": outlier_edad,
            "raw_source_file": str(SOURCE.relative_to(REPO)),
            "raw_source_row": int(idx),
        })

    log.info(
        "filtrado: invalido_diio=%d fecha_inv=%d fecha_fut=%d predio_ext=%d outliers_peso=%d outliers_edad=%d → válidos=%d",
        stats["diio_invalido"], stats["fecha_invalida"], stats["fecha_futura"],
        stats["predio_externo"], stats["outlier_peso"], stats["outlier_edad"],
        len(rows_validas),
    )

    # Lookup diio→animal_id
    with connect() as conn:
        with conn.cursor() as cur:
            diio_to_id = get_animales_diio_to_id(cur)
            log.info("animales en BD: %d (lookup por diio)", len(diio_to_id))

            # Resolver animal_id, contar huérfanos
            insertables: list[tuple] = []
            for r in rows_validas:
                animal_id = diio_to_id.get(r["diio"])
                if animal_id is None:
                    stats["huerfanos"] += 1
                    continue
                insertables.append((
                    r["predio_id"], animal_id, r["peso_kg"], r["fecha"],
                    r["edad_meses"], r["outlier_peso"], r["outlier_edad"],
                    r["raw_source_file"], r["raw_source_row"],
                    pd.Timestamp.now().isoformat(),
                ))
            stats["validos"] = len(insertables)
            log.info("huerfanos (DIIO no en animales): %d", stats["huerfanos"])
            log.info("insertables: %d", len(insertables))

            columns = [
                "predio_id", "animal_id", "peso_kg", "fecha",
                "edad_meses", "outlier_peso", "outlier_edad",
                "raw_source_file", "raw_source_row", "imported_at",
            ]
            inserted = insert_many(
                cur, "pesajes", columns, insertables,
                on_conflict="(animal_id, fecha, peso_kg) DO NOTHING",
                page_size=2000,
            )
            conn.commit()
            total = count(cur, "pesajes")

    log.info("pesajes: insertados=%d total=%d", inserted, total)
    return {"tabla": "pesajes", **stats, "insertados": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
