import { useState, useCallback, useEffect } from 'react';

export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  tags: string[];
  altText?: string;
  title?: string;
  description?: string;
  caption?: string;
  outputFilename: string; // Output filename without extension (defaults to source filename without extension)
  optimisedBlob?: File;
  optimisedUrl?: string;
  originalSize: number;
  optimisedSize?: number;
}

export interface ProcessingSettings {
  maxWidth: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
}

export interface SSHSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  wpPath: string; // Path to WordPress root directory on the server
}

export interface TagsSettings {
  tags: string[];
}

const STORAGE_KEY_TAGS = 'wp-prep-global-tags';
const STORAGE_KEY_SETTINGS = 'wp-prep-settings';
const STORAGE_KEY_SSH = 'wp-prep-ssh-settings';
const STORAGE_KEY_TAGS_SETTINGS = 'wp-prep-tags-settings';

const DEFAULT_TAGS = ['Mobile', 'Desktop'];

export const useImageStore = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  
  const [globalTags, setGlobalTags] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TAGS);
    return saved ? JSON.parse(saved) : DEFAULT_TAGS;
  });

  const [settings, setSettings] = useState<ProcessingSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
    return saved ? JSON.parse(saved) : {
      maxWidth: 1200,
      quality: 0.8,
      format: 'webp',
    };
  });

  const [sshSettings, setSshSettings] = useState<SSHSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SSH);
    return saved ? JSON.parse(saved) : {
      host: '',
      port: 0,
      username: '',
      password: '',
      wpPath: '~/public_html',
    };
  });

  const [tagsSettings, setTagsSettings] = useState<TagsSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TAGS_SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
    // Migrate from globalTags if tagsSettings doesn't exist
    const savedGlobalTags = localStorage.getItem(STORAGE_KEY_TAGS);
    if (savedGlobalTags) {
      const migratedTags = JSON.parse(savedGlobalTags);
      return { tags: migratedTags };
    }
    return { tags: DEFAULT_TAGS };
  });

  // Persist tags and settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(globalTags));
  }, [globalTags]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SSH, JSON.stringify(sshSettings));
  }, [sshSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TAGS_SETTINGS, JSON.stringify(tagsSettings));
  }, [tagsSettings]);

  const getFilenamePrefix = (filename: string): string => {
    return filename.split('.').slice(0, -1).join('.') || filename;
  };

  const addImages = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => {
      const filenamePrefix = getFilenamePrefix(file.name);
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        tags: [],
        title: filenamePrefix,
        altText: filenamePrefix,
        description: '',
        caption: '',
        outputFilename: filenamePrefix, // Default to source filename without extension
        originalSize: file.size,
      };
    });
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      if (removed?.optimisedUrl) URL.revokeObjectURL(removed.optimisedUrl);
      return filtered;
    });
  }, []);

  const updateImageTags = useCallback((id: string, tags: string[]) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, tags } : img))
    );
  }, []);

  const batchAddTags = useCallback((tagsToAdd: string[]) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        tags: Array.from(new Set([...img.tags, ...tagsToAdd]))
      }))
    );
  }, []);

  const clearAllTags = useCallback(() => {
    setImages((prev) => prev.map((img) => ({ ...img, tags: [] })));
  }, []);

  const addTagToSettings = useCallback((tag: string) => {
    if (!tagsSettings.tags.includes(tag)) {
      setTagsSettings((prev) => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  }, [tagsSettings.tags]);

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

  const removeGlobalTag = useCallback((tag: string) => {
    setGlobalTags((prev) => prev.filter(t => t !== tag));
  }, []);

  const updateImageMetadata = useCallback((id: string, metadata: Partial<Pick<ProcessedImage, 'title' | 'altText' | 'description' | 'caption' | 'tags'>>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...metadata } : img))
    );
  }, []);

  const updateImageOutputFilename = useCallback((id: string, outputFilename: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, outputFilename } : img))
    );
  }, []);

  return {
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
    removeGlobalTag,
    batchAddTags,
    clearAllTags,
    addTagToSettings,
    updateImageMetadata,
    updateImageOutputFilename,
    setImages
  };
};