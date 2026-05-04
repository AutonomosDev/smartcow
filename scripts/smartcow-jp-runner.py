#!/usr/bin/env python3
"""smartcow-jp-runner.py — corre las 50 preguntas de JP contra vanna-server.

Lee scripts/jp-50-preguntas.txt, ejecuta una por una, captura SQL + rows
+ narrativa + tiempo, y genera reporte markdown.

Asume que vanna-server.py está corriendo en :3004.

Uso:
  # 1. Levantar vanna-server (otra terminal o background)
  OLLAMA_MODEL=smartcow:latest .venv-vanna/bin/python scripts/vanna-server.py &
  # 2. Correr suite
  .venv-vanna/bin/python scripts/smartcow-jp-runner.py
"""
import json
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
QUESTIONS_FILE = REPO / "scripts" / "jp-50-preguntas.txt"
VANNA_URL = "http://127.0.0.1:3004/chat"
OUT_FILE = REPO / "reports" / f"jp-50-preguntas-{time.strftime('%Y-%m-%d-%H%M')}.md"

CATEGORIES = {
    "A": "Stock / Inventario",
    "B": "Salud / Veterinaria",
    "C": "Peso / Ganancia",
    "D": "Reproducción",
    "E": "Negocio / Ventas",
}


def load_questions() -> list[tuple[str, str]]:
    """Devuelve [(categoria, pregunta), ...]. Detecta categoría por sección
    `# ─── X. ... ───`."""
    out: list[tuple[str, str]] = []
    cat = "?"
    for line in QUESTIONS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("# ───") and ". " in line:
            # Extrae letra de categoría
            for letter in CATEGORIES:
                if f". {letter}." in line or f" {letter}." in line:
                    cat = letter
                    break
        elif line.startswith("#"):
            continue
        else:
            out.append((cat, line))
    return out


def call_vanna(question: str, predio_id: int = 1, timeout: float = 90.0) -> dict:
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
        return {"error": str(e), "sql": None, "rows": None, "narrative": None, "elapsed_ms": 0}


def evaluate(result: dict) -> tuple[str, list[str]]:
    """Devuelve (icon, issues). icon: 🟢🟡🔴"""
    issues: list[str] = []
    sql = result.get("sql") or ""
    rows = result.get("rows")
    err = result.get("error")

    if not sql:
        issues.append("sin_sql")
    if "date('now'" in sql.lower():
        issues.append("sqlite_leak")
    if err:
        issues.append(f"error:{str(err)[:60]}")
    if rows is None:
        issues.append("rows_null")
    elif isinstance(rows, list) and not rows:
        issues.append("rows_vacios")

    if not issues:
        return "🟢", issues
    if rows is not None and (isinstance(rows, list) and rows) and not any(i.startswith("error") or i.startswith("sqlite") for i in issues):
        return "🟡", issues
    return "🔴", issues


def main() -> int:
    questions = load_questions()
    print(f"📋 cargadas {len(questions)} preguntas", flush=True)

    # categorías
    by_cat: dict[str, int] = {}
    for cat, _ in questions:
        by_cat[cat] = by_cat.get(cat, 0) + 1
    for cat, n in sorted(by_cat.items()):
        print(f"   {cat}. {CATEGORIES.get(cat, '?')}: {n}", flush=True)

    print("\n🧪 ejecutando contra vanna-server :3004...", flush=True)
    results: list[dict] = []
    t0 = time.time()
    for i, (cat, q) in enumerate(questions, 1):
        # JP es dueño del holding (ambos predios) — alterna predio cada query
        # para evaluar ambos. Mejor: 1=Agrícola para A/B/D, 2=Feedlot para C
        predio_id = 2 if cat in ("C",) else 1
        print(f"  [{i:>2}/{len(questions)}] [{cat}] {q[:55]}...", flush=True)
        r = call_vanna(q, predio_id=predio_id)
        icon, issues = evaluate(r)
        rows_n = len(r["rows"]) if isinstance(r.get("rows"), list) else 0
        results.append({
            "i": i, "cat": cat, "q": q, "predio_id": predio_id,
            "sql": r.get("sql") or "", "rows_n": rows_n,
            "narrative": r.get("narrative") or "",
            "error": r.get("error"),
            "elapsed_ms": r.get("elapsed_ms", 0),
            "icon": icon, "issues": issues,
        })
        print(f"        {icon} {rows_n} rows · {r.get('elapsed_ms', 0)}ms", flush=True)

    elapsed = time.time() - t0
    ok = sum(1 for r in results if r["icon"] == "🟢")
    parc = sum(1 for r in results if r["icon"] == "🟡")
    fail = sum(1 for r in results if r["icon"] == "🔴")
    rate = ok * 100 / len(results)

    print(f"\n⏱  total {elapsed:.1f}s · 🟢{ok} 🟡{parc} 🔴{fail} · acierto={rate:.0f}%", flush=True)

    # Render markdown
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        f"# 50 preguntas de JP — {time.strftime('%Y-%m-%d %H:%M')}",
        "",
        f"_{len(questions)} preguntas · {elapsed:.1f}s · OK {ok} · parcial {parc} · fail {fail} · acierto **{rate:.0f}%**_",
        "",
        "## Resumen por categoría",
        "",
        "| Categoría | Total | 🟢 | 🟡 | 🔴 | Acierto |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for cat, n in sorted(by_cat.items()):
        cat_results = [r for r in results if r["cat"] == cat]
        cat_ok = sum(1 for r in cat_results if r["icon"] == "🟢")
        cat_parc = sum(1 for r in cat_results if r["icon"] == "🟡")
        cat_fail = sum(1 for r in cat_results if r["icon"] == "🔴")
        parts.append(
            f"| {cat}. {CATEGORIES.get(cat, '?')} | {n} | {cat_ok} | {cat_parc} | {cat_fail} | "
            f"{cat_ok*100//n}% |"
        )
    parts.append("")
    parts.append("---")
    parts.append("")
    parts.append("## Detalle por pregunta")
    parts.append("")
    for r in results:
        parts.append(f"### {r['i']}. {r['icon']} [{r['cat']}] {r['q']}")
        parts.append("")
        parts.append(f"- predio_id={r['predio_id']} · {r['rows_n']} rows · {r['elapsed_ms']}ms")
        if r["issues"]:
            parts.append(f"- issues: {', '.join(r['issues'])}")
        if r["narrative"]:
            parts.append(f"- narrativa: {r['narrative'][:200]}")
        parts.append("")
        parts.append("```sql")
        parts.append(r["sql"] or "(sin sql)")
        parts.append("```")
        parts.append("")

    OUT_FILE.write_text("\n".join(parts), encoding="utf-8")
    print(f"💾 {OUT_FILE.relative_to(REPO)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
