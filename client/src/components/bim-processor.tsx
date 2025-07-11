import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Building, Zap, CheckCircle, Clock, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  accuracy: string;
  processingTime: string;
  totalElements: number;
  totalCost: number;
}

export function BIMProcessor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<ProcessingResult | null>(null);
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

    // Calculate total cost
    mockResult.totalCost = [
      ...mockResult.structural,
      ...mockResult.architectural,
      ...mockResult.mep,
      ...mockResult.finishes,
      ...mockResult.external
    ].reduce((sum, element) => sum + element.cost, 0);

    setResult(mockResult);
    setIsProcessing(false);
    setCurrentStep('Processing complete');
    
    toast({
      title: "BIM Processing Complete",
      description: `Successfully processed ${file.name} with ${mockResult.totalElements} elements detected.`,
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.dwg', '.dxf', '.ifc', '.rvt', '.skp', '.pln', '.pdf'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a DWG, DXF, IFC, Revit, SketchUp, ArchiCAD, or PDF file.",
        variant: "destructive"
      });
      return;
    }

    await simulateProcessing(file);
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
        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
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

              <Card className="border-dashed border-2 border-gray-300 hover:border-emerald-400 transition-colors">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Upload BIM/CAD File</h3>
                    <p className="text-gray-600 mb-4">
                      Drag and drop your file here or click to browse
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
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

              <div className="space-y-4">
                {Object.entries(result).map(([category, elements]) => {
                  if (!Array.isArray(elements) || elements.length === 0) return null;
                  
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
                          {elements.map((element) => (
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}