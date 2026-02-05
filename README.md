# WP Image Optimiser

A web-based image optimisation tool designed primarily for WordPress users.
Optimise, compress, and tag images with batch processing capabilities, all through an intuitive browser interface.

## Features

- **Batch Image Processing** - Load and process multiple images simultaneously
- **Format Conversion** - Convert images to WebP, JPEG, or PNG formats
- **Quality Control** - Adjustable compression quality and maximum dimensions
- **Image Tagging** - Add custom tags to images for better organisation
- **Metadata Management** - Edit title, alt text, description, and caption for each image
- **Export Options** - Download optimised images individually or as a ZIP archive
- **Port Conflict Detection** - Automatically checks if the required port is available
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Download Latest Release

The easiest way to get started is to download a pre-built release from GitHub:

**[Download Latest Release](https://github.com/Aersida-Applied-IT/wp-image-optimiser/releases/latest)**

### Release Options

Each release includes two download options:

1. **Pre-built Version** (`wp-image-optimiser-dist-*.zip`) - **Recommended for most users**
   - No build tools required
   - Just extract and serve using the included scripts
   - Perfect for non-technical users
   - See [Quick Start (Pre-built Version)](#quick-start-pre-built-version) below

2. **Source Code** (`wp-image-optimiser-source-*.zip`) - **For developers**
   - Full source code for customization
   - Requires Node.js 24 LTS and pnpm
   - See [Quick Start (Source Code)](#quick-start-source-code) below

> **Note:** You don't need a GitHub account to download releases. Simply visit the [releases page](https://github.com/Aersida-Applied-IT/wp-image-optimiser/releases) and download the files you need.

## Quick Start (Pre-built Version)

If you downloaded the pre-built release:

1. **Extract the ZIP file** - Extract `wp-image-optimiser-dist-*.zip` to a folder
2. **Navigate to the folder** - Open the extracted folder in your file explorer/terminal
3. **Start the server**:
   - **Windows**: Double-click `serve-dist.bat`
   - **Mac/Linux**: Run `chmod +x serve-dist.sh && ./serve-dist.sh`
4. **Open your browser** - Navigate to `http://localhost:9081`

The server script will automatically detect Python or Node.js on your system. If neither is available, see [README_INSTALL.md](README_INSTALL.md) for installation instructions.

## Quick Start (Source Code)

If you downloaded the source code or cloned the repository:

1. **Install Prerequisites** - Install Node.js 24 LTS and enable Corepack for pnpm (see [Installation Guide](README_INSTALL.md))
2. **Install Dependencies** - Run `pnpm install` in the project directory
3. **Start the App** - Double-click `start-app.bat` (Windows) or run `./start-app.sh` (Mac/Linux)
4. **Open Browser** - The app will automatically open at `http://localhost:9081`

For detailed installation instructions, please see [README_INSTALL.md](README_INSTALL.md).

## Usage

### Loading Images

1. Click "Load Images" in the header or "Select Files" in the empty state
2. Select one or more image files from your computer
3. Images will appear in the queue with previews

### Optimising Images

1. Adjust settings in the left panel:
   - **Max Width**: Set maximum image width/height
   - **Quality**: Adjust compression quality (0.7 - 1.0)
   - **Format**: Choose WebP, JPEG, or PNG
2. Add tags to images individually or use batch tagging
3. Edit metadata (title, alt text, description, caption) as needed
4. Click "Process All" to optimise all images
5. Download individual images or export all as a ZIP file

### Image Tags

- Add custom tags to categorise your images
- Use batch tagging to apply tags to multiple images at once
- Tags are included in the optimised filename: `image-name [tag1 tag2].ext`

## Building for Production

To create a production build:

```bash
pnpm run build
```

This creates a `dist` folder containing optimised static files. You can serve these files using any web server:

- **Vercel** - Deploy directly using the included `vercel.json` configuration
- **Nginx** - Configure to serve the `dist` folder
- **Apache** - Point DocumentRoot to the `dist` folder
- **Python** - Use `python -m http.server` in the `dist` folder
- **Node.js** - Use `pnpm run preview` to preview the production build locally

## Development

### Available Scripts

- `pnpm run dev` - Start development server with port checking
- `pnpm run build` - Build for production
- `pnpm run build:dev` - Build in development mode
- `pnpm run lint` - Run ESLint
- `pnpm run typecheck` - Run TypeScript type checking
- `pnpm run preview` - Preview production build

### Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **browser-image-compression** - Image compression
- **jszip** - ZIP file creation

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please visit the [GitHub Issues](https://github.com/Aersida-Applied-IT/wp-image-optimiser/issues) page.
