import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tags, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchActionsProps {
  availableTags: string[];
  onBatchAddTags: (tags: string[]) => void;
  onClearAllTags: () => void;
  hasImages: boolean;
}

const BatchActions: React.FC<BatchActionsProps> = ({
  availableTags,
  onBatchAddTags,
  onClearAllTags,
  hasImages,
}) => {
  const [selectedBatchTags, setSelectedBatchTags] = React.useState<string[]>([]);

  const toggleBatchTag = (tag: string) => {
    setSelectedBatchTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleApply = () => {
    if (selectedBatchTags.length > 0) {
      onBatchAddTags(selectedBatchTags);
      setSelectedBatchTags([]);
    }
  };

  if (!hasImages) return null;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tags className="h-5 w-5 text-indigo-600" />
          Batch Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Apply Tags to All</p>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => {
              const isSelected = selectedBatchTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-all",
                    isSelected ? "bg-indigo-600" : "hover:border-indigo-400"
                  )}
                  onClick={() => toggleBatchTag(tag)}
                >
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            disabled={selectedBatchTags.length === 0}
            onClick={handleApply}
          >
            <Check className="mr-2 h-4 w-4" />
            Apply to All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-slate-500"
            onClick={onClearAllTags}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Tags
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchActions;