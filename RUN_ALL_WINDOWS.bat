\
@echo off
setlocal
cd /d "%~dp0"
title SmartPark Fullstack (Windows)

echo ======================================================
echo   SmartPark Fullstack - one click run (Windows)
echo ======================================================
echo This will open TWO terminals:
echo   1) Backend FastAPI on http://localhost:8080
echo   2) Frontend Vite on http://localhost:5173
echo ======================================================
echo.

start "SmartPark Backend (FastAPI)" cmd /k "cd backend && RUN_BACKEND_WINDOWS.bat"
start "SmartPark Frontend (Vite)" cmd /k "cd frontend && RUN_WINDOWS.bat"

echo.
echo If you see errors, keep both windows open and read the logs.
echo.
pause
