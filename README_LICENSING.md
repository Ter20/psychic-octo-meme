# Mark LVI — License Keys (simple guide)

This folder gives Mark LVI (your "Jarvis" prototype, codename **VIRA**) a way to
lock the app behind a **license key**, so only people you give a key to can run it.

## The big idea (wax stamp 🕯️)

- You own a **secret stamp** (a private key). Only you have it.
- Your app carries a **photo of the stamp** (a public key).
- You **stamp** each license you hand out.
- When the app starts, it checks the stamp against the photo:
  *"Is this a real stamp I made?"* If yes → run. If fake/expired → stop.
- Even if someone reads **all** your app code, they only find the *photo*.
  You cannot make a stamp from a photo, so **nobody can forge your keys.**

## What's in here

| File | What it is for |
|------|----------------|
| `licensing/core.py` | The engine (makes keys, stamps licenses, checks them). |
| `licensing/make_keys.py` | **Step 1** — make your stamp (run once). |
| `licensing/issue_license.py` | **Step 2** — stamp a license for someone. |
| `licensing/check_license.py` | **Step 3** — the app checks the license at startup. |

## Set up (one time)

```bash
# 1) install the one library we need
pip install -r requirements.txt

# 2) make your stamp (creates secrets/owner_private.key + app_public.key)
python -m licensing.make_keys
```

> ⚠️ **Keep `secrets/owner_private.key` private.** Never share it, never commit it.
> `.gitignore` already blocks it. Make a private backup somewhere safe.

## Make a license (do this for each person — or yourself)

```bash
# never expires
python -m licensing.issue_license --holder "Terrence"

# expires on a date
python -m licensing.issue_license --holder "Terrence" --expires 2027-01-01

# only works on THIS computer
python -m licensing.issue_license --holder "Me" --lock-to-this-machine
```

This saves the key to `license.key`. Give that file (or the printed text) to the
person. They put it next to the app and run it.

## Check the license (inside Mark LVI)

Add these two lines at the very top of your app's startup:

```python
from licensing.check_license import require_license

info = require_license()            # stops the app if the key is bad/missing/expired
print("Welcome,", info["holder"])   # only reached when the key is good
# ...then your normal Gemini / Mark LVI code runs...
```

To test by hand:

```bash
python -m licensing.check_license
```

## Nicer for users: a popup window 🪟

Non-techy users should not have to copy files. `main.py` already uses a popup:
the first time someone runs the app with no license, a small window appears
asking them to paste their key (or load a `.key` file). Once they activate, the
key is saved and the window never comes back.

- The popup uses **Tkinter**, which comes with Python on **Windows and Mac**.
- On **Linux** only, install it once: `sudo apt install python3-tk`
- No screen (e.g. a server)? The app falls back to a clear text message instead
  of crashing.

Test the window by hand:

```bash
python -m licensing.license_window
```

## Good to know

- This checking works **offline** — no server needed.
- It's strong against forgery (real digital signatures).
- It does **not** stop someone from editing your open-source code to delete the
  check. That is normal for any app you ship as source. The signature stops
  people from making **fake keys**, which is the main thing you asked for.
