import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BIMUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: (urn: string) => void;
}

export function BIMUploadModal({ isOpen, onClose, onUploadSuccess }: BIMUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [progress, setProgress] = useState(0);

  /**
   * GROK'S FIXED UPLOAD FUNCTION
   * Uses XMLHttpRequest for proper progress tracking and file handling
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);
    
    setIsUploading(true);
    setUploadStatus('Uploading... 0%');
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/forge/upload-bim');

    // Progress tracking
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setUploadStatus(`Uploading... ${percent}%`);
      }
    };

    // Response handling
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setIsUploading(false);
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            console.log('Upload successful:', result);
            
            if (result.status === 'translating') {
              setUploadStatus('Upload successful! Translation in progress...');
              // Start polling for translation completion
              if (result.urn) {
                pollTranslationStatus(result.urn);
              }
            } else if (result.status === 'ready') {
              setUploadStatus('Upload and translation complete! BIM model ready.');
              // Notify parent component
              if (onUploadSuccess && result.urn) {
                onUploadSuccess(result.urn);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse response:', parseError);
            setUploadStatus('Upload completed but response parsing failed');
          }
        } else {
          console.error('Upload failed:', xhr.status, xhr.statusText, xhr.responseText);
          setUploadStatus(`Upload failed: ${xhr.statusText}`);
        }
      }
    };

    // Error handling
    xhr.onerror = () => {
      setIsUploading(false);
      setUploadStatus('Upload failed: Network error');
    };

    // Create FormData with correct field name matching backend
    const formData = new FormData();
    formData.append('file', file); // Matches Grok's backend implementation
    
    console.log('Starting upload with XMLHttpRequest...');
    xhr.send(formData);
  };

  /**
   * Poll translation status until complete
   */
  const pollTranslationStatus = async (urn: string) => {
    const maxAttempts = 60; // 30 minutes max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/forge/status/${encodeURIComponent(urn)}`);
        const status = await response.json();

        if (status.status === 'success') {
          setUploadStatus('Translation complete! BIM model ready for viewing.');
          console.log('Translation completed successfully');
          // Notify parent component when translation is complete
          if (onUploadSuccess) {
            onUploadSuccess(urn);
          }
        } else if (status.status === 'failed') {
          setUploadStatus('Translation failed. Please try a different file format.');
          console.error('Translation failed:', status);
        } else if (attempts < maxAttempts) {
          attempts++;
          const remainingTime = Math.round((maxAttempts - attempts) * 0.5); // 30 second intervals
          setUploadStatus(`Processing BIM file... ${attempts}/${maxAttempts} (${remainingTime}min remaining)`);
          setTimeout(poll, 30000); // Check every 30 seconds
        } else {
          setUploadStatus('Translation timeout. The file may still be processing.');
          console.warn('Translation polling timed out');
        }
      } catch (error) {
        console.error('Translation status error:', error);
        setUploadStatus('Error checking translation status.');
      }
    };

    await poll();
  };

  const handleClose = () => {
    setIsUploading(false);
    setProgress(0);
    setUploadStatus('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 w-full max-w-lg shadow-2xl"
          >
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            Upload BIM File
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Real-time processing with Autodesk Platform Services
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Supports: Revit (.rvt), IFC (.ifc), AutoCAD (.dwg), DXF (.dxf) up to 500MB
          </p>
        </div>
        
        {/* Enhanced file input with better styling */}
        <div className="mb-6">
          <input
            type="file"
            accept=".rvt,.ifc,.dwg,.dxf"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                      file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
                      hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300
                      disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        {/* Progress indicator with enhanced styling */}
        {isUploading && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {uploadStatus}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Large files may take several minutes to process
            </p>
          </div>
        )}

        {/* Status message display */}
        {uploadStatus && !isUploading && (
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {uploadStatus}
            </p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 rounded-lg border 
                     border-gray-300 dark:border-gray-600 hover:bg-gray-100 
                     dark:hover:bg-gray-700 transition-colors"
            disabled={isUploading}
          >
            {isUploading ? 'Processing...' : 'Cancel'}
          </button>
          <button 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUploading}
            onClick={() => {
              // Optional: Trigger file input click for better UX
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput && !isUploading) {
                fileInput.click();
              }
            }}
          >
            {isUploading ? 'Processing...' : 'Select File'}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}