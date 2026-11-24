@echo off
TITLE CROWDLESS - Delhi Journey Planner
echo ==============================================================
echo           CROWDLESS - Move smarter. Travel calmer.
echo       IIIT Delhi Transport Stack Hackathon Prototype
echo ==============================================================
echo.
echo Starting Python ML Prediction Service on port 8000...
start "CROWDLESS ML Service" cmd /k "cd ml-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Node.js Backend & Web Application on port 5000...
start "CROWDLESS Web Server" cmd /k "cd backend && node dist/src/index.js"

timeout /t 2 /nobreak >nul

echo Opening CROWDLESS in your default browser...
start http://localhost:5000

echo.
echo ==============================================================
echo Services are running:
echo   - Web App & API:   http://localhost:5000
echo   - ML Inference:    http://127.0.0.1:8000
echo   - Health check:    http://localhost:5000/api/health
echo ==============================================================
pause
