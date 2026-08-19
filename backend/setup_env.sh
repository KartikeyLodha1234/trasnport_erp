#!/usr/bin/env bash
set -euo pipefail

# Creates a local virtualenv at backend/.venv and installs requirements
WORKDIR=$(dirname "$0")
cd "$WORKDIR"

PY=python3
if ! command -v $PY >/dev/null 2>&1; then
  PY=python
fi

echo "Creating virtual environment at $PWD/.venv using $PY"
$PY -m venv .venv
echo "Activating virtual environment and installing requirements..."
source .venv/bin/activate
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
else
  echo "requirements.txt not found in $PWD"
fi

echo
echo "Setup complete. To activate the environment in this shell:"
echo "  source $PWD/.venv/bin/activate"
