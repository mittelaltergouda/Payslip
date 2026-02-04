@echo off
REM Script to stop all running Node.js processes
REM ========================================================

echo Stopping all Node.js processes...
echo.

REM Kill all running Node.js processes forcefully
taskkill /F /IM node.exe >nul 2>&1

REM Check if any processes were found and killed
if %ERRORLEVEL% equ 0 (
    echo All Node.js processes have been stopped.
) else (
    echo No running Node.js processes found.
)

echo.
pause
