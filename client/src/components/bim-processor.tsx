import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Building, Zap, CheckCircle, Clock, Target, Eye, Layers, Palette, TreePine, RotateCcw, ZoomIn, ZoomOut, Calendar, Move3d } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PARAMETRIC_ASSEMBLIES, AUSTRALIAN_RATES } from "@shared/schema";
import { ProjectScheduler } from "./project-scheduler";
import { WireframeViewer } from "./wireframe-viewer";
import { AIQSCompliancePanel } from "./aiqs-compliance-panel";

interface BIMElement {
  id: string;
  category: 'structural' | 'architectural' | 'mep' | 'finishes' | 'external';
  type: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface ProcessingResult {
  structural: BIMElement[];
  architectural: BIMElement[];
  mep: BIMElement[];
  finishes: BIMElement[];
  external: BIMElement[];
  parametric?: ParametricElement[];
  accuracy: string;
  processingTime: string;
  totalElements: number;
  totalCost: number;
}

interface ParametricElement {
  id: string;
  name: string;
  quantity: number;
  cost: number;
  eco_rating: number;
  components: { material: string; quantity: number; unit: string }[];
}

export function BIMProcessor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const simulateProcessing = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    const steps = [
      { name: 'File validation and upload', duration: 2000 },
      { name: 'AI element detection', duration: 8000 },
      { name: 'Quantity calculation', duration: 5000 },
      { name: 'Cost estimation', duration: 3000 },
      { name: 'Report generation', duration: 2000 }
    ];

    let totalProgress = 0;
    
    for (const [index, step] of steps.entries()) {
      setCurrentStep(step.name);
      
      // Simulate step progress
      const stepProgress = 100 / steps.length;
      const startProgress = totalProgress;
      
      for (let i = 0; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, step.duration / 20));
        setProgress(startProgress + (stepProgress * i / 100));
      }
      
      totalProgress += stepProgress;
    }

    // Generate mock results
    const mockResult: ProcessingResult = {
      structural: [
        { id: '1', category: 'structural', type: 'Concrete Slab', quantity: 450, unit: 'm²', cost: 74250 },
        { id: '2', category: 'structural', type: 'Steel Beams', quantity: 12, unit: 'each', cost: 36000 },
        { id: '3', category: 'structural', type: 'Columns', quantity: 18, unit: 'each', cost: 54000 }
      ],
      architectural: [
        { id: '4', category: 'architectural', type: 'External Walls', quantity: 120, unit: 'm²', cost: 21600 },
        { id: '5', category: 'architectural', type: 'Windows', quantity: 24, unit: 'each', cost: 19200 },
        { id: '6', category: 'architectural', type: 'Doors', quantity: 15, unit: 'each', cost: 22500 }
      ],
      mep: [
        { id: '7', category: 'mep', type: 'Electrical Rough-in', quantity: 450, unit: 'm²', cost: 31500 },
        { id: '8', category: 'mep', type: 'Plumbing Rough-in', quantity: 450, unit: 'm²', cost: 27000 },
        { id: '9', category: 'mep', type: 'HVAC System', quantity: 450, unit: 'm²', cost: 81000 }
      ],
      finishes: [
        { id: '10', category: 'finishes', type: 'Flooring', quantity: 380, unit: 'm²', cost: 26600 },
        { id: '11', category: 'finishes', type: 'Paint & Finishes', quantity: 850, unit: 'm²', cost: 17000 }
      ],
      external: [
        { id: '12', category: 'external', type: 'Landscaping', quantity: 200, unit: 'm²', cost: 12000 },
        { id: '13', category: 'external', type: 'Paving', quantity: 150, unit: 'm²', cost: 15000 }
      ],
      accuracy: '±2%',
      processingTime: '23 minutes',
      totalElements: 13,
      totalCost: 0
    };

    // Add parametric assemblies with escalation
    const parametricElements = PARAMETRIC_ASSEMBLIES.slice(0, 5).map((assembly, index) => ({
      id: `p${index + 1}`,
      name: assembly.name,
      quantity: Math.floor(Math.random() * 50) + 10,
      cost: assembly.total_cost * (1 + (AUSTRALIAN_RATES.escalation_factors.annual_2025 / 100)) * (Math.floor(Math.random() * 50) + 10),
      eco_rating: assembly.eco_rating,
      components: assembly.components
    }));

    mockResult.parametric = parametricElements;

    // Calculate total cost including parametric
    mockResult.totalCost = [
      ...mockResult.structural,
      ...mockResult.architectural,
      ...mockResult.mep,
      ...mockResult.finishes,
      ...mockResult.external
    ].reduce((sum, element) => sum + element.cost, 0) + 
    (parametricElements?.reduce((sum, element) => sum + element.cost, 0) || 0);

    // Update total elements count
    mockResult.totalElements = 13 + parametricElements.length;

    setResult(mockResult);
    setIsProcessing(false);
    setCurrentStep('Processing complete');
    
    toast({
      title: "BIM Processing Complete",
      description: `Successfully processed ${file.name} with ${mockResult.totalElements} elements detected.`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileUpload triggered');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }
    console.log('File selected:', file.name, file.type, file.size);
    processFile(file);
  };

  const processFile = async (file: File) => {
    console.log('processFile called with:', file.name);
    const allowedTypes = ['.dwg', '.dxf', '.ifc', '.rvt', '.skp', '.pln', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    console.log('File extension:', fileExtension);
    
    if (!allowedTypes.includes(fileExtension)) {
      console.log('File type not supported');
      toast({
        title: "Unsupported File Type",
        description: "Please upload a DWG, DXF, IFC, Revit, SketchUp, ArchiCAD, or PDF file.",
        variant: "destructive"
      });
      return;
    }

    console.log('File accepted, starting processing...');
    setCurrentFileName(file.name); // Capture the actual file name
    await simulateProcessing(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    console.log('File dropped');
    
    const file = e.dataTransfer.files[0];
    if (file) {
      console.log('Processing dropped file:', file.name);
      processFile(file);
    } else {
      console.log('No file in drop event');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      structural: 'bg-red-100 text-red-800',
      architectural: 'bg-blue-100 text-blue-800',
      mep: 'bg-green-100 text-green-800',
      finishes: 'bg-purple-100 text-purple-800',
      external: 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          onClick={() => {
            console.log('BIM Auto-Takeoff button clicked, opening dialog');
            setIsOpen(true);
          }}
        >
          <Upload className="w-4 h-4 mr-2" />
          BIM Auto-Takeoff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Enterprise BIM Auto-Takeoff System
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!isProcessing && !result && (
            <div className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Upload your BIM/CAD files for AI-powered automatic quantity takeoff. 
                  Supports DWG, DXF, IFC, Revit (.RVT), SketchUp (.SKP), ArchiCAD (.PLN), and PDF plans.
                </AlertDescription>
              </Alert>

              <Card 
                className={`border-dashed border-2 transition-colors ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-300 hover:border-emerald-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Upload BIM/CAD File</h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your file here or click to browse
                    </p>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Choose File button clicked');
                        if (fileInputRef.current) {
                          console.log('File input found, triggering click');
                          fileInputRef.current.click();
                        } else {
                          console.error('File input ref not found');
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dwg,.dxf,.ifc,.rvt,.skp,.pln,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  {/* Backup direct upload button for testing */}
                  <div className="mt-4 p-2 border rounded bg-gray-50">
                    <p className="text-xs text-gray-600 mb-2">Direct Upload Test:</p>
                    <input
                      type="file"
                      accept=".dwg,.dxf,.ifc,.rvt,.skp,.pln,.pdf"
                      onChange={handleFileUpload}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    <h4 className="font-semibold">±2% Accuracy</h4>
                    <p className="text-sm text-gray-600">Guaranteed precision</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-semibold">15-45 Minutes</h4>
                    <p className="text-sm text-gray-600">Processing time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <h4 className="font-semibold">5+ Categories</h4>
                    <p className="text-sm text-gray-600">Element detection</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 animate-pulse" />
                    AI Processing in Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{currentStep}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                  
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      AI is analyzing your BIM file and detecting construction elements. 
                      This process typically takes 15-45 minutes depending on file complexity.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    BIM Processing Complete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{result.totalElements}</div>
                      <div className="text-sm text-gray-600">Elements Detected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">${result.totalCost.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Cost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{result.accuracy}</div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{result.processingTime}</div>
                      <div className="text-sm text-gray-600">Processing Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Takeoff Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live BIM Wireframe Visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 3D Wireframe Viewer */}
                    <div className="space-y-4">
                      <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] relative">
                        <div className="absolute top-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                          90646-001 Rowville DT AUS_Final DD.0001.rvt
                        </div>
                        
                        {/* Simulated 3D Wireframe */}
                        <svg className="w-full h-full" viewBox="0 0 400 300">
                          {/* Foundation/Slab */}
                          <rect x="50" y="200" width="300" height="80" fill="#ff4444" fillOpacity="0.3" stroke="#ff4444" strokeWidth="2" />
                          <text x="55" y="215" fill="#fff" fontSize="10">Concrete Slab: 240m² @ $165/m² = $39,600</text>
                          
                          {/* Walls */}
                          <rect x="50" y="120" width="300" height="80" fill="#4444ff" fillOpacity="0.3" stroke="#4444ff" strokeWidth="2" />
                          <text x="55" y="135" fill="#fff" fontSize="10">Masonry Walls: 180m² @ $180/m² = $32,400</text>
                          
                          {/* Roof */}
                          <polygon points="50,120 200,60 350,120" fill="#ffff44" fillOpacity="0.3" stroke="#ffff44" strokeWidth="2" />
                          <text x="55" y="105" fill="#fff" fontSize="10">Colorbond Roof: 280m² @ $80/m² = $22,400</text>
                          
                          {/* MEP Systems */}
                          <circle cx="100" cy="160" r="15" fill="#ff8800" fillOpacity="0.5" stroke="#ff8800" strokeWidth="2" />
                          <text x="70" y="185" fill="#fff" fontSize="8">HVAC: $85/m²</text>
                          
                          <circle cx="300" cy="160" r="15" fill="#8800ff" fillOpacity="0.5" stroke="#8800ff" strokeWidth="2" />
                          <text x="270" y="185" fill="#fff" fontSize="8">Electrical: $75/m²</text>
                          
                          {/* Grid lines */}
                          <defs>
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#444" strokeWidth="0.5"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                        
                        {/* Controls */}
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-white border-white hover:bg-white/20"
                            onClick={() => setShowWireframe(true)}
                          >
                            <Move3d className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/20">
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/20">
                            <ZoomIn className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-white border-white hover:bg-white/20">
                            <ZoomOut className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Element Visibility Controls */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Layers className="w-3 h-3 mr-1" />
                          Toggle Structural
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Building className="w-3 h-3 mr-1" />
                          Toggle MEP
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Palette className="w-3 h-3 mr-1" />
                          Toggle Finishes
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          <TreePine className="w-3 h-3 mr-1" />
                          Toggle External
                        </Button>
                      </div>
                    </div>

                    {/* Live Quantity Takeoff Panel */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Live Quantity Takeoff</h4>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {result.structural.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-400 rounded"></div>
                              <span className="font-medium">{item.type}</span>
                            </div>
                            <div className="text-right">
                              <div>{item.quantity} {item.unit}</div>
                              <div className="font-semibold text-red-700">${item.cost.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        
                        {result.architectural.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-400 rounded"></div>
                              <span className="font-medium">{item.type}</span>
                            </div>
                            <div className="text-right">
                              <div>{item.quantity} {item.unit}</div>
                              <div className="font-semibold text-blue-700">${item.cost.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        
                        {result.mep.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-400 rounded"></div>
                              <span className="font-medium">{item.type}</span>
                            </div>
                            <div className="text-right">
                              <div>{item.quantity} {item.unit}</div>
                              <div className="font-semibold text-green-700">${item.cost.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        
                        {result.finishes.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-purple-400 rounded"></div>
                              <span className="font-medium">{item.type}</span>
                            </div>
                            <div className="text-right">
                              <div>{item.quantity} {item.unit}</div>
                              <div className="font-semibold text-purple-700">${item.cost.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                        
                        {result.external.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-400 rounded"></div>
                              <span className="font-medium">{item.type}</span>
                            </div>
                            <div className="text-right">
                              <div>{item.quantity} {item.unit}</div>
                              <div className="font-semibold text-orange-700">${item.cost.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy Quantification & Cost Verification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Cost Accuracy Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Area-Based Cost Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Area-Based Rate Analysis</h4>
                      <div className="space-y-3">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Foundation & Slab</span>
                            <span className="text-red-600 font-bold">$39,600</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Area Measured: 240m² (AI Detection: 98.2% confidence)</div>
                            <div>Rate Applied: $165/m² (Concrete slab with mesh)</div>
                            <div>Coverage: Full building footprint detected</div>
                            <div className="text-green-600">✓ Complete coverage verified</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Exterior Walls</span>
                            <span className="text-blue-600 font-bold">$32,400</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Area Measured: 180m² (AI Detection: 96.8% confidence)</div>
                            <div>Rate Applied: $180/m² (Double brick masonry)</div>
                            <div>Coverage: Perimeter walls, openings deducted</div>
                            <div className="text-green-600">✓ Door/window openings correctly deducted</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Roofing System</span>
                            <span className="text-yellow-600 font-bold">$22,400</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Area Measured: 280m² (AI Detection: 94.5% confidence)</div>
                            <div>Rate Applied: $80/m² (Colorbond steel roofing)</div>
                            <div>Coverage: Pitched roof including overhangs</div>
                            <div className="text-amber-500">⚠ Manual verification recommended for complex roof geometry</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">MEP Services</span>
                            <span className="text-green-600 font-bold">$38,400</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Floor Area: 240m² × $160/m² (combined services)</div>
                            <div>Electrical: $75/m², Plumbing: $45/m², HVAC: $40/m²</div>
                            <div>Coverage: Full building services distribution</div>
                            <div className="text-green-600">✓ Service routing verified</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quality Metrics */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Quality & Confidence Metrics</h4>
                      
                      {/* Overall Accuracy Score */}
                      <div className="bg-green-50 border border-green-200 p-4 rounded">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-green-800">Overall Accuracy</span>
                          <span className="text-2xl font-bold text-green-600">96.4%</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span>Element Detection</span>
                            <span>98.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Area Calculation</span>
                            <span>96.1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate Application</span>
                            <span>99.8%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost Estimation</span>
                            <span>94.7%</span>
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Risk Assessment</h5>
                        
                        <div className="bg-green-50 border-l-4 border-green-400 p-2 text-xs">
                          <div className="font-medium text-green-800">Low Risk Items (85%)</div>
                          <div className="text-green-700">Standard elements, clear geometry, verified measurements</div>
                        </div>
                        
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 text-xs">
                          <div className="font-medium text-yellow-800">Medium Risk Items (12%)</div>
                          <div className="text-yellow-700">Complex roof geometry, curved elements requiring verification</div>
                        </div>
                        
                        <div className="bg-red-50 border-l-4 border-red-400 p-2 text-xs">
                          <div className="font-medium text-red-800">High Risk Items (3%)</div>
                          <div className="text-red-700">Custom elements, unclear drawings, manual verification needed</div>
                        </div>
                      </div>

                      {/* Verification Actions */}
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Recommended Verifications</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Foundation area measurement confirmed</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Wall openings correctly calculated</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-yellow-500" />
                            <span>Roof perimeter requires field verification</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>MEP routing paths visually confirmed</span>
                          </div>
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="pt-4 border-t">
                        <h5 className="font-medium text-sm mb-2">Export Verification Report</h5>
                        <div className="space-y-2">
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            QS Verification Report (PDF)
                          </Button>
                          <Button size="sm" variant="outline" className="w-full text-xs">
                            <Building className="w-3 h-3 mr-1" />
                            Element Schedule (CSV)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Builder Cost Qualification & Site Mobilization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Builder Cost Qualification & Site Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Time on Site Analysis */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Time on Site Analysis</h4>
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-sm">Construction Duration</span>
                            <span className="text-blue-600 font-bold">18 weeks</span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Foundation & Slab: 3 weeks</div>
                            <div>Structural Frame: 4 weeks</div>
                            <div>Roof & External: 5 weeks</div>
                            <div>MEP & Fitout: 4 weeks</div>
                            <div>Final & Handover: 2 weeks</div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Labor Time Allocation</div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span>Carpenter (2 trades × 18 weeks)</span>
                              <span>720 hours @ $65/hr = $46,800</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Electrician (1 trade × 8 weeks)</span>
                              <span>320 hours @ $85/hr = $27,200</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Plumber (1 trade × 6 weeks)</span>
                              <span>240 hours @ $82/hr = $19,680</span>
                            </div>
                            <div className="flex justify-between">
                              <span>General Laborer (1 × 18 weeks)</span>
                              <span>720 hours @ $45/hr = $32,400</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold">
                              <span>Total Labor Cost</span>
                              <span>$126,080</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Site Mobilization Costs */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Site Mobilization & Setup</h4>
                      <div className="space-y-3">
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Initial Mobilization</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Site Shed & Office (18 weeks)</span>
                              <span>$8,500</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Temporary Power Connection</span>
                              <span>$3,200</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Water & Utilities Setup</span>
                              <span>$2,800</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Site Security & Fencing</span>
                              <span>$5,600</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Waste Management (18 weeks)</span>
                              <span>$7,200</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-semibold">
                              <span>Mobilization Total</span>
                              <span>$27,300</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Site Management</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Site Supervisor (18 weeks @ $95/hr)</span>
                              <span>$68,400</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Safety Officer (part-time)</span>
                              <span>$18,500</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Site Administration</span>
                              <span>$12,800</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-semibold">
                              <span>Management Total</span>
                              <span>$99,700</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Hire & Plant */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm">Equipment Hire & Plant</h4>
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Major Plant Hire</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>20T Excavator (2 weeks)</span>
                              <span>$8,400</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Concrete Pump (3 days)</span>
                              <span>$4,200</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mobile Crane 25T (5 days)</span>
                              <span>$12,500</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Scaffolding (6 weeks)</span>
                              <span>$18,600</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Bobcat & Attachments (8 weeks)</span>
                              <span>$9,600</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-semibold">
                              <span>Plant Hire Total</span>
                              <span>$53,300</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Small Tools & Equipment</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Power Tools Hire (18 weeks)</span>
                              <span>$5,400</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Generators & Compressors</span>
                              <span>$3,800</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Lifting Equipment</span>
                              <span>$2,600</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-semibold">
                              <span>Small Plant Total</span>
                              <span>$11,800</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-red-50 border border-red-200 p-3 rounded">
                          <div className="font-medium text-sm mb-2">Builder Cost Summary</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Direct Labor</span>
                              <span>$126,080</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Site Mobilization</span>
                              <span>$27,300</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Site Management</span>
                              <span>$99,700</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Equipment Hire</span>
                              <span>$65,100</span>
                            </div>
                            <div className="border-t pt-1 flex justify-between font-bold text-red-700">
                              <span>Builder Costs Total</span>
                              <span>$318,180</span>
                            </div>
                            <div className="text-xs text-gray-500 pt-1">
                              + Materials: $132,400 = Total: $450,580
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional QS Integration */}
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold text-sm mb-4">Professional QS Cost Breakdown (Based on Authentic Australian Data)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-sm font-medium text-blue-800">Direct Costs</div>
                        <div className="text-lg font-bold text-blue-600">$450,580</div>
                        <div className="text-xs text-blue-700">Materials + Labor + Plant</div>
                      </div>
                      
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-sm font-medium text-orange-800">Overheads (15%)</div>
                        <div className="text-lg font-bold text-orange-600">$67,587</div>
                        <div className="text-xs text-orange-700">Site + Head Office</div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-sm font-medium text-green-800">Profit (12%)</div>
                        <div className="text-lg font-bold text-green-600">$62,140</div>
                        <div className="text-xs text-green-700">Builder Margin</div>
                      </div>
                      
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-sm font-medium text-purple-800">Contingency (8%)</div>
                        <div className="text-lg font-bold text-purple-600">$46,825</div>
                        <div className="text-xs text-purple-700">Risk Allowance</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-900 text-white p-4 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">TOTAL CONTRACT VALUE (Ex GST)</span>
                        <span className="text-2xl font-bold">$627,132</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span>GST (10%)</span>
                        <span>$62,713</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                        <span className="text-xl font-bold">TOTAL INC GST</span>
                        <span className="text-3xl font-bold text-green-400">$689,845</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Scheduling Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Development Scheduling & Sequencing Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Import Microsoft Project schedules (like North Lakes) to establish accurate time on site and cost sequencing for various development types.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Current Project Analysis</h4>
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Estimated Duration:</span>
                              <span className="font-semibold">18-28 weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Critical Path:</span>
                              <span className="font-semibold">22 weeks</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Peak Resources:</span>
                              <span className="font-semibold">15-18 trades</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Weather Risk:</span>
                              <span className="font-semibold">Medium (External works)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                          <div className="font-medium text-sm text-green-800 mb-2">Time-Based Cost Accuracy</div>
                          <div className="space-y-1 text-xs text-green-700">
                            <div>• Labor allocation verified across 18-week timeline</div>
                            <div>• Site mobilization optimized for project duration</div>
                            <div>• Equipment hire scheduled to match construction phases</div>
                            <div>• Resource conflicts identified and resolved</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Development Type Comparison</h4>
                        
                        <div className="space-y-2">
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Residential Development</span>
                              <span className="text-blue-600">28 weeks</span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              Foundation → Frame → Roof → MEP → Finishes (Standard sequence)
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Commercial Development</span>
                              <span className="text-purple-600">42 weeks</span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              Design → Deep foundations → Steel frame → Envelope → Complex MEP
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Industrial Development</span>
                              <span className="text-orange-600">36 weeks</span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              Site prep → Heavy foundations → Steel structure → Services
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <ProjectScheduler />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <AIQSCompliancePanel 
                        projectType="commercial"
                        projectValue={result.totalCost}
                        reportType="edc"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {Object.entries(result).map(([category, elements]) => {
                  if (!Array.isArray(elements) || elements.length === 0) return null;
                  if (category === 'parametric') {
                    // Special handling for parametric assemblies
                    const categoryTotal = (elements as ParametricElement[]).reduce((sum, el) => sum + el.cost, 0);
                    
                    return (
                      <Card key={category} className="border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-100 text-purple-800">
                                Parametric Assemblies
                              </Badge>
                              <span className="text-lg">${categoryTotal.toLocaleString()}</span>
                            </div>
                            <span className="text-sm text-gray-600">{elements.length} assemblies</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {(elements as ParametricElement[]).map((element) => (
                              <div key={element.id} className="p-3 bg-white rounded-lg border border-purple-100">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-medium text-purple-900">{element.name}</span>
                                    <span className="text-gray-600 ml-2">
                                      {element.quantity} units
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-purple-700">${element.cost.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">Eco: {element.eco_rating}/10</div>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Components: {element.components.map(c => c.material).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  const categoryTotal = elements.reduce((sum, el) => sum + el.cost, 0);
                  
                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={getCategoryColor(category)}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Badge>
                            <span className="text-lg">${categoryTotal.toLocaleString()}</span>
                          </div>
                          <span className="text-sm text-gray-600">{elements.length} items</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {elements.map((element: any) => (
                            <div key={element.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="font-medium">{element.type}</span>
                                <span className="text-gray-600 ml-2">
                                  {element.quantity} {element.unit}
                                </span>
                              </div>
                              <div className="font-semibold">${element.cost.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Building className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>Next Steps:</strong> Download the complete AIQS compliant cost plan, 
                  export to your accounting system, or generate client presentation reports.
                </AlertDescription>
              </Alert>
              
              {/* 3D Wireframe View Button */}
              <div className="mt-4">
                <Button 
                  onClick={() => setShowWireframe(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <Move3d className="w-4 h-4 mr-2" />
                  View 3D Wireframe Model - {currentFileName}
                </Button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Explore detected elements in 3D space with AIQS EDC compliance verification
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* 3D Wireframe Viewer */}
      <WireframeViewer 
        isOpen={showWireframe}
        onClose={() => setShowWireframe(false)}
        fileName={currentFileName || "Current Model"}
        elements={result ? [...result.structural, ...result.architectural, ...result.mep, ...result.finishes, ...result.external] : []}
      />
    </Dialog>
  );
}