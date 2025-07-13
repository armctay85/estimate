import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Building, 
  Palette, 
  Move3d,
  Maximize,
  Download,
  FileText,
  Target,
  Sparkles,
  Camera,
  Sun,
  Moon,
  CloudRain,
  Paintbrush,
  Box,
  Grid3x3,
  Cpu
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Wireframe3DElement {
  id: string;
  category: 'structural' | 'architectural' | 'mep' | 'finishes' | 'external';
  type: string;
  geometry: {
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    depth: number;
    rotation?: { x: number; y: number; z: number };
  };
  material: {
    color: string;
    texture?: string;
    roughness?: number;
    metalness?: number;
  };
  quantity: number;
  unit: string;
  cost: number;
  visible: boolean;
}

interface Wireframe3DViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  fileName?: string;
  elements?: any[];
  projectData?: any;
  embedded?: boolean;
}

export function Wireframe3DViewer({ 
  isOpen = true, 
  onClose = () => {}, 
  fileName = "Demo Project", 
  elements = [],
  projectData,
  embedded = false 
}: Wireframe3DViewerProps) {
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'realistic'>('wireframe');
  const [selectedElement, setSelectedElement] = useState<Wireframe3DElement | null>(null);
  const [cameraRotation, setCameraRotation] = useState({ x: -30, y: 45, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [aiRenderMode, setAiRenderMode] = useState<'none' | 'photorealistic' | 'architectural' | 'concept'>('none');
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [lightingMode, setLightingMode] = useState<'day' | 'night' | 'cloudy'>('day');
  const [visibilitySettings, setVisibilitySettings] = useState({
    structural: true,
    architectural: true,
    mep: true,
    finishes: true,
    external: true
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Generate demo 3D elements based on project type
  const generateDemo3DElements = (): Wireframe3DElement[] => {
    // Check if it's a Starbucks project (QSR/Drive-Through)
    if (fileName.toLowerCase().includes('starbucks') || projectData?.projectType?.includes('QSR')) {
      return [
        {
          id: 'foundation-3d',
          category: 'structural',
          type: 'Concrete Slab Foundation',
          geometry: { x: 0, y: 0, z: 0, width: 220, height: 15, depth: 180 },
          material: { color: '#8B7355', roughness: 0.9, metalness: 0.1 },
          quantity: 165,
          unit: 'm²',
          cost: 27225,
          visible: true
        },
        {
          id: 'precast-walls-3d',
          category: 'structural',
          type: 'Precast Concrete Panels',
          geometry: { x: 0, y: 15, z: 0, width: 10, height: 120, depth: 180 },
          material: { color: '#D3D3D3', roughness: 0.7, metalness: 0 },
          quantity: 380,
          unit: 'm²',
          cost: 106400,
          visible: true
        },
        {
          id: 'drive-thru-canopy-3d',
          category: 'architectural',
          type: 'Drive-Thru Canopy',
          geometry: { x: 220, y: 100, z: 60, width: 100, height: 20, depth: 60, rotation: { x: 0, y: 0, z: -5 } },
          material: { color: '#228B22', roughness: 0.4, metalness: 0.6 },
          quantity: 60,
          unit: 'm²',
          cost: 18000,
          visible: true
        },
        {
          id: 'kitchen-area-3d',
          category: 'architectural',
          type: 'Commercial Kitchen',
          geometry: { x: 60, y: 15, z: 40, width: 100, height: 100, depth: 100 },
          material: { color: '#C0C0C0', roughness: 0.3, metalness: 0.8 },
          quantity: 1,
          unit: 'item',
          cost: 180000,
          visible: true
        },
        {
          id: 'roof-qsr-3d',
          category: 'structural',
          type: 'Colorbond Roof',
          geometry: { x: -10, y: 135, z: -10, width: 240, height: 15, depth: 200, rotation: { x: 3, y: 0, z: 0 } },
          material: { color: '#708090', roughness: 0.4, metalness: 0.6 },
          quantity: 320,
          unit: 'm²',
          cost: 27200,
          visible: true
        },
        {
          id: 'storefront-3d',
          category: 'architectural',
          type: 'Glazing & Shopfront',
          geometry: { x: 210, y: 15, z: 20, width: 5, height: 100, depth: 140 },
          material: { color: '#87CEEB', roughness: 0.1, metalness: 0.2 },
          quantity: 65,
          unit: 'm²',
          cost: 29250,
          visible: true
        }
      ];
    }
    
    // Check if it's a Kmart project (Retail)
    if (fileName.toLowerCase().includes('kmart') || projectData?.projectType?.includes('Retail')) {
      return [
        {
          id: 'foundation-retail-3d',
          category: 'structural',
          type: 'Existing Slab',
          geometry: { x: 0, y: 0, z: 0, width: 400, height: 10, depth: 300 },
          material: { color: '#808080', roughness: 0.9, metalness: 0.1 },
          quantity: 2400,
          unit: 'm²',
          cost: 0,
          visible: true
        },
        {
          id: 'steel-structure-3d',
          category: 'structural',
          type: 'Steel Structure Modifications',
          geometry: { x: 100, y: 10, z: 100, width: 30, height: 150, depth: 30 },
          material: { color: '#FF6347', roughness: 0.3, metalness: 0.8 },
          quantity: 45,
          unit: 't',
          cost: 144000,
          visible: true
        },
        {
          id: 'retail-walls-3d',
          category: 'architectural',
          type: 'Internal Partitions',
          geometry: { x: 50, y: 10, z: 150, width: 300, height: 100, depth: 5 },
          material: { color: '#F5DEB3', roughness: 0.6, metalness: 0 },
          quantity: 480,
          unit: 'm²',
          cost: 36000,
          visible: true
        },
        {
          id: 'ceiling-retail-3d',
          category: 'architectural',
          type: 'Suspended Ceiling',
          geometry: { x: 0, y: 110, z: 0, width: 400, height: 5, depth: 300 },
          material: { color: '#FFFFFF', roughness: 0.8, metalness: 0 },
          quantity: 1850,
          unit: 'm²',
          cost: 101750,
          visible: true
        },
        {
          id: 'shelving-3d',
          category: 'architectural',
          type: 'Retail Fixtures',
          geometry: { x: 150, y: 10, z: 100, width: 100, height: 80, depth: 40 },
          material: { color: '#4682B4', roughness: 0.5, metalness: 0.3 },
          quantity: 1,
          unit: 'item',
          cost: 125000,
          visible: true
        },
        {
          id: 'shopfront-retail-3d',
          category: 'architectural',
          type: 'Shopfront Glazing',
          geometry: { x: 395, y: 10, z: 50, width: 5, height: 100, depth: 200 },
          material: { color: '#87CEEB', roughness: 0.1, metalness: 0.2 },
          quantity: 85,
          unit: 'm²',
          cost: 32300,
          visible: true
        }
      ];
    }
    
    // Default generic building elements
    return [
      {
        id: 'foundation-3d',
        category: 'structural',
        type: 'Concrete Foundation',
        geometry: { x: 0, y: 0, z: 0, width: 300, height: 20, depth: 200 },
        material: { color: '#8B7355', roughness: 0.9, metalness: 0.1 },
        quantity: 600,
        unit: 'm²',
        cost: 99000,
        visible: true
      },
      {
        id: 'columns-3d',
        category: 'structural',
        type: 'Steel Columns',
        geometry: { x: 50, y: 20, z: 50, width: 20, height: 180, depth: 20 },
        material: { color: '#C0C0C0', roughness: 0.3, metalness: 0.8 },
        quantity: 12,
        unit: 'units',
        cost: 48000,
        visible: true
      },
      {
        id: 'walls-ext-3d',
        category: 'architectural',
        type: 'External Walls',
        geometry: { x: 0, y: 20, z: 0, width: 10, height: 180, depth: 200 },
        material: { color: '#DEB887', roughness: 0.8, metalness: 0 },
        quantity: 380,
        unit: 'm²',
        cost: 68400,
        visible: true
      },
      {
        id: 'roof-3d',
        category: 'structural',
        type: 'Metal Roof Structure',
        geometry: { x: -20, y: 200, z: -20, width: 340, height: 40, depth: 240, rotation: { x: 5, y: 0, z: 0 } },
        material: { color: '#708090', roughness: 0.4, metalness: 0.6 },
        quantity: 680,
        unit: 'm²',
        cost: 54400,
        visible: true
      },
      {
        id: 'hvac-3d',
        category: 'mep',
        type: 'HVAC Rooftop Units',
        geometry: { x: 100, y: 240, z: 80, width: 40, height: 30, depth: 40 },
        material: { color: '#4169E1', roughness: 0.5, metalness: 0.7 },
        quantity: 3,
        unit: 'units',
        cost: 45000,
        visible: true
      },
      {
        id: 'windows-3d',
        category: 'architectural',
        type: 'Curtain Wall System',
        geometry: { x: 300, y: 50, z: 20, width: 5, height: 120, depth: 160 },
        material: { color: '#87CEEB', roughness: 0.1, metalness: 0.2 },
        quantity: 320,
        unit: 'm²',
        cost: 192000,
        visible: true
      }
    ];
  };

  const [wireframe3DElements, setWireframe3DElements] = useState<Wireframe3DElement[]>([]);
  
  // Generate elements when component mounts or when project data changes
  useEffect(() => {
    setWireframe3DElements(generateDemo3DElements());
  }, [fileName, projectData]);

  // Handle camera rotation with mouse drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) { // Left mouse button
      setCameraRotation(prev => ({
        x: prev.x + e.movementY * 0.5,
        y: prev.y + e.movementX * 0.5,
        z: prev.z
      }));
    }
  };

  // AI Render simulation
  const startAIRender = async (mode: 'photorealistic' | 'architectural' | 'concept') => {
    setIsRendering(true);
    setAiRenderMode(mode);
    setRenderProgress(0);

    // Simulate rendering progress
    const progressInterval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsRendering(false);
          toast({
            title: "AI Rendering Complete",
            description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} render generated successfully`,
          });
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const resetView = () => {
    setCameraRotation({ x: -30, y: 45, z: 0 });
    setZoom(1);
  };

  const exportModel = () => {
    toast({
      title: "3D Model Export",
      description: "Exporting model with AI enhancements and cost data",
    });
  };

  const toggleVisibility = (category: keyof typeof visibilitySettings) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'structural': return '#ff4444';
      case 'architectural': return '#4444ff';
      case 'mep': return '#ff8800';
      case 'finishes': return '#8844ff';
      case 'external': return '#44ff44';
      default: return '#666666';
    }
  };

  // Calculate 3D transformation for isometric view
  const get3DTransform = (element: Wireframe3DElement) => {
    const { x, y, z, rotation } = element.geometry;
    const rotX = cameraRotation.x + (rotation?.x || 0);
    const rotY = cameraRotation.y + (rotation?.y || 0);
    const rotZ = cameraRotation.z + (rotation?.z || 0);
    
    return `
      translate3d(${x}px, ${-y}px, ${z}px)
      rotateX(${rotX}deg)
      rotateY(${rotY}deg)
      rotateZ(${rotZ}deg)
      scale3d(${zoom}, ${zoom}, ${zoom})
    `;
  };

  const content = (
    <div className={embedded ? "" : "max-w-7xl max-h-[90vh] overflow-hidden"}>
      {!embedded && (
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            3D Model Viewer - {fileName}
            <Badge variant="outline" className="ml-2">AI Enhanced</Badge>
            {projectData?.fileType && (
              <Badge variant="secondary" className="ml-2">{projectData.fileType}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
      )}
      
      <div className={`grid ${embedded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'} gap-4 ${embedded ? 'h-[400px]' : 'h-[70vh]'}`}>
        {/* 3D Viewer */}
        <div className={embedded ? "" : "lg:col-span-3"}>
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-auto">
                    <TabsList className="h-8">
                      <TabsTrigger value="wireframe" className="text-xs">
                        <Grid3x3 className="w-3 h-3 mr-1" />
                        Wireframe
                      </TabsTrigger>
                      <TabsTrigger value="solid" className="text-xs">
                        <Box className="w-3 h-3 mr-1" />
                        Solid
                      </TabsTrigger>
                      <TabsTrigger value="realistic" className="text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Realistic
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {isRendering && (
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin" />
                      <span className="text-xs">AI Processing... {renderProgress}%</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={resetView}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setZoom(zoom / 1.2)}>
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  {!embedded && (
                    <Button size="sm" variant="outline" onClick={exportModel}>
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div 
                ref={canvasRef}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg relative h-full min-h-[300px] overflow-hidden cursor-move"
                onMouseMove={handleMouseMove}
                style={{ perspective: '1000px' }}
              >
                {/* Lighting effects */}
                <div className={`absolute inset-0 pointer-events-none ${
                  lightingMode === 'day' ? 'bg-gradient-to-t from-transparent to-yellow-500/10' :
                  lightingMode === 'night' ? 'bg-gradient-to-t from-transparent to-blue-900/30' :
                  'bg-gradient-to-t from-transparent to-gray-500/20'
                }`} />
                
                {/* 3D Scene Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative" style={{ 
                    transformStyle: 'preserve-3d',
                    transform: `rotateX(${cameraRotation.x}deg) rotateY(${cameraRotation.y}deg) scale(${zoom})`
                  }}>
                    {/* Grid floor */}
                    <div className="absolute" style={{
                      transform: 'rotateX(90deg) translateZ(-100px)',
                      width: '400px',
                      height: '400px',
                      left: '-200px',
                      top: '-200px',
                      backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }} />
                    
                    {/* Render 3D elements */}
                    <AnimatePresence>
                      {wireframe3DElements.map((element) => {
                        if (!visibilitySettings[element.category]) return null;
                        
                        const { width, height, depth } = element.geometry;
                        const isSelected = selectedElement?.id === element.id;
                        
                        return (
                          <motion.div
                            key={element.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute cursor-pointer"
                            style={{
                              transform: get3DTransform(element),
                              transformStyle: 'preserve-3d',
                              width: `${width}px`,
                              height: `${height}px`
                            }}
                            onClick={() => setSelectedElement(element)}
                          >
                            {/* Front face */}
                            <div className="absolute" style={{
                              width: `${width}px`,
                              height: `${height}px`,
                              backgroundColor: viewMode === 'realistic' ? element.material.color : getCategoryColor(element.category),
                              opacity: viewMode === 'wireframe' ? 0 : (isSelected ? 0.9 : 0.7),
                              border: viewMode === 'wireframe' ? `2px solid ${getCategoryColor(element.category)}` : 'none',
                              boxShadow: isSelected ? '0 0 20px rgba(255,255,255,0.5)' : 'none',
                              transform: `translateZ(${depth/2}px)`
                            }}>
                              {viewMode === 'realistic' && aiRenderMode !== 'none' && (
                                <div className="w-full h-full bg-gradient-to-br from-transparent to-black/20" />
                              )}
                            </div>
                            
                            {/* Back face */}
                            <div className="absolute" style={{
                              width: `${width}px`,
                              height: `${height}px`,
                              backgroundColor: viewMode === 'realistic' ? element.material.color : getCategoryColor(element.category),
                              opacity: viewMode === 'wireframe' ? 0 : (isSelected ? 0.9 : 0.7),
                              border: viewMode === 'wireframe' ? `2px solid ${getCategoryColor(element.category)}` : 'none',
                              transform: `translateZ(-${depth/2}px) rotateY(180deg)`
                            }} />
                            
                            {/* Top face */}
                            <div className="absolute" style={{
                              width: `${width}px`,
                              height: `${depth}px`,
                              backgroundColor: viewMode === 'realistic' ? element.material.color : getCategoryColor(element.category),
                              opacity: viewMode === 'wireframe' ? 0 : (isSelected ? 0.9 : 0.7),
                              border: viewMode === 'wireframe' ? `2px solid ${getCategoryColor(element.category)}` : 'none',
                              transform: `rotateX(90deg) translateZ(${height/2}px)`,
                              transformOrigin: 'center bottom'
                            }} />
                            
                            {/* Cost label */}
                            {isSelected && (
                              <div className="absolute text-white text-xs bg-black/80 px-2 py-1 rounded"
                                style={{ transform: 'translateZ(100px)' }}>
                                ${element.cost.toLocaleString()}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
                
                {/* Controls overlay */}
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {wireframe3DElements.filter(e => visibilitySettings[e.category]).length} Elements
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ${wireframe3DElements.filter(e => visibilitySettings[e.category])
                      .reduce((sum, e) => sum + e.cost, 0).toLocaleString()}
                  </Badge>
                </div>
                
                {/* AI Render controls */}
                {viewMode === 'realistic' && !embedded && (
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <Button 
                      size="sm" 
                      variant={aiRenderMode === 'photorealistic' ? 'default' : 'outline'}
                      onClick={() => startAIRender('photorealistic')}
                      disabled={isRendering}
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      Photorealistic
                    </Button>
                    <Button 
                      size="sm" 
                      variant={aiRenderMode === 'architectural' ? 'default' : 'outline'}
                      onClick={() => startAIRender('architectural')}
                      disabled={isRendering}
                    >
                      <Building className="w-3 h-3 mr-1" />
                      Architectural
                    </Button>
                    <Button 
                      size="sm" 
                      variant={aiRenderMode === 'concept' ? 'default' : 'outline'}
                      onClick={() => startAIRender('concept')}
                      disabled={isRendering}
                    >
                      <Paintbrush className="w-3 h-3 mr-1" />
                      Concept
                    </Button>
                  </div>
                )}
                
                {/* Lighting controls */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLightingMode('day')}
                    className={lightingMode === 'day' ? 'bg-yellow-500/20' : ''}
                  >
                    <Sun className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLightingMode('night')}
                    className={lightingMode === 'night' ? 'bg-blue-500/20' : ''}
                  >
                    <Moon className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setLightingMode('cloudy')}
                    className={lightingMode === 'cloudy' ? 'bg-gray-500/20' : ''}
                  >
                    <CloudRain className="w-3 h-3" />
                  </Button>
                </div>
                
                {/* Rendering progress */}
                {isRendering && (
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <Progress value={renderProgress} className="w-full" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Controls Panel - only show if not embedded */}
        {!embedded && (
          <div className="space-y-4">
            {/* File Information */}
            {projectData && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>File:</span>
                      <span className="font-mono text-xs truncate max-w-[120px]" title={projectData.fileName}>
                        {projectData.fileName || 'Demo Model'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Type:</span>
                      <Badge variant="secondary" className="text-xs h-5">
                        {projectData.fileType || 'RVT'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Elements:</span>
                      <span className="font-bold">{projectData.totalElements}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-bold text-green-600">
                        ${projectData.totalCost?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="text-green-600 font-semibold">{projectData.accuracy}</span>
                    </div>
                    <Separator className="my-2" />
                    <Alert className="p-2 bg-yellow-50 border-yellow-200">
                      <AlertDescription className="text-xs">
                        <strong>Important:</strong> This is a <u>demo visualization only</u>. The actual {projectData.fileType || 'RVT'} file cannot be rendered here. 
                        True RVT parsing requires:
                        <ul className="mt-1 ml-4 list-disc">
                          <li>Autodesk Forge API or similar CAD engine</li>
                          <li>Server-side processing (not available in browser)</li>
                          <li>Licensed CAD libraries</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Element Visibility */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Element Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(visibilitySettings).map(([category, visible]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: getCategoryColor(category) }}
                      />
                      <span className="text-xs capitalize">{category}</span>
                    </div>
                    <Button
                      size="sm"
                      variant={visible ? "default" : "outline"}
                      onClick={() => toggleVisibility(category as keyof typeof visibilitySettings)}
                      className="h-6 px-2"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Selected Element Details */}
            {selectedElement && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Element Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs space-y-1">
                    <div><strong>Type:</strong> {selectedElement.type}</div>
                    <div><strong>Category:</strong> {selectedElement.category}</div>
                    <div><strong>Quantity:</strong> {selectedElement.quantity} {selectedElement.unit}</div>
                    <div><strong>Total Cost:</strong> ${selectedElement.cost.toLocaleString()}</div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs space-y-1">
                    <div><strong>Dimensions:</strong></div>
                    <div>W: {(selectedElement.geometry.width / 10).toFixed(1)}m</div>
                    <div>H: {(selectedElement.geometry.height / 10).toFixed(1)}m</div>
                    <div>D: {(selectedElement.geometry.depth / 10).toFixed(1)}m</div>
                  </div>
                  
                  {viewMode === 'realistic' && (
                    <>
                      <Separator />
                      <div className="text-xs space-y-1">
                        <div><strong>Material Properties:</strong></div>
                        <div>Color: {selectedElement.material.color}</div>
                        <div>Roughness: {(selectedElement.material.roughness || 0.5) * 100}%</div>
                        <div>Metalness: {(selectedElement.material.metalness || 0) * 100}%</div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* AI Enhancement Status */}
            {aiRenderMode !== 'none' && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Enhancement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <Badge variant="secondary">{aiRenderMode}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality:</span>
                      <span>Ultra HD (8K)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600">Complete</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden" aria-describedby="wireframe-3d-description">
        <p id="wireframe-3d-description" className="sr-only">
          3D wireframe visualization of construction elements
        </p>
        {content}
      </DialogContent>
    </Dialog>
  );
}