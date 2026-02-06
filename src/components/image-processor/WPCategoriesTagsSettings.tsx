import React, { useState } from 'react';
import { WPCategoriesTagsSettings as Settings, WPCategoryNode } from '@/hooks/use-image-store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, Plus, X, Folder, Tag, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WPCategoriesTagsSettingsProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

const WPCategoriesTagsSettings: React.FC<WPCategoriesTagsSettingsProps> = ({ settings, onUpdate }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Helper function to generate unique keys for categories
  const getCategoryPath = (node: WPCategoryNode, path: string = ''): string => {
    const currentPath = path ? `${path} > ${node.name}` : node.name;
    return currentPath;
  };

  // Helper function to find a category node by path
  const findCategoryByPath = (categories: WPCategoryNode[], path: string): WPCategoryNode | null => {
    const parts = path.split(' > ');
    let current: WPCategoryNode[] = categories;
    let found: WPCategoryNode | null = null;

    for (const part of parts) {
      found = current.find(cat => cat.name === part) || null;
      if (!found) return null;
      current = found.children || [];
    }
    return found;
  };

  // Helper function to add a category (supports nested paths like "Parent > Child")
  const addCategory = () => {
    if (!newCategoryName.trim()) return;

    const categoryPath = newCategoryName.trim();
    const parts = categoryPath.split(' > ').map(p => p.trim()).filter(p => p);
    
    if (parts.length === 0) return;

    const updatedCategories = [...settings.categories];
    
    // Build the category tree from the path
    let currentLevel = updatedCategories;
    let currentPath = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const path = currentPath ? `${currentPath} > ${part}` : part;
      
      // Check if this category already exists
      let existing = currentLevel.find(cat => cat.name === part);
      
      if (!existing) {
        // Create new category
        existing = { name: part };
        currentLevel.push(existing);
      }
      
      // Prepare for next level
      if (!existing.children) {
        existing.children = [];
      }
      currentLevel = existing.children;
      currentPath = path;
    }

    onUpdate({ ...settings, categories: updatedCategories });
    setNewCategoryName('');
  };

  // Helper function to remove a category
  const removeCategory = (path: string) => {
    const parts = path.split(' > ');
    const updatedCategories = [...settings.categories];

    if (parts.length === 1) {
      // Root level category
      onUpdate({ ...settings, categories: updatedCategories.filter(cat => cat.name !== parts[0]) });
    } else {
      // Nested category
      const parentPath = parts.slice(0, -1).join(' > ');
      const parent = findCategoryByPath(updatedCategories, parentPath);
      if (parent && parent.children) {
        parent.children = parent.children.filter(cat => cat.name !== parts[parts.length - 1]);
        onUpdate({ ...settings, categories: updatedCategories });
      }
    }
  };

  // Helper function to add a tag
  const addTag = () => {
    if (!newTagName.trim() || settings.tags.includes(newTagName.trim())) return;
    onUpdate({ ...settings, tags: [...settings.tags, newTagName.trim()] });
    setNewTagName('');
  };

  // Helper function to remove a tag
  const removeTag = (tag: string) => {
    onUpdate({ ...settings, tags: settings.tags.filter(t => t !== tag) });
  };

  // Render category tree recursively
  const renderCategoryTree = (categories: WPCategoryNode[], parentPath: string = '') => {
    return categories.map((category) => {
      const path = getCategoryPath(category, parentPath);
      const isExpanded = expandedCategories.has(path);
      const hasChildren = category.children && category.children.length > 0;

      return (
        <div key={path} className="ml-4">
          <div className="flex items-center gap-2 py-1 group">
            <Collapsible
              open={isExpanded}
              onOpenChange={(open) => {
                const newExpanded = new Set(expandedCategories);
                if (open) {
                  newExpanded.add(path);
                } else {
                  newExpanded.delete(path);
                }
                setExpandedCategories(newExpanded);
              }}
            >
              <div className="flex items-center gap-2 flex-1">
                {hasChildren ? (
                  <CollapsibleTrigger className="p-0.5 hover:bg-slate-100 rounded">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                  </CollapsibleTrigger>
                ) : (
                  <div className="w-5" />
                )}
                <Folder className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-slate-700 flex-1">{category.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeCategory(path)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {hasChildren && (
                <CollapsibleContent className="ml-6 mt-1">
                  {renderCategoryTree(category.children!, path)}
                </CollapsibleContent>
              )}
            </Collapsible>
          </div>
        </div>
      );
    });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-indigo-600" />
          Media Categories and Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs leading-relaxed">
            To find your WordPress Attachment Categories and Tags, go to your WordPress admin → Media Library. 
            Check the columns for "Att. Category" and "Att. Tag" to see the exact names. 
            Ensure the spelling matches exactly what is in WordPress, and use a minimum of categories.
          </AlertDescription>
        </Alert>

        {/* Categories Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Categories (Hierarchical)</Label>
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50 max-h-64 overflow-y-auto">
            {settings.categories.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No categories added yet</p>
            ) : (
              <div className="space-y-1">
                {renderCategoryTree(settings.categories)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Category name (use 'Parent > Child' for nested)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addCategory}
              disabled={!newCategoryName.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Categories support hierarchical structure (parent/child relationships). 
            Click the chevron to expand/collapse nested categories.
          </p>
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tags (Simple List)</Label>
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50 max-h-48 overflow-y-auto">
            {settings.tags.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No tags added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {settings.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                  >
                    <span className="text-slate-700">{tag}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-slate-100"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addTag}
              disabled={!newTagName.trim() || settings.tags.includes(newTagName.trim())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Tags are simple labels. Add multiple tags separated by pressing Enter after each tag.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WPCategoriesTagsSettings;
