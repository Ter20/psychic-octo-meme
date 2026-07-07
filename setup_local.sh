#!/usr/bin/env bash
# Run this ON THE SAME MACHINE as your live OmniRoute install.
# OmniRoute only listens on localhost by default, so AIX Mission Control
# has to run alongside it locally to reach it without extra network setup.
set -euo pipefail

cd "$(dirname "$0")"

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env — edit it now and set:"
  echo "  ANTHROPIC_API_KEY   (your Claude API key)"
  echo "  OMNIROUTE_API_KEY   (OmniRoute Dashboard -> Endpoints)"
  echo "OMNIROUTE_API_URL can stay blank; it defaults to http://localhost:20128."
  exit 0
fi

echo "Starting AIX Mission Control on http://localhost:8000 ..."
python -m aix_mission_control.main
