# LeadIQ Quickstart PowerShell Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       LeadIQ - AI-Powered Lead Enrichment System" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting FastAPI Backend and Vite React Frontend..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "[OK] Backend running at:  http://127.0.0.1:8000 (Swagger: http://127.0.0.1:8000/docs)" -ForegroundColor Green
Write-Host "[OK] Frontend running at: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
