#!/usr/bin/env bash
# PennyWise Prototype Startup Script
cd "$(dirname "$0")"

if [ -d "venv" ]; then
    ./venv/bin/uvicorn main:app --reload --port 8000 --host 0.0.0.0
else
    python3 -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
fi
