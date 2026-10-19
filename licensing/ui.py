"""Shared UI bits for the AIX / VIRA windows (needs Tkinter / a screen).

The star here is ElectricLogo: it shows the logo and animates a glowing
electric bolt that travels down the middle "split" of the face, like the
real AIX logo. If anything about the animation fails, the still logo is
still shown - it never crashes the window.
"""

from __future__ import annotations

import random
import tkinter as tk

from licensing import branding


class ElectricLogo(tk.Canvas):
    """A canvas that shows the logo with a spark running down the center."""

    def __init__(self, parent, photo, *, seam_x_frac: float = 0.5):
        width = photo.width()
        height = photo.height()
        super().__init__(parent, width=width, height=height,
                         bg=branding.BG, highlightthickness=0)
        self._photo = photo  # keep a reference so it is not garbage-collected
        self.create_image(0, 0, anchor="nw", image=photo)

        self._width = width
        self._height = height
        self._seam_x = int(width * seam_x_frac)
        self._y = 0
        self._segments: list[int] = []
        self._running = True

        # The bolt: a white-hot core with blue edges that fade out.
        self._colors = [branding.ACCENT, branding.ACCENT_SOFT, "#FFFFFF",
                        branding.ACCENT_SOFT, branding.ACCENT]
        self._widths = [2, 3, 4, 3, 2]
        self._seg_len = 9

        self.bind("<Destroy>", lambda _event: self.stop())
        self._animate()

    def stop(self) -> None:
        self._running = False

    def _animate(self) -> None:
        if not self._running:
            return
        try:
            for item in self._segments:
                self.delete(item)
            self._segments.clear()

            for i, (color, line_w) in enumerate(zip(self._colors, self._widths)):
                top = self._y - i * self._seg_len
                if top < 0:
                    continue
                jitter = random.randint(-2, 2)  # tiny wiggle = electric feel
                x = self._seam_x + jitter
                item = self.create_line(x, top, x, top - self._seg_len,
                                        fill=color, width=line_w, capstyle="round")
                self._segments.append(item)

            self._y += 8
            if self._y > self._height + self._seg_len * len(self._colors):
                self._y = 0
            self.after(40, self._animate)
        except tk.TclError:
            # The window was closed mid-animation; just stop quietly.
            self._running = False


def style_button(parent, text: str, command, *, primary: bool = False):
    """Make a flat, on-brand button."""
    if primary:
        bg, fg, active = branding.ACCENT, branding.BG, branding.ACCENT_SOFT
    else:
        bg, fg, active = branding.PANEL, branding.TEXT, "#13335C"
    return tk.Button(
        parent, text=text, command=command,
        bg=bg, fg=fg, activebackground=active, activeforeground=fg,
        relief="flat", bd=0, padx=14, pady=7, cursor="hand2",
        font=("Arial", 10, "bold"),
    )


def add_header(parent) -> None:
    """Add the animated logo + VIRA / AIX wordmark to the top of a window."""
    photo = branding.load_photo(tk, branding.LOGO_PATH)
    if photo is not None:
        ElectricLogo(parent, photo).pack(pady=(14, 6))
    tk.Label(parent, text=branding.PRODUCT, bg=branding.BG, fg=branding.TEXT,
             font=("Arial", 22, "bold")).pack()
    tk.Label(parent, text=f"{branding.BRAND}  ·  {branding.TAGLINE}",
             bg=branding.BG, fg=branding.ACCENT,
             font=("Arial", 9, "bold")).pack(pady=(0, 8))
