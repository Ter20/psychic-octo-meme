"""Mark LVI licensing package.

Three simple steps:
  1. licensing.make_keys      -> make your stamp (run once)
  2. licensing.issue_license  -> stamp a license for someone
  3. licensing.check_license  -> your app checks the license at startup
"""

from .core import (
    LicenseError,
    generate_keypair,
    make_license,
    this_machine_id,
    verify_license,
)

__all__ = [
    "LicenseError",
    "generate_keypair",
    "make_license",
    "this_machine_id",
    "verify_license",
]
