@echo off
cd /d "%~dp0"
title OA Screening Backend Setup

echo ==========================================
echo    OA Screening Backend - Quick Starter
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install the LTS version from https://nodejs.org/ and reopen this file.
  pause
  exit /b 1
)

if not exist package.json (
  echo ERROR: package.json was not found.
  echo Please keep this BAT file in the same folder as package.json.
  pause
  exit /b 1
)

if not exist .env (
  if exist .env.example (
    copy .env.example .env >nul
    echo Created .env from .env.example.
    echo For login/database features, edit .env and configure PostgreSQL/JWT settings.
    echo The /health check can be tested once the server starts.
    echo.
  )
)

if not exist node_modules (
  echo Installing backend packages. This may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo Package installation failed. Check the error above and your internet connection.
    pause
    exit /b 1
  )
) else (
  echo node_modules already exists; skipping npm install.
)

echo.
echo Starting backend on port 4000...
echo When you see the listening message, open http://localhost:4000/health
 echo Press Ctrl+C to stop the server.
echo.
call npm run dev
if errorlevel 1 (
  echo.
  echo The server stopped with an error. Please send a screenshot of this window.
)
pause
