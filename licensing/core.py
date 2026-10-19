"""
Mark LVI - License engine (the "stamp machine").

Plain-language idea
-------------------
- You own a SECRET STAMP (the private key). Only you have it.
- Your app carries a PHOTO of that stamp (the public key).
- You STAMP each license. The app checks the stamp is real.
- Nobody can fake the stamp, even if they read your whole app's code,
  because a photo can CHECK a stamp but cannot MAKE one.

Under the hood this uses Ed25519 digital signatures from the well-tested
`cryptography` library. You do not need to understand the math to use it.
"""

from __future__ import annotations

import base64
import hashlib
import json
import platform
import uuid
from datetime import date
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


class LicenseError(Exception):
    """Raised when a license is missing, fake, expired, or for another computer."""


# --- tiny helpers to turn bytes into safe text and back ----------------------

def _b64url_encode(raw: bytes) -> str:
    """Turn raw bytes into short, URL-safe text (no padding)."""
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    """Turn that text back into raw bytes."""
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


# --- STEP 1: make your stamp (run once) --------------------------------------

def generate_keypair(private_path: str | Path, public_path: str | Path) -> None:
    """Create a new SECRET stamp (private key) and its PHOTO (public key)."""
    private_path = Path(private_path)
    public_path = Path(public_path)

    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_path.write_text(_b64url_encode(private_key.private_bytes_raw()), encoding="ascii")
    public_path.write_text(_b64url_encode(public_key.public_bytes_raw()), encoding="ascii")

    # Best effort: make the secret file readable only by you (ignored on Windows).
    try:
        private_path.chmod(0o600)
    except OSError:
        pass


def _load_private(private_path: str | Path) -> Ed25519PrivateKey:
    raw = _b64url_decode(Path(private_path).read_text(encoding="ascii").strip())
    return Ed25519PrivateKey.from_private_bytes(raw)


def _load_public(public_text: str) -> Ed25519PublicKey:
    return Ed25519PublicKey.from_public_bytes(_b64url_decode(public_text.strip()))


# --- STEP 2: stamp a license -------------------------------------------------

def make_license(
    private_path: str | Path,
    *,
    holder: str,
    product: str = "Mark LVI",
    plan: str = "personal",
    expires: str | None = None,
    machine_id: str | None = None,
) -> str:
    """Create one signed license string.

    holder     : who the license is for (a name or email)
    expires    : end date "YYYY-MM-DD", or None for no end date
    machine_id : lock to one computer, or None for any computer
    """
    payload = {
        "product": product,
        "holder": holder,
        "plan": plan,
        "issued": date.today().isoformat(),
        "expires": expires,
        "machine_id": machine_id,
    }
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    signature = _load_private(private_path).sign(body)
    return f"{_b64url_encode(body)}.{_b64url_encode(signature)}"


# --- STEP 3: check a license -------------------------------------------------

def verify_license(
    public_text: str,
    license_text: str,
    *,
    machine_id: str | None = None,
) -> dict:
    """Check a license. Returns the info inside it, or raises LicenseError."""
    license_text = license_text.strip()

    # 1) Split the license into its two parts: the message and the stamp.
    try:
        body_b64, sig_b64 = license_text.split(".")
        body = _b64url_decode(body_b64)
        signature = _b64url_decode(sig_b64)
    except Exception as exc:  # noqa: BLE001 - any shape problem means "not valid"
        raise LicenseError("This license is not in the right shape.") from exc

    # 2) Is the stamp real? (Was it made with YOUR secret key?)
    try:
        _load_public(public_text).verify(signature, body)
    except InvalidSignature as exc:
        raise LicenseError("Fake stamp - this license was not made by you.") from exc

    payload = json.loads(body.decode("utf-8"))

    # 3) Has it run out?
    expires = payload.get("expires")
    if expires and date.fromisoformat(expires) < date.today():
        raise LicenseError(f"This license ended on {expires}.")

    # 4) Is it locked to a different computer?
    wanted = payload.get("machine_id")
    if wanted and machine_id and wanted != machine_id:
        raise LicenseError("This license is locked to a different computer.")

    return payload


# --- optional: a simple id for THIS computer ---------------------------------

def this_machine_id() -> str:
    """A simple, stable-ish id for this computer (used for machine-locking)."""
    raw = f"{platform.node()}|{uuid.getnode()}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]
