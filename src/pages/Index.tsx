import React, { useCallback, useState } from 'react';
import { useImageStore } from '@/hooks/use-image-store';
import ImageCard from '@/components/image-processor/ImageCard';
import ProcessingSettings from '@/components/image-processor/ProcessingSettings';
import ExportPanel from '@/components/image-processor/ExportPanel';
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Layers, Zap } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { showError, showSuccess } from '@/utils/toast';
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const {
    images,
    globalTags,
    settings,
    setSettings,
    addImages,
    removeImage,
    updateImageTags,
    updateImageStatus,
    addGlobalTag,
  } = useImageStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(Array.from(e.target.files));
    }
  };

  const processImage = async (image: any) => {
    updateImageStatus(image.id, 'processing');
    try {
      const options = {
        maxWidthOrHeight: settings.maxWidth,
        useWebWorker: true,
        fileType: `image/${settings.format}` as any,
        initialQuality: settings.quality,
      };

      const compressedFile = await imageCompression(image.file, options);
      
      // Create a new filename with tags: name [tag1 tag2].ext
      const baseName = image.file.name.split('.')[0];
      const tagString = image.tags.length > 0 ? ` [${image.tags.join(' ')}]` : '';
      const newFileName = `${baseName}${tagString}.${settings.format}`;
      
      const finalFile = new File([compressedFile], newFileName, {
        type: `image/${settings.format}`,
      });

      const optimizedUrl = URL.createObjectURL(finalFile);
      
      updateImageStatus(image.id, 'completed', {
        optimizedBlob: finalFile,
        optimizedUrl,
        optimizedSize: finalFile.size,
      });
    } catch (error) {
      console.error(error);
      updateImageStatus(image.id, 'error');
      showError(`Failed to process ${image.file.name}`);
    }
  };

  const handleProcessAll = async () => {
    setIsProcessing(true);
    const pendingImages = images.filter(img => img.status !== 'completed');
    
    for (const image of pendingImages) {
      await processImage(image);
    }
    
    setIsProcessing(false);
    showSuccess("All images optimized successfully!");
  };

  const handleDownloadAll = () => {
    // In a real app, we'd use JSZip here. For now, we'll trigger individual downloads
    // or suggest the user download them one by one if many.
    const completed = images.filter(img => img.status === 'completed');
    if (completed.length === 0) {
      showError("No optimized images to download.");
      return;
    }

    completed.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img.optimizedUrl!;
        link.download = img.optimizedBlob?.name || `image-${index}.webp`;
        link.click();
      }, index * 200);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">WP Image Prep</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button variant="outline" className="gap-2 border-slate-200" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Upload Images
                </span>
              </Button>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Settings & Export */}
          <div className="lg:col-span-4 space-y-6">
            <ProcessingSettings settings={settings} onUpdate={setSettings} />
            <ExportPanel
              onProcessAll={handleProcessAll}
              onDownloadAll={handleDownloadAll}
              isProcessing={isProcessing}
              hasImages={images.length > 0}
            />
          </div>

          {/* Right Column: Image Grid */}
          <div className="lg:col-span-8">
            {images.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No images uploaded</h3>
                <p className="text-slate-500 max-w-xs mt-2">
                  Upload your PNG or JPEG files to start optimizing them for WordPress.
                </p>
                <label className="mt-6 cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Select Files
                  </Button>
                </label>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Queue ({images.length} images)
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-red-600"
                    onClick={() => {
                      images.forEach(img => {
                        if (img.preview) URL.revokeObjectURL(img.preview);
                        if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
                      });
                      // Reset images
                      window.location.reload();
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      availableTags={globalTags}
                      onRemove={() => removeImage(image.id)}
                      onUpdateTags={(tags) => updateImageTags(image.id, tags)}
                      onAddGlobalTag={addGlobalTag}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Index;