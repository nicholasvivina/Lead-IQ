@echo off
echo ========================================================
echo       LeadIQ - AI-Powered Lead Enrichment System
echo ========================================================
echo Starting FastAPI Backend and Vite React Frontend...
echo.

start "LeadIQ Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "LeadIQ Frontend (Vite React)" cmd /k "cd frontend && npm run dev"

echo.
echo [OK] Backend starting at: http://127.0.0.1:8000 (Swagger docs at /docs)
echo [OK] Frontend starting at: http://localhost:5173
echo ========================================================
