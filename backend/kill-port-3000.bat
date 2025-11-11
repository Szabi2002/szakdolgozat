@echo off
REM Helper script to kill any process using port 3000
REM Useful when you get EADDRINUSE errors

echo Checking for processes using port 3000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Found process ID: %%a
    taskkill //F //PID %%a
)

echo.
echo Port 3000 should now be free. You can start the backend with: npm run start:dev
