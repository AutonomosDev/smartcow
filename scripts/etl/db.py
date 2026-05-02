"""
Helper de conexión a smartcow_local. DSN del .env (no hardcoded).
"""
import os
import re
from pathlib import Path

import psycopg2
from psycopg2 import extras

REPO = Path("/Users/autonomos_dev/Projects/smartcow")
DEFAULT_DSN = "postgresql://postgres@127.0.0.1:5432/smartcow_local"


def _read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    out: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^([A-Z_][A-Z0-9_]*)=(.*)$", line)
        if not m:
            continue
        out[m.group(1)] = m.group(2).strip("\"'")
    return out


def get_dsn() -> str:
    """Resuelve DSN: env var > .env.local > .env > default."""
    if (v := os.environ.get("DATABASE_URL_LOCAL")):
        return v
    for fname in (".env.local", ".env"):
        env = _read_env_file(REPO / fname)
        if "DATABASE_URL_LOCAL" in env:
            return env["DATABASE_URL_LOCAL"]
    return DEFAULT_DSN


def connect():
    """Conecta. El caller hace .close() o usa context manager."""
    return psycopg2.connect(get_dsn())


def insert_many(
    cur,
    table: str,
    columns: list[str],
    rows: list[tuple],
    on_conflict: str | None = None,
    page_size: int = 5000,
) -> int:
    """Bulk insert con ON CONFLICT opcional. Devuelve filas insertadas."""
    if not rows:
        return 0
    cols_sql = ", ".join(columns)
    placeholders = "(" + ", ".join(["%s"] * len(columns)) + ")"
    conflict_sql = f"ON CONFLICT {on_conflict}" if on_conflict else ""
    sql = (
        f"INSERT INTO {table} ({cols_sql}) VALUES %s {conflict_sql}".strip()
    )
    extras.execute_values(cur, sql, rows, template=placeholders, page_size=page_size)
    return cur.rowcount


def truncate_tables(cur, tables: list[str]) -> None:
    """TRUNCATE con CASCADE en orden inverso de FK."""
    for t in tables:
        cur.execute(f"TRUNCATE TABLE {t} RESTART IDENTITY CASCADE;")


def count(cur, table: str) -> int:
    cur.execute(f"SELECT COUNT(*) FROM {table};")
    row = cur.fetchone()
    return int(row[0]) if row else 0


def get_animales_diio_to_id(cur) -> dict[str, int]:
    """Carga lookup diio→animal_id en memoria. Usado por scripts de eventos."""
    cur.execute("SELECT id, diio FROM animales WHERE diio IS NOT NULL;")
    return {str(diio).strip(): int(aid) for aid, diio in cur.fetchall()}
