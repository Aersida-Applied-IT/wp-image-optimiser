@echo off
REM WP Image Optimiser - Startup Script for Windows
REM This script checks prerequisites and starts the development server

echo.
echo ========================================
echo   WP Image Optimiser - Starting...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js 24 LTS first:
    echo   - Visit https://nodejs.org/ and download Node.js 24 LTS
    echo   - Run the installer and follow the instructions
    echo   - Make sure to check "Add to PATH" during installation
    echo.
    echo After installing Node.js, restart Command Prompt and try again.
    echo.
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node -v') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i
if %NODE_MAJOR% LSS 24 (
    echo [ERROR] Node.js version 24 or higher is required
    echo Current version: 
    node -v
    echo.
    echo Please install Node.js 24 LTS from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check if pnpm is installed
where pnpm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Enabling Corepack to provide pnpm...
    echo.
    
    REM Enable Corepack (built into Node.js 24)
    call corepack enable
    
    REM Verify installation
    where pnpm >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to enable pnpm via Corepack.
        echo.
        echo Please ensure Node.js 24 LTS is installed correctly.
        echo.
        pause
        exit /b 1
    )
)

REM Check if node_modules exists, if not, run install
if not exist "node_modules" (
    echo [INFO] Dependencies not found. Installing dependencies...
    echo This may take a few minutes...
    echo.
    call pnpm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo.
)

REM Start the development server
echo [SUCCESS] Prerequisites checked successfully!
echo.
echo Starting development server...
echo The app will open at http://localhost:9081
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

call pnpm run dev

pause
