"""STEP 3: your app checks the license here when it starts.

Use it inside Mark LVI's startup code like this:

    from licensing.check_license import require_license

    info = require_license()               # stops the app if the license is bad
    print("Welcome,", info["holder"])      # only runs if the license is good

You can also test it by hand:

    python -m licensing.check_license
"""

from pathlib import Path

from licensing.core import LicenseError, this_machine_id, verify_license

PUBLIC_PATH = Path("app_public.key")
LICENSE_PATH = Path("license.key")


def load_license_info(*, check_machine: bool = False) -> dict:
    """Read and check the license files. Returns the info, or raises LicenseError."""
    if not PUBLIC_PATH.exists():
        raise LicenseError(f"Missing {PUBLIC_PATH} - the app cannot check licenses.")
    if not LICENSE_PATH.exists():
        raise LicenseError(f"No {LICENSE_PATH} found. Please add your license file.")

    public_text = PUBLIC_PATH.read_text(encoding="ascii")
    license_text = LICENSE_PATH.read_text(encoding="ascii")
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
