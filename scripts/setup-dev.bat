@echo off
REM ============================================================================
REM Development Environment Setup Script (Windows)
REM ============================================================================
REM This script automates the setup of the development environment for the
REM Kozlekedesi Jegykezelo (Public Transport Ticketing) application.
REM ============================================================================

echo.
echo ============================================================
echo   Kozlekedesi Jegykezelo - Development Environment Setup
echo ============================================================
echo.

REM ============================================================================
REM 1. Check Prerequisites
REM ============================================================================

echo [1/6] Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js 20.x LTS from: https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js version: %NODE_VERSION%

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm not found!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm version: %NPM_VERSION%

REM Check Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Git not found. Some features may not work.
) else (
    for /f "tokens=*" %%i in ('git --version') do set GIT_VERSION=%%i
    echo [OK] Git: %GIT_VERSION%
)

echo.

REM ============================================================================
REM 2. Install Backend Dependencies
REM ============================================================================

echo [2/6] Installing backend dependencies...
echo.

if exist backend\package.json (
    cd backend
    echo Installing backend packages... This may take a few minutes.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Backend dependency installation failed!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed successfully
    cd ..
) else (
    echo [WARNING] backend/package.json not found. Skipping backend setup.
    echo The backend may need to be initialized first.
)

echo.

REM ============================================================================
REM 3. Install Frontend Dependencies
REM ============================================================================

echo [3/6] Installing frontend dependencies...
echo.

if exist frontend\package.json (
    cd frontend
    echo Installing frontend packages... This may take a few minutes.
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Frontend dependency installation failed!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed successfully
    cd ..
) else (
    echo [WARNING] frontend/package.json not found. Skipping frontend setup.
    echo The frontend may need to be initialized first.
)

echo.

REM ============================================================================
REM 4. Setup Environment Files
REM ============================================================================

echo [4/6] Setting up environment files...
echo.

REM Backend .env
if exist backend\.env.example (
    if not exist backend\.env (
        copy backend\.env.example backend\.env >nul
        echo [OK] Created backend\.env from template
        echo [ACTION REQUIRED] Please edit backend\.env with your Supabase credentials
    ) else (
        echo [SKIP] backend\.env already exists
    )
) else (
    echo [WARNING] backend\.env.example not found
)

REM Frontend .env
if exist frontend\.env.example (
    if not exist frontend\.env (
        copy frontend\.env.example frontend\.env >nul
        echo [OK] Created frontend\.env from template
        echo [ACTION REQUIRED] Please edit frontend\.env with your Supabase credentials
    ) else (
        echo [SKIP] frontend\.env already exists
    )
) else (
    echo [WARNING] frontend\.env.example not found
)

echo.

REM ============================================================================
REM 5. Verify Installation
REM ============================================================================

echo [5/6] Verifying installation...
echo.

REM Check backend build
if exist backend\package.json (
    cd backend
    echo Checking if backend builds...
    call npm run build >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Backend builds successfully
    ) else (
        echo [WARNING] Backend build may have issues
    )
    cd ..
)

REM Check frontend build
if exist frontend\package.json (
    cd frontend
    echo Checking if frontend builds...
    call npm run build >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Frontend builds successfully
    ) else (
        echo [WARNING] Frontend build may have issues
    )
    cd ..
)

echo.

REM ============================================================================
REM 6. Display Next Steps
REM ============================================================================

echo [6/6] Setup complete!
echo.
echo ============================================================
echo   Next Steps
echo ============================================================
echo.
echo 1. Configure environment variables:
echo    - Edit backend\.env with your Supabase credentials
echo    - Edit frontend\.env with your Supabase credentials
echo.
echo 2. Review the setup documentation:
echo    - database\SUPABASE_SETUP.md - Supabase configuration
echo    - docs\ENVIRONMENT_SETUP.md - Environment variables guide
echo.
echo 3. Start the development servers:
echo    Backend:  cd backend  ^&^& npm run start:dev
echo    Frontend: cd frontend ^&^& npm start
echo.
echo 4. Access the application:
echo    Backend API:  http://localhost:3000
echo    Swagger Docs: http://localhost:3000/api/docs
echo    Frontend App: http://localhost:4200
echo.
echo ============================================================
echo   Useful Commands
echo ============================================================
echo.
echo Backend commands:
echo   npm run start:dev  - Start development server with hot reload
echo   npm run test       - Run unit tests
echo   npm run lint       - Run ESLint
echo   npm run build      - Build for production
echo.
echo Frontend commands:
echo   ng serve           - Start development server
echo   ng test            - Run unit tests
echo   ng lint            - Run ESLint
echo   ng build           - Build for production
echo.
echo ============================================================
echo.
pause
