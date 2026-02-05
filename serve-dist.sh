#!/bin/bash

# WP Image Optimiser - Server Script for Pre-built Version (macOS/Linux)
# This script serves the pre-built dist folder using available tools

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Colour

echo ""
echo "========================================"
echo "  WP Image Optimiser - Starting Server"
echo "========================================"
echo ""

# Check if dist folder contents exists
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ ERROR: The 'index.html' file was not found!${NC}"
    echo ""
    echo "This script is for serving the pre-built version."
    echo "Make sure you have extracted the dist folder from the release ZIP."
    echo ""
    echo "Expected structure:"
    echo "    index.html"
    echo "    assets/"
    echo "    ..."
    echo ""
    exit 1
fi

# Try Python 3 first (most common on Linux/Mac)
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Using Python 3 to serve files...${NC}"
    echo ""
    echo "Starting server at http://localhost:9081"
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "========================================"
    echo ""
    python3 -m http.server 9081
    exit 0
fi

# Try Python (fallback)
if command -v python &> /dev/null; then
    echo -e "${GREEN}✅ Using Python to serve files...${NC}"
    echo ""
    echo "Starting server at http://localhost:9081"
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "========================================"
    echo ""
    python -m http.server 9081
    exit 0
fi

# Try Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Using Node.js to serve files...${NC}"
    echo ""
    echo "Starting server at http://localhost:9081"
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "========================================"
    echo ""
    node -e "const http=require('http');const fs=require('fs');const path=require('path');const mimeTypes={'html':'text/html','js':'text/javascript','css':'text/css','json':'application/json','png':'image/png','jpg':'image/jpg','gif':'image/gif','svg':'image/svg+xml','ico':'image/x-icon','woff':'font/woff','woff2':'font/woff2'};const server=http.createServer((req,res)=>{let filePath='.'+req.url;if(filePath==='./')filePath='./index.html';const ext=path.extname(filePath).substring(1);const contentType=mimeTypes[ext]||'application/octet-stream';fs.readFile(filePath,(err,content)=>{if(err){if(err.code==='ENOENT'){res.writeHead(404);res.end('File not found');}else{res.writeHead(500);res.end('Server error');}}else{res.writeHead(200,{'Content-Type':contentType});res.end(content);}});});server.listen(9081,()=>{console.log('Server running at http://localhost:9081');});"
    exit 0
fi

# No suitable tool found
echo -e "${RED}❌ ERROR: No suitable server tool found!${NC}"
echo ""
echo "Please install one of the following:"
echo ""
echo "Option 1: Python 3 (Recommended)"
echo "  macOS: Usually pre-installed, or install via Homebrew:"
echo "    brew install python3"
echo "  Linux: Install via package manager:"
echo "    sudo apt-get install python3  # Debian/Ubuntu"
echo "    sudo yum install python3      # CentOS/RHEL"
echo ""
echo "Option 2: Node.js"
echo "  - Download from https://nodejs.org/"
echo "  - Install Node.js 24 LTS or higher"
echo ""
echo "After installing, restart your terminal and try again."
echo ""
echo "Alternative: You can also use any web server software:"
echo "  - Apache, Nginx, or any other web server"
echo "  - Point the document root to the extracted folder"
echo "  - Configure it to serve on port 9081"
echo ""
exit 1
