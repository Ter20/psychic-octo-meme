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
        self._segments: list[int] = []
        self._running = True

        # Flicker: strike for a few frames, go dark for a few, then strike again.
        self._on = True
        self._phase_left = 3

        self.bind("<Destroy>", lambda _event: self.stop())
        self._animate()

    def stop(self) -> None:
        self._running = False

    def _jagged_path(self) -> list[float]:
        """A zig-zag lightning path down the seam, re-randomized every frame."""
        nodes = 14
        points: list[float] = []
        for i in range(nodes + 1):
            t = i / nodes
            y = t * self._height
            amp = (1 - abs(2 * t - 1)) * 13  # wild in the middle, tight at the ends
            x = self._seam_x + random.uniform(-amp, amp)
            points.extend((x, y))
        return points

    def _fork(self, path: list[float]) -> list[float]:
        """A short branch splitting off a random point on the main bolt."""
        i = random.randrange(3, len(path) // 2 - 2) * 2
        bx, by = path[i], path[i + 1]
        branch = [bx, by]
        direction = random.choice((-1, 1))
        for _ in range(random.randint(2, 4)):
            bx += direction * random.uniform(6, 16)
            by += random.uniform(7, 15)
            branch.extend((bx, by))
        return branch

    def _draw_bolt(self) -> None:
        path = self._jagged_path()
        # Stack lines widest-to-thinnest to fake a glow around a white-hot core.
        for color, line_w in ((branding.ACCENT, 5), (branding.ACCENT_SOFT, 2), ("#FFFFFF", 1)):
            self._segments.append(
                self.create_line(*path, fill=color, width=line_w, joinstyle="round"))
        for _ in range(random.randint(1, 2)):
            if random.random() < 0.7:
                branch = self._fork(path)
                self._segments.append(
                    self.create_line(*branch, fill=branding.ACCENT_SOFT, width=2))
                self._segments.append(
                    self.create_line(*branch, fill="#FFFFFF", width=1))

    def _animate(self) -> None:
        if not self._running:
            return
        try:
            for item in self._segments:
                self.delete(item)
            self._segments.clear()

            self._phase_left -= 1
            if self._phase_left <= 0:
                self._on = not self._on
                self._phase_left = random.randint(2, 4) if self._on else random.randint(1, 3)
            if self._on:
                self._draw_bolt()  # new jagged shape each frame = flicker

            self.after(55, self._animate)
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
