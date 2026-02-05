# WP Image Optimiser - Installation Guide

This guide covers two installation methods:
1. **Using Pre-built Release** (Recommended for most users) - No build tools required
2. **Installing from Source** (For developers) - Requires Node.js and pnpm

---

## Using Pre-built Release (No Build Required)

This is the easiest way to get started. The pre-built version doesn't require any build tools - just download, extract, and serve.

### Step 1: Download the Release

1. Visit the [GitHub Releases page](https://github.com/Aersida-Applied-IT/wp-image-optimiser/releases/latest)
2. Download `wp-image-optimiser-dist-*.zip` (the pre-built version)
3. **Note:** You don't need a GitHub account to download releases

### Step 2: Extract the ZIP File

1. Extract the downloaded ZIP file to a folder of your choice
2. You should see a `dist` folder containing the application files

### Step 3: Start the Server

The release includes simple server scripts that work on all operating systems:

#### Windows

1. Navigate to the extracted folder
2. Double-click `serve-dist.bat`
3. The script will automatically detect Python or Node.js on your system
4. Open your browser to `http://localhost:9081`

#### macOS / Linux

1. Open Terminal and navigate to the extracted folder:
   ```bash
   cd /path/to/extracted/folder
   ```

2. Make the script executable (first time only):
   ```bash
   chmod +x serve-dist.sh
   ```

3. Run the script:
   ```bash
   ./serve-dist.sh
   ```

4. Open your browser to `http://localhost:9081`

### What If I Don't Have Python or Node.js?

The server scripts will check for Python or Node.js automatically. If neither is available, you have two options:

**Option 1: Install Python (Recommended)**
- **Windows**: Download from [python.org](https://www.python.org/downloads/) - Make sure to check "Add Python to PATH"
- **macOS**: Usually pre-installed, or install via Homebrew: `brew install python3`
- **Linux**: Install via package manager: `sudo apt-get install python3` (Debian/Ubuntu)

**Option 2: Use Any Web Server**
You can use any web server software (Apache, Nginx, etc.) to serve the `dist` folder:
- Point the document root to the `dist` folder
- Configure the server to listen on port 9081
- Access the application at `http://localhost:9081`

### Alternative: Manual Server Commands

If you prefer to run the server manually:

**Using Python:**
```bash
cd dist
python3 -m http.server 9081
# or on Windows: python -m http.server 9081
```

**Using Node.js:**
```bash
cd dist
npx serve -p 9081
# or install serve globally: npm install -g serve
```

---

## Installing from Source (For Developers)

If you want to modify the code or need the full development environment, follow these instructions.

### Prerequisites

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

## One-Time Setup (Source Code)

1. **Download the Project**:
   - Download the source code ZIP from [GitHub Releases](https://github.com/Aersida-Applied-IT/wp-image-optimiser/releases/latest) (`wp-image-optimiser-source-*.zip`)
   - Or clone the repository: `git clone https://github.com/Aersida-Applied-IT/wp-image-optimiser.git`
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
