#!/usr/bin/env python3
"""家计本 — make.fun best-household-budget-site entrypoint (stdlib only).

The repository holds the finished static site under app/, its screenshots
under screenshots/ and dossier.json in the repo root. This program copies
those three deliverables to the grader's output directory, exactly like the
kit's own starter does for its single file. Standard library only: no
third-party packages, no network. It runs twice and writes the same bytes
both times, as the competition requires.

Safety: the output directory must never be the repository itself or inside
it (a stale-tree removal there could delete the sources). Every copied file
is verified against its source by sha256 before the program reports success.

  MAKEFUN_OUTPUT_DIR=out python3 main.py   # local check
  python3 main.py                          # sandbox: writes /output/
"""

import hashlib
import json
import os
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT_DIR = Path(os.environ.get("MAKEFUN_OUTPUT_DIR") or "/output").resolve()

# Deliverables, copied in a fixed order so repeated runs are identical.
ITEMS = ("app", "screenshots", "dossier.json")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def fail(msg):
    print(f"main.py: ERROR: {msg}", file=sys.stderr)
    return 2


def main():
    # Guard: never write into the repository itself.
    if OUT_DIR == HERE or HERE in OUT_DIR.parents:
        return fail(f"refusing to write output inside the repository: {OUT_DIR}")

    # Pre-flight: every deliverable must exist, dossier must parse,
    # screenshots must number 3 or 4 (the competition's gate).
    for name in ITEMS:
        if not (HERE / name).exists():
            return fail(f"missing deliverable in repository: {name}")
    try:
        json.loads((HERE / "dossier.json").read_text(encoding="utf-8"))
    except (ValueError, OSError) as e:
        return fail(f"dossier.json does not parse: {e}")
    shots = sorted(p for p in (HERE / "screenshots").iterdir() if p.is_file())
    if not 3 <= len(shots) <= 4:
        return fail(f"expected 3-4 screenshots, found {len(shots)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in ITEMS:
        src, dst = HERE / name, OUT_DIR / name
        if src.is_dir():
            if dst.exists():
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            shutil.copyfile(src, dst)

    # Post-copy verification: every output file must match its source.
    checked, total = 0, 0
    for name in ITEMS:
        src, dst = HERE / name, OUT_DIR / name
        pairs = ([(p, dst / p.relative_to(src)) for p in sorted(src.rglob("*")) if p.is_file()]
                 if src.is_dir() else [(src, dst)])
        for s, d in pairs:
            if not d.is_file() or sha256(s) != sha256(d):
                return fail(f"copy mismatch: {d}")
            checked += 1
            total += d.stat().st_size
    print(f"verified {checked} files, {total} bytes -> {OUT_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
