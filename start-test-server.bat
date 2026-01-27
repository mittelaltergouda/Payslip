@echo off
REM Script to start Next.js dev server and open in browser
REM ========================================================

echo Starting Next.js development server...
echo.

REM Start npm dev server in a separate named window (non-blocking)
start "Next.js Dev Server" npm run dev

REM Wait 5 seconds for server to fully initialize
timeout /t 5 /nobreak

REM Now open browser after server is ready
start "" http://localhost:3000

REM Keep batch window visible and running
echo.
echo Browser opened. Close this window to stop the server.
pause
