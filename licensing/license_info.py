"""Show WHO the app is licensed to and WHEN it expires (AIX / VIRA branded).

On a computer with a screen:
    python -m licensing.license_info     # opens a branded window

In a plain terminal it prints the same details as text.
You can also show the window from your own code:

    from licensing.license_info import show_license_info
    show_license_info()
"""

from __future__ import annotations

from datetime import date

from licensing.check_license import load_license_info
from licensing.core import LicenseError


def license_rows(*, check_machine: bool = False) -> list[tuple[str, str]]:
    """Return license details as (label, value) rows. Raises LicenseError if none."""
    info = load_license_info(check_machine=check_machine)

    expires = info.get("expires")
    if expires:
        days_left = (date.fromisoformat(expires) - date.today()).days
        if days_left >= 0:
            expires_value = f"{expires}  ({days_left} days left)"
        else:
            expires_value = f"{expires}  (EXPIRED)"
    else:
        expires_value = "Never (lifetime)"

    return [
        ("Product", info.get("product", "")),
        ("Licensed to", info.get("holder", "")),
        ("Plan", info.get("plan", "")),
        ("Issued", info.get("issued", "")),
        ("Expires", expires_value),
        ("Locked to computer", "Yes" if info.get("machine_id") else "No (any computer)"),
    ]


def license_info_text(*, check_machine: bool = False) -> str:
    """Plain-text version of the license details (for terminals / testing)."""
    try:
        rows = license_rows(check_machine=check_machine)
    except LicenseError as exc:
        return f"No valid license: {exc}"
    width = max(len(label) for label, _ in rows)
    return "\n".join(f"{label.rjust(width)} :  {value}" for label, value in rows)


def show_license_info(*, check_machine: bool = False) -> None:
    """Open a branded window showing who the license is for and when it ends."""
    import tkinter as tk

    from licensing import branding, ui

    root = tk.Tk()
    root.title(f"{branding.PRODUCT} by {branding.BRAND} - License")
    root.configure(bg=branding.BG)
    root.geometry("440x560")
    root.resizable(False, False)

    icon = branding.load_photo(tk, branding.ICON_PATH)
    if icon is not None:
        root.iconphoto(False, icon)

    ui.add_header(root)  # animated electric logo + VIRA / AIX wordmark

    detail = ""
    try:
        rows = license_rows(check_machine=check_machine)
        valid = True
    except LicenseError as exc:
        rows = []
        detail = str(exc)
        valid = False

    tk.Label(root, text="LICENSE ACTIVE" if valid else "NOT LICENSED",
             bg=branding.BG, fg=branding.OK if valid else branding.ERROR,
             font=("Arial", 12, "bold")).pack(pady=(4, 10))

    if valid:
        card = tk.Frame(root, bg=branding.PANEL)
        card.pack(padx=18, fill="x")
        for label, value in rows:
            line = tk.Frame(card, bg=branding.PANEL)
            line.pack(fill="x", padx=12, pady=5)
            tk.Label(line, text=label, bg=branding.PANEL, fg=branding.MUTED,
                     font=("Arial", 9, "bold"), width=16, anchor="w").pack(side="left")
            tk.Label(line, text=value, bg=branding.PANEL, fg=branding.TEXT,
                     font=("Arial", 10), anchor="w", justify="left",
                     wraplength=230).pack(side="left")
    else:
        tk.Label(root, text=detail, bg=branding.BG, fg=branding.MUTED,
                 wraplength=400).pack(pady=8)

    ui.style_button(root, "Close", root.destroy, primary=True).pack(pady=16)
    root.mainloop()


if __name__ == "__main__":
    try:
        import tkinter  # noqa: F401 - only to see if a screen library exists
        show_license_info()
    except ImportError:
        print(license_info_text())
