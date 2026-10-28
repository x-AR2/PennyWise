@echo off
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
) else if exist "Prototype\venv\Scripts\activate.bat" (
    call Prototype\venv\Scripts\activate.bat
    python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
) else (
    python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
)

