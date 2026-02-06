import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Terminal, ExternalLink, Info, FileArchive } from "lucide-react";
import { showSuccess, showError } from '@/utils/toast';
import JSZip from 'jszip';
import { ProcessedImage, SSHSettings } from '@/hooks/use-image-store';

interface ExportPanelProps {
  onProcessAll: () => void;
  images: ProcessedImage[];
  isProcessing: boolean;
  hasImages: boolean;
  sshSettings: SSHSettings;
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

const ExportPanel: React.FC<ExportPanelProps> = ({
  onProcessAll,
  images,
  isProcessing,
  hasImages,
  sshSettings,
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

  const generateBashScript = (completedImages: ProcessedImage[], useSSH: boolean): string => {
    const commands = completedImages
      .filter((img) => img.optimisedBlob)
      .map((img) => {
        const filename = img.optimisedBlob!.name;
        const parts: string[] = [`wp media import "${filename}"`];
        
        if (img.title) {
          const escaped = escapeBashString(img.title);
          parts.push(`--title='${escaped}'`);
        }
        if (img.altText) {
          const escaped = escapeBashString(img.altText);
          parts.push(`--alt='${escaped}'`);
        }
        if (img.caption) {
          const escaped = escapeBashString(img.caption);
          parts.push(`--caption='${escaped}'`);
        }
        if (img.description) {
          const escaped = escapeBashString(img.description);
          parts.push(`--desc='${escaped}'`);
        }
        
        return parts.join(' ');
      });
    
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

# Upload images first
echo "Uploading images to server..."
for img in *.webp *.jpg *.jpeg *.png 2>/dev/null; do
  if [ -f "$img" ]; then
    echo "Uploading $img..."
    sshpass -p "$SSH_PASSWORD" scp -o StrictHostKeyChecking=no -P "$SSH_PORT" "$img" "$SSH_USER@$SSH_HOST:$WP_PATH/"
  fi
done

# Run wp-cli commands
echo "Running wp-cli commands..."
${commands.map(cmd => {
  // Escape the command properly for bash - escape $, `, ", and \
  const escapedCmd = cmd.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`').replace(/"/g, '\\"');
  return `run_wp_command "${escapedCmd}"`;
}).join('\n')}

echo "Import complete!"
`;
      return script;
    }
    
    return `#!/bin/bash\n\n${commands.join('\n')}\n`;
  };

  const generateBatchScript = (completedImages: ProcessedImage[], useSSH: boolean): string => {
    const commands = completedImages
      .filter((img) => img.optimisedBlob)
      .map((img) => {
        const filename = img.optimisedBlob!.name;
        const parts: string[] = [`wp media import "${filename}"`];
        
        if (img.title) {
          const escaped = escapeBatchString(img.title);
          parts.push(`--title="${escaped}"`);
        }
        if (img.altText) {
          const escaped = escapeBatchString(img.altText);
          parts.push(`--alt="${escaped}"`);
        }
        if (img.caption) {
          const escaped = escapeBatchString(img.caption);
          parts.push(`--caption="${escaped}"`);
        }
        if (img.description) {
          const escaped = escapeBatchString(img.description);
          parts.push(`--desc="${escaped}"`);
        }
        
        return parts.join(' ');
      });
    
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
for %%f in (*.webp *.jpg *.jpeg *.png) do (
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
${commands.map(cmd => {
  const escapedCmd = cmd.replace(/"/g, '""');
  return `ssh -o StrictHostKeyChecking=no -p %SSH_PORT% %SSH_USER%@%SSH_HOST% "cd %WP_PATH% && ${escapedCmd}"`;
}).join('\n')}

echo Import complete!
`;
      return script;
    }
    
    return commands.join('\n');
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
- For Windows: Windows 10 version 1803 or newer, or Windows 11 (OpenSSH built-in and enabled by default)
  - Note: Windows scripts will prompt for password interactively (Windows OpenSSH doesn't support automated password entry)

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

**Windows:**
\`\`\`cmd
import.bat
\`\`\`

The script will:
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
- **"OpenSSH not found"** (Windows): Enable OpenSSH Client in Windows Features
- **Connection refused**: Check your SSH host, port, and ensure SSH is enabled on your server
- **Permission denied**: Verify your username and password are correct
- **wp-cli not found**: Ensure wp-cli is installed on your WordPress server
- **Password prompts** (Windows): Windows OpenSSH requires interactive password entry - this is normal
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
            WordPress Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Import Methods</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1">1. SSH Method (Recommended)</p>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  Configure your SSH settings above, then download the ZIP file. Extract it and run <code className="bg-slate-100 px-1 rounded">import.sh</code> (Linux/Mac) or <code className="bg-slate-100 px-1 rounded">import.bat</code> (Windows). The script will automatically SSH into your server and upload images using wp-cli.
                </p>
                {sshSettings.host && sshSettings.username && sshSettings.wpPath ? (
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-md p-2">
                    <p className="text-[10px] text-green-800">
                      ✓ SSH settings configured. Ready to export!
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
                <strong>First Time Setup:</strong> Before running the import scripts, you may need to run <code className="bg-blue-100 px-1 rounded">wp-setup.sh</code> or <code className="bg-blue-100 px-1 rounded">wp-setup.bat</code> to handle SSH key fingerprint acceptance. This only needs to be done once per server.
              </p>
              <p className="text-[10px] text-blue-800 leading-relaxed">
                <strong>Security:</strong> The SSH password is stored in <code className="bg-blue-100 px-1 rounded">ssh-config.txt</code> within the ZIP file. Keep the ZIP file secure and delete it after use.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-md p-3 flex gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              <strong>Pro Tip:</strong> The filenames include your tags in brackets (e.g., <code>image [tag1 tag2].webp</code>). This helps WordPress search and SEO.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportPanel;