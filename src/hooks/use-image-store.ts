import { useState, useCallback } from 'react';

export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  tags: string[];
  optimizedBlob?: Blob;
  optimizedUrl?: string;
  originalSize: number;
  optimizedSize?: number;
}

export interface ProcessingSettings {
  maxWidth: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export const useImageStore = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [globalTags, setGlobalTags] = useState<string[]>(['Mobile', 'Desktop', 'Product', 'Lifestyle', 'Banner']);
  const [settings, setSettings] = useState<ProcessingSettings>({
    maxWidth: 1200,
    quality: 0.8,
    format: 'webp',
  });

  const addImages = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      tags: [],
      originalSize: file.size,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      if (removed?.optimizedUrl) URL.revokeObjectURL(removed.optimizedUrl);
      return filtered;
    });
  }, []);

  const updateImageTags = useCallback((id: string, tags: string[]) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, tags } : img))
    );
  }, []);

  const updateImageStatus = useCallback((id: string, status: ProcessedImage['status'], data?: Partial<ProcessedImage>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, status, ...data } : img))
    );
  }, []);

  const addGlobalTag = useCallback((tag: string) => {
    if (!globalTags.includes(tag)) {
      setGlobalTags((prev) => [...prev, tag]);
    }
  }, [globalTags]);

  return {
    images,
    globalTags,
    settings,
    setSettings,
    addImages,
    removeImage,
    updateImageTags,
    updateImageStatus,
    addGlobalTag,
    setImages
  };
};