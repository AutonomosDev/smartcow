#!/usr/bin/env python3
"""smartcow-triple-audit.py — AUT-394.

Audita la BD smartcow_local + el trabajo construido (ETL, dossiers,
plan v2) usando 3 personas expertas distintas:

  1. DBA Senior (PostgreSQL)
  2. Data Scientist Senior
  3. Veterinario / Consultor Ganadero Chile

Cada persona recibe TODO el contexto y devuelve findings con
errores, alucinaciones e inconsistencias.

Output: reports/triple-audit-YYYY-MM-DD-HHMM.md
"""
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "smartcow:latest")
DOSSIERS_DIR = REPO / "reports" / "inventario"
PLAN_FINAL = REPO / "reports" / "aut-388-plan-final.md"
OUT_FILE = REPO / "reports" / f"triple-audit-{time.strftime('%Y-%m-%d-%H%M')}.md"


# ─── Recolectar contexto ──────────────────────────────────
def db_schema() -> str:
    """Schema completo de las tablas operacionales (14 + catálogos)."""
    cmd = [
        "psql", "-h", "127.0.0.1", "-p", "5432",
        "-U", "postgres", "-d", "smartcow_local", "-A", "-t", "-c",
        """
        SELECT
          c.table_name || '.' || c.column_name || ' :: ' || c.data_type ||
          CASE WHEN c.is_nullable='YES' THEN ' NULL' ELSE ' NOT NULL' END
        FROM information_schema.columns c
        WHERE c.table_schema='public'
          AND c.table_name IN (
            'holdings','predios','animales','pesajes','partos',
            'tratamientos','inseminaciones','ecografias','areteos',
            'bajas','baja_motivo','ventas','traslados','inventarios',
            'precios_feria','kpi_diario','tipo_ganado','razas',
            'estado_reproductivo','tipo_parto','subtipo_parto',
            'inseminadores','semen','organizaciones'
          )
        ORDER BY c.table_name, c.ordinal_position;
        """,
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    return r.stdout


def db_stats() -> str:
    """Counts, min/max, null %, dispersión por tabla principal."""
    queries = [
        ("holdings count", "SELECT COUNT(*) FROM holdings"),
        ("predios count", "SELECT COUNT(*) FROM predios"),
        ("animales counts", """
            SELECT 'total: '||COUNT(*)||' · activos: '||COUNT(*) FILTER (WHERE estado='activo')||
                   ' · bajas: '||COUNT(*) FILTER (WHERE estado='baja')
            FROM animales"""),
        ("animales por etapa", """
            SELECT etapa||': '||COUNT(*) FROM animales GROUP BY etapa ORDER BY etapa"""),
        ("animales por sexo", """
            SELECT sexo||': '||COUNT(*) FROM animales GROUP BY sexo"""),
        ("animales por predio", """
            SELECT 'predio_'||predio_id||': '||COUNT(*) FROM animales GROUP BY predio_id"""),
        ("pesajes stats", """
            SELECT 'count: '||COUNT(*)||' · rango fecha: '||MIN(fecha)||' → '||MAX(fecha)
            FROM pesajes"""),
        ("pesajes peso stats", """
            SELECT 'min: '||MIN(peso_kg)||' · max: '||MAX(peso_kg)||
                   ' · avg: '||ROUND(AVG(peso_kg)::numeric, 1)||
                   ' · outliers_peso: '||SUM(CASE WHEN outlier_peso THEN 1 ELSE 0 END)||
                   ' · outliers_edad: '||SUM(CASE WHEN outlier_edad THEN 1 ELSE 0 END)
            FROM pesajes"""),
        ("partos resultados", """
            SELECT resultado||': '||COUNT(*) FROM partos GROUP BY resultado"""),
        ("partos rango", """
            SELECT 'count: '||COUNT(*)||' · rango: '||MIN(fecha)||' → '||MAX(fecha) FROM partos"""),
        ("inseminaciones rango", """
            SELECT 'count: '||COUNT(*)||' · rango: '||MIN(fecha)||' → '||MAX(fecha) FROM inseminaciones"""),
        ("tratamientos top diagnosticos", """
            SELECT diagnostico||': '||COUNT(*) FROM tratamientos
            WHERE diagnostico IS NOT NULL
            GROUP BY diagnostico ORDER BY COUNT(*) DESC LIMIT 8"""),
        ("bajas count", "SELECT COUNT(*)::text||' bajas registradas' FROM bajas"),
        ("baja_motivo top", """
            SELECT bm.nombre||': '||COUNT(b.id) FROM baja_motivo bm
            LEFT JOIN bajas b ON b.motivo_id=bm.id
            GROUP BY bm.nombre HAVING COUNT(b.id)>0 ORDER BY COUNT(b.id) DESC LIMIT 5"""),
        ("ventas tipo", """
            SELECT 'individual: '||COUNT(*) FILTER (WHERE animal_id IS NOT NULL)||
                   ' · lote: '||COUNT(*) FILTER (WHERE animal_id IS NULL)||
                   ' · total: '||COUNT(*) FROM ventas"""),
        ("traslados count", "SELECT COUNT(*)::text||' traslados' FROM traslados"),
        ("inventarios count", "SELECT COUNT(*)::text||' inventarios físicos' FROM inventarios"),
        ("precios_feria stats", """
            SELECT 'count: '||COUNT(*)||' · rango: '||MIN(fecha)||' → '||MAX(fecha)||
                   ' · ferias: '||COUNT(DISTINCT feria) FROM precios_feria"""),
        ("kpi_diario", "SELECT * FROM kpi_diario ORDER BY predio_id"),
        # huérfanos / integridad referencial
        ("animales sin tipo_ganado válido", """
            SELECT COUNT(*)::text||' animales con tipo_ganado_id inválido'
            FROM animales a LEFT JOIN tipo_ganado tg ON tg.id=a.tipo_ganado_id
            WHERE tg.id IS NULL"""),
        ("pesajes con animal_id huérfano", """
            SELECT COUNT(*)::text||' pesajes con animal_id huérfano'
            FROM pesajes p LEFT JOIN animales a ON a.id=p.animal_id
            WHERE a.id IS NULL"""),
        ("animales con estado_reproductivo NULL %", """
            SELECT ROUND(100.0*SUM(CASE WHEN estado_reproductivo_id IS NULL THEN 1 ELSE 0 END)
                         /COUNT(*), 1)::text||'% animales sin estado_reproductivo' FROM animales"""),
        ("animales con fecha_nacimiento NULL %", """
            SELECT ROUND(100.0*SUM(CASE WHEN fecha_nacimiento IS NULL THEN 1 ELSE 0 END)
                         /COUNT(*), 1)::text||'% animales sin fecha_nacimiento' FROM animales"""),
    ]
    out: list[str] = []
    for label, q in queries:
        cmd = ["psql", "-h", "127.0.0.1", "-p", "5432",
               "-U", "postgres", "-d", "smartcow_local",
               "-A", "-t", "-c", q]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            out.append(f"\n## {label}\n{r.stdout.strip()}\n")
        except Exception as e:
            out.append(f"\n## {label}\nERR: {e}\n")
    return "\n".join(out)


def db_samples() -> str:
    """Sample 5 filas de cada tabla principal."""
    tables = [
        ("animales", "SELECT id, predio_id, diio, tipo_ganado_id, sexo, etapa, estado, fecha_nacimiento FROM animales LIMIT 5"),
        ("pesajes", "SELECT id, animal_id, predio_id, peso_kg, fecha, edad_meses, outlier_peso FROM pesajes LIMIT 5"),
        ("partos", "SELECT id, madre_id, predio_id, fecha, resultado, numero_partos FROM partos LIMIT 5"),
        ("tratamientos", "SELECT id, animal_id, predio_id, fecha, diagnostico, medicamentos FROM tratamientos LIMIT 5"),
        ("ventas", "SELECT id, predio_id, animal_id, fecha, peso_kg, destino, animales_lote FROM ventas LIMIT 5"),
        ("bajas", "SELECT id, animal_id, predio_id, fecha, motivo_id, observaciones FROM bajas LIMIT 5"),
        ("traslados", "SELECT id, fecha, predio_origen_id, predio_destino_id, fundo_origen_nombre, fundo_destino_nombre, n_animales FROM traslados LIMIT 5"),
        ("inventarios", "SELECT id, predio_id, fecha, n_encontrados, n_faltantes, tg_encontrados FROM inventarios LIMIT 5"),
    ]
    out: list[str] = []
    for tbl, q in tables:
        cmd = ["psql", "-h", "127.0.0.1", "-p", "5432",
               "-U", "postgres", "-d", "smartcow_local",
               "-c", q]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            out.append(f"\n## sample {tbl}\n```\n{r.stdout.strip()}\n```\n")
        except Exception as e:
            out.append(f"\n## sample {tbl}\nERR: {e}\n")
    return "\n".join(out)


def load_plan() -> str:
    return PLAN_FINAL.read_text(encoding="utf-8") if PLAN_FINAL.exists() else "(plan no encontrado)"


# ─── Personas ────────────────────────────────────────────
PERSONA_DBA = """Sos DBA Senior PostgreSQL con 15 años de experiencia. Auditás
el schema y la integridad de smartcow_local. Buscás:

  · columnas con tipos incorrectos (varchar para números, etc)
  · FKs faltantes que deberían existir
  · índices que faltan o índices muertos
  · queries lentas, JOINs ineficientes
  · uso de NULL inconsistente
  · normalización 3NF rota
  · dialecto SQL mezclado (SQLite leak, MySQL leak)
  · constraint violations potenciales
  · datos duplicados que deberían ser únicos

Reportá en formato:
  🔴 CRÍTICO  — bloquea producción
  🟡 WARNING  — riesgo medio
  🟢 SUGERENCIA — mejora opcional

Cada finding debe citar: TABLA.COLUMNA, valor concreto, query SQL
que demuestra el problema. Cero abstracciones.

Sé directo. Cero diplomacia. Si está mal, decílo.
"""

PERSONA_DATA = """Sos Data Scientist Senior con foco en agricultura. Auditás
la calidad estadística de smartcow_local. Buscás:

  · distribuciones sospechosas (medias, varianzas anómalas)
  · outliers no flaggeados
  · sesgos temporales (gaps en fechas, concentración en periodos)
  · missing values críticos para análisis
  · correlaciones inverosímiles entre tablas
  · data leakage: columnas que predicen target
  · sample bias (predio sobre-representado)
  · drift entre archivos vs BD (¿qué se perdió en el ETL?)
  · series temporales rotas
  · valores categóricos inconsistentes (mismo valor con typos)

Reportá en formato:
  🔴 CRÍTICO  — invalida análisis downstream
  🟡 WARNING  — sesgo no resuelto
  🟢 SUGERENCIA — mejora ML

Cita estadísticas concretas: promedios, %, conteos. Cero
"podríamos investigar". Decí qué encontraste y por qué importa.
"""

PERSONA_VET = """Sos veterinario consultor ganadero con 20 años en Chile,
especialista en bovinos de carne. Auditás la coherencia del modelo
de datos con la realidad del rubro. Buscás:

  · valores biológicamente imposibles
    (ej. peso 1500kg, edad 50 años, gestación 5 días)
  · mapeos etapa/edad/peso incoherentes
    (Vaca Vaquilla 6 meses, Ternero engorda, Toro crianza)
  · regla SAG no respetada (resguardo carne, trazabilidad DIIO)
  · ciclo reproductivo roto (parto sin gestación previa)
  · diagnósticos que no son del rubro chileno
  · medicamentos prohibidos o uso fuera de label
  · benchmarks fuera de norma
    (preñez, mortalidad, GDP, intervalo entre partos)
  · razas no aptas para el clima Los Lagos
  · errores de manejo evidentes en la data

Reportá en formato:
  🔴 CRÍTICO  — implica problema sanitario / SAG
  🟡 WARNING  — alerta de manejo
  🟢 SUGERENCIA — buena práctica

Cita SIEMPRE el dato concreto: animal_id, fecha, valor. Hablá
como veterinario chileno experimentado.
"""


def call_smartcow(system: str, user_prompt: str) -> tuple[str, float]:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "num_ctx": 65536,
            "temperature": 0.4,
            "num_predict": 16384,
        },
    }
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=3600) as r:
        d = json.loads(r.read())
    return d.get("message", {}).get("content", "").strip(), time.time() - t0


# ─── Main ────────────────────────────────────────────────
USER_PROMPT_TEMPLATE = """Te paso TODO el contexto de smartcow_local. Auditá según
tu especialidad. Devolvé findings concretos con datos reales.

═══════════════════════════════════════════════════════
SCHEMA COMPLETO (column types)
═══════════════════════════════════════════════════════

{schema}

═══════════════════════════════════════════════════════
STATS LIVE DE LA BD (counts, distribuciones, integridad)
═══════════════════════════════════════════════════════

{stats}

═══════════════════════════════════════════════════════
SAMPLES (5 filas por tabla principal)
═══════════════════════════════════════════════════════

{samples}

═══════════════════════════════════════════════════════
PLAN ETL (cómo se cargó la data)
═══════════════════════════════════════════════════════

{plan}

═══════════════════════════════════════════════════════
TU AUDITORÍA AHORA (en español Chile, sin diplomacia):
═══════════════════════════════════════════════════════
"""


def main() -> int:
    print("📚 recolectando contexto BD live...", flush=True)
    schema = db_schema()
    stats = db_stats()
    samples = db_samples()
    plan = load_plan()

    print(f"   schema:  {len(schema):,} chars", flush=True)
    print(f"   stats:   {len(stats):,} chars", flush=True)
    print(f"   samples: {len(samples):,} chars", flush=True)
    print(f"   plan:    {len(plan):,} chars", flush=True)

    user_prompt = USER_PROMPT_TEMPLATE.format(
        schema=schema, stats=stats, samples=samples, plan=plan,
    )
    total = len(user_prompt)
    print(f"\n   user_prompt total: {total:,} chars (~{total//4:,} tokens)", flush=True)

    if total // 4 > 60_000:
        print("   ⚠ prompt cerca del límite num_ctx=65536", flush=True)

    personas = [
        ("dba", "DBA Senior PostgreSQL", PERSONA_DBA),
        ("data", "Data Scientist Senior", PERSONA_DATA),
        ("vet", "Veterinario Ganadero Senior Chile", PERSONA_VET),
    ]

    results: list[dict] = []
    for tag, label, sys_prompt in personas:
        print(f"\n🧠 [{tag}] {label} auditando...", flush=True)
        out, elapsed = call_smartcow(sys_prompt, user_prompt)
        print(f"   ⏱  {elapsed:.1f}s · {len(out):,} chars", flush=True)
        results.append({"tag": tag, "label": label, "out": out, "elapsed": elapsed})

    # Render markdown final
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        f"# Triple Audit smartcow_local — {time.strftime('%Y-%m-%d %H:%M')}",
        "",
        f"_3 personas expertas auditando la BD smartcow_local + ETL + plan._",
        "",
        f"- Input: schema {len(schema):,} chars · stats {len(stats):,} · samples {len(samples):,} · plan {len(plan):,}",
        f"- Total prompt: {total:,} chars (~{total//4:,} tokens)",
        f"- Modelo: `{OLLAMA_MODEL}` num_ctx=65536",
        "",
        "---",
        "",
    ]
    for r in results:
        parts.append(f"## 🧑‍💼 {r['label']}")
        parts.append("")
        parts.append(f"_elapsed: {r['elapsed']:.1f}s · output: {len(r['out']):,} chars_")
        parts.append("")
        parts.append(r["out"])
        parts.append("")
        parts.append("---")
        parts.append("")
    OUT_FILE.write_text("\n".join(parts), encoding="utf-8")
    print(f"\n💾 {OUT_FILE.relative_to(REPO)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
