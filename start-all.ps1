# CROWDLESS All-In-One PowerShell Launcher
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host "          CROWDLESS - Move smarter. Travel calmer.             " -ForegroundColor White
Write-Host "      IIIT Delhi Transport Stack Hackathon Prototype          " -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Python FastAPI ML service
Write-Host "[1/3] Starting Python ML Prediction Service on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\ml-service'; python -m uvicorn main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

# 2. Start Node.js Backend & unified web app
Write-Host "[2/3] Starting Node.js Backend on port 5000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir\backend'; node dist/src/index.js"

Start-Sleep -Seconds 2

# 3. Open in browser
Write-Host "[3/3] Opening CROWDLESS Web Application..." -ForegroundColor Green
Start-Process "http://localhost:5000"

Write-Host "`nAll services online:" -ForegroundColor Cyan
Write-Host "  - Frontend & API:   http://localhost:5000" -ForegroundColor White
Write-Host "  - ML Predictor:     http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - API Health:       http://localhost:5000/api/health" -ForegroundColor White
