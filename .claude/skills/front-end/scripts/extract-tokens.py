#!/usr/bin/env python3
"""
Extract SmartCow DS tokens from colors_and_type.css → JSON.
Usage: python extract-tokens.py [path/to/colors_and_type.css]
Default path: docs/design/smartcow-design-system-web-chat/project/colors_and_type.css
"""

import re
import json
import sys
from pathlib import Path

def find_css():
    script_dir = Path(__file__).parent
    project_root = script_dir.parents[3]
    default = project_root / "docs/design/smartcow-design-system-web-chat/project/colors_and_type.css"
    if len(sys.argv) > 1:
        return Path(sys.argv[1])
    return default

def extract(css_path: Path) -> dict:
    text = css_path.read_text()

    colors = {}
    radius = {}
    spacing = {}
    typography = {}

    # Extract :root custom properties
    root_match = re.search(r':root\s*\{([^}]+)\}', text, re.DOTALL)
    if not root_match:
        return {}
    root_block = root_match.group(1)

    for line in root_block.splitlines():
        line = line.strip()
        if not line or line.startswith('/*'):
            continue
        m = re.match(r'(--sc-[\w-]+)\s*:\s*([^;]+);', line)
        if not m:
            continue
        key, val = m.group(1).strip(), m.group(2).strip()
        val = val.split('/*')[0].strip()

        if re.match(r'#[0-9a-fA-F]{3,6}$', val):
            short = key.replace('--sc-', '').replace('-', '_')
            colors[short] = val
        elif 'radius' in key or key == '--sc-r-sm':
            short = key.replace('--sc-', '').replace('-', '_')
            radius[short] = val
        elif key.startswith('--sc-s-'):
            short = key.replace('--sc-s-', '')
            spacing[short] = val
        elif key.startswith('--sc-t-'):
            short = key.replace('--sc-t-', '')
            typography[short] = val

    return {
        "colors": colors,
        "fonts": {
            "sans": "'DM Sans', system-ui, -apple-system, sans-serif",
            "mono": "'JetBrains Mono', ui-monospace, monospace"
        },
        "radius": radius if radius else {"default": "8px"},
        "spacing": spacing,
        "typography": typography,
        "const_C": {
            "ink1":   colors.get("ink_1", "#1a1a1a"),
            "ink2":   colors.get("ink_2", "#888888"),
            "ink3":   colors.get("ink_3", "#bbbbbb"),
            "cream":  colors.get("cream", "#ebe9e3"),
            "note":   colors.get("bg", "#f8f6f1"),
            "noteBd": "#e8e5dd",
            "green":  colors.get("primary", "#1e3a2f"),
            "leaf":   colors.get("accent", "#7ecfa0"),
            "blueFg": colors.get("info", "#1a5276"),
            "warnFg": colors.get("badge_warn_fg", "#9b5e1a"),
        }
    }

if __name__ == "__main__":
    css_path = find_css()
    if not css_path.exists():
        print(f"ERROR: CSS not found at {css_path}", file=sys.stderr)
        sys.exit(1)
    result = extract(css_path)
    print(json.dumps(result, indent=2, ensure_ascii=False))
