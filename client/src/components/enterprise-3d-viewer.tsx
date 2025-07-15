import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Building, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { ForgeViewer } from './forge-viewer';

interface Enterprise3DViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UploadedFile {
  fileName: string;
  fileSize: number;
  fileType: string;
  urn: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  message?: string;
  uploadedAt: Date;
}

export function Enterprise3DViewer({ isOpen, onClose }: Enterprise3DViewerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [currentFile, setCurrentFile] = useState<UploadedFile | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const supportedTypes = ['.rvt', '.ifc', '.dwg', '.dxf', '.fbx', '.obj'];
    const fileName = file.name.toLowerCase();
    const isSupported = supportedTypes.some(type => fileName.endsWith(type));
    
    if (!isSupported) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload RVT, IFC, DWG, DXF, FBX, or OBJ files.",
        variant: "destructive",
      });
      return;
    }

    // Create upload entry
    const uploadEntry: UploadedFile = {
      fileName: file.name,
      fileSize: file.size,
      fileType: fileName.split('.').pop()?.toUpperCase() || '',
      urn: '',
      status: 'uploading',
      progress: 0,
      uploadedAt: new Date()
    };

    setUploadedFiles(prev => [...prev, uploadEntry]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to Forge API
      const response = await fetch('/api/forge/upload-bim', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Update upload entry with success
      setUploadedFiles(prev => 
        prev.map(f => 
          f.fileName === file.name ? {
            ...f,
            urn: result.urn,
            status: 'ready',
            progress: 100,
            message: 'File uploaded and translated successfully'
          } : f
        )
      );

      toast({
        title: "BIM File Uploaded",
        description: `${file.name} has been processed and is ready for 3D viewing.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update upload entry with error
      setUploadedFiles(prev => 
        prev.map(f => 
          f.fileName === file.name ? {
            ...f,
            status: 'error',
            progress: 0,
            message: error.message || 'Upload failed'
          } : f
        )
      );

      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload BIM file. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleView3D = (file: UploadedFile) => {
    if (file.status === 'ready' && file.urn) {
      setCurrentFile(file);
      setShowViewer(true);
    }
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setCurrentFile(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return 'Ready for 3D Viewing';
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'error': return 'Upload Failed';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Upload Interface */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building className="w-6 h-6" />
                Enterprise 3D BIM Viewer
                <Badge className="bg-purple-800 text-purple-100">Autodesk Forge</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Upload Section */}
            <div className="mb-8">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Upload BIM Files</h3>
                <p className="text-gray-600 mb-4">
                  Upload your CAD/BIM files for professional 3D visualization
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge variant="outline">.RVT</Badge>
                  <Badge variant="outline">.IFC</Badge>
                  <Badge variant="outline">.DWG</Badge>
                  <Badge variant="outline">.DXF</Badge>
                  <Badge variant="outline">.FBX</Badge>
                  <Badge variant="outline">.OBJ</Badge>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".rvt,.ifc,.dwg,.dxf,.fbx,.obj"
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Select BIM File
                </Button>
              </div>
            </div>

            {/* Enterprise Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold">3D Navigation</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Professional 3D navigation with zoom, pan, and rotate controls
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold">Element Selection</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Click any element to inspect properties and cost data
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Real-time Rendering</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    High-quality rendering with shadows, lighting, and materials
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
                <div className="space-y-4">
                  {uploadedFiles.map((file, index) => (
                    <Card key={index} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(file.status)}`}></div>
                            <div>
                              <div className="font-medium">{file.fileName}</div>
                              <div className="text-sm text-gray-500">
                                {formatFileSize(file.fileSize)} • {file.fileType} • {file.uploadedAt.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                {file.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {file.status === 'ready' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                                <span>{getStatusText(file.status)}</span>
                              </div>
                              {file.message && (
                                <div className="text-xs text-gray-500 mt-1">{file.message}</div>
                              )}
                            </div>
                            
                            {file.status === 'ready' && (
                              <Button
                                onClick={() => handleView3D(file)}
                                className="bg-purple-600 hover:bg-purple-700"
                                size="sm"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View in 3D
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Files Message */}
            {uploadedFiles.length === 0 && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  No BIM files uploaded yet. Upload a file to start viewing in 3D with professional Autodesk Forge rendering.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3D Viewer Modal */}
      {showViewer && currentFile && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4">
          <Card className="max-w-[95vw] max-h-[95vh] w-full h-full">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  3D Model Viewer - {currentFile.fileName}
                  <Badge className="bg-purple-800 text-purple-100">Autodesk Forge</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleCloseViewer} className="text-white hover:bg-white/20">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-0 flex-1">
              <div className="h-[calc(95vh-120px)]">
                <ForgeViewer
                  urn={currentFile.urn}
                  fileName={currentFile.fileName}
                  onClose={handleCloseViewer}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}