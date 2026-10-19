"""STEP 1 (run this ONCE): make your secret stamp and its public photo.

How to run (from your project folder):

    python -m licensing.make_keys

It creates two files:
  secrets/owner_private.key  <-- YOUR SECRET. Never share it. Never put it on git.
  app_public.key             <-- Safe. This ships inside your app.

If you ever lose owner_private.key, you can no longer make NEW licenses with
the same stamp, and old licenses stop matching a new stamp. So keep a backup
somewhere safe and private (not in the code repo).
"""

from pathlib import Path

from licensing.core import generate_keypair

SECRETS_DIR = Path("secrets")
PRIVATE_PATH = SECRETS_DIR / "owner_private.key"
PUBLIC_PATH = Path("app_public.key")


def main() -> None:
    SECRETS_DIR.mkdir(exist_ok=True)

    if PRIVATE_PATH.exists():
        print(f"A secret key already exists at: {PRIVATE_PATH}")
        print("Keep using it. Only delete it by hand if you truly want to start")
        print("over -- doing that makes every old license stop working.")
        return

    generate_keypair(PRIVATE_PATH, PUBLIC_PATH)
    print("Done! Your stamp is ready:")
    print(f"  SECRET (keep safe, do NOT share): {PRIVATE_PATH}")
    print(f"  PUBLIC (ship inside the app)    : {PUBLIC_PATH}")


if __name__ == "__main__":
    main()
