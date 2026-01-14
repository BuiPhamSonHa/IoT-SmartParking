\
@echo off
setlocal
cd /d "%~dp0"
title SmartPark Frontend (Windows)

echo ======================================================
echo   SmartPark Frontend - run (Windows)
echo ======================================================
echo Folder: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js LTS, then retry.
  echo.
  pause
  exit /b 1
)

echo [1/2] Installing dependencies (first time may take a while)...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting Vite dev server...
echo Open: http://localhost:5173
echo.
call npm run dev

echo.
echo Stopped.
pause
