@echo off
REM Script to start Next.js dev server and open in browser
REM ========================================================

echo Starting Next.js development server...
echo.

REM Start npm dev server
start npm run dev

REM Wait 4 seconds for server initialization
timeout /t 4 /nobreak

REM Open http://localhost:3000 in default browser
start http://localhost:3000

echo Browser should open shortly. Press Ctrl+C in this window to stop the server.
