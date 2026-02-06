import React, { useState } from 'react';
import { TagsSettings as Settings } from '@/hooks/use-image-store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Tag, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TagsSettingsProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

const TagsSettings: React.FC<TagsSettingsProps> = ({ settings, onUpdate }) => {
  const [newTagName, setNewTagName] = useState('');

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

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-indigo-600" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs leading-relaxed">
            Configure the tags that will be available for selection when processing images. 
            These tags can be used to organise and categorise your images.
          </AlertDescription>
        </Alert>

        {/* Tags Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Available Tags</Label>
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
            Add tags that will be available for selection when processing images. Press Enter or click the plus button to add.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TagsSettings;
