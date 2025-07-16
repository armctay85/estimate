import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SimpleTestViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleTestViewer({ isOpen, onClose }: SimpleTestViewerProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    console.log('TEST: Close button clicked - working');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md max-h-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Test Viewer</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClose}
            className="cursor-pointer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p>If you can see this and the close button works, the component system is functional.</p>
        <Button onClick={handleClose} className="mt-4 w-full">
          Close Test
        </Button>
      </div>
    </div>
  );
}