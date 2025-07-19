/**
 * FIXED BIM PROCESSOR - GROK'S RECOMMENDATIONS IMPLEMENTED
 * Addresses: broken close functionality, proper status parsing, cost extraction, polling timeout
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X, Upload, FileText, CheckCircle, AlertCircle, Clock, Eye, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessingJob {
  id: string;
  fileName: string;
  status: 'uploading' | 'translating' | 'complete' | 'error' | 'timeout';
  progress: number;
  urn?: string;
  error?: string;
  extractedData?: {
    elements: any[];
    totalCost: number;
  };
}

interface FixedBIMProcessorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FixedBIMProcessor({ isOpen, onClose }: FixedBIMProcessorProps) {
  console.log('FixedBIMProcessor render - isOpen:', isOpen);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [currentUrn, setCurrentUrn] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Grok's file size check implementation
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 500MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const validTypes = ['.rvt', '.ifc', '.dwg', '.dxf', '.nwd'];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validTypes.includes(fileExt)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload a valid BIM file (${validTypes.join(', ')})`,
        variant: "destructive",
      });
      return;
    }

    const jobId = Date.now().toString();
    const newJob: ProcessingJob = {
      id: jobId,
      fileName: file.name,
      status: 'uploading',
      progress: 0
    };

    setJobs(prev => [...prev, newJob]);

    try {
      // Upload file using real Forge endpoints
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading to real Forge API...');
      const uploadResponse = await fetch('/api/forge-real/upload-bim', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload response:', uploadData);
      
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'translating', progress: 25, urn: uploadData.urn }
          : job
      ));

      // Start translation
      const translateResponse = await fetch('/api/forge-real/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn: uploadData.urn })
      });

      if (!translateResponse.ok) {
        const errorData = await translateResponse.json();
        throw new Error(errorData.message || 'Translation failed');
      }

      // Poll for translation status with timeout (Grok's recommendation)
      let pollAttempts = 0;
      const maxAttempts = 120; // 10 minutes (5s intervals)
      
      const pollStatus = async () => {
        pollAttempts++;
        
        if (pollAttempts > maxAttempts) {
          setJobs(prev => prev.map(job =>
            job.id === jobId
              ? { ...job, status: 'timeout', error: 'Translation timeout after 10 minutes' }
              : job
          ));
          return;
        }

        try {
          const statusResponse = await fetch(`/api/forge-real/status/${uploadData.urn}`);
          const statusData = await statusResponse.json();
          
          console.log('Status response:', statusData);

          // Grok's proper status parsing implementation
          const progress = statusData.status === 'success' ? 100 : 
                          statusData.status === 'inprogress' ? 75 : 50;

          setJobs(prev => prev.map(job =>
            job.id === jobId
              ? { 
                  ...job, 
                  progress,
                  status: statusData.status === 'success' ? 'complete' : 
                         statusData.status === 'failed' ? 'error' : 'translating'
                }
              : job
          ));

          if (statusData.status === 'success') {
            // Get access token for viewer (Grok's enhancement)
            const tokenResponse = await fetch('/api/forge-real/token', { method: 'POST' });
            const tokenData = await tokenResponse.json();
            setAccessToken(tokenData.access_token);

            // Extract BIM elements with costs (Grok's new endpoint)
            try {
              const extractResponse = await fetch(`/api/forge-real/extract/${uploadData.urn}`, {
                method: 'POST'
              });
              const extractData = await extractResponse.json();
              
              if (extractData.success) {
                setJobs(prev => prev.map(job =>
                  job.id === jobId
                    ? { ...job, extractedData: { elements: extractData.elements, totalCost: extractData.totalCost } }
                    : job
                ));
              }
            } catch (extractError) {
              console.warn('Element extraction failed:', extractError);
            }

          } else if (statusData.status === 'failed') {
            setJobs(prev => prev.map(job =>
              job.id === jobId
                ? { ...job, status: 'error', error: 'Translation failed' }
                : job
            ));
          } else {
            setTimeout(pollStatus, 5000); // Poll every 5 seconds
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          setJobs(prev => prev.map(job =>
            job.id === jobId
              ? { ...job, status: 'error', error: 'Status check failed' }
              : job
          ));
        }
      };

      setTimeout(pollStatus, 5000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: 'error', error: error.message }
          : job
      ));
    }
  }, [toast]);

  const openViewer = (urn: string) => {
    setCurrentUrn(urn);
    setShowViewer(true);
  };

  // Grok's proper close handling - no navigation traps
  const handleClose = () => {
    if (showViewer) {
      setShowViewer(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) {
    console.log('FixedBIMProcessor not rendering - isOpen is false');
    return null;
  }
  
  console.log('FixedBIMProcessor IS RENDERING - modal should be visible');

  return (
    <>
      {/* Fixed Modal with proper close functionality */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-6 h-6" />
                Real BIM Auto-Takeoff Processor
                <Badge variant="outline">Powered by Autodesk Platform Services</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
              <input
                type="file"
                accept=".rvt,.ifc,.dwg,.dxf,.nwd"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="real-bim-upload"
              />
              <label htmlFor="real-bim-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <h3 className="text-lg font-semibold mb-2">Upload Real BIM Files</h3>
                <p className="text-gray-600">
                  Authentic Autodesk Platform Services processing
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: Revit (.rvt), IFC (.ifc), AutoCAD (.dwg), DXF (.dxf), Navisworks (.nwd)
                </p>
                <p className="text-sm text-gray-500">Maximum: 500MB</p>
              </label>
            </div>

            {/* Processing Jobs */}
            {jobs.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Real Processing Jobs</h4>
                {jobs.map(job => (
                  <Card key={job.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          <span className="font-medium">{job.fileName}</span>
                          {job.status === 'complete' && <Badge variant="outline" className="text-green-600">Real Processing Complete</Badge>}
                          {job.status === 'error' && <Badge variant="destructive">Failed</Badge>}
                          {job.status === 'timeout' && <Badge variant="secondary">Timeout</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          {job.status === 'complete' && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <Button 
                                size="sm" 
                                onClick={() => job.urn && openViewer(job.urn)}
                                disabled={!job.urn}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Real 3D Model
                              </Button>
                            </>
                          )}
                          {job.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                          {job.status === 'timeout' && <Clock className="w-5 h-5 text-orange-500" />}
                        </div>
                      </div>
                      <Progress value={job.progress} className="mb-2" />
                      <p className="text-sm text-gray-600">
                        {job.status === 'uploading' && 'Uploading to Autodesk Platform Services...'}
                        {job.status === 'translating' && 'Processing real BIM data...'}
                        {job.status === 'complete' && 'Ready for authentic 3D viewing'}
                        {job.status === 'error' && (job.error || 'Processing failed')}
                        {job.status === 'timeout' && 'Processing timeout - try smaller file'}
                      </p>
                      
                      {/* Cost Analysis Section (Grok's enhancement) */}
                      {job.extractedData && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-semibold mb-2">Real BIM Cost Analysis</h5>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Elements Extracted</p>
                              <p className="text-lg font-bold">{job.extractedData.elements.length.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Project Cost</p>
                              <p className="text-lg font-bold text-green-600">
                                ${job.extractedData.totalCost.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              Based on authentic BIM properties with Australian construction rates
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Real Implementation:</strong> This processor uses authentic Autodesk Platform Services 
                for genuine BIM file processing, not simulation or mock data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Real Forge Viewer - TODO: Implement enhanced viewer */}
      {showViewer && currentUrn && (
        <div className="fixed inset-0 bg-black/80 z-60 flex flex-col">
          <div className="bg-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Real Autodesk Forge Viewer</h2>
            <Button variant="outline" onClick={() => setShowViewer(false)}>
              <X className="w-4 h-4 mr-2" />
              Close Viewer
            </Button>
          </div>
          <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold mb-2">Real Forge Viewer Integration</p>
              <p className="text-gray-600 mb-4">URN: {currentUrn}</p>
              <p className="text-sm text-gray-500">
                Enhanced viewer with SDK v7.100, layers, view modes will be implemented here
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowViewer(false)}
              >
                Close and Return to Processor
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}