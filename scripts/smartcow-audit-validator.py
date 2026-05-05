#!/usr/bin/env python3
"""smartcow-audit-validator.py — AUT-394 fase 2.

Toma el reporte triple-audit más reciente y lo audita CONTRA la BD real,
verificando cada finding como:
  · VERIFICADO ✓  (evidencia SQL + resultado)
  · PARCIAL    🟡 (cierto pero mal articulado)
  · ALUCINACIÓN ✗ (prueba contraria)

Output: reports/audit-validation-YYYY-MM-DD-HHMM.md
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
OUT_FILE = REPO / "reports" / f"audit-validation-{time.strftime('%Y-%m-%d-%H%M')}.md"


def latest_audit_report() -> Path:
    files = sorted((REPO / "reports").glob("triple-audit-*.md"))
    if not files:
        raise FileNotFoundError("ningún triple-audit-*.md encontrado")
    return files[-1]


def db_facts() -> str:
    """Hechos LIVE de la BD: counts, ranges, integridad. Pre-calculados
    para que el modelo NO tenga que adivinar."""
    queries = [
        ("FK pesajes→animales existe?", """
            SELECT EXISTS(
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name='pesajes' AND constraint_type='FOREIGN KEY'
                  AND constraint_name LIKE '%animal_id%'
            )::text"""),
        ("FK partos→animales existe?", """
            SELECT EXISTS(
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name='partos' AND constraint_type='FOREIGN KEY'
                  AND constraint_name LIKE '%madre_id%'
            )::text"""),
        ("FK tratamientos→animales existe?", """
            SELECT EXISTS(
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name='tratamientos' AND constraint_type='FOREIGN KEY'
                  AND constraint_name LIKE '%animal_id%'
            )::text"""),
        ("UNIQUE pesajes (animal_id, fecha) existe?", """
            SELECT string_agg(indexname, ', ') FROM pg_indexes
            WHERE tablename='pesajes' AND indexname ILIKE '%uq%'"""),
        ("Indices en pesajes.animal_id?", """
            SELECT string_agg(indexname, ', ') FROM pg_indexes
            WHERE tablename='pesajes' AND indexdef ILIKE '%animal_id%'"""),
        ("Indices en tratamientos.animal_id?", """
            SELECT string_agg(indexname, ', ') FROM pg_indexes
            WHERE tablename='tratamientos' AND indexdef ILIKE '%animal_id%'"""),
        ("animales.diio dtype", """
            SELECT data_type||COALESCE('('||character_maximum_length::text||')','')
            FROM information_schema.columns
            WHERE table_name='animales' AND column_name='diio'"""),
        ("animales.estado_reproductivo_id NULL %", """
            SELECT ROUND(100.0*SUM(CASE WHEN estado_reproductivo_id IS NULL THEN 1 ELSE 0 END)
                         /COUNT(*), 1)::text FROM animales"""),
        ("inseminaciones rango fechas", """
            SELECT MIN(fecha)::text||' → '||MAX(fecha)::text FROM inseminaciones"""),
        ("inseminaciones futuras", """
            SELECT COUNT(*)::text FROM inseminaciones WHERE fecha > CURRENT_DATE"""),
        ("inseminaciones < 1990", """
            SELECT COUNT(*)::text FROM inseminaciones WHERE fecha < '1990-01-01'"""),
        ("pesajes futuras", """
            SELECT COUNT(*)::text FROM pesajes WHERE fecha > CURRENT_DATE"""),
        ("partos futuras", """
            SELECT COUNT(*)::text FROM partos WHERE fecha > CURRENT_DATE"""),
        ("bajas count", "SELECT COUNT(*)::text FROM bajas"),
        ("bajas archivo fuente filas", "SELECT '1431 (fuente Bajas_Historial_18-04-2026_raw.csv)'::text"),
        ("pesajes outlier_peso=true", """
            SELECT COUNT(*)::text FROM pesajes WHERE outlier_peso=true"""),
        ("pesajes outlier_edad=true", """
            SELECT COUNT(*)::text FROM pesajes WHERE outlier_edad=true"""),
        ("pesajes huérfanos (animal_id no en animales)", """
            SELECT COUNT(*)::text FROM pesajes p
            LEFT JOIN animales a ON a.id=p.animal_id
            WHERE a.id IS NULL"""),
        ("animales con fecha_nacimiento NULL", """
            SELECT COUNT(*)::text FROM animales WHERE fecha_nacimiento IS NULL"""),
        ("ventas individual vs lote", """
            SELECT COUNT(*) FILTER (WHERE animal_id IS NOT NULL)::text||' individual · '||
                   COUNT(*) FILTER (WHERE animal_id IS NULL)::text||' lote' FROM ventas"""),
        ("tratamientos con diagnostico NULL", """
            SELECT COUNT(*)::text||' (de '||COUNT(*)::text||' total)' FROM tratamientos
            WHERE diagnostico IS NULL OR diagnostico=''"""),
        ("tratamientos con diagnostico válido", """
            SELECT COUNT(*)::text FROM tratamientos
            WHERE diagnostico IS NOT NULL AND diagnostico<>''"""),
        ("baja_motivo distintos", """
            SELECT COUNT(DISTINCT id)::text FROM baja_motivo"""),
        ("predios distintos", "SELECT string_agg(nombre, ', ' ORDER BY id) FROM predios"),
        ("kpi_diario hoy", """
            SELECT 'predios: '||COUNT(*)::text||' · vacas_prenadas: '||COALESCE(SUM(vacas_prenadas),0)::text||
                   ' · sin_pesaje_60d: '||COALESCE(SUM(animales_sin_pesaje_60d),0)::text
            FROM kpi_diario WHERE fecha=CURRENT_DATE"""),
    ]
    out: list[str] = []
    for label, q in queries:
        cmd = ["psql", "-h", "127.0.0.1", "-p", "5432",
               "-U", "postgres", "-d", "smartcow_local",
               "-A", "-t", "-c", q]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            val = r.stdout.strip() or "(vacío)"
            out.append(f"  · {label}: {val}")
        except Exception as e:
            out.append(f"  · {label}: ERR {e}")
    return "\n".join(out)


SYSTEM = """Sos auditor independiente. Tu trabajo es VERIFICAR cada finding
del reporte triple-audit contra los HECHOS LIVE de la BD que te paso.

Para cada finding del reporte, devolvé EXACTAMENTE este formato:

  ### Finding [persona]: [título corto]

  Cita textual del finding: "..."

  Veredicto: ✓ VERIFICADO  |  🟡 PARCIAL  |  ✗ ALUCINACIÓN

  Evidencia: <hecho concreto de la BD que prueba/refuta>

  Comentario (1-2 líneas máximo)

REGLAS:
  · CERO diplomacia. Si es alucinación, decílo crudo.
  · Citá los HECHOS LIVE que te paso, no inventes.
  · Si el finding usa números (ej. "6288 registros"), verificá
    el número exacto contra HECHOS LIVE.
  · Si el finding cita una FK/columna/índice, verificá que exista.
  · Marcá PARCIAL solo cuando el finding es cierto pero exagerado
    (ej. dice "no hay índice" pero hay uno parcial).

Generá la auditoría en orden secuencial: primero los findings del
DBA, después Data Scientist, después Veterinario.

NO inventes findings nuevos. Solo evaluás los del reporte.
"""


USER_TEMPLATE = """═══════════════════════════════════════════════════════
HECHOS LIVE DE smartcow_local (verdad, queries ejecutadas en vivo)
═══════════════════════════════════════════════════════

{facts}

═══════════════════════════════════════════════════════
REPORTE TRIPLE-AUDIT A VALIDAR
═══════════════════════════════════════════════════════

{audit}

═══════════════════════════════════════════════════════
TU VALIDACIÓN POR FINDING:
═══════════════════════════════════════════════════════
"""


def call_smartcow(prompt: str) -> tuple[str, float]:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
        "stream": False,
        "options": {
            "num_ctx": 65536,
            "temperature": 0.3,
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


def main() -> int:
    audit_path = latest_audit_report()
    print(f"📄 reporte a validar: {audit_path.name}", flush=True)
    audit_text = audit_path.read_text(encoding="utf-8")
    print(f"   audit: {len(audit_text):,} chars", flush=True)

    print("📊 calculando hechos live...", flush=True)
    facts = db_facts()
    print(f"   facts: {len(facts):,} chars", flush=True)

    user_prompt = USER_TEMPLATE.format(facts=facts, audit=audit_text)
    total = len(user_prompt) + len(SYSTEM)
    print(f"   prompt total: {total:,} chars (~{total//4:,} tokens)", flush=True)

    print("\n🧠 validando findings con auditor independiente...", flush=True)
    out, elapsed = call_smartcow(user_prompt)
    print(f"⏱  {elapsed:.1f}s · {len(out):,} chars", flush=True)

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    header = (
        f"# Audit Validation — {time.strftime('%Y-%m-%d %H:%M')}\n\n"
        f"_Auditor independiente verificando findings de_ `{audit_path.name}`\n\n"
        f"_elapsed: {elapsed:.1f}s · output: {len(out):,} chars · prompt: {total:,} chars_\n\n"
        f"---\n\n"
        f"## Hechos LIVE consultados (verdad-base)\n\n"
        f"```\n{facts}\n```\n\n"
        f"---\n\n"
        f"## Validación por finding\n\n"
    )
    OUT_FILE.write_text(header + out + "\n", encoding="utf-8")
    print(f"💾 {OUT_FILE.relative_to(REPO)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
