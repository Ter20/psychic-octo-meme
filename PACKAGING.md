# Packaging Mark LVI into one file 📦

This makes a single program file (one `.exe` on Windows, or one runnable file
on Mac/Linux) so people can run Mark LVI **without installing Python** and
without easily seeing your source code. It also bundles the **public** key so
the license check still works.

> This is extra protection, not perfect protection. A very determined person
> can still pick apart any program. But it stops casual copying and hides your
> code from normal users.

## One-time setup

```bash
pip install -r requirements.txt
pip install pyinstaller
```

Make sure you have already made your keys and a license:

```bash
python -m licensing.make_keys
python -m licensing.issue_license --holder "Me"
```

## Build the one-file app

**Mac / Linux:**
```bash
pyinstaller --onefile --windowed --name VIRA \
  --add-data "app_public.key:." \
  --add-data "assets:assets" \
  main.py
```

**Windows (note the `;` instead of `:`):**
```bash
pyinstaller --onefile --windowed --name VIRA ^
  --add-data "app_public.key;." ^
  --add-data "assets;assets" ^
  main.py
```

> `--add-data "assets:assets"` bundles the AIX logo so the branded window
> still shows it. `--windowed` hides the black terminal box (remove it if you
> want to keep the text console while testing).

When it finishes, your single program file is in the **`dist/`** folder:
- Mac/Linux: `dist/VIRA`
- Windows: `dist/VIRA.exe`

## Give it to someone

1. Send them the program file from `dist/`.
2. Send them their **`license.key`** (make one with `issue_license`).
3. They put `license.key` in the **same folder** as the program, then run it.

## Rules to stay safe 🔒

- ✅ `app_public.key` is bundled inside the app. That is fine - it is public.
- ❌ **Never** bundle or send `secrets/owner_private.key`. That is your stamp.
- ℹ️ `license.key` is kept **outside** the program on purpose, so each person
  can use their own license without you rebuilding the app.

## Cleaning up build files

PyInstaller creates `build/`, `dist/`, and a `*.spec` file. They are already
ignored by git, so they will not be uploaded.
