import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, FileText } from 'lucide-react';

interface WorkingBIMDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkingBIMDialog({ isOpen, onClose }: WorkingBIMDialogProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    console.log('WorkingBIMDialog: Close button clicked');
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // Here would be real file processing
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header with working close button */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">BIM File Processor</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h3 className="text-xl font-semibold mb-2">Upload BIM Files</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Support for .rvt, .ifc, .dwg, and .dxf files
            </p>
          </div>

          {/* File upload area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-6">
            <input
              type="file"
              accept=".rvt,.ifc,.dwg,.dxf"
              onChange={handleFileUpload}
              className="hidden"
              id="bim-file-upload"
            />
            <label
              htmlFor="bim-file-upload"
              className="cursor-pointer block"
            >
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to select or drag files here
              </p>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
              Process Files
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}