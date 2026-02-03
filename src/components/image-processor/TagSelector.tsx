import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onToggleTag: (tag: string) => void;
  onAddNewTag: (tag: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  availableTags,
  onToggleTag,
  onAddNewTag,
}) => {
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    if (newTag.trim()) {
      onAddNewTag(newTag.trim());
      onToggleTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                isSelected ? "bg-indigo-600 hover:bg-indigo-700" : "hover:border-indigo-400"
              )}
              onClick={() => onToggleTag(tag)}
            >
              {tag}
              {isSelected && <Check className="ml-1 h-3 w-3" />}
            </Badge>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add custom tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="h-8 text-xs"
        />
        <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TagSelector;