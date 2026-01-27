@echo off
REM Script to start Next.js dev server and open in browser
REM ========================================================

echo Starting Next.js development server...
echo.

REM Open http://localhost:3000 in default browser (in background)
start "" http://localhost:3000

REM Wait 1 second for browser to open
timeout /t 1 /nobreak

echo.
echo Server is running. Close this window to stop the server.
echo.

REM Start npm dev server (blocking - this ties the process to the batch window)
npm run dev
