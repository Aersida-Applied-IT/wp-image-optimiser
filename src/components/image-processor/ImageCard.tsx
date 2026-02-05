import React from 'react';
import { ProcessedImage } from '@/hooks/use-image-store';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download, Loader2, FileImage, CheckCircle2 } from "lucide-react";
import TagSelector from './TagSelector';
import ImageMetadata from './ImageMetadata';

interface ImageCardProps {
  image: ProcessedImage;
  availableTags: string[];
  onRemove: () => void;
  onUpdateTags: (tags: string[]) => void;
  onAddGlobalTag: (tag: string) => void;
  onUpdateMetadata: (metadata: Partial<Pick<ProcessedImage, 'title' | 'altText' | 'description' | 'caption'>>) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({
  image,
  availableTags,
  onRemove,
  onUpdateTags,
  onAddGlobalTag,
  onUpdateMetadata,
}) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleTag = (tag: string) => {
    const newTags = image.tags.includes(tag)
      ? image.tags.filter((t) => t !== tag)
      : [...image.tags, tag];
    onUpdateTags(newTags);
  };

  return (
    <Card className="overflow-hidden border-slate-200 hover:border-indigo-300 transition-colors group">
      <div className="relative aspect-video bg-slate-100 overflow-hidden">
        <img
          src={image.preview}
          alt={image.file.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        {image.status === 'completed' && (
          <div className="absolute top-2 left-2">
            <CheckCircle2 className="h-6 w-6 text-green-500 fill-white" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-slate-900" title={image.file.name}>
              {image.file.name}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {formatSize(image.originalSize)}
              </span>
              {image.optimisedSize && (
                <>
                  <span className="text-slate-300">→</span>
                  <span className="text-[10px] text-green-600 font-bold tracking-wider">
                    {formatSize(image.optimisedSize)}
                  </span>
                </>
              )}
            </div>
          </div>
          {image.optimisedUrl && (
            <Button variant="outline" size="icon" className="h-8 w-8" asChild>
              <a href={image.optimisedUrl} download={`optimised-${image.file.name.split('.')[0]}.webp`}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Tags</p>
          <TagSelector
            selectedTags={image.tags}
            availableTags={availableTags}
            onToggleTag={toggleTag}
            onAddNewTag={onAddGlobalTag}
          />
        </div>

        <ImageMetadata
          image={image}
          onUpdate={onUpdateMetadata}
        />
      </CardContent>
    </Card>
  );
};

export default ImageCard;