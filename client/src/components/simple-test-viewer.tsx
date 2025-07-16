import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface SimpleTestViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleTestViewer({ isOpen, onClose }: SimpleTestViewerProps) {
  console.log('SimpleTestViewer render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('SimpleTestViewer: Not rendering - isOpen is false');
    return null;
  }

  const handleClose = () => {
    console.log('TEST: Close button clicked - working');
    onClose();
  };

  console.log('SimpleTestViewer: Rendering modal overlay');

  return (
    <div 
      className="fixed inset-0 bg-red-500/80 z-[99999] flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 shadow-2xl max-w-md w-full"
        style={{ 
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-black">EMERGENCY TEST VIEWER</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClose}
            className="cursor-pointer bg-red-600 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-black">You should see this red overlay. The close button should work.</p>
        <Button onClick={handleClose} className="mt-4 w-full bg-green-600 hover:bg-green-700">
          CLOSE THIS TEST
        </Button>
      </div>
    </div>
  );
}