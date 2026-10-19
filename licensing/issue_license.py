"""STEP 2: make (stamp) a license for a person -- or for yourself.

Examples (run from your project folder):

    # a simple license that never ends
    python -m licensing.issue_license --holder "Terrence"

    # a license that stops working after a date
    python -m licensing.issue_license --holder "Terrence" --expires 2027-01-01

    # a license that only works on THIS computer
    python -m licensing.issue_license --holder "Me" --lock-to-this-machine

It prints the license and also saves it to a file (default: license.key).
Give that file (or the printed text) to the person who should be allowed in.
"""

import argparse
from pathlib import Path

from licensing.core import make_license, this_machine_id

PRIVATE_PATH = Path("secrets") / "owner_private.key"


def main() -> None:
    parser = argparse.ArgumentParser(description="Make a Mark LVI license.")
    parser.add_argument("--holder", required=True, help="Who the license is for.")
    parser.add_argument("--plan", default="personal", help="Plan name (default: personal).")
    parser.add_argument("--expires", default=None, help="End date YYYY-MM-DD (default: never).")
    parser.add_argument(
        "--lock-to-this-machine",
        action="store_true",
        help="Only let THIS computer use the license.",
    )
    parser.add_argument("--out", default="license.key", help="File to save it to.")
    args = parser.parse_args()

    if not PRIVATE_PATH.exists():
        raise SystemExit("No secret key found. First run:  python -m licensing.make_keys")

    machine_id = this_machine_id() if args.lock_to_this_machine else None
    license_text = make_license(
        PRIVATE_PATH,
        holder=args.holder,
        plan=args.plan,
        expires=args.expires,
        machine_id=machine_id,
    )

    Path(args.out).write_text(license_text, encoding="ascii")
    print(f"License made and saved to: {args.out}")
    print()
    print(license_text)


if __name__ == "__main__":
    main()
