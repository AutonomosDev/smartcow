#!/usr/bin/env python3
"""carga_15_kpi_diario.py — Calcula snapshot diario de KPIs por predio.

AUT-391: tabla kpi_diario creada en migration 0030.

Calcula 1 fila por (today, predio_id) usando SQL agregado contra
animales, pesajes, ecografias.

Idempotente: ON CONFLICT (fecha, predio_id) DO UPDATE.
"""
import logging
from datetime import date

from etl.db import connect, count


def calcular_y_cargar(cur, predio_id: int) -> dict:
    """Calcula KPIs para un predio y devuelve la fila a insertar."""
    today = date.today()

    # 1. Total animales activos
    cur.execute(
        "SELECT COUNT(*) FROM animales WHERE predio_id=%s AND estado='activo';",
        (predio_id,),
    )
    total = cur.fetchone()[0] or 0

    # 2. Vacas preñadas / vacías (solo en crianza)
    cur.execute("""
        SELECT
          COUNT(*) FILTER (WHERE er.nombre ILIKE '%%pren%%') AS prenadas,
          COUNT(*) FILTER (WHERE er.nombre ILIKE '%%vac%%')  AS vacias
        FROM animales a
        LEFT JOIN estado_reproductivo er ON er.id = a.estado_reproductivo_id
        WHERE a.predio_id=%s AND a.estado='activo'
          AND a.etapa = 'crianza';
    """, (predio_id,))
    prenadas, vacias = cur.fetchone()

    # 3. Animales listos para venta: engorda con peso > 450
    cur.execute("""
        SELECT COUNT(DISTINCT a.id)
        FROM animales a
        JOIN pesajes p ON p.animal_id = a.id
        WHERE a.predio_id=%s AND a.estado='activo' AND a.etapa='engorda'
          AND p.peso_kg > 450;
    """, (predio_id,))
    listos = cur.fetchone()[0] or 0

    # 4. Peso promedio por etapa (último pesaje por animal)
    cur.execute("""
        WITH ult AS (
          SELECT DISTINCT ON (p.animal_id) p.animal_id, p.peso_kg, a.etapa
          FROM pesajes p JOIN animales a ON a.id = p.animal_id
          WHERE a.predio_id=%s AND a.estado='activo'
          ORDER BY p.animal_id, p.fecha DESC
        )
        SELECT
          AVG(peso_kg) FILTER (WHERE etapa='engorda') AS peso_engorda,
          AVG(peso_kg) FILTER (WHERE etapa='recria')  AS peso_recria
        FROM ult;
    """, (predio_id,))
    peso_engorda, peso_recria = cur.fetchone()

    # 5. Pesajes hechos hoy
    cur.execute(
        "SELECT COUNT(*) FROM pesajes WHERE predio_id=%s AND fecha=%s;",
        (predio_id, today),
    )
    pesajes_dia = cur.fetchone()[0] or 0

    # 6. Outliers detectados
    cur.execute(
        "SELECT COUNT(*) FROM pesajes WHERE predio_id=%s AND (outlier_peso OR outlier_edad);",
        (predio_id,),
    )
    outliers = cur.fetchone()[0] or 0

    # 7. Animales activos sin pesaje hace 60+ días
    cur.execute("""
        SELECT COUNT(*)
        FROM animales a
        WHERE a.predio_id=%s AND a.estado='activo'
          AND NOT EXISTS (
            SELECT 1 FROM pesajes p
            WHERE p.animal_id = a.id
              AND p.fecha >= CURRENT_DATE - INTERVAL '60 days'
          );
    """, (predio_id,))
    sin_pesaje_60d = cur.fetchone()[0] or 0

    return {
        "fecha": today,
        "predio_id": predio_id,
        "total_animales": total,
        "vacas_prenadas": prenadas or 0,
        "vacas_vacias": vacias or 0,
        "animales_listos_venta": listos,
        "peso_promedio_engorda": float(peso_engorda) if peso_engorda else None,
        "peso_promedio_recria": float(peso_recria) if peso_recria else None,
        "pesajes_dia": pesajes_dia,
        "outliers_detectados": outliers,
        "animales_sin_pesaje_60d": sin_pesaje_60d,
    }


def run() -> dict:
    log = logging.getLogger("carga_15_kpi_diario")
    with connect() as conn:
        with conn.cursor() as cur:
            # Verificar tabla existe
            cur.execute(
                "SELECT to_regclass('public.kpi_diario');"
            )
            if cur.fetchone()[0] is None:
                log.warning("kpi_diario: tabla no existe — corre migration 0030")
                return {"tabla": "kpi_diario", "skipped": True, "razon": "tabla no existe"}

            cur.execute("SELECT id FROM predios ORDER BY id;")
            predios = [r[0] for r in cur.fetchall()]
            log.info("calculando KPIs para %d predios...", len(predios))

            inserted = 0
            for pid in predios:
                kpi = calcular_y_cargar(cur, pid)
                cur.execute("""
                    INSERT INTO kpi_diario (
                        fecha, predio_id, total_animales,
                        vacas_prenadas, vacas_vacias, animales_listos_venta,
                        peso_promedio_engorda, peso_promedio_recria,
                        pesajes_dia, outliers_detectados, animales_sin_pesaje_60d
                    ) VALUES (
                        %(fecha)s, %(predio_id)s, %(total_animales)s,
                        %(vacas_prenadas)s, %(vacas_vacias)s, %(animales_listos_venta)s,
                        %(peso_promedio_engorda)s, %(peso_promedio_recria)s,
                        %(pesajes_dia)s, %(outliers_detectados)s, %(animales_sin_pesaje_60d)s
                    )
                    ON CONFLICT (fecha, predio_id) DO UPDATE SET
                        total_animales = EXCLUDED.total_animales,
                        vacas_prenadas = EXCLUDED.vacas_prenadas,
                        vacas_vacias = EXCLUDED.vacas_vacias,
                        animales_listos_venta = EXCLUDED.animales_listos_venta,
                        peso_promedio_engorda = EXCLUDED.peso_promedio_engorda,
                        peso_promedio_recria = EXCLUDED.peso_promedio_recria,
                        pesajes_dia = EXCLUDED.pesajes_dia,
                        outliers_detectados = EXCLUDED.outliers_detectados,
                        animales_sin_pesaje_60d = EXCLUDED.animales_sin_pesaje_60d,
                        computed_at = now();
                """, kpi)
                inserted += 1
                log.info("  predio %d: total=%d listos=%d sin_pesaje_60d=%d",
                         pid, kpi["total_animales"],
                         kpi["animales_listos_venta"], kpi["animales_sin_pesaje_60d"])
            conn.commit()
            total = count(cur, "kpi_diario")
    log.info("kpi_diario: upserts=%d total=%d", inserted, total)
    return {"tabla": "kpi_diario", "upserts": inserted, "total": total}


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(name)s] %(message)s")
    print(run())
