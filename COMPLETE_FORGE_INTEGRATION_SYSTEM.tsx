/**
 * COMPLETE AUTODESK FORGE INTEGRATION SYSTEM
 * Enterprise-grade BIM visualization platform with full backend integration
 * 
 * This system provides:
 * - Complete parent components for Forge 3D viewer
 * - Full backend API integration
 * - Professional file upload and processing pipeline
 * - Enterprise-grade authentication and error handling
 * - Real-time BIM cost analysis and element extraction
 */

// =============================================================================
// PARENT COMPONENT: BIM Upload and Processing Manager
// =============================================================================

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Building, 
  Eye,
  Settings,
  Download,
  Loader2
} from 'lucide-react';
import { ProfessionalForge3DViewer } from './FORGE_3D_VIEWER_SOURCE';

interface BIMFile {
  file: File;
  urn?: string;
  translationStatus?: 'pending' | 'processing' | 'success' | 'failed';
  translationProgress?: number;
  modelMetadata?: any;
  extractedElements?: BIMElement[];
  totalCost?: number;
}

interface BIMElement {
  id: string;
  name: string;
  category: string;
  properties: Record<string, any>;
  cost: number;
  material: string;
  quantity: number;
  unit: string;
}

export function EnterpriseBIMProcessor() {
  const [uploadedFiles, setUploadedFiles] = useState<BIMFile[]>([]);
  const [currentFile, setCurrentFile] = useState<BIMFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [forgeAccessToken, setForgeAccessToken] = useState<string>('');
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [processingLog, setProcessingLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Forge access token
  const getForgeToken = useCallback(async () => {
    try {
      const response = await fetch('/api/forge/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setForgeAccessToken(data.access_token);
      addLog('✅ Forge authentication successful');
      return data.access_token;
    } catch (error) {
      addLog(`❌ Authentication error: ${error.message}`);
      throw error;
    }
  }, []);

  // Add log entry
  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;

    const file = files[0];
    const supportedFormats = ['.rvt', '.ifc', '.dwg', '.dxf', '.nwd', '.fbx'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!supportedFormats.includes(fileExtension)) {
      addLog(`❌ Unsupported file format: ${fileExtension}`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    addLog(`📁 Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // Get authentication token
      const token = await getForgeToken();
      setUploadProgress(10);

      // Upload file to Forge
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);

      const uploadResponse = await fetch('/api/forge/upload-bim', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      setUploadProgress(30);
      addLog(`✅ File uploaded successfully, URN: ${uploadData.urn}`);

      // Start translation
      const translationResponse = await fetch('/api/forge/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          urn: uploadData.urn,
          outputFormat: 'svf2'
        })
      });

      if (!translationResponse.ok) {
        throw new Error(`Translation failed: ${translationResponse.statusText}`);
      }

      setUploadProgress(50);
      addLog('🔄 Translation job started');

      // Create BIM file object
      const bimFile: BIMFile = {
        file,
        urn: uploadData.urn,
        translationStatus: 'processing',
        translationProgress: 0
      };

      setUploadedFiles(prev => [...prev, bimFile]);
      setCurrentFile(bimFile);

      // Poll for translation status
      pollTranslationStatus(uploadData.urn, token, bimFile);

    } catch (error) {
      addLog(`❌ Upload error: ${error.message}`);
      setIsUploading(false);
    }
  }, []);

  // Poll translation status
  const pollTranslationStatus = async (urn: string, token: string, bimFile: BIMFile) => {
    const maxAttempts = 60; // 30 minutes with 30-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const response = await fetch(`/api/forge/status/${urn}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Status check failed: ${response.statusText}`);
        }

        const statusData = await response.json();
        const progress = Math.min(50 + (attempts * 2), 90);
        setUploadProgress(progress);

        addLog(`🔄 Translation progress: ${statusData.progress || 'Processing...'}`);

        if (statusData.status === 'success') {
          setUploadProgress(100);
          addLog('✅ Translation completed successfully');
          
          // Update file status
          const updatedFile = {
            ...bimFile,
            translationStatus: 'success' as const,
            translationProgress: 100
          };
          
          setUploadedFiles(prev => 
            prev.map(f => f.urn === urn ? updatedFile : f)
          );
          setCurrentFile(updatedFile);
          setIsUploading(false);

          // Extract BIM data
          await extractBIMData(urn, token, updatedFile);
          
        } else if (statusData.status === 'failed') {
          throw new Error('Translation failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Translation timeout');
        } else {
          // Continue polling
          setTimeout(poll, 30000); // Poll every 30 seconds
        }

      } catch (error) {
        addLog(`❌ Translation error: ${error.message}`);
        setIsUploading(false);
        
        setUploadedFiles(prev => 
          prev.map(f => f.urn === urn ? { ...f, translationStatus: 'failed' } : f)
        );
      }
    };

    poll();
  };

  // Extract BIM data and calculate costs
  const extractBIMData = async (urn: string, token: string, bimFile: BIMFile) => {
    try {
      addLog('🔍 Extracting BIM elements and costs...');
      
      const response = await fetch(`/api/forge/extract/${urn}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Data extraction failed: ${response.statusText}`);
      }

      const extractedData = await response.json();
      
      // Process elements and calculate costs
      const elements: BIMElement[] = extractedData.elements.map((el: any) => ({
        id: el.dbId || el.id,
        name: el.name || `Element ${el.dbId}`,
        category: el.category || 'Unknown',
        properties: el.properties || {},
        cost: calculateElementCost(el),
        material: el.material || 'Unknown',
        quantity: el.quantity || 1,
        unit: el.unit || 'ea'
      }));

      const totalCost = elements.reduce((sum, el) => sum + el.cost, 0);

      // Update file with extracted data
      const updatedFile = {
        ...bimFile,
        extractedElements: elements,
        totalCost,
        modelMetadata: extractedData.metadata
      };

      setUploadedFiles(prev => 
        prev.map(f => f.urn === urn ? updatedFile : f)
      );
      setCurrentFile(updatedFile);

      addLog(`✅ Extracted ${elements.length} elements, Total cost: $${totalCost.toLocaleString()}`);

    } catch (error) {
      addLog(`❌ Data extraction error: ${error.message}`);
    }
  };

  // Calculate element cost based on properties
  const calculateElementCost = (element: any): number => {
    // Australian construction rates integration
    const materialRates: Record<string, number> = {
      'concrete': 165, // per m²
      'steel': 1230, // per tonne
      'timber': 1650, // per m³
      'brick': 180, // per m²
      'glass': 400, // per m²
      'aluminum': 85, // per m²
      'plasterboard': 35, // per m²
    };

    const volume = parseFloat(element.properties?.Volume?.value || '1');
    const area = parseFloat(element.properties?.Area?.value || '1');
    const material = (element.material || 'concrete').toLowerCase();
    
    const rate = materialRates[material] || 200;
    const measureUnit = element.properties?.Volume ? volume : area;
    
    return Math.round(measureUnit * rate);
  };

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Building className="w-8 h-8 text-blue-600" />
          Enterprise BIM Auto-Takeoff System
        </h1>
        <p className="text-gray-600">
          Professional Autodesk Forge integration for real BIM file processing and cost analysis
        </p>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Autodesk Platform Services (APS) Integration
        </Badge>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">File Upload</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="analysis">BIM Analysis</TabsTrigger>
          <TabsTrigger value="viewer">3D Viewer</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                BIM File Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Upload BIM Files</h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop your BIM files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported formats: .rvt, .ifc, .dwg, .dxf, .nwd, .fbx (Max: 500MB)
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mb-4"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </>
                  )}
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".rvt,.ifc,.dwg,.dxf,.nwd,.fbx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {isUploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="w-full mb-2" />
                    <p className="text-sm text-gray-600">{uploadProgress}% Complete</p>
                  </div>
                )}
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Uploaded Files</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{file.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.translationStatus === 'success' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Ready
                            </Badge>
                          )}
                          {file.translationStatus === 'processing' && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Processing
                            </Badge>
                          )}
                          {file.translationStatus === 'failed' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              Failed
                            </Badge>
                          )}
                          {file.totalCost && (
                            <Badge variant="outline">
                              ${file.totalCost.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Processing Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                {processingLog.length === 0 ? (
                  <p>No processing activity yet. Upload a BIM file to begin.</p>
                ) : (
                  processingLog.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          {currentFile?.extractedElements ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    BIM Element Analysis
                  </span>
                  <Badge variant="outline">
                    {currentFile.extractedElements.length} Elements
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-600">Total Cost</h4>
                      <p className="text-2xl font-bold">${currentFile.totalCost?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-600">Elements</h4>
                      <p className="text-2xl font-bold">{currentFile.extractedElements.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-purple-600">Categories</h4>
                      <p className="text-2xl font-bold">
                        {new Set(currentFile.extractedElements.map(el => el.category)).size}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Elements Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 text-left">Element</th>
                        <th className="border border-gray-300 p-2 text-left">Category</th>
                        <th className="border border-gray-300 p-2 text-left">Material</th>
                        <th className="border border-gray-300 p-2 text-left">Quantity</th>
                        <th className="border border-gray-300 p-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentFile.extractedElements.slice(0, 20).map((element) => (
                        <tr key={element.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2">{element.name}</td>
                          <td className="border border-gray-300 p-2">
                            <Badge variant="outline">{element.category}</Badge>
                          </td>
                          <td className="border border-gray-300 p-2">{element.material}</td>
                          <td className="border border-gray-300 p-2">
                            {element.quantity} {element.unit}
                          </td>
                          <td className="border border-gray-300 p-2 text-right font-mono">
                            ${element.cost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {currentFile.extractedElements.length > 20 && (
                  <p className="text-center text-gray-500 mt-4">
                    Showing first 20 elements. Total: {currentFile.extractedElements.length}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No BIM analysis data available. Upload and process a BIM file first.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* 3D Viewer Tab */}
        <TabsContent value="viewer" className="space-y-4">
          {currentFile?.urn && currentFile.translationStatus === 'success' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Professional 3D Viewer
                  </span>
                  <Button onClick={() => setShow3DViewer(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Open 3D Viewer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">3D Model Ready</h3>
                  <p className="text-gray-600 mb-4">
                    Your BIM model has been processed and is ready for viewing
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">File:</span> {currentFile.file.name}
                    </div>
                    <div>
                      <span className="font-medium">URN:</span> {currentFile.urn.slice(0, 20)}...
                    </div>
                    <div>
                      <span className="font-medium">Elements:</span> {currentFile.extractedElements?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Total Cost:</span> ${currentFile.totalCost?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No 3D model available. Upload and process a BIM file to view the 3D model.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* 3D Viewer Modal */}
      {show3DViewer && currentFile?.urn && (
        <ProfessionalForge3DViewer
          isOpen={show3DViewer}
          onClose={() => setShow3DViewer(false)}
          urn={currentFile.urn}
          fileName={currentFile.file.name}
          accessToken={forgeAccessToken}
          onElementSelect={(element) => {
            console.log('Element selected:', element);
          }}
        />
      )}
    </div>
  );
}

export default EnterpriseBIMProcessor;