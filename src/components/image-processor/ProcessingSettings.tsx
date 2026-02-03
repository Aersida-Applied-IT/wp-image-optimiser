import React from 'react';
import { ProcessingSettings as Settings } from '@/hooks/use-image-store';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Monitor, Settings2 } from "lucide-react";

interface ProcessingSettingsProps {
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

const ProcessingSettings: React.FC<ProcessingSettingsProps> = ({ settings, onUpdate }) => {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-indigo-600" />
          Optimization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Target Width</Label>
            <span className="text-xs font-bold text-indigo-600">{settings.maxWidth}px</span>
          </div>
          <Slider
            value={[settings.maxWidth]}
            min={400}
            max={2400}
            step={100}
            onValueChange={([val]) => onUpdate({ ...settings, maxWidth: val })}
            className="py-2"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile (800px)</span>
            <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> Laptop (1600px)</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label className="text-sm font-medium">Quality</Label>
            <span className="text-xs font-bold text-indigo-600">{Math.round(settings.quality * 100)}%</span>
          </div>
          <Slider
            value={[settings.quality * 100]}
            min={10}
            max={100}
            step={5}
            onValueChange={([val]) => onUpdate({ ...settings, quality: val / 100 })}
            className="py-2"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">Output Format</Label>
          <Select
            value={settings.format}
            onValueChange={(val: any) => onUpdate({ ...settings, format: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webp">WebP (Recommended)</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG (Lossless)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            WebP offers the best compression for WordPress and is supported by all modern browsers and Android devices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingSettings;