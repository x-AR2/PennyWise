# PennyWise Setup Guide

Setup and execution instructions for running PennyWise on Linux and Windows.

---

## Linux Setup

### Prerequisites
- Python 3.10+
- `pip`
- `git`

### Instructions

1. **Clone the repository:**
   ```bash
   git clone git@github.com:x-AR2/PennyWise.git
   cd PennyWise/Prototype
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *(Alternatively, run `./run.sh`)*

5. **Open in your browser:**
   Navigate to [http://localhost:8000](http://localhost:8000)

---

## Windows Setup

### Prerequisites
- Python 3.10+
- `pip`
- `git`

### Instructions

1. **Clone the repository:**
   ```cmd
   git clone git@github.com:x-AR2/PennyWise.git
   cd PennyWise\Prototype
   ```

2. **Create and activate a virtual environment:**
   ```cmd
   python -m venv venv
   venv\Scripts\activate
   ```
   *(If using PowerShell, run: `.\venv\Scripts\Activate.ps1`)*

3. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

4. **Run the application:**
   ```cmd
   python -m uvicorn main:app --reload --port 8000
   ```
   *(Alternatively, run `run.bat`)*

5. **Open in your browser:**
   Navigate to [http://localhost:8000](http://localhost:8000)
