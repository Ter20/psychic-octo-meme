@echo off
title Mission Control Dashboard

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not found.
  echo Download and install it from https://nodejs.org ^(pick LTS^)
  pause
  exit /b 1
)

:: Check .env.local
if not exist "%~dp0.env.local" (
  echo WARNING: .env.local not found. Creating a template...
  (
    echo OPENROUTER_API_KEY=YOUR_KEY_HERE
    echo OPENAI_API_KEY=YOUR_KEY_HERE
    echo OBSIDIAN_VAULT=C:\Users\%USERNAME%\Documents\ObsidianVault
  ) > "%~dp0.env.local"
  echo.
  echo Created .env.local — edit it with your API keys, then re-run this file.
  notepad "%~dp0.env.local"
  pause
  exit /b 0
)

:: Install deps if node_modules is missing
if not exist "%~dp0node_modules" (
  echo Installing dependencies ^(first run only — takes a minute^)...
  call npm install
  if errorlevel 1 (
    echo npm install failed. See error above.
    pause
    exit /b 1
  )
)

echo.
echo  Mission Control is starting...
echo  Open http://localhost:3000 in your browser.
echo  Press Ctrl+C to stop.
echo.

call npm run dev
pause
