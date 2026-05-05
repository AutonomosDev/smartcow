"""Helpers comunes para los scripts ETL."""
import re
from typing import Any

import pandas as pd


def normalizar_diio(v: Any) -> str | None:
    """Normaliza DIIO a string numérico. Devuelve None si inválido (=1, vacío, no numérico)."""
    if v is None or pd.isna(v):
        return None
    s = re.sub(r"\D", "", str(v).strip())
    if not s or s == "1":
        return None
    return s


def parse_fecha_iso(v: Any) -> str | None:
    """Parsea fechas que vienen con comillas '"2026-04-18T..."'. Devuelve YYYY-MM-DD o None."""
    if v is None or pd.isna(v):
        return None
    s = str(v).strip().strip('"')
    fecha = pd.to_datetime(s, errors="coerce", utc=True)
    if pd.isna(fecha):
        return None
    return fecha.strftime("%Y-%m-%d")


def es_fecha_futura(fecha_str: str | None, hoy_str: str = "2026-05-01") -> bool:
    if not fecha_str:
        return False
    return fecha_str > hoy_str


def clean_date_column(df: pd.DataFrame, col: str) -> None:
    """Limpia comillas de una columna fecha en-place."""
    if col in df.columns:
        df[col] = df[col].astype(str).str.strip('"')


def parse_resguardo_dias(v: Any) -> int | None:
    """Parsea texto tipo '30 Días', '3 meses', '7 días' a int días. None si no matchea."""
    if v is None or pd.isna(v):
        return None
    s = str(v).strip().lower()
    m = re.search(r"(\d+)\s*(día|dia|d)", s)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)\s*(mes|m)", s)
    if m:
        return int(m.group(1)) * 30
    return None


def parse_tg_estructurado(v: Any) -> dict[str, int] | None:
    """Parsea texto tipo 'Vaca: 100\nNovillo: 50' a dict."""
    if v is None or pd.isna(v):
        return None
    s = str(v).strip()
    if not s:
        return None
    out: dict[str, int] = {}
    for line in re.split(r"[\n,;]+", s):
        m = re.match(r"\s*([A-Za-záéíóúñÁÉÍÓÚÑ]+)\s*:\s*(\d+)", line)
        if m:
            out[m.group(1).strip()] = int(m.group(2))
    return out or None
