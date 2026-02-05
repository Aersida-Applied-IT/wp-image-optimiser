# WP Image Optimiser - Installation Guide

This guide will walk you through installing all prerequisites and setting up the WP Image Optimiser application.

## Prerequisites

Before you can run this application, you need to install two tools:
1. **Node.js 24 LTS** - The JavaScript runtime environment (version 24 or higher required)
2. **pnpm** - A fast, disk space efficient package manager (version 10 or higher)

### Installing Node.js

#### Windows

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download **Node.js 24 LTS** (the current LTS version)
   - Choose the Windows Installer (.msi) for your system

2. **Install Node.js**:
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard:
     - Accept the license agreement
     - Choose the default installation location (recommended)
     - **Important**: Make sure "Add to PATH" is checked (it should be by default)
     - Click "Install" and wait for installation to complete

3. **Verify Installation**:
   - Open Command Prompt (press `Win + R`, type `cmd`, press Enter)
   - Type: `node --version`
   - You should see a version number (e.g., `v24.13.0`)
   - Type: `npm --version`
   - You should see a version number (e.g., `11.6.2`)

#### macOS

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download **Node.js 24 LTS** for macOS

2. **Install Node.js**:
   - Double-click the downloaded `.pkg` file
   - Follow the installation wizard

3. **Verify Installation**:
   - Open Terminal and run: `node --version`
   - You should see a version number (e.g., `v24.13.0`)
   - Run: `npm --version`
   - You should see a version number (e.g., `11.6.2`)

#### Linux

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### Installing pnpm

Node.js 24 includes Corepack, which provides pnpm automatically:

1. Open Terminal (Mac/Linux) or Command Prompt (Windows)
2. Enable Corepack:
   ```bash
   corepack enable
   ```
3. Verify installation: `pnpm --version`

After enabling Corepack, restart your terminal or run:
- **Windows**: Close and reopen Command Prompt/PowerShell
- **Mac/Linux**: Run `source ~/.bashrc` or `source ~/.zshrc`

## One-Time Setup

1. **Download the Project**:
   - Download or clone the project folder to your computer
   - Extract it if it's in a ZIP file

2. **Open Terminal/Command Prompt**:
   - **Windows**: Navigate to the project folder, then right-click and select "Open in Terminal" or "Open PowerShell window here"
   - **Mac/Linux**: Open Terminal and navigate to the project folder using `cd` command
     ```bash
     cd /path/to/wp-image-optimiser
     ```

3. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   This will download all required packages. This may take a few minutes the first time.

4. **Verify Setup**:
   - Make sure there are no error messages
   - You should see a `node_modules` folder created in the project directory

## How to Start the App

### Windows

Simply **double-click** the `start-app.bat` file in the project folder. This will run `pnpm dev` for you to start everything up.

### macOS / Linux

1. **Make the script executable** (first time only):
   ```bash
   chmod +x start-app.sh
   ```

2. **Run the script**:
   ```bash
   ./start-app.sh
   ```

### What Happens Next

1. The app will check if port 9081 is available
2. If the port is free, the development server will start
3. Your default web browser should automatically open to `http://localhost:9081`
4. If the browser doesn't open automatically, manually navigate to `http://localhost:9081`
