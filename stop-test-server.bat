@echo off
REM Script to stop Next.js dev server by killing Node.js processes
REM ================================================================

echo Stopping Next.js development server...
echo.

REM Kill all Node.js processes forcefully
taskkill /F /IM node.exe 2>nul

REM Check if any processes were killed
if %errorlevel% equ 0 (
    echo Node.js processes terminated successfully.
) else (
    echo No Node.js processes were running.
)

REM Keep batch window visible
echo.
echo Done. Press any key to close this window.
pause
