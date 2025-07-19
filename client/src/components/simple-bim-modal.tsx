import React from 'react';
import { X, Upload, Building } from 'lucide-react';

interface SimpleBIMModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleBIMModal({ isOpen, onClose }: SimpleBIMModalProps) {
  console.log('SimpleBIMModal render - isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('SimpleBIMModal not rendering - isOpen is false');
    return null;
  }
  
  console.log('SimpleBIMModal IS RENDERING - modal should be visible');

  const handleClose = () => {
    console.log('SimpleBIMModal close clicked');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          console.log('SimpleBIMModal backdrop clicked');
          handleClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise BIM Auto-Takeoff</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Autodesk Platform Services Integration</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">Upload BIM Files</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Real Autodesk Platform Services processing
            </p>
            <p className="text-sm text-gray-500">
              Supports: Revit (.rvt), IFC (.ifc), AutoCAD (.dwg), DXF (.dxf)
            </p>
            <input
              type="file"
              accept=".rvt,.ifc,.dwg,.dxf"
              className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Process BIM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}