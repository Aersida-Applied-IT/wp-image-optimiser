import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Terminal, ExternalLink, Info, FileArchive } from "lucide-react";
import { showSuccess, showError } from '@/utils/toast';
import JSZip from 'jszip';
import { ProcessedImage } from '@/hooks/use-image-store';

interface ExportPanelProps {
  onProcessAll: () => void;
  images: ProcessedImage[];
  isProcessing: boolean;
  hasImages: boolean;
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

  const generateBashScript = (completedImages: ProcessedImage[]): string => {
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
    
    return `#!/bin/bash\n\n${commands.join('\n')}\n`;
  };

  const generateBatchScript = (completedImages: ProcessedImage[]): string => {
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
    
    return commands.join('\n');
  };

  const handleDownloadZip = async () => {
    const completed = images.filter(img => img.status === 'completed');
    if (completed.length === 0) {
      showError("No optimised images to download. Process them first!");
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

      // Generate and add bash script
      const bashScript = generateBashScript(completed);
      zip.file('import.sh', bashScript);

      // Generate and add batch script
      const batchScript = generateBatchScript(completed);
      zip.file('import.bat', batchScript);

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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">WP-CLI Method</p>
            <div className="bg-slate-900 rounded-md p-3 relative group">
              <code className="text-[10px] text-indigo-300 block break-all">
                wp media import ./optimised/*.webp --post_id=123 --title="Product Gallery"
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-1 right-1 h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                onClick={() => copyToClipboard('wp media import ./optimised/*.webp')}
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recommended Plugins</p>
            <ul className="space-y-2">
              <li className="flex items-center justify-between text-xs text-slate-600">
                <span>WP All Import</span>
                <ExternalLink className="h-3 w-3" />
              </li>
              <li className="flex items-center justify-between text-xs text-slate-600">
                <span>Media Library Folders</span>
                <ExternalLink className="h-3 w-3" />
              </li>
            </ul>
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