"""
Mark LVI / VIRA - main startup file.

What happens here, in order:
  1. Load secret settings from a .env file (like your Gemini API key).
  2. CHECK THE LICENSE. If it is missing / fake / expired, the app stops here.
  3. Only then start the real assistant (currently Google Gemini).

If your Mark LVI already lives in another file on your computer, you only
need to copy the one block marked  >>> COPY ME  into the TOP of that file.
"""

from __future__ import annotations

import os

# >>> COPY ME: load secret settings, then check the license -------------------
from dotenv import load_dotenv

from licensing.check_license import require_license

load_dotenv()  # reads a file named .env in this folder (if it exists)

# Stops the whole app with a clear message if the license is not valid.
# Tip: use require_license(check_machine=True) to also lock to one computer.
license_info = require_license()
print(f"[Mark LVI] License OK. Welcome, {license_info['holder']}! (plan: {license_info['plan']})")
# <<< end COPY ME -------------------------------------------------------------


def start_assistant() -> None:
    """Your real Mark LVI / VIRA logic goes here. This demo uses Google Gemini."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print()
        print("No GEMINI_API_KEY found. To fix this:")
        print("  1) Copy the file .env.example to a new file named  .env")
        print("  2) Put your key inside it:  GEMINI_API_KEY=your-key-here")
        print("  3) Run this program again.")
        return

    try:
        from google import genai
    except ImportError:
        print()
        print("The Gemini library is not installed yet. Install it with:")
        print("  pip install -r requirements.txt")
        return

    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    print()
    print("Mark LVI is ready. Type a message, or 'quit' to leave.")
    while True:
        try:
            you = input("you  > ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if you.lower() in {"quit", "exit", "bye"}:
            break
        if not you:
            continue
        reply = client.models.generate_content(model=model, contents=you)
        print("mark >", reply.text)


if __name__ == "__main__":
    start_assistant()
