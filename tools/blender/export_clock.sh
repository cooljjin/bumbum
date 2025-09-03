#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

OUT_PATH="${1:-$PROJECT_ROOT/exports/clock.glb}"
FONT_PATH="${2:-}" # optional

if ! command -v blender >/dev/null 2>&1; then
  echo "Blender not found. Install Blender and ensure 'blender' is on PATH." >&2
  echo "macOS (Homebrew): brew install --cask blender" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT_PATH")"

echo "Exporting clock to $OUT_PATH"
if [[ -n "$FONT_PATH" ]]; then
  blender -b -P "$SCRIPT_DIR/make_clock.py" -- --out "$OUT_PATH" --font "$FONT_PATH"
else
  blender -b -P "$SCRIPT_DIR/make_clock.py" -- --out "$OUT_PATH"
fi

echo "Done: $OUT_PATH"

