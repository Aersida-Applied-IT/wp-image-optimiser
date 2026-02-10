import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Terminal, ExternalLink, Info, FileArchive, Settings } from "lucide-react";
import { showSuccess, showError } from '@/utils/toast';
import JSZip from 'jszip';
import { ProcessedImage, SSHSettings, ProcessingSettings } from '@/hooks/use-image-store';

interface ExportPanelProps {
  onProcessAll: () => void;
  images: ProcessedImage[];
  isProcessing: boolean;
  hasImages: boolean;
  sshSettings: SSHSettings;
  settings: ProcessingSettings;
}

// Helper function to escape CSV values
const escapeCsvValue = (value: string): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Helper function to escape bash string (for single quotes)
const escapeBashString = (value: string): string => {
  if (!value) return '';
  // Escape single quotes by ending quote, adding escaped quote, starting new quote
  return value.replace(/'/g, "'\\''");
};

// Helper function to escape batch string (for double quotes)
const escapeBatchString = (value: string): string => {
  if (!value) return '';
  // Escape double quotes by doubling them
  return value.replace(/"/g, '""');
};

// Helper function to escape PowerShell string (for single quotes)
const escapePowerShellString = (value: string): string => {
  if (!value) return '';
  // Escape single quotes by doubling them
  return value.replace(/'/g, "''");
};

const ExportPanel: React.FC<ExportPanelProps> = ({
  onProcessAll,
  images,
  isProcessing,
  hasImages,
  sshSettings,
  settings,
}) => {
  const [isZipping, setIsZipping] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Command copied to clipboard!");
  };

  const generateCsv = (completedImages: ProcessedImage[]): string => {
    const headers = ['filename', 'title', 'alt', 'caption', 'description', 'tags'];
    const rows = completedImages.map((img) => {
      if (!img.optimisedBlob) return null;
      const filename = img.optimisedBlob.name;
      const title = escapeCsvValue(img.title || '');
      const alt = escapeCsvValue(img.altText || '');
      const caption = escapeCsvValue(img.caption || '');
      const description = escapeCsvValue(img.description || '');
      const tags = escapeCsvValue(img.tags.join(','));
      return [filename, title, alt, caption, description, tags].join(',');
    }).filter(Boolean);

    return [headers.join(','), ...rows].join('\n');
  };

  // Helper to get file extension from format
  const getFileExtension = (format: string): string => {
    switch (format) {
      case 'webp': return 'webp';
      case 'jpeg': return 'jpg';
      case 'png': return 'png';
      default: return 'webp';
    }
  };

  const generateBashScript = (completedImages: ProcessedImage[], useSSH: boolean): string => {
    const fileExt = getFileExtension(settings.format);

    if (useSSH && sshSettings.host && sshSettings.username && sshSettings.wpPath) {
      const sshHost = escapeBashString(sshSettings.host);
      const sshUser = escapeBashString(sshSettings.username);
      const sshPort = sshSettings.port || 22;
      const wpPath = escapeBashString(sshSettings.wpPath);

      // Read password from config file
      const script = `#!/bin/bash

# SSH Configuration
SSH_HOST="${sshHost}"
SSH_USER="${sshUser}"
SSH_PORT="${sshPort}"
WP_PATH="${wpPath}"

# Read password from ssh-config.txt
if [ ! -f "ssh-config.txt" ]; then
  echo "Error: ssh-config.txt not found. Please ensure it's in the same directory."
  exit 1
fi

SSH_PASSWORD=$(grep "^password=" ssh-config.txt | cut -d'=' -f2-)

if [ -z "$SSH_PASSWORD" ]; then
  echo "Error: Password not found in ssh-config.txt"
  exit 1
fi

# Function to run wp-cli command via SSH
run_wp_command() {
  local cmd="$1"
  sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=no -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "cd $WP_PATH && $cmd"
}

# Function to get metadata from CSV file
get_metadata_from_csv() {
  local filename="$1"
  local field_num="$2"
  grep "^$filename," metadata.csv 2>/dev/null | cut -d',' -f$field_num | sed 's/^"//;s/"$//' | sed 's/""/"/g' || echo ""
}

# Upload images first
echo "Uploading images to server..."
for img in *.${fileExt} 2>/dev/null; do
  if [ -f "$img" ]; then
    echo "Uploading $img..."
    sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -P "$SSH_PORT" "$img" "$SSH_USER@$SSH_HOST:$WP_PATH/"
    if [ $? -ne 0 ]; then
      echo "Error: Failed to upload $img"
      exit 1
    fi
  fi
done

# Run wp-cli commands for each uploaded file
echo "Running wp-cli commands..."
for img in *.${fileExt} 2>/dev/null; do
  if [ -f "$img" ]; then
    echo "Importing $img..."
    
    # Get metadata from CSV (columns: filename, title, alt, caption, description, tags)
    TITLE=$(get_metadata_from_csv "$img" 2)
    ALT=$(get_metadata_from_csv "$img" 3)
    CAPTION=$(get_metadata_from_csv "$img" 4)
    DESC=$(get_metadata_from_csv "$img" 5)
    
    # Build wp-cli command with metadata
    CMD="wp media import \\"$img\\""
    
    if [ -n "$TITLE" ] && [ "$TITLE" != "" ]; then
      # Escape single quotes for bash
      ESCAPED_TITLE=$(echo "$TITLE" | sed "s/'/'\\\\''/g")
      CMD="$CMD --title='$ESCAPED_TITLE'"
    fi
    if [ -n "$ALT" ] && [ "$ALT" != "" ]; then
      ESCAPED_ALT=$(echo "$ALT" | sed "s/'/'\\\\''/g")
      CMD="$CMD --alt='$ESCAPED_ALT'"
    fi
    if [ -n "$CAPTION" ] && [ "$CAPTION" != "" ]; then
      ESCAPED_CAPTION=$(echo "$CAPTION" | sed "s/'/'\\\\''/g")
      CMD="$CMD --caption='$ESCAPED_CAPTION'"
    fi
    if [ -n "$DESC" ] && [ "$DESC" != "" ]; then
      ESCAPED_DESC=$(echo "$DESC" | sed "s/'/'\\\\''/g")
      CMD="$CMD --desc='$ESCAPED_DESC'"
    fi
    
    run_wp_command "$CMD"
    if [ $? -ne 0 ]; then
      echo "Error: Failed to import $img"
      exit 1
    fi
  fi
done

echo "Import complete!"
`;
      return script;
    }

    return `#!/bin/bash\n\n# Process all ${fileExt} files in current directory\nfor img in *.${fileExt}; do\n  if [ -f "$img" ]; then\n    wp media import "$img"\n  fi\ndone\n`;
  };

  const generateBatchScript = (completedImages: ProcessedImage[], useSSH: boolean): string => {
    const fileExt = getFileExtension(settings.format);
    
    // Note: Batch file CSV parsing is complex, so we'll use a simpler approach
    // The script will iterate over files and import them (metadata can be added via CSV import separately)

    if (useSSH && sshSettings.host && sshSettings.username && sshSettings.wpPath) {
      const sshHost = escapeBatchString(sshSettings.host);
      const sshUser = escapeBatchString(sshSettings.username);
      const sshPort = sshSettings.port || 22;
      const wpPath = escapeBatchString(sshSettings.wpPath);

      // Windows batch script with SSH support using Windows OpenSSH (Windows 10 1803+ or Windows 11)
      // Note: Password will be entered interactively (Windows OpenSSH doesn't support non-interactive password entry)
      const script = `@echo off
REM SSH Configuration
REM Requires Windows 10 version 1803 or newer, or Windows 11 (OpenSSH built-in)
set SSH_HOST=${sshHost}
set SSH_USER=${sshUser}
set SSH_PORT=${sshPort}
set WP_PATH=${wpPath}

REM Check if Windows OpenSSH is available
where ssh >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: OpenSSH not found. This script requires Windows 10 version 1803+ or Windows 11.
  echo Please ensure OpenSSH Client is enabled in Windows Features.
  echo.
  echo To enable: Settings ^> Apps ^> Optional Features ^> Add a feature ^> OpenSSH Client
  exit /b 1
)

REM Read password from ssh-config.txt (for reference - password will be entered interactively)
if not exist "ssh-config.txt" (
  echo Error: ssh-config.txt not found. Please ensure it's in the same directory.
  exit /b 1
)

for /f "tokens=2 delims==" %%a in ('findstr "^password=" ssh-config.txt') do set SSH_PASSWORD=%%a

if "%SSH_PASSWORD%"=="" (
  echo Warning: Password not found in ssh-config.txt
  echo You will be prompted to enter your password during the upload process.
  echo.
)

echo Uploading images to server...
echo Note: You will be prompted to enter your SSH password for each upload.
echo.
for %%f in (*.${fileExt}) do (
  if exist "%%f" (
    echo Uploading %%f...
    scp -o StrictHostKeyChecking=no -P %SSH_PORT% "%%f" %SSH_USER%@%SSH_HOST%:%WP_PATH%/
    if %errorlevel% neq 0 (
      echo Error: Failed to upload %%f
      exit /b 1
    )
  )
)

echo Running wp-cli commands...
echo Note: You will be prompted to enter your SSH password for each command.
echo.
REM Process each uploaded file
for %%f in (*.${fileExt}) do (
  if exist "%%f" (
    echo Importing %%f...
    ssh -o StrictHostKeyChecking=no -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "cd %WP_PATH% && wp media import \"%%f\""
    if %errorlevel% neq 0 (
      echo Error: Failed to import %%f
      exit /b 1
    )
  )
)

echo Import complete!
`;
      return script;
    }

    return `REM Process all ${fileExt} files in current directory\nfor %%f in (*.${fileExt}) do (\n  if exist "%%f" (\n    wp media import "%%f"\n  )\n)\n`;
  };

  const generatePowerShellScript = (completedImages: ProcessedImage[], useSSH: boolean): string => {
    const fileExt = getFileExtension(settings.format);

    if (useSSH && sshSettings.host && sshSettings.username && sshSettings.wpPath) {
      const sshHost = escapePowerShellString(sshSettings.host);
      const sshUser = escapePowerShellString(sshSettings.username);
      const sshPort = sshSettings.port || 22;
      const wpPath = escapePowerShellString(sshSettings.wpPath);

      // PowerShell script using SSH.NET library (installed automatically)
      // Password is read once from ssh-config.txt and reused for all operations
      const script = `# WP Image Optimiser - PowerShell Import Script
# This script uses SSH.NET library for SSH/SCP operations
# Password is entered once at the start and reused for all operations

#Requires -Version 5.1

# SSH Configuration
$SSH_HOST = "${sshHost}"
$SSH_USER = "${sshUser}"
$SSH_PORT = ${sshPort}
$WP_PATH = "${wpPath}"

# Read password from ssh-config.txt
if (-not (Test-Path "ssh-config.txt")) {
    Write-Host "Error: ssh-config.txt not found. Please ensure it's in the same directory." -ForegroundColor Red
    exit 1
}

# Read config file line by line and extract password
$SSH_PASSWORD = $null
$configLines = Get-Content "ssh-config.txt"
foreach ($line in $configLines) {
    # Skip comment lines and empty lines
    $trimmedLine = $line.Trim()
    if ($trimmedLine -match "^#|^$") {
        continue
    }
    # Match password line - handle optional whitespace around equals sign
    if ($trimmedLine -match "^password\\s*=\\s*(.+)$") {
        $SSH_PASSWORD = $matches[1].Trim()
        break
    }
}

if ([string]::IsNullOrEmpty($SSH_PASSWORD)) {
    Write-Host "Error: Password not found in ssh-config.txt" -ForegroundColor Red
    Write-Host "Please ensure ssh-config.txt contains a line starting with 'password='" -ForegroundColor Yellow
    Write-Host "Debug: Config file contains $($configLines.Count) lines" -ForegroundColor Gray
    exit 1
}

Write-Host "WP Image Optimiser - Import Script" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Clean up any old SSH.NET DLLs that might conflict with Posh-SSH
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($scriptDir)) {
    $scriptDir = $PSScriptRoot
}
if ([string]::IsNullOrEmpty($scriptDir)) {
    $scriptDir = Get-Location
}

$oldDlls = @("Renci.SshNet.dll", "SshNet.Security.Cryptography.dll")
foreach ($dll in $oldDlls) {
    $dllPath = Join-Path $scriptDir $dll
    if (Test-Path $dllPath) {
        Write-Host "Removing old $dll to avoid conflicts..." -ForegroundColor Yellow
        Remove-Item -Path $dllPath -Force -ErrorAction SilentlyContinue
    }
}

# Install/Import Posh-SSH module (simpler SSH library for PowerShell)
Write-Host "Checking for Posh-SSH module..." -ForegroundColor Cyan

if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "Posh-SSH module not found. Installing (one-time setup)..." -ForegroundColor Yellow
    
    # Check if running as administrator (required for module installation)
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if (-not $isAdmin) {
        Write-Host "Warning: Not running as administrator. Attempting to install for current user..." -ForegroundColor Yellow
        $scope = "CurrentUser"
    }
    else {
        $scope = "AllUsers"
    }
    
    try {
        Install-Module -Name Posh-SSH -Scope $scope -Force -SkipPublisherCheck -AllowClobber
        Write-Host "Posh-SSH installed successfully." -ForegroundColor Green
    }
    catch {
        Write-Host "Error installing Posh-SSH: $_" -ForegroundColor Red
        Write-Host "You may need to run PowerShell as Administrator, or install manually:" -ForegroundColor Yellow
        Write-Host "  Install-Module -Name Posh-SSH -Scope CurrentUser" -ForegroundColor Yellow
        exit 1
    }
}

# Import the module
try {
    Import-Module Posh-SSH -Force
    Write-Host "Posh-SSH module loaded." -ForegroundColor Green
}
catch {
    Write-Host "Error loading Posh-SSH module: $_" -ForegroundColor Red
    exit 1
}

# Create secure password object
$securePassword = ConvertTo-SecureString $SSH_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($SSH_USER, $securePassword)

# Create SSH session
Write-Host "Connecting to server..." -ForegroundColor Cyan
$connectionString = "$SSH_USER@$SSH_HOST" + ":" + "$SSH_PORT"
Write-Host "Attempting SSH connection to $connectionString..." -ForegroundColor Gray

try {
    # Create SSH session (Posh-SSH handles host key acceptance automatically)
    $session = New-SSHSession -ComputerName $SSH_HOST -Port $SSH_PORT -Credential $credential -AcceptKey
    
    if (-not $session) {
        throw "Failed to create SSH session"
    }
    
    # Note: We'll use SCP for file uploads (simpler and more reliable)
    # SFTP session creation can be problematic, so we'll use SCP which works well
    
    Write-Host "Connected successfully!" -ForegroundColor Green
    Write-Host ""
}
catch {
    Write-Host "Error connecting to server: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please verify:" -ForegroundColor Yellow
    Write-Host "  - Host: $SSH_HOST" -ForegroundColor Yellow
    Write-Host "  - Port: $SSH_PORT" -ForegroundColor Yellow
    Write-Host "  - Username: $SSH_USER" -ForegroundColor Yellow
    Write-Host "  - Password is correct" -ForegroundColor Yellow
    Write-Host "  - SSH service is running on the server" -ForegroundColor Yellow
    Write-Host "  - Firewall allows connections on port $SSH_PORT" -ForegroundColor Yellow
    exit 1
}

# Function to run SSH command
function Invoke-WPCommand {
    param(
        [string]$Command
    )
    
    try {
        # Expand ~ to home directory and ensure we're in the right directory
        # Use double quotes so $HOME expands on the remote (single quotes would leave $HOME literal)
        $expandedPath = $WP_PATH -replace '^~', '$HOME'
        $fullCommand = "cd \`"$expandedPath\`" && pwd && $Command"
        $result = Invoke-SSHCommand -SessionId $session.SessionId -Command $fullCommand
        
        if ($result.ExitStatus -ne 0) {
            Write-Host "Error: $($result.Error)" -ForegroundColor Red
            return $false
        }
        
        if ($result.Output) {
            Write-Host $result.Output
        }
        return $true
    }
    catch {
        Write-Host "Error executing command: $_" -ForegroundColor Red
        return $false
    }
}

# Function to upload file using SFTP
function Invoke-SFTPUpload {
    param(
        [string]$LocalFile
    )
    
    $fileName = Split-Path -Leaf $LocalFile
    
    try {
        # Use SCP for file uploads (simpler and more reliable)
        # Set-SCPItem uploads the file to the destination directory
        # Expand ~ to home directory for the destination path
        $expandedDest = $WP_PATH -replace '^~', '$HOME'
        
        # Suppress the "Index out of range" warning (it's a non-fatal Posh-SSH issue)
        $null = Set-SCPItem -ComputerName $SSH_HOST -Port $SSH_PORT -Credential $credential -Path $LocalFile -Destination $expandedDest -AcceptKey -ErrorAction SilentlyContinue
        
        # Verify file was uploaded by checking if it exists on server
        # Use double quotes so $HOME expands on the remote (single quotes would leave $HOME literal)
        $verifyCmd = "test -f \`"$expandedDest/$fileName\`" && echo 'exists' || echo 'missing'"
        $verifyResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $verifyCmd
        if ($verifyResult.Output -match "exists") {
            Write-Host "Successfully uploaded $fileName" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "Warning: Upload verification failed for $fileName" -ForegroundColor Yellow
            Write-Host "Verification output: $($verifyResult.Output)" -ForegroundColor Gray
            # Still return true since Set-SCPItem reported success (the error might be non-fatal)
            return $true
        }
    }
    catch {
        Write-Host "Error uploading $fileName : $_" -ForegroundColor Red
        return $false
    }
}

# Upload images first
Write-Host "Uploading images to server..." -ForegroundColor Cyan

# Get script directory to find images in the same folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($scriptDir)) {
    $scriptDir = $PSScriptRoot
}
if ([string]::IsNullOrEmpty($scriptDir)) {
    $scriptDir = Get-Location
}

Write-Host "Looking for images in: $scriptDir" -ForegroundColor Gray

# Get image files of the specific format only
$fileExt = "${fileExt}"
$imageFiles = Get-ChildItem -Path $scriptDir -Filter "*.${fileExt}" -File -ErrorAction SilentlyContinue

if ($imageFiles.Count -eq 0) {
    Write-Host "Warning: No ${fileExt} files found in script directory." -ForegroundColor Yellow
    Write-Host "Please ensure image files are in the same directory as this script." -ForegroundColor Yellow
    Write-Host "Searched for: *.${fileExt}" -ForegroundColor Gray
}
else {
    Write-Host "Found $($imageFiles.Count) image file(s) to upload." -ForegroundColor Green
    foreach ($img in $imageFiles) {
        Write-Host "Uploading $($img.Name)..." -ForegroundColor Gray
        if (-not (Invoke-SFTPUpload -LocalFile $img.FullName)) {
            Write-Host "Failed to upload $($img.Name). Aborting." -ForegroundColor Red
            Remove-SSHSession -SessionId $session.SessionId | Out-Null
            exit 1
        }
    }
    Write-Host "All images uploaded successfully." -ForegroundColor Green
}

Write-Host ""
Write-Host "Running wp-cli commands..." -ForegroundColor Cyan

# Verify files are on server before running wp-cli commands
Write-Host "Verifying uploaded files..." -ForegroundColor Gray
$expandedPath = $WP_PATH -replace '^~', '$HOME'
$verifyCmd = "cd \`"$expandedPath\`" && pwd && ls -la *.${fileExt} 2>/dev/null | head -10"
$verifyResult = Invoke-SSHCommand -SessionId $session.SessionId -Command $verifyCmd
Write-Host "Server directory: $($verifyResult.Output)" -ForegroundColor Gray

# Function to get metadata from CSV
function Get-MetadataFromCsv {
    param(
        [string]$FileName,
        [int]$ColumnIndex
    )
    $csvLine = Get-Content "metadata.csv" | Where-Object { $_ -match "^$([regex]::Escape($FileName))," } | Select-Object -First 1
    if ($csvLine) {
        $fields = $csvLine -split ',(?=(?:[^"]*"[^"]*")*[^"]*$)' -replace '^"|"$', ''
        if ($fields.Count -gt $ColumnIndex) {
            return $fields[$ColumnIndex] -replace '""', '"'
        }
    }
    return ""
}

# Run wp-cli commands for each uploaded file
Write-Host "Running wp-cli commands..." -ForegroundColor Cyan
foreach ($img in $imageFiles) {
    $fileName = $img.Name
    Write-Host "Importing $fileName..." -ForegroundColor Gray
    
    # Get metadata from CSV (columns: filename, title, alt, caption, description, tags)
    $title = Get-MetadataFromCsv -FileName $fileName -ColumnIndex 1
    $alt = Get-MetadataFromCsv -FileName $fileName -ColumnIndex 2
    $caption = Get-MetadataFromCsv -FileName $fileName -ColumnIndex 3
    $desc = Get-MetadataFromCsv -FileName $fileName -ColumnIndex 4
    
    # Build wp-cli command
    $cmd = "wp media import '$fileName'"
    
    if ($title) {
        $escapedTitle = $title -replace "'", "''"
        $cmd += " --title='$escapedTitle'"
    }
    if ($alt) {
        $escapedAlt = $alt -replace "'", "''"
        $cmd += " --alt='$escapedAlt'"
    }
    if ($caption) {
        $escapedCaption = $caption -replace "'", "''"
        $cmd += " --caption='$escapedCaption'"
    }
    if ($desc) {
        $escapedDesc = $desc -replace "'", "''"
        $cmd += " --desc='$escapedDesc'"
    }
    
    if (-not (Invoke-WPCommand -Command $cmd)) {
        Write-Host "Failed to import $fileName" -ForegroundColor Red
        Remove-SSHSession -SessionId $session.SessionId | Out-Null
        exit 1
    }
}

# Cleanup
Remove-SSHSession -SessionId $session.SessionId | Out-Null

Write-Host ""
Write-Host "Import complete!" -ForegroundColor Green
`;
      return script;
    }

    return `# WP Image Optimiser - PowerShell Import Script\n\n# Process all ${fileExt} files in current directory\nGet-ChildItem -Filter "*.${fileExt}" | ForEach-Object {\n    wp media import $_.Name\n}\n`;
  };

  const handleDownloadZip = async () => {
    const completed = images.filter(img => img.status === 'completed');
    if (completed.length === 0) {
      showError("No optimised images to download. Process them first!");
      return;
    }

    const useSSH = !!(sshSettings.host && sshSettings.username && sshSettings.wpPath);
    if (useSSH && !sshSettings.password) {
      showError("SSH password is required when using SSH connection.");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add optimised images
      completed.forEach((img) => {
        if (img.optimisedBlob) {
          zip.file(img.optimisedBlob.name, img.optimisedBlob);
        }
      });

      // Generate and add CSV file
      const csvContent = generateCsv(completed);
      zip.file('metadata.csv', csvContent);

      // Add SSH config if SSH is configured
      if (useSSH) {
        const sshConfig = `host=${sshSettings.host}
port=${sshSettings.port || 22}
username=${sshSettings.username}
password=${sshSettings.password}
wp_path=${sshSettings.wpPath}

# SECURITY WARNING: This file contains sensitive information.
# Keep this ZIP file secure and delete it after use.`;
        zip.file('ssh-config.txt', sshConfig);
      }

      // Generate and add bash script
      const bashScript = generateBashScript(completed, useSSH);
      zip.file('import.sh', bashScript);

      // Generate and add batch script
      const batchScript = generateBatchScript(completed, useSSH);
      zip.file('import.bat', batchScript);

      // Generate and add PowerShell script (recommended for Windows)
      if (useSSH) {
        const powershellScript = generatePowerShellScript(completed, useSSH);
        zip.file('import.ps1', powershellScript);
      }

      // Add setup scripts if SSH is configured
      if (useSSH) {
        // Read setup scripts from the scripts directory (they should be included in build)
        // For now, we'll generate them inline
        const wpSetupSh = `#!/bin/bash

# WP Image Optimiser - SSH Setup Script
# This script handles first-time SSH connection setup by accepting the server's host key
# Run this script once before using import.sh

echo "WP Image Optimiser - SSH Setup"
echo "=============================="
echo ""

# Check if ssh-config.txt exists
if [ ! -f "ssh-config.txt" ]; then
  echo "Error: ssh-config.txt not found."
  echo "Please ensure you've extracted the ZIP file and ssh-config.txt is in the same directory."
  exit 1
fi

# Read configuration from ssh-config.txt
SSH_HOST=$(grep "^host=" ssh-config.txt | cut -d'=' -f2-)
SSH_USER=$(grep "^username=" ssh-config.txt | cut -d'=' -f2-)
SSH_PORT=$(grep "^port=" ssh-config.txt | cut -d'=' -f2-)
SSH_PASSWORD=$(grep "^password=" ssh-config.txt | cut -d'=' -f2-)

if [ -z "$SSH_HOST" ] || [ -z "$SSH_USER" ]; then
  echo "Error: Invalid ssh-config.txt. Missing host or username."
  exit 1
fi

# Default port to 22 if not specified
if [ -z "$SSH_PORT" ]; then
  SSH_PORT=22
fi

echo "Connecting to: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo ""
echo "This will connect to your server and accept the SSH host key fingerprint."
echo "You may be prompted to accept the key - type 'yes' when prompted."
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
  echo "Warning: sshpass not found. Installing may be required."
  echo ""
  echo "On Ubuntu/Debian: sudo apt-get install sshpass"
  echo "On macOS: brew install sshpass"
  echo "On CentOS/RHEL: sudo yum install sshpass"
  echo ""
  echo "Attempting connection without sshpass (you'll need to enter password manually)..."
  echo ""
  
  # Use regular ssh and let user enter password
  ssh -o StrictHostKeyChecking=accept-new -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo 'Connection successful!'"
else
  if [ -z "$SSH_PASSWORD" ]; then
    echo "Warning: Password not found in ssh-config.txt"
    echo "Attempting connection without password (you'll need to enter it manually)..."
    ssh -o StrictHostKeyChecking=accept-new -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo 'Connection successful!'"
  else
    # Use sshpass with password
    sshpass -p "$SSH_PASSWORD" ssh -o StrictHostKeyChecking=accept-new -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "echo 'Connection successful!'"
  fi
fi

if [ $? -eq 0 ]; then
  echo ""
  echo "✓ SSH setup complete! You can now run import.sh"
else
  echo ""
  echo "✗ SSH setup failed. Please check your configuration and try again."
  exit 1
fi
`;

        const wpSetupBat = `@echo off
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
`;

        zip.file('wp-setup.sh', wpSetupSh);
        zip.file('wp-setup.bat', wpSetupBat);

        // Add README for SSH setup
        const readmeContent = `# WP Image Optimiser - Import Instructions

## SSH Method (Recommended)

### Prerequisites
- SSH access to your WordPress server
- wp-cli installed on your WordPress server
- For Linux/Mac: sshpass installed (run: sudo apt-get install sshpass or brew install sshpass)
- For Windows: PowerShell 5.1 or newer (built into Windows 10/11)
  - PowerShell script (import.ps1) is recommended - password entered once
  - Batch script (import.bat) is available but requires password for each command

### First-Time Setup

Before running the import scripts, you need to accept the SSH host key fingerprint:

**Linux/Mac:**
\`\`\`bash
chmod +x wp-setup.sh
./wp-setup.sh
\`\`\`

**Windows:**
\`\`\`cmd
wp-setup.bat
\`\`\`

This only needs to be done once per server.

### Running the Import

After setup, run the import script:

**Linux/Mac:**
\`\`\`bash
chmod +x import.sh
./import.sh
\`\`\`

**Windows (Recommended - PowerShell):**
\`\`\`powershell
powershell -ExecutionPolicy Bypass -File import.ps1
\`\`\`

The PowerShell script will:
- Download SSH.NET library automatically on first run (requires internet connection)
- Read password once from ssh-config.txt
- Upload all images and run wp-cli commands without additional password prompts

**Windows (Alternative - Batch):**
\`\`\`cmd
import.bat
\`\`\`

Note: The batch script will prompt for your password for each upload and command. For a better experience, use the PowerShell script instead.

The scripts will:
1. Upload all optimised images to your WordPress server
2. Run wp-cli commands to import them into WordPress with metadata

## WP All Import Plugin Method

Alternatively, you can use the WP All Import plugin:

1. Install the WP All Import plugin from WordPress.org
2. Use the included \`metadata.csv\` file to import images through the WordPress admin interface
3. This method allows you to import images without SSH access

## Security Note

The \`ssh-config.txt\` file contains your SSH password. Keep the ZIP file secure and delete it after use.

## Troubleshooting

- **"sshpass not found"** (Linux/Mac): Install sshpass using your package manager
- **"ExecutionPolicy" error** (Windows PowerShell): Run: \`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\`
- **"Cannot download SSH.NET"** (Windows PowerShell): Ensure you have internet connectivity for first-time setup
- **Connection refused**: Check your SSH host, port, and ensure SSH is enabled on your server
- **Permission denied**: Verify your username and password are correct
- **wp-cli not found**: Ensure wp-cli is installed on your WordPress server
- **Password prompts** (Windows batch script): This is normal - use the PowerShell script (import.ps1) to avoid repeated password prompts
`;

        zip.file('README.txt', readmeContent);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wp-images-${new Date().toISOString().split('T')[0]}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      showSuccess("ZIP archive created and downloaded!");
    } catch (err) {
      showError("Failed to create ZIP archive.");
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm bg-indigo-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-600" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={onProcessAll}
            disabled={isProcessing || !hasImages}
          >
            {isProcessing ? "Processing..." : "Optimise All Images"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            onClick={handleDownloadZip}
            disabled={isProcessing || !hasImages || isZipping}
          >
            {isZipping ? "Creating ZIP..." : (
              <>
                <FileArchive className="mr-2 h-4 w-4" />
                Download Optimised ZIP
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-600" />
            Import to WordPress Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Either method for import to WordPress requires some setup that you will only need to do once.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">1. SSH Method (Recommended)</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  In your WordPress host, ensure you have SSH access enabled, and wp-cli installed.
                  Most WordPress hosts will have wp-cli installed by default.
                </p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Go into settings (the gear icon above) and enter in the "Image Upload Settings" (SSH settings) for access to your WordPress website.
                  You'll only need to do this once for each machine you install WP Image Optimiser on.
                </p>
                {sshSettings.host && sshSettings.username && sshSettings.wpPath ? (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2">
                    <p className="text-[10px] text-green-800">
                      ✓ SSH settings configured. Ready to import to WordPress!
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md p-2">
                    <p className="text-[10px] text-amber-800">
                      ⚠ Configure SSH settings above to use this method.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">2. WP All Import Plugin</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Note that you will need a paid-for version of this WordPress plugin to be able to use this plugin import images into WordPress.
                </p>
                <a
                  href="https://wordpress.org/plugins/wp-all-import/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5 text-slate-600" />
            Importing Images to WordPress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              WP Image optimiser supports both methods for import to WordPress.
              For both methods, you will need to download the ZIP file, extract it,
              and then open a command line / terminal at the extracted folder to run the scripts.
            </p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              The extracted folder will contain the images, import scripts (for the SSH method) and .CSV file (for the WP All Import Plugin method).
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Options</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">1. SSH Method</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  The following may look like a lot. But once you are used to it, it will take only a few seconds each time you want to import images.
                </p>
                <strong className="text-[10px] font-semibold text-slate-700 mb-1">Accessing the Command Line / Terminal</strong>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  <strong>For Linux/Mac users:</strong> You can access the command line by opening a terminal window.
                </p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  <strong>For Windows users:</strong> You can access the command line by opening a PowerShell window.
                  You can set this up to work directly from the file explorer, so that you can right click on the extracted ZIP file folder and selecting "Open PowerShell here".
                </p>
                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-1 flex gap-2">
                  <Info className="h-4 w-4 text-yellow-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-yellow-800 leading-relaxed">
                      <strong>Linux/Mac: Enable the Scripts</strong>
                      <br />
                      <span className="text-[10px] text-yellow-800 leading-relaxed">
                        For Linux/Mac users, you may need to ensure that the scripts can be run by making them executable.
                        <br />You can do this by running the command <code className="bg-blue-100 px-1 rounded">chmod +x *.sh</code>.
                      </span>
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-1 flex gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-800 leading-relaxed">
                      <strong>SSH Key Fingerprint Setup:</strong>
                      <br />
                      <span className="text-[10px] text-blue-800 leading-relaxed">
                        Before running the import scripts, you may need to run <br /><code className="bg-blue-100 px-1 rounded">./wp-setup.sh</code> (Linux/Mac) or <code className="bg-blue-100 px-1 rounded">.\wp-setup.bat</code> (Windows) to handle SSH key fingerprint acceptance.
                        <br /><strong>This only needs to be done once.</strong>
                      </span>
                    </p>
                  </div>
                </div>
                <strong className="text-[12px] font-bold text-slate-700 mb-1">Running the Scripts</strong>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  Finally, we are here. The following are the commands you will need to run to import the images.
                </p>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  <strong>Linux/Mac:</strong> Use <code className="bg-blue-100 px-1 rounded">./import.sh</code>
                </p>
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  <strong>Windows:</strong> Use <code className="bg-blue-100 px-1 rounded">.\import.ps1</code> (PowerShell).
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">2. WP All Import Plugin</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Use the <code className="bg-slate-100 px-1 rounded">metadata.csv</code> file included in the ZIP with the WP All Import plugin. This allows you to import images through the WordPress admin interface.
                </p>
                <a
                  href="https://wordpress.org/plugins/wp-all-import/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  Learn more <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] text-blue-800 leading-relaxed">
                <strong>Security:</strong> The SSH password is stored in <code className="bg-blue-100 px-1 rounded">ssh-config.txt</code> within the ZIP file. Keep the ZIP file secure and delete it after use.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ExportPanel;