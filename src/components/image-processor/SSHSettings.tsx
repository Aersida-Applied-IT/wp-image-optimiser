import React, { useState } from 'react';
import { SSHSettings } from '@/hooks/use-image-store';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SSHSettingsProps {
  settings: SSHSettings;
  onUpdate: (settings: SSHSettings) => void;
}

const SSHSettingsComponent: React.FC<SSHSettingsProps> = ({ settings, onUpdate }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: keyof SSHSettings, value: string | number) => {
    onUpdate({ ...settings, [field]: value });
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600" />
          Image Upload Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
          <p className="text-xs text-blue-800 leading-relaxed">
            These are the settings to access your WordPress website directly via 'SSH', if your hosting supports this and you have it enabled. Access these through your hosting platform.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-host" className="text-sm font-medium">Your Website Domain Name</Label>
          <Input
            id="ssh-host"
            type="text"
            placeholder="example.com or 192.168.1.100"
            value={settings.host}
            onChange={(e) => handleChange('host', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-port" className="text-sm font-medium">Port</Label>
          <Input
            id="ssh-port"
            type="number"
            placeholder="Enter port number"
            value={settings.port || ''}
            onChange={(e) => handleChange('port', parseInt(e.target.value) || 0)}
            className="w-full"
            min="1"
            max="65535"
          />
          <p className="text-xs text-slate-500">
            Check your host's management console for this number, it will not be 0, but some custom number.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-username" className="text-sm font-medium">Username</Label>
          <Input
            id="ssh-username"
            type="text"
            placeholder="your-username"
            value={settings.username}
            onChange={(e) => handleChange('username', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            This will not be your personal username, but one assigned with your domain by your hosting provider.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="ssh-password"
              type={showPassword ? "text" : "password"}
              placeholder="Your SSH password"
              value={settings.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-slate-400" />
              ) : (
                <Eye className="h-4 w-4 text-slate-400" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Not your personal password, but the one that goes with the username above. Password will be stored securely in the exported ZIP file.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ssh-wp-path" className="text-sm font-medium">WordPress Path</Label>
          <Input
            id="ssh-wp-path"
            type="text"
            placeholder="~/public_html"
            value={settings.wpPath}
            onChange={(e) => handleChange('wpPath', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-slate-500">
            Path to your WordPress root directory on the server
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SSHSettingsComponent;
