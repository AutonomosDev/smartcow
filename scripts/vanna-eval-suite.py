#!/usr/bin/env python3
"""vanna-eval-suite.py — Suite de evaluación con 20 queries.

Llama vanna-server :3004 con queries en español, valida que el SQL
generado se ejecute sin error y que los resultados sean razonables.

Output: reports/vanna-eval-suite-YYYY-MM-DD-HHMM.md
"""
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
VANNA_URL = "http://127.0.0.1:3004/chat"
OUT_FILE = REPO / "reports" / f"vanna-eval-suite-{time.strftime('%Y-%m-%d-%H%M')}.md"

# 20 queries cubriendo las 14 tablas
QUERIES = [
    # animales / tipo_ganado
    ("¿cuántas vacas activas hay en Agrícola?", "animales", 1, lambda r: bool(r) and any(v > 0 for d in r for v in d.values())),
    ("¿cuántos animales hay en feedlot por etapa?", "animales", 2, lambda r: bool(r) and len(r) >= 1),
    ("¿cuántos toros hay en total?", "animales", 1, lambda r: bool(r)),
    # pesajes
    ("¿cuál es el peso promedio de animales en engorda en feedlot?", "pesajes", 2, lambda r: bool(r) and any(isinstance(v, (int, float, str)) for d in r for v in d.values())),
    ("¿cuántos pesajes se hicieron en enero 2026?", "pesajes", 2, lambda r: bool(r)),
    ("¿qué animales tienen peso menor a 10 kg (outliers)?", "pesajes", 1, None),
    # partos
    ("¿cuántos partos hubo en 2024?", "partos", 1, lambda r: bool(r)),
    ("¿cuántos partos resultaron muertos?", "partos", 1, lambda r: bool(r)),
    # inseminaciones
    ("¿cuántas inseminaciones se hicieron este año?", "inseminaciones", 1, lambda r: bool(r)),
    # tratamientos
    ("top 5 diagnósticos más comunes en tratamientos", "tratamientos", 1, lambda r: bool(r) and len(r) >= 1),
    ("¿cuántos tratamientos por neumonía hay?", "tratamientos", 1, lambda r: bool(r)),
    # bajas / baja_motivo
    ("¿cuál es el motivo más común de bajas?", "bajas", 1, None),
    # ventas
    ("¿a qué destinos se vende más ganado?", "ventas", 1, lambda r: bool(r) and len(r) >= 1),
    ("¿cuántas ventas son por lote sin DIIO?", "ventas", 1, lambda r: bool(r)),
    # traslados
    ("¿cuántos traslados se registraron este año?", "traslados", 1, lambda r: bool(r)),
    # inventarios
    ("¿cuántos inventarios físicos se hicieron?", "inventarios", 1, lambda r: bool(r)),
    # precios_feria
    ("precio promedio kg de novillo engorda en bulnes este año", "precios_feria", 1, None),
    # kpi_diario
    ("¿cuántos animales sin pesar hace 60 días en feedlot?", "kpi_diario", 2, None),
    # SQL avanzado
    ("animales listos para venta con peso > 450kg en feedlot", "pesajes+animales", 2, lambda r: bool(r)),
    # cross-table
    ("tasa de preñez actual de vacas en Agrícola", "animales+estado_reproductivo", 1, None),
]

SQLITE_LEAKS = [
    "date('now'",
    "date(now)",
    "datetime('now'",
    "strftime('%Y'",
]


def call_vanna(question: str, predio_id: int, timeout: float = 90.0) -> dict:
    body = json.dumps({"question": question, "user_id": 1, "predio_id": predio_id}).encode()
    req = urllib.request.Request(
        VANNA_URL,
        data=body,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e), "sql": None, "rows": None}


def evaluate(q_idx: int, q: tuple, result: dict) -> dict:
    question, target_table, predio_id, validator = q
    sql = result.get("sql") or ""
    rows = result.get("rows")
    err = result.get("error")

    issues = []
    score = 0  # 0=fail, 1=parcial, 2=ok

    # check 1: sin SQL
    if not sql:
        issues.append("sin_sql")
        return {"q": question, "table": target_table, "score": 0, "sql": "",
                "rows_n": 0, "issues": issues, "elapsed_ms": result.get("elapsed_ms", 0)}

    # check 2: dialecto SQLite leak
    sql_lower = sql.lower()
    for leak in SQLITE_LEAKS:
        if leak in sql_lower:
            issues.append(f"sqlite_leak:{leak}")

    # check 3: tabla destino mencionada (heurístico)
    target_tables = target_table.split("+")
    for t in target_tables:
        if t.strip() not in sql_lower:
            issues.append(f"missing_table:{t.strip()}")

    # check 4: error de ejecución
    if err:
        issues.append(f"sql_error:{err[:80]}")

    # check 5: rows válidas (si validator definido)
    if validator and rows is not None:
        try:
            if not validator(rows):
                issues.append("rows_validator_failed")
        except Exception as e:
            issues.append(f"validator_exception:{e}")

    # score
    if not issues and rows is not None:
        score = 2  # OK
    elif rows is not None and not any(i.startswith("sqlite_leak") or i.startswith("sql_error") for i in issues):
        score = 1  # parcial (tabla puede estar mal)
    else:
        score = 0

    return {
        "q": question, "table": target_table, "predio_id": predio_id,
        "score": score, "sql": sql,
        "rows_n": len(rows) if isinstance(rows, list) else 0,
        "issues": issues, "elapsed_ms": result.get("elapsed_ms", 0),
    }


def main() -> int:
    results = []
    print(f"🧪 corriendo {len(QUERIES)} queries contra vanna-server...", flush=True)
    t0 = time.time()
    for i, q in enumerate(QUERIES, 1):
        question = q[0]
        predio_id = q[2]
        print(f"  [{i:>2}/{len(QUERIES)}] {question[:60]}...", flush=True)
        result = call_vanna(question, predio_id)
        ev = evaluate(i, q, result)
        results.append(ev)
        icon = "🟢" if ev["score"] == 2 else ("🟡" if ev["score"] == 1 else "🔴")
        print(f"        {icon} {ev['rows_n']} rows · {ev['elapsed_ms']}ms · {len(ev['issues'])} issues", flush=True)

    elapsed = time.time() - t0
    ok = sum(1 for r in results if r["score"] == 2)
    parcial = sum(1 for r in results if r["score"] == 1)
    fail = sum(1 for r in results if r["score"] == 0)
    rate = ok * 100 / len(results)

    print(f"\n⏱  total {elapsed:.1f}s · 🟢{ok} 🟡{parcial} 🔴{fail} · acierto={rate:.0f}%", flush=True)

    # Render markdown
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        f"# Vanna eval suite — {time.strftime('%Y-%m-%d %H:%M')}",
        "",
        f"_{len(QUERIES)} queries · {elapsed:.1f}s · "
        f"OK {ok} · parcial {parcial} · fail {fail} · acierto **{rate:.0f}%**_",
        "",
        "| # | Pregunta | Tabla esperada | Score | Issues |",
        "| --- | --- | --- | :-: | --- |",
    ]
    for i, r in enumerate(results, 1):
        icon = "🟢" if r["score"] == 2 else ("🟡" if r["score"] == 1 else "🔴")
        issues_short = ", ".join(r["issues"])[:60] or "—"
        parts.append(
            f"| {i} | {r['q']} | `{r['table']}` | {icon} | {issues_short} |"
        )
    parts.append("")
    parts.append("---")
    parts.append("")
    parts.append("## Detalle por query")
    parts.append("")
    for i, r in enumerate(results, 1):
        icon = "🟢" if r["score"] == 2 else ("🟡" if r["score"] == 1 else "🔴")
        parts.append(f"### {i}. {icon} {r['q']}")
        parts.append("")
        parts.append(f"- predio_id: `{r['predio_id']}` · tabla esperada: `{r['table']}`")
        parts.append(f"- rows: {r['rows_n']} · elapsed: {r['elapsed_ms']}ms")
        if r["issues"]:
            parts.append(f"- issues: {', '.join(r['issues'])}")
        parts.append("")
        parts.append("```sql")
        parts.append(r["sql"] or "(sin sql)")
        parts.append("```")
        parts.append("")

    OUT_FILE.write_text("\n".join(parts), encoding="utf-8")
    print(f"💾 {OUT_FILE.relative_to(REPO)}", flush=True)
    return 0 if rate >= 80 else 1


if __name__ == "__main__":
    sys.exit(main())
