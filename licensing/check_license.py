"""STEP 3: your app checks the license here when it starts.

Use it inside Mark LVI's startup code like this:

    from licensing.check_license import require_license

    info = require_license()               # stops the app if the license is bad
    print("Welcome,", info["holder"])      # only runs if the license is good

You can also test it by hand:

    python -m licensing.check_license

This file also works after you package the app into one file (see PACKAGING.md):
  - app_public.key is read from INSIDE the bundle (it ships with the app).
  - license.key is read from NEXT TO the app, so each user drops in their own.
"""

import sys
from pathlib import Path

from licensing.core import LicenseError, this_machine_id, verify_license


def _resource_path(name: str) -> Path:
    """Where read-only files that SHIP with the app live (like app_public.key)."""
    bundle_dir = getattr(sys, "_MEIPASS", None)  # set when packaged with PyInstaller
    base = Path(bundle_dir) if bundle_dir else Path.cwd()
    return base / name


def _external_path(name: str) -> Path:
    """Where the USER's own files live (like license.key): next to the program."""
    if getattr(sys, "frozen", False):  # running as a packaged one-file app
        return Path(sys.executable).resolve().parent / name
    return Path.cwd() / name


def load_license_info(*, check_machine: bool = False) -> dict:
    """Read and check the license files. Returns the info, or raises LicenseError."""
    public_path = _resource_path("app_public.key")
    license_path = _external_path("license.key")

    if not public_path.exists():
        raise LicenseError(f"Missing {public_path.name} - the app cannot check licenses.")
    if not license_path.exists():
        raise LicenseError(f"No {license_path.name} found. Please add your license file.")

    public_text = public_path.read_text(encoding="ascii")
    license_text = license_path.read_text(encoding="ascii")
    machine_id = this_machine_id() if check_machine else None
    return verify_license(public_text, license_text, machine_id=machine_id)


def require_license(*, check_machine: bool = False) -> dict:
    """Return the license info, or stop the whole app with a clear message."""
    try:
        return load_license_info(check_machine=check_machine)
    except LicenseError as exc:
        raise SystemExit(f"[Mark LVI] License problem: {exc}")


if __name__ == "__main__":
    details = require_license(check_machine=False)
    print("License looks good! (valid)")
    for key, value in details.items():
        print(f"  {key}: {value}")
