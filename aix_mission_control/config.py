import os

from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-sonnet-5")

OMNIROUTE_API_URL = os.environ.get("OMNIROUTE_API_URL", "")
OMNIROUTE_API_KEY = os.environ.get("OMNIROUTE_API_KEY", "")
