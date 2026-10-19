"""Shared UI bits for the AIX / VIRA windows (needs Tkinter / a screen).

The star here is ElectricLogo: it shows the logo and animates a glowing
electric bolt that travels down the middle "split" of the face, like the
real AIX logo. If anything about the animation fails, the still logo is
still shown - it never crashes the window.
"""

from __future__ import annotations

import tkinter as tk

from licensing import branding


class ElectricLogo(tk.Canvas):
    """A canvas that shows the logo with a spark running down the center."""

    # One cycle: flash, gap, flash (two strikes), then a long calm rest. Loops.
    _PATTERN = [1, 1, 0, 0, 1, 1, 0] + [0] * 16

    def __init__(self, parent, photo, *, seam_x_frac: float = 0.52):
        width = photo.width()
        height = photo.height()
        super().__init__(parent, width=width, height=height,
                         bg=branding.BG, highlightthickness=0)
        self._photo = photo  # keep a reference so it is not garbage-collected
        self.create_image(0, 0, anchor="nw", image=photo)

        self._width = width
        self._height = height
        self._seam_x = int(width * seam_x_frac)
        self._path = self._maze_path()  # a fixed bolt - the SAME shape each strike
        self._segments: list[int] = []
        self._frame = 0
        self._running = True

        self.bind("<Destroy>", lambda _event: self.stop())
        self._animate()

    def stop(self) -> None:
        self._running = False

    def _maze_path(self) -> list[float]:
        """A clean bolt that runs straight down the seam with right-angle jogs."""
        x = self._seam_x
        h = self._height
        # (x-offset from the seam, fraction down the logo); right angles between them.
        nodes = [
            (0, 0.00), (0, 0.30),
            (10, 0.30), (10, 0.56),
            (-8, 0.56), (-8, 0.82),
            (0, 0.82), (0, 1.00),
        ]
        points: list[float] = []
        for dx, t in nodes:
            points.extend((x + dx, t * h))
        return points

    def _draw_bolt(self) -> None:
        # Stack lines widest-to-thinnest to glow around a white-hot core.
        for color, line_w in ((branding.ACCENT, 6), (branding.ACCENT_SOFT, 3), ("#FFFFFF", 2)):
            self._segments.append(
                self.create_line(*self._path, fill=color, width=line_w, joinstyle="miter"))

    def _animate(self) -> None:
        if not self._running:
            return
        try:
            for item in self._segments:
                self.delete(item)
            self._segments.clear()

            if self._PATTERN[self._frame % len(self._PATTERN)]:
                self._draw_bolt()
            self._frame += 1

            self.after(60, self._animate)
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
