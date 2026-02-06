#!/bin/bash

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
