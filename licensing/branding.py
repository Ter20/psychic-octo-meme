"""AIX / VIRA branding - colors, names, and asset paths in ONE place.

Change anything here and every window updates. This file has no Tkinter
imports, so it is safe to load even on a computer with no screen.

Colors were sampled from the official AIX logo.
"""

from __future__ import annotations

import sys
from pathlib import Path

# --- Names ---
PRODUCT = "VIRA"
BRAND = "AIX"
TAGLINE = "ARTIFICIAL INTELLIGENCE XTREME"

# --- Colors (straight from the logo) ---
BG = "#041229"          # deep navy background
PANEL = "#0A1F3C"       # slightly lighter navy for panels
ACCENT = "#46BAFE"      # electric blue
ACCENT_SOFT = "#8FD4FF"  # lighter blue for the spark trail
TEXT = "#EAF4FF"        # near-white text
MUTED = "#8FB3D6"       # soft blue-gray for less important text
ERROR = "#FF6B6B"       # red for problems
OK = "#46E0A0"          # green for "all good"


def _asset_dir() -> Path:
    """Where image assets live (works in dev and in a packaged app)."""
    bundle_dir = getattr(sys, "_MEIPASS", None)  # set by PyInstaller when packaged
    base = Path(bundle_dir) if bundle_dir else Path.cwd()
    return base / "assets"


LOGO_PATH = _asset_dir() / "logo.png"
ICON_PATH = _asset_dir() / "icon.png"


def load_photo(tk_module, path: Path):
    """Load a PNG as a Tkinter image, or return None if it is missing."""
    try:
        if Path(path).exists():
            return tk_module.PhotoImage(file=str(path))
    except Exception:  # noqa: BLE001 - a missing/odd image must never crash the app
        pass
    return None
