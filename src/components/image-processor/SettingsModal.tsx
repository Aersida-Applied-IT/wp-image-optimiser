import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProcessingSettings from '@/components/image-processor/ProcessingSettings';
import SSHSettings from '@/components/image-processor/SSHSettings';
import { ProcessingSettings as ProcessingSettingsType, SSHSettings as SSHSettingsType } from '@/hooks/use-image-store';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processingSettings: ProcessingSettingsType;
  sshSettings: SSHSettingsType;
  onProcessingSettingsUpdate: (settings: ProcessingSettingsType) => void;
  onSshSettingsUpdate: (settings: SSHSettingsType) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  processingSettings,
  sshSettings,
  onProcessingSettingsUpdate,
  onSshSettingsUpdate,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <ProcessingSettings settings={processingSettings} onUpdate={onProcessingSettingsUpdate} />
          <SSHSettings settings={sshSettings} onUpdate={onSshSettingsUpdate} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
