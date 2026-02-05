import React from 'react';
import { ProcessedImage } from '@/hooks/use-image-store';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ImageMetadataProps {
  image: ProcessedImage;
  onUpdate: (metadata: Partial<Pick<ProcessedImage, 'title' | 'altText' | 'description' | 'caption'>>) => void;
}

const getFilenamePrefix = (filename: string): string => {
  return filename.split('.').slice(0, -1).join('.') || filename;
};

const ImageMetadata: React.FC<ImageMetadataProps> = ({ image, onUpdate }) => {
  const filenamePrefix = getFilenamePrefix(image.file.name);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value });
  };

  const handleAltTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ altText: e.target.value });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ caption: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ description: e.target.value });
  };

  return (
    <div className="pt-2 border-t border-slate-100 space-y-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Metadata</p>
      
      <div className="space-y-2">
        <Label htmlFor={`title-${image.id}`} className="text-xs font-medium text-slate-700">
          Title
        </Label>
        <Input
          id={`title-${image.id}`}
          value={image.title || ''}
          onChange={handleTitleChange}
          placeholder={filenamePrefix}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`alt-${image.id}`} className="text-xs font-medium text-slate-700">
          Alt-text
        </Label>
        <Textarea
          id={`alt-${image.id}`}
          value={image.altText || ''}
          onChange={handleAltTextChange}
          placeholder={filenamePrefix}
          className="min-h-[60px] text-xs resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`caption-${image.id}`} className="text-xs font-medium text-slate-700">
          Caption
        </Label>
        <Textarea
          id={`caption-${image.id}`}
          value={image.caption || ''}
          onChange={handleCaptionChange}
          placeholder="Enter caption..."
          className="min-h-[60px] text-xs resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${image.id}`} className="text-xs font-medium text-slate-700">
          Description
        </Label>
        <Textarea
          id={`description-${image.id}`}
          value={image.description || ''}
          onChange={handleDescriptionChange}
          placeholder="Enter description..."
          className="min-h-[100px] text-xs resize-none"
        />
      </div>
    </div>
  );
};

export default ImageMetadata;
