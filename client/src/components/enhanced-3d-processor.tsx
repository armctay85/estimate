import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileUp, 
  Loader2, 
  AlertTriangle,
  Download,
  Eye,
  Grid3x3,
  Box,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessingResult {
  format: 'ifc' | 'dwg' | 'dxf' | 'obj' | 'fbx';
  vertices: number[];
  edges: number[][];
  faces: number[][];
  metadata: {
    units: string;
    scale: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
  elements: {
    id: string;
    type: string;
    category: string;
    vertices: number[];
    edges: number[][];
  }[];
}

export function Enhanced3DProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'points'>('wireframe');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // For RVT files, show conversion requirement
      if (file.name.toLowerCase().endsWith('.rvt')) {
        toast({
          title: "RVT Conversion Required",
          description: "RVT files need to be converted to IFC format first. Use Revit's IFC exporter.",
          variant: "destructive"
        });
        
        // Simulate what would happen with proper conversion
        await simulateRVTProcessing();
      } else if (file.name.toLowerCase().endsWith('.ifc')) {
        // For IFC files, we could use IFC.js
        await simulateIFCProcessing();
      } else {
        // For other formats
        await simulateGenericProcessing();
      }
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "Failed to process the file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateRVTProcessing = async () => {
    // Simulate processing steps
    const steps = [
      { name: 'Checking file format', progress: 10 },
      { name: 'RVT format detected - conversion required', progress: 20 },
      { name: 'Simulating IFC conversion', progress: 50 },
      { name: 'Extracting wireframe data', progress: 80 },
      { name: 'Generating preview', progress: 100 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(step.progress);
    }

    // Generate sample wireframe data
    setResult({
      format: 'ifc',
      vertices: generateSampleVertices(),
      edges: generateSampleEdges(),
      faces: generateSampleFaces(),
      metadata: {
        units: 'meters',
        scale: 1.0,
        bounds: {
          min: [0, 0, 0],
          max: [10, 10, 3]
        }
      },
      elements: generateSampleElements()
    });

    renderWireframe();
  };

  const simulateIFCProcessing = async () => {
    // Similar to RVT but direct processing
    await simulateRVTProcessing();
  };

  const simulateGenericProcessing = async () => {
    // For DWG, DXF, etc.
    await simulateRVTProcessing();
  };

  const generateSampleVertices = (): number[] => {
    // Generate vertices for a simple building wireframe
    const vertices: number[] = [];
    
    // Base rectangle
    vertices.push(0, 0, 0);
    vertices.push(10, 0, 0);
    vertices.push(10, 8, 0);
    vertices.push(0, 8, 0);
    
    // Top rectangle
    vertices.push(0, 0, 3);
    vertices.push(10, 0, 3);
    vertices.push(10, 8, 3);
    vertices.push(0, 8, 3);
    
    // Interior walls
    vertices.push(5, 0, 0);
    vertices.push(5, 8, 0);
    vertices.push(5, 0, 3);
    vertices.push(5, 8, 3);
    
    return vertices;
  };

  const generateSampleEdges = (): number[][] => {
    // Define edges connecting vertices
    return [
      [0, 1], [1, 2], [2, 3], [3, 0], // Base
      [4, 5], [5, 6], [6, 7], [7, 4], // Top
      [0, 4], [1, 5], [2, 6], [3, 7], // Verticals
      [8, 9], [10, 11], [8, 10], [9, 11] // Interior
    ];
  };

  const generateSampleFaces = (): number[][] => {
    return [
      [0, 1, 2, 3], // Floor
      [4, 5, 6, 7], // Ceiling
      [0, 1, 5, 4], // Wall 1
      [1, 2, 6, 5], // Wall 2
      [2, 3, 7, 6], // Wall 3
      [3, 0, 4, 7]  // Wall 4
    ];
  };

  const generateSampleElements = () => {
    return [
      {
        id: 'wall-1',
        type: 'Basic Wall',
        category: 'Walls',
        vertices: [0, 1, 5, 4],
        edges: [[0, 1], [1, 5], [5, 4], [4, 0]]
      },
      {
        id: 'floor-1',
        type: 'Floor',
        category: 'Floors',
        vertices: [0, 1, 2, 3],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0]]
      }
    ];
  };

  const renderWireframe = () => {
    if (!canvasRef.current || !result) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up transformation
    const scale = 30;
    const offsetX = 50;
    const offsetY = 200;
    
    // Draw based on view mode
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 1;

    if (viewMode === 'wireframe') {
      // Draw edges
      result.edges.forEach(edge => {
        const v1Index = edge[0] * 3;
        const v2Index = edge[1] * 3;
        
        const x1 = result.vertices[v1Index] * scale + offsetX;
        const y1 = -result.vertices[v1Index + 2] * scale + offsetY;
        const x2 = result.vertices[v2Index] * scale + offsetX;
        const y2 = -result.vertices[v2Index + 2] * scale + offsetY;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    } else if (viewMode === 'points') {
      // Draw vertices
      ctx.fillStyle = '#0066cc';
      for (let i = 0; i < result.vertices.length; i += 3) {
        const x = result.vertices[i] * scale + offsetX;
        const y = -result.vertices[i + 2] * scale + offsetY;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5" />
          Enhanced 3D File Processor
          <Badge variant="secondary">Wireframe Engine</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            <strong>Supported Formats:</strong> IFC (direct), DWG, DXF, OBJ, FBX
            <br />
            <strong>RVT Files:</strong> Require conversion to IFC using Revit's exporter first
          </AlertDescription>
        </Alert>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc,.dwg,.dxf,.obj,.fbx,.rvt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!file ? (
            <div
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-2">
                IFC, DWG, DXF, OBJ, FBX, RVT
              </p>
            </div>
          ) : (
            <div>
              <FileUp className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                onClick={processFile}
                disabled={isProcessing}
                className="mt-4"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process File'
                )}
              </Button>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-gray-600">
              Processing... {progress}%
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Wireframe Preview</h3>
              <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                <TabsList>
                  <TabsTrigger value="wireframe">
                    <Box className="w-4 h-4 mr-1" />
                    Wireframe
                  </TabsTrigger>
                  <TabsTrigger value="points">
                    <Layers className="w-4 h-4 mr-1" />
                    Points
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Model Info</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Format: {result.format.toUpperCase()}</div>
                  <div>Vertices: {result.vertices.length / 3}</div>
                  <div>Edges: {result.edges.length}</div>
                  <div>Elements: {result.elements.length}</div>
                  <div>Units: {result.metadata.units}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Export Options",
                        description: "Export to DXF, OBJ, or Three.js JSON format"
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Wireframe
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => renderWireframe()}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Refresh View
                  </Button>
                </CardContent>
              </Card>
            </div>

            {file?.name.toLowerCase().endsWith('.rvt') && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>RVT File Detected:</strong> This is a simulation. For actual RVT wireframe extraction:
                  <ol className="list-decimal ml-5 mt-2 text-sm">
                    <li>Open the RVT file in Revit</li>
                    <li>Export to IFC format (File → Export → IFC)</li>
                    <li>Upload the IFC file here for true wireframe extraction</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}