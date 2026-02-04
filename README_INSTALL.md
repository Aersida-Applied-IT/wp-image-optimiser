# WP Image Optimiser - Installation Guide

This app requires **Node.js** to be installed on the computer.

## One-Time Setup
1. Download the project folder to the laptop.
2. Open a terminal/command prompt in that folder.
3. Run: `npm install`

## How to Start the App
Simply double-click the `start-app.bat` (Windows) or run `./start-app.sh` (Mac/Linux).

The app will open in your default web browser at `http://localhost:8080`.

## Packaging for Production
If you want to host this on a server or a local network:
1. Run `npm run build`.
2. This creates a `dist` folder.
3. You can serve the contents of the `dist` folder using any web server (like Nginx, Apache, or even a simple Python server).
