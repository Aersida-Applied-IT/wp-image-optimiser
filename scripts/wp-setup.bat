@echo off
REM WP Image Optimiser - SSH Setup Script for Windows
REM This script handles first-time SSH connection setup by accepting the server's host key
REM Requires Windows 10 version 1803 or newer, or Windows 11 (OpenSSH built-in)
REM Run this script once before using import.bat

echo WP Image Optimiser - SSH Setup
echo ==============================
echo.

REM Check if ssh-config.txt exists
if not exist "ssh-config.txt" (
  echo Error: ssh-config.txt not found.
  echo Please ensure you've extracted the ZIP file and ssh-config.txt is in the same directory.
  exit /b 1
)

REM Read configuration from ssh-config.txt
for /f "tokens=2 delims==" %%a in ('findstr "^host=" ssh-config.txt') do set SSH_HOST=%%a
for /f "tokens=2 delims==" %%a in ('findstr "^username=" ssh-config.txt') do set SSH_USER=%%a
for /f "tokens=2 delims==" %%a in ('findstr "^port=" ssh-config.txt') do set SSH_PORT=%%a
for /f "tokens=2 delims==" %%a in ('findstr "^password=" ssh-config.txt') do set SSH_PASSWORD=%%a

if "%SSH_HOST%"=="" (
  echo Error: Invalid ssh-config.txt. Missing host.
  exit /b 1
)

if "%SSH_USER%"=="" (
  echo Error: Invalid ssh-config.txt. Missing username.
  exit /b 1
)

REM Default port to 22 if not specified
if "%SSH_PORT%"=="" set SSH_PORT=22

REM Check if Windows OpenSSH is available
where ssh >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: OpenSSH not found. This script requires Windows 10 version 1803+ or Windows 11.
  echo Please ensure OpenSSH Client is enabled in Windows Features.
  echo.
  echo To enable: Settings ^> Apps ^> Optional Features ^> Add a feature ^> OpenSSH Client
  exit /b 1
)

echo Connecting to: %SSH_USER%@%SSH_HOST%:%SSH_PORT%
echo.
echo This will connect to your server and accept the SSH host key fingerprint.
echo You will be prompted to enter your password.
echo.

REM Use Windows OpenSSH to connect and accept host key
REM Note: Password will be entered interactively
echo yes | ssh -o StrictHostKeyChecking=accept-new -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "echo Connection successful!"

if %errorlevel% equ 0 (
  echo.
  echo ✓ SSH setup complete! You can now run import.bat
) else (
  echo.
  echo ✗ SSH setup failed. Please check your configuration and try again.
  exit /b 1
)
