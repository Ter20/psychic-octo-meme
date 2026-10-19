"""A simple popup window that asks the user to paste their license key.

- If a valid license.key already exists, the window does NOT appear.
- If not, the window lets the user paste a key (or load a .key file),
  checks it, and saves it next to the app so they only do this once.

The popup needs Tkinter. Tkinter comes WITH Python on Windows and Mac.
On Linux you may need to install it once:  sudo apt install python3-tk

Run the window by hand to test it:
    python -m licensing.license_window
"""

from __future__ import annotations

from licensing.check_license import _external_path, _resource_path, load_license_info
from licensing.core import LicenseError, this_machine_id, verify_license


def activate_from_text(license_text: str, *, check_machine: bool = False) -> dict:
    """Check a pasted key and, if good, save it as the app's license.key.

    Returns the license info on success.
    Raises LicenseError if the key is fake, expired, or for another computer.
    """
    public_path = _resource_path("app_public.key")
    if not public_path.exists():
        raise LicenseError("Missing app_public.key - the app cannot check licenses.")

    public_text = public_path.read_text(encoding="ascii")
    machine_id = this_machine_id() if check_machine else None

    # Raises LicenseError if the key is not valid.
    info = verify_license(public_text, license_text, machine_id=machine_id)

    # The key is good -> save it next to the app so we never ask again.
    _external_path("license.key").write_text(license_text.strip(), encoding="ascii")
    return info


def prompt_for_license(*, check_machine: bool = False) -> dict | None:
    """Open the popup window. Returns the license info if activated, else None."""
    import tkinter as tk
    from tkinter import filedialog, scrolledtext

    result: dict = {}

    root = tk.Tk()
    root.title("Mark LVI - Activate")
    root.geometry("470x330")
    root.resizable(False, False)

    tk.Label(root, text="Enter your license key", font=("Arial", 14, "bold")).pack(pady=(16, 2))
    tk.Label(root, text="Paste the key you were given, then click Activate.",
             fg="#555555").pack()

    text_box = scrolledtext.ScrolledText(root, height=6, width=54, wrap="char")
    text_box.pack(padx=16, pady=10)
    text_box.focus_set()

    status = tk.Label(root, text="", fg="#b00020", wraplength=430, justify="left")
    status.pack()

    def load_from_file() -> None:
        path = filedialog.askopenfilename(
            title="Choose your license file",
            filetypes=[("License files", "*.key *.lic"), ("All files", "*.*")],
        )
        if path:
            with open(path, "r", encoding="ascii") as handle:
                text_box.delete("1.0", "end")
                text_box.insert("1.0", handle.read().strip())

    def activate() -> None:
        key = text_box.get("1.0", "end").strip()
        if not key:
            status.config(text="Please paste your key first.")
            return
        try:
            info = activate_from_text(key, check_machine=check_machine)
        except LicenseError as exc:
            status.config(text=f"Sorry: {exc}")
            return
        result.update(info)
        root.destroy()

    row = tk.Frame(root)
    row.pack(pady=8)
    tk.Button(row, text="Load from file...", command=load_from_file).pack(side="left", padx=6)
    tk.Button(row, text="Activate", command=activate, default="active").pack(side="left", padx=6)

    root.bind("<Return>", lambda _event: activate())
    root.mainloop()

    return result or None


def ensure_licensed(*, check_machine: bool = False, allow_popup: bool = True) -> dict:
    """Return license info. If there is none yet, show the popup when possible.

    Order:
      1) A valid license.key already exists -> return it (no window).
      2) Otherwise open the popup so the user can paste a key.
      3) If no screen/Tkinter is available -> raise LicenseError with a hint.
    """
    try:
        return load_license_info(check_machine=check_machine)
    except LicenseError:
        pass  # no valid license yet -> try the popup below

    if not allow_popup:
        raise LicenseError("No valid license found.")

    try:
        import tkinter  # noqa: F401  (only checking that it exists)
    except ImportError as exc:
        raise LicenseError(
            "No valid license found, and the popup needs Tkinter "
            "(on Linux run: sudo apt install python3-tk)."
        ) from exc

    info = prompt_for_license(check_machine=check_machine)
    if info is None:
        raise LicenseError("Activation cancelled - no valid license was entered.")
    return info


if __name__ == "__main__":
    details = ensure_licensed()
    print("Activated! Welcome,", details["holder"])
