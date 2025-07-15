import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Box,
  Settings,
  Layers,
  Sun,
  Moon,
  Camera,
  Maximize2,
  Grid,
  Palette,
  Play,
  Pause,
  X
} from "lucide-react";

interface Realistic3DViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  fileName?: string;
  projectData?: any;
  elements?: any[];
  showControls?: boolean;
  autoRotate?: boolean;
  showCostOverlay?: boolean;
  containerHeight?: string;
}

export function Realistic3DViewer({ 
  isOpen = true, 
  onClose, 
  fileName = "Architectural Model", 
  projectData,
  elements,
  showControls = true,
  autoRotate = false,
  showCostOverlay = true,
  containerHeight = "h-[600px]"
}: Realistic3DViewerProps) {
  const [rotation, setRotation] = useState({ x: -15, y: 35 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lightingMode, setLightingMode] = useState<'day' | 'night' | 'studio'>('day');
  const [viewMode, setViewMode] = useState<'realistic' | 'wireframe' | 'xray'>('realistic');
  const [autoRotateActive, setAutoRotateActive] = useState(autoRotate);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotateActive) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + 0.3
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoRotateActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation({ x: -15, y: 35 });
    setZoom(1);
  };

  // Lighting settings based on mode
  const getLightingStyle = () => {
    switch (lightingMode) {
      case 'day':
        return {
          background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 30%, #B0E0E6 100%)',
          ambientLight: 'rgba(255, 248, 220, 0.8)',
          shadowIntensity: 0.3
        };
      case 'night':
        return {
          background: 'linear-gradient(to bottom, #0F0F23 0%, #1A1A2E 30%, #16213E 100%)',
          ambientLight: 'rgba(100, 149, 237, 0.4)',
          shadowIntensity: 0.7
        };
      case 'studio':
        return {
          background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)',
          ambientLight: 'rgba(255, 255, 255, 0.9)',
          shadowIntensity: 0.2
        };
    }
  };

  const lighting = getLightingStyle();

  // Enhanced building elements with realistic materials
  const getBuildingElements = () => {
    if (elements) return elements;
    
    return [
      {
        id: 'foundation',
        name: 'Concrete Foundation',
        type: 'foundation',
        x: 0, y: -20, z: 0,
        width: 200, height: 25, depth: 150,
        cost: 45000,
        material: 'concrete',
        details: 'Reinforced concrete slab with vapor barrier'
      },
      {
        id: 'structure',
        name: 'Steel Frame Structure',
        type: 'structural',
        x: 0, y: 30, z: 0,
        width: 180, height: 120, depth: 130,
        cost: 185000,
        material: 'steel',
        details: 'Structural steel frame with moment connections'
      },
      {
        id: 'walls',
        name: 'Exterior Walls',
        type: 'architectural',
        x: 0, y: 50, z: 0,
        width: 185, height: 100, depth: 135,
        cost: 95000,
        material: 'masonry',
        details: 'Insulated masonry veneer with steel stud backup'
      },
      {
        id: 'roof',
        name: 'Metal Roof System',
        type: 'roofing',
        x: 0, y: 105, z: 0,
        width: 195, height: 12, depth: 145,
        cost: 32000,
        material: 'metal',
        details: 'Standing seam metal roof with insulation'
      },
      {
        id: 'glazing',
        name: 'Curtain Wall Glazing',
        type: 'architectural',
        x: 70, y: 50, z: 0,
        width: 8, height: 80, depth: 135,
        cost: 85000,
        material: 'glass',
        details: 'High-performance glazed curtain wall system'
      },
      {
        id: 'entrance',
        name: 'Main Entrance',
        type: 'architectural',
        x: -90, y: 20, z: 0,
        width: 15, height: 60, depth: 25,
        cost: 25000,
        material: 'aluminum',
        details: 'Aluminum storefront entrance with automatic doors'
      }
    ];
  };

  const buildingElements = getBuildingElements();
  const totalCost = buildingElements.reduce((sum, el) => sum + el.cost, 0);

  // Material rendering functions
  const renderMaterial = (element: any, face: 'front' | 'back' | 'side' | 'top' | 'bottom') => {
    const { material, type } = element;
    
    const getMaterialStyle = () => {
      switch (material) {
        case 'concrete':
          return {
            background: 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 30%, #4B5563 60%, #6B7280 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(255,255,255,0.1)',
            border: '1px solid #374151',
            texture: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.05) 8px, rgba(0,0,0,0.05) 16px)'
          };
        case 'steel':
          return {
            background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 25%, #9CA3AF 50%, #D1D5DB 75%, #E5E7EB 100%)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2), inset 0 -1px 2px rgba(255,255,255,0.4)',
            border: '1px solid #6B7280',
            texture: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
          };
        case 'masonry':
          return {
            background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 25%, #991B1B 50%, #B91C1C 75%, #DC2626 100%)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.3)',
            border: '1px solid #7F1D1D',
            texture: 'repeating-linear-gradient(0deg, transparent 0px, rgba(0,0,0,0.1) 1px, transparent 2px, transparent 15px), repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.1) 1px, transparent 2px, transparent 25px)'
          };
        case 'metal':
          return {
            background: 'linear-gradient(135deg, #374151 0%, #4B5563 25%, #6B7280 50%, #4B5563 75%, #374151 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid #1F2937',
            texture: 'repeating-linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 2px, transparent 4px, transparent 20px)'
          };
        case 'glass':
          return {
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(96, 165, 250, 0.4) 50%, rgba(59, 130, 246, 0.3) 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5), 0 2px 8px rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            backdropFilter: 'blur(2px)',
            texture: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)'
          };
        case 'aluminum':
          return {
            background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 25%, #D1D5DB 50%, #E5E7EB 75%, #F3F4F6 100%)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.2)',
            border: '1px solid #9CA3AF',
            texture: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)'
          };
        default:
          return {
            background: '#6B7280',
            border: '1px solid #374151'
          };
      }
    };

    const materialStyle = getMaterialStyle();
    
    return {
      ...materialStyle,
      opacity: face === 'back' ? 0.8 : face === 'side' ? 0.9 : 1,
      filter: lightingMode === 'night' ? 'brightness(0.6) contrast(1.2)' : 
             lightingMode === 'studio' ? 'brightness(1.1) contrast(1.1)' : 'none'
    };
  };

  const renderBuildingElement = (element: any) => {
    const baseTransform = `translate3d(${element.x}px, ${-element.y}px, ${element.z}px)`;
    const isSelected = selectedElement === element.id;
    
    return (
      <div 
        key={element.id} 
        className="absolute cursor-pointer group" 
        style={{ 
          transform: baseTransform, 
          transformStyle: 'preserve-3d',
          filter: isSelected ? 'brightness(1.2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 'none'
        }}
        onClick={() => setSelectedElement(isSelected ? null : element.id)}
      >
        {/* Front face */}
        <div 
          className="absolute"
          style={{
            width: `${element.width}px`,
            height: `${element.height}px`,
            transform: `translateZ(${element.depth/2}px)`,
            ...renderMaterial(element, 'front')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'front').texture }} />
        </div>
        
        {/* Back face */}
        <div 
          className="absolute"
          style={{
            width: `${element.width}px`,
            height: `${element.height}px`,
            transform: `translateZ(-${element.depth/2}px) rotateY(180deg)`,
            ...renderMaterial(element, 'back')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'back').texture }} />
        </div>
        
        {/* Left side */}
        <div 
          className="absolute"
          style={{
            width: `${element.depth}px`,
            height: `${element.height}px`,
            transform: `rotateY(-90deg) translateZ(${element.width/2}px)`,
            transformOrigin: 'left',
            ...renderMaterial(element, 'side')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'side').texture }} />
        </div>
        
        {/* Right side */}
        <div 
          className="absolute"
          style={{
            width: `${element.depth}px`,
            height: `${element.height}px`,
            transform: `rotateY(90deg) translateZ(${element.width/2}px)`,
            transformOrigin: 'right',
            ...renderMaterial(element, 'side')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'side').texture }} />
        </div>
        
        {/* Top face */}
        <div 
          className="absolute"
          style={{
            width: `${element.width}px`,
            height: `${element.depth}px`,
            transform: `rotateX(90deg) translateZ(${element.height/2}px)`,
            transformOrigin: 'top',
            ...renderMaterial(element, 'top')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'top').texture }} />
        </div>
        
        {/* Bottom face */}
        <div 
          className="absolute"
          style={{
            width: `${element.width}px`,
            height: `${element.depth}px`,
            transform: `rotateX(-90deg) translateZ(-${element.height/2}px)`,
            transformOrigin: 'bottom',
            ...renderMaterial(element, 'bottom')
          }}
        >
          <div className="absolute inset-0" style={{ background: renderMaterial(element, 'bottom').texture }} />
        </div>
        
        {/* Hover tooltip */}
        {showCostOverlay && (
          <div className="absolute text-white text-xs bg-black/90 px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-gray-600" 
               style={{ 
                 transform: `translateZ(${element.depth/2 + 40}px)`, 
                 whiteSpace: 'nowrap',
                 backdropFilter: 'blur(4px)'
               }}>
            <div className="font-semibold">{element.name}</div>
            <div className="text-green-400">${element.cost.toLocaleString()}</div>
            <div className="text-gray-300 text-xs mt-1">{element.details}</div>
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className="max-w-7xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          {fileName}
          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
            {viewMode.toUpperCase()} • {lightingMode.toUpperCase()}
          </Badge>
        </DialogTitle>
      </DialogHeader>
      
      <Tabs defaultValue="viewer" className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="viewer">3D Viewer</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="viewer">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main 3D Viewer */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Architectural Visualization</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAutoRotateActive(!autoRotateActive)}>
                        {autoRotateActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetView}>
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setZoom(zoom / 1.2)}>
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Enhanced Controls Bar */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 border-b rounded-lg">
                    {/* View Mode */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">View:</span>
                      <Toggle 
                        pressed={viewMode === 'realistic'} 
                        onPressedChange={() => setViewMode('realistic')}
                        size="sm"
                      >
                        <Palette className="w-3 h-3" />
                      </Toggle>
                      <Toggle 
                        pressed={viewMode === 'wireframe'} 
                        onPressedChange={() => setViewMode('wireframe')}
                        size="sm"
                      >
                        <Grid className="w-3 h-3" />
                      </Toggle>
                    </div>
                    
                    {/* Lighting */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Lighting:</span>
                      <Toggle 
                        pressed={lightingMode === 'day'} 
                        onPressedChange={() => setLightingMode('day')}
                        size="sm"
                      >
                        <Sun className="w-3 h-3" />
                      </Toggle>
                      <Toggle 
                        pressed={lightingMode === 'night'} 
                        onPressedChange={() => setLightingMode('night')}
                        size="sm"
                      >
                        <Moon className="w-3 h-3" />
                      </Toggle>
                      <Toggle 
                        pressed={lightingMode === 'studio'} 
                        onPressedChange={() => setLightingMode('studio')}
                        size="sm"
                      >
                        <Camera className="w-3 h-3" />
                      </Toggle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <div 
                    className="relative overflow-hidden cursor-move"
                    style={{ 
                      height: '600px', 
                      perspective: '1500px',
                      background: lighting.background
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Enhanced Environment */}
                    {showGrid && (
                      <div className="absolute inset-0 opacity-20" 
                           style={{
                             backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                             backgroundSize: '20px 20px'
                           }} />
                    )}
                    
                    {/* 3D Scene Container */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ 
                        transformStyle: 'preserve-3d',
                        filter: `drop-shadow(0 10px 30px rgba(0,0,0,${lighting.shadowIntensity}))`
                      }}
                    >
                      <div
                        style={{
                          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
                          transformStyle: 'preserve-3d',
                          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                        }}
                      >
                        {/* Enhanced Ground Plane */}
                        <div
                          className="absolute"
                          style={{
                            width: '500px',
                            height: '400px',
                            transform: 'rotateX(90deg) translateZ(-100px) translate(-250px, -200px)',
                            background: lightingMode === 'night' 
                              ? 'linear-gradient(45deg, #1F2937 25%, #374151 25%, #374151 50%, #1F2937 50%, #1F2937 75%, #374151 75%, #374151 100%)'
                              : 'linear-gradient(45deg, #F3F4F6 25%, #E5E7EB 25%, #E5E7EB 50%, #F3F4F6 50%, #F3F4F6 75%, #E5E7EB 75%, #E5E7EB 100%)',
                            backgroundSize: '40px 40px',
                            border: '2px solid rgba(156, 163, 175, 0.3)',
                            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.1)'
                          }}
                        />
                        
                        {/* Render all building elements */}
                        {buildingElements.map(renderBuildingElement)}
                      </div>
                    </div>
                    
                    {/* Status Overlay */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge className="bg-blue-600 text-white">
                        Elements: {buildingElements.length}
                      </Badge>
                      <Badge className="bg-green-600 text-white">
                        Total: ${totalCost.toLocaleString()}
                      </Badge>
                      <Badge className="bg-purple-600 text-white">
                        Zoom: {Math.round(zoom * 100)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Element Details Sidebar */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Building Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {buildingElements.map(element => (
                    <div 
                      key={element.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedElement === element.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedElement(selectedElement === element.id ? null : element.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-sm">{element.name}</div>
                          <div className="text-xs text-gray-600 capitalize">{element.material}</div>
                        </div>
                        <div className="text-sm font-mono text-green-600">
                          ${element.cost.toLocaleString()}
                        </div>
                      </div>
                      {selectedElement === element.id && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                          {element.details}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="controls">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Camera Rotation</label>
                <div className="space-y-2">
                  <Slider
                    value={[rotation.x]}
                    onValueChange={([x]) => setRotation(prev => ({ ...prev, x }))}
                    min={-90}
                    max={90}
                    step={1}
                  />
                  <Slider
                    value={[rotation.y]}
                    onValueChange={([y]) => setRotation(prev => ({ ...prev, y }))}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Zoom Level</label>
                <Slider
                  value={[zoom]}
                  onValueChange={([z]) => setZoom(z)}
                  min={0.1}
                  max={3}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Material Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {['concrete', 'steel', 'masonry', 'metal', 'glass', 'aluminum'].map(material => (
                  <div key={material} className="p-3 border rounded-lg">
                    <div 
                      className="w-full h-16 rounded mb-2"
                      style={renderMaterial({ material }, 'front')}
                    />
                    <div className="text-sm font-medium capitalize">{material}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Cost Breakdown</h4>
                  <div className="mt-2 space-y-1">
                    {buildingElements.map(element => (
                      <div key={element.id} className="flex justify-between text-sm">
                        <span>{element.name}</span>
                        <span className="font-mono">${element.cost.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="font-mono">${totalCost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (!isOpen) return null;

  // Check if this is embedded mode (no onClose function or specific container height)
  const isEmbedded = !onClose || containerHeight !== "h-[600px]";

  if (isEmbedded) {
    // Embedded mode - just return the content directly
    return (
      <div className={`w-full ${containerHeight}`}>
        {content}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto relative">
        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white shadow-md"
        >
          <X className="w-4 h-4" />
        </Button>
        
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Box className="w-6 h-6" />
            Realistic 3D Architectural Viewer
          </h2>
          <p className="text-gray-600 mt-1">Professional photorealistic building visualization</p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {content}
        </div>
      </div>
    </div>
  );
}