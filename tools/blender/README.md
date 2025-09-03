Blender Clock Export
====================

This folder contains a Blender Python script that generates a simple wall clock (similar to a classic black-rim design) and exports it to a GLB file. It runs headless, so no UI is needed.

Files
- make_clock.py: Creates the clock and exports GLB.
- export_clock.sh: Convenience wrapper that calls Blender with the script.

Requirements
- Blender installed and available on PATH.
  - macOS (Homebrew): `brew install --cask blender`
  - Linux: use your distro package or the official tarball
  - Windows: install Blender and add `blender` to PATH

Usage
1) Direct, via Blender CLI

   blender -b -P tools/blender/make_clock.py -- --out exports/clock.glb

   Optional custom font for digits:

   blender -b -P tools/blender/make_clock.py -- --out exports/clock.glb --font "/path/to/Arial Bold.ttf"

2) Using the wrapper script

   bash tools/blender/export_clock.sh exports/clock.glb "/path/to/Arial Bold.ttf"

Output
- A GLB file at `exports/clock.glb` (or your chosen path) that can be imported into three.js, babylon.js, or Blender.

