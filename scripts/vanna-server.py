#!/usr/bin/env python3
"""
vanna-server.py — Sidecar HTTP que expone Vanna 2.0 + Gemma local
al backend Next.js vía POST /chat.

AUT-349 — Reemplazo de handlers L1 hand-coded por Vanna+Gemma+system
prompt. Multi-cliente sin custom dev por cliente.

Endpoint:
  POST /chat   { "question": "...", "user_id": 1, "predio_id": 1 }
  → { "sql": "...", "rows": [...], "narrative": "...", "elapsed_ms": N }

Variables:
  VANNA_PORT       (default: 3004)
  OLLAMA_URL       (default: http://127.0.0.1:11434)
  OLLAMA_MODEL     (default: gemma4:latest)
  DATABASE_URL_LOCAL

Uso:
  .venv-vanna/bin/python scripts/vanna-server.py
"""
import json
import os
import re
import sys
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import psycopg2
import psycopg2.extras

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
PORT = int(os.environ.get("VANNA_PORT", 3004))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "gemma4:latest")
DSN = os.environ.get(
    "DATABASE_URL_LOCAL",
    "postgresql://postgres@127.0.0.1:5432/smartcow_local",
)


def load_system_prompt() -> str:
    """System prompt rico con schema smartcow_local. Reusamos el de vanna-eval.py si existe."""
    eval_path = REPO / "scripts" / "vanna-eval.py"
    if eval_path.exists():
        text = eval_path.read_text(encoding="utf-8")
        m = re.search(r'SYSTEM_PROMPT\s*=\s*"""(.*?)"""', text, re.S)
        if m:
            return m.group(1).strip()
    # Fallback compacto.
    return """<|think|>
Sos asistente ganadero SmartCow Chile.

Schema:
  animales (id, predio_id, diio, sexo, fecha_nacimiento, estado, etapa)
  pesajes (id, animal_id, predio_id, peso_kg, fecha)
  partos (id, madre_id, predio_id, fecha, resultado)
  bajas (id, animal_id, predio_id, fecha, motivo_id)
  ecografias (id, animal_id, predio_id, fecha, preniada, resultado)

Reglas:
  - SOLO postgres SQL válido
  - NUNCA respondas users, organizaciones ni sessions
  - Responde JSON: {"sql":"<query>", "explanation":"<texto>"}
"""


SYSTEM_PROMPT = load_system_prompt()


def call_ollama(question: str, predio_id: int) -> dict:
    user = (
        f"predio_id del usuario = {predio_id}. "
        f"Filtra siempre por predio_id en WHERE.\n\n"
        f"Pregunta: {question}\n\n"
        'Responde JSON: {"sql":"<query>","explanation":"<texto breve>"}'
    )
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.3, "num_ctx": 16384},
    }
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=240) as r:
        d = json.loads(r.read())
    raw = d.get("message", {}).get("content", "{}")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.S)
        parsed = json.loads(m.group(0)) if m else {"sql": "", "explanation": raw}
    parsed["_eval_count"] = d.get("eval_count", 0)
    return parsed


SQL_BLOCKLIST = re.compile(
    r"\b(users|organizaciones|sessions|chat_usage|chat_cache|user_memory)\b",
    re.IGNORECASE,
)
SQL_WRITE_REGEX = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create)\b", re.IGNORECASE
)


def execute_sql(sql: str) -> tuple[list[dict], str | None]:
    """Ejecuta SQL read-only contra smartcow_local. Devuelve (rows, error)."""
    if not sql or not sql.strip():
        return [], "sql vacío"
    if SQL_WRITE_REGEX.search(sql):
        return [], "operaciones de escritura no permitidas"
    if SQL_BLOCKLIST.search(sql):
        return [], "tabla restringida"
    conn = psycopg2.connect(DSN, cursor_factory=psycopg2.extras.DictCursor)
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            if cur.description:
                cols = [d[0] for d in cur.description]
                rows = [dict(zip(cols, row)) for row in cur.fetchmany(200)]
                return rows, None
            return [], None
    except Exception as e:
        return [], str(e)
    finally:
        conn.close()


class VannaHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # silencia stderr ruidoso
        sys.stderr.write(f"[vanna] {fmt % args}\n")

    def _send(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/health"):
            self._send(200, {"ok": True, "model": OLLAMA_MODEL})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/chat"):
            self._send(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid json"})
            return

        question = (body.get("question") or "").strip()
        predio_id = int(body.get("predio_id") or 1)
        if not question:
            self._send(400, {"error": "question requerido"})
            return

        t0 = time.time()
        try:
            llm = call_ollama(question, predio_id)
        except Exception as e:
            self._send(502, {"error": f"ollama: {e}"})
            return
        sql = (llm.get("sql") or "").strip().rstrip(";")
        rows, err = execute_sql(sql)

        elapsed_ms = int((time.time() - t0) * 1000)
        self._send(
            200,
            {
                "sql": sql,
                "rows": rows,
                "narrative": llm.get("explanation", ""),
                "error": err,
                "elapsed_ms": elapsed_ms,
                "tokens": llm.get("_eval_count", 0),
            },
        )


def main() -> int:
    print(f"🚀 vanna-server :{PORT} → ollama={OLLAMA_URL} db={DSN.split('@')[-1]}")
    server = HTTPServer(("127.0.0.1", PORT), VannaHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 bye")
    return 0


if __name__ == "__main__":
    sys.exit(main())
