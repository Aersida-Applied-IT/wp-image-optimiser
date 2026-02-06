import React, { useCallback, useState } from 'react';
import { Image as ImageIcon, Layers, Zap, Trash2, Download, Settings } from "lucide-react";
import imageCompression from 'browser-image-compression';

import { useImageStore } from '@/hooks/use-image-store';
import { showError, showSuccess } from '@/utils/toast';

import ImageCard from '@/components/image-processor/ImageCard';
import ExportPanel from '@/components/image-processor/ExportPanel';
import BatchActions from '@/components/image-processor/BatchActions';
import SettingsModal from '@/components/image-processor/SettingsModal';
import { Button } from "@/components/ui/button";

const Index = () => {
  const {
    images,
    globalTags,
    settings,
    setSettings,
    sshSettings,
    setSshSettings,
    tagsSettings,
    setTagsSettings,
    addImages,
    removeImage,
    updateImageTags,
    updateImageStatus,
    addGlobalTag,
    batchAddTags,
    clearAllTags,
    addTagToSettings,
    updateImageMetadata,
    setImages
  } = useImageStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

      const optimisedUrl = URL.createObjectURL(finalFile);
      
      updateImageStatus(image.id, 'completed', {
        optimisedBlob: finalFile,
        optimisedUrl,
        optimisedSize: finalFile.size,
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
    showSuccess("All images optimised successfully!");
  };

  const handleClearQueue = () => {
    images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
      if (img.optimisedUrl) URL.revokeObjectURL(img.optimisedUrl);
    });
    setImages([]);
    showSuccess("Queue cleared.");
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
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">WP Image Optimiser</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
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
                  <Download className="h-4 w-4" />
                  Load Images
                </span>
              </Button>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Export & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <BatchActions 
              availableTags={tagsSettings.tags} 
              onBatchAddTags={batchAddTags}
              onClearAllTags={clearAllTags}
              hasImages={images.length > 0}
            />
            <ExportPanel
              onProcessAll={handleProcessAll}
              images={images}
              isProcessing={isProcessing}
              hasImages={images.length > 0}
              sshSettings={sshSettings}
            />
          </div>

          {/* Right Column: Image Grid */}
          <div className="lg:col-span-8">
            {images.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <ImageIcon className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No images loaded</h3>
                <p className="text-slate-500 max-w-xs mt-2">
                  Load your image files to start optimising them.
                </p>
                <label className="mt-6 cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button className="bg-indigo-600 hover:bg-indigo-700" asChild>
                    <span>Select Files</span>
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
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    onClick={handleClearQueue}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Queue
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      tagsSettings={tagsSettings}
                      onRemove={() => removeImage(image.id)}
                      onUpdateTags={(tags) => updateImageTags(image.id, tags)}
                      onAddTagToSettings={addTagToSettings}
                      onUpdateMetadata={(metadata) => updateImageMetadata(image.id, metadata)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          processingSettings={settings}
          sshSettings={sshSettings}
          tagsSettings={tagsSettings}
          onProcessingSettingsUpdate={setSettings}
          onSshSettingsUpdate={setSshSettings}
          onTagsSettingsUpdate={setTagsSettings}
        />
      )}
    </div>
  );
};

export default Index;