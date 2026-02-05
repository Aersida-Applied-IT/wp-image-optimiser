@echo off
REM WP Image Optimiser - Server Script for Pre-built Version (Windows)
REM This script serves the pre-built dist folder using available tools

echo.
echo ========================================
echo   WP Image Optimiser - Starting Server
echo ========================================
echo.

REM Check if dist folder contents exists
if not exist "index.html" (
    echo [ERROR] The 'index.html' file was not found!
    echo.
    echo This script is for serving the pre-built version.
    echo Make sure you have extracted the dist folder from the release ZIP.
    echo.
    echo Expected structure:
    echo     index.html
    echo     assets\
    echo     ...
    echo.
    pause
    exit /b 1
)

REM Try Python first (most common)
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Using Python to serve files...
    echo.
    echo Starting server at http://localhost:9081
    echo Press Ctrl+C to stop the server
    echo.
    echo ========================================
    echo.
    python -m http.server 9081
    pause
    exit /b 0
)

REM Try Python 3
where python3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Using Python 3 to serve files...
    echo.
    echo Starting server at http://localhost:9081
    echo Press Ctrl+C to stop the server
    echo.
    echo ========================================
    echo.
    python3 -m http.server 9081
    pause
    exit /b 0
)

REM Try Node.js
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Using Node.js to serve files...
    echo.
    echo Starting server at http://localhost:9081
    echo Press Ctrl+C to stop the server
    echo.
    echo ========================================
    echo.
    node -e "const http=require('http');const fs=require('fs');const path=require('path');const mimeTypes={'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json','png':'image/png','jpg':'image/jpg','gif':'image/gif','svg':'image/svg+xml','ico':'image/x-icon'};const server=http.createServer((req,res)=>{let filePath='.'+req.url;if(filePath==='./')filePath='./index.html';const ext=path.extname(filePath).substring(1);const contentType=mimeTypes[ext]||'application/octet-stream';fs.readFile(filePath,(err,content)=>{if(err){if(err.code==='ENOENT'){res.writeHead(404);res.end('File not found');}else{res.writeHead(500);res.end('Server error');}}else{res.writeHead(200,{'Content-Type':contentType});res.end(content);}});});server.listen(9081,()=>{console.log('Server running at http://localhost:9081');});"
    pause
    exit /b 0
)

REM No suitable tool found
echo [ERROR] No suitable server tool found!
echo.
echo Please install one of the following:
echo.
echo Option 1: Python (Recommended)
echo   - Download from https://www.python.org/downloads/
echo   - Make sure to check "Add Python to PATH" during installation
echo.
echo Option 2: Node.js
echo   - Download from https://nodejs.org/
echo   - Install Node.js 24 LTS or higher
echo.
echo After installing, restart Command Prompt and try again.
echo.
echo Alternative: You can also use any web server software:
echo   - Apache, Nginx, or any other web server
echo   - Point the document root to the extracted folder
echo   - Configure it to serve on port 9081
echo.
pause
exit /b 1
