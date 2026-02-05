#!/bin/bash

# WP Image Optimiser - Startup Script for macOS/Linux
# This script checks prerequisites and starts the development server

set -e  # Exit on error

# Colours for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Colour

echo "🚀 Starting WP Image Optimiser..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ ERROR: Node.js is not installed!${NC}"
    echo ""
    echo "Please install Node.js 24 LTS first:"
    echo "  - Visit https://nodejs.org/ and download Node.js 24 LTS"
    echo ""
    echo "After installing Node.js, restart your terminal and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 24 ]; then
    echo -e "${RED}❌ ERROR: Node.js version 24 or higher is required${NC}"
    echo "Current version: $(node -v)"
    echo ""
    echo "Please install Node.js 24 LTS from https://nodejs.org/"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  Enabling Corepack to provide pnpm...${NC}"
    echo ""
    
    # Enable Corepack (built into Node.js 24)
    corepack enable
    
    # Verify installation
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ ERROR: Failed to enable pnpm via Corepack${NC}"
        echo ""
        echo "Please ensure Node.js 24 LTS is installed correctly."
        exit 1
    fi
fi

# Check pnpm version
PNPM_VERSION=$(pnpm -v | cut -d'.' -f1)
if [ "$PNPM_VERSION" -lt 10 ]; then
    echo -e "${YELLOW}⚠️  WARNING: pnpm version 10 or higher is recommended${NC}"
    echo "Current version: $(pnpm -v)"
    echo ""
fi

# Check if node_modules exists, if not, run install
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Dependencies not found. Installing dependencies...${NC}"
    echo ""
    pnpm install
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ERROR: Failed to install dependencies${NC}"
        exit 1
    fi
    echo ""
fi

# Start the development server
echo -e "${GREEN}✅ Prerequisites checked successfully!${NC}"
echo ""
echo "Starting development server..."
echo "The app will open at http://localhost:9081"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

pnpm run dev
