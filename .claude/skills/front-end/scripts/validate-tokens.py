#!/usr/bin/env python3
"""
Validate a .tsx/.jsx/.css file against the SmartCow DS token rules.
Usage: python validate-tokens.py <file>
Exit 0 = no violations. Exit 1 = violations found (printed to stdout).
"""

import re
import sys
from pathlib import Path

# ── Canonical color set ──────────────────────────────────────────────────────
CANONICAL_COLORS = {
    "#1a1a1a", "#888888", "#bbbbbb", "#f0ede8",  # ink
    "#ebe9e3", "#f8f6f1", "#f8f6f1", "#ffffff",  # backgrounds
    "#1e3a2f", "#7ecfa0",                          # brand
    "#e74c3c", "#f39c12", "#1a5276",               # semantic
    "#fde8e8", "#c0392b",                          # badge urgente
    "#fdf0e6", "#9b5e1a",                          # badge warn
    "#e6f3ec",                                     # badge ok bg
    "#e6f0f8",                                     # badge info bg
    "#666666",                                     # badge neutro fg
    "#e8e5dd", "#fafaf7",                          # note variants in components
}

# ── Tailwind color patterns to reject ───────────────────────────────────────
TAILWIND_COLOR_RE = re.compile(
    r'\b(?:bg|text|border|ring|fill|stroke|from|to|via)-'
    r'(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|'
    r'green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|'
    r'pink|rose)-\d{2,3}\b'
)

# ── Forbidden strings ────────────────────────────────────────────────────────
FORBIDDEN_STRINGS = [
    ("#06200F",   "color brand-dark superseded — usar #1e3a2f"),
    ("dark-mode", "dark mode explícitamente excluido del DS"),
    ('"dark"',    "dark mode explícitamente excluido del DS"),
]

# ── Forbidden radius values ──────────────────────────────────────────────────
BAD_RADIUS_RE = re.compile(
    r'border[Rr]adius\s*[=:]\s*["\']?(?:1[2-9]|2[0-9]|3[0-9])px["\']?'
)

# ── Font check ───────────────────────────────────────────────────────────────
FONT_RE = re.compile(r"""font[Ff]amily\s*[=:]\s*["']([^"']+)["']""")
ALLOWED_FONTS = {"DM Sans", "system-ui", "-apple-system", "sans-serif",
                 "JetBrains Mono", "ui-monospace", "monospace"}


def check(filepath: str) -> list[str]:
    path = Path(filepath)
    if not path.exists():
        return [f"ERROR: archivo no encontrado — {filepath}"]

    text = path.read_text(errors="replace")
    violations = []

    # 1. Hex colors not in canonical set
    for m in re.finditer(r'#[0-9a-fA-F]{6}\b', text):
        color = m.group(0).lower()
        if color not in CANONICAL_COLORS:
            line_no = text[:m.start()].count('\n') + 1
            violations.append(
                f"L{line_no}: color no canónico {color} — "
                f"usar tokens de references/tokens.md"
            )

    # 2. Tailwind color classes
    for m in TAILWIND_COLOR_RE.finditer(text):
        line_no = text[:m.start()].count('\n') + 1
        violations.append(
            f"L{line_no}: clase Tailwind color '{m.group(0)}' — "
            f"usar const C tokens en su lugar"
        )

    # 3. Forbidden strings
    for needle, reason in FORBIDDEN_STRINGS:
        for m in re.finditer(re.escape(needle), text):
            line_no = text[:m.start()].count('\n') + 1
            violations.append(f"L{line_no}: '{needle}' prohibido — {reason}")

    # 4. Bad radius
    for m in BAD_RADIUS_RE.finditer(text):
        line_no = text[:m.start()].count('\n') + 1
        violations.append(
            f"L{line_no}: radius '{m.group(0)}' — DS usa 8px único (o 50% para círculos)"
        )

    # 5. Non-canonical fonts
    for m in FONT_RE.finditer(text):
        font_str = m.group(1)
        fonts_in_value = [f.strip().strip("'\"") for f in font_str.split(',')]
        for f in fonts_in_value:
            if f and f not in ALLOWED_FONTS:
                line_no = text[:m.start()].count('\n') + 1
                violations.append(
                    f"L{line_no}: fuente no canónica '{f}' — "
                    f"solo DM Sans (400/500/600) y JetBrains Mono"
                )
                break

    return violations


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python validate-tokens.py <archivo.tsx|jsx|css>")
        sys.exit(2)

    violations = check(sys.argv[1])

    if not violations:
        print(f"✓ {sys.argv[1]} — sin violaciones DS")
        sys.exit(0)
    else:
        print(f"✗ {len(violations)} violación(es) en {sys.argv[1]}:\n")
        for v in violations:
            print(f"  {v}")
        sys.exit(1)
