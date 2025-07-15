import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Box,
  Info,
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
  Monitor,
  MoreHorizontal,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Enhanced3DViewerProps {
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

export function Enhanced3DViewer({ 
  isOpen = true, 
  onClose = () => {}, 
  fileName = "Demo Project", 
  projectData,
  elements,
  showControls = true,
  autoRotate = false,
  showCostOverlay = true,
  containerHeight = "h-[600px]"
}: Enhanced3DViewerProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(['structural', 'architectural', 'mep', 'external']));
  const [currentViewMode, setCurrentViewMode] = useState<'wireframe' | 'solid' | 'realistic'>('realistic');
  const [lightingMode, setLightingMode] = useState<'day' | 'night' | 'studio'>('day');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [autoRotateActive, setAutoRotateActive] = useState(autoRotate);
  const [renderQuality, setRenderQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();

  // Auto-rotation effect with speed control
  useEffect(() => {
    if (!autoRotateActive) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + (0.5 * animationSpeed)
      }));
    }, 50 / animationSpeed);
    
    return () => clearInterval(interval);
  }, [autoRotateActive, animationSpeed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation({ x: -20, y: 45 });
    setZoom(1);
    toast({
      title: "View Reset",
      description: "Camera position restored to default"
    });
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(visibleCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setVisibleCategories(newCategories);
  };

  const selectPresetView = (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric') => {
    const presets = {
      front: { x: 0, y: 0 },
      back: { x: 0, y: 180 },
      left: { x: 0, y: -90 },
      right: { x: 0, y: 90 },
      top: { x: -90, y: 0 },
      bottom: { x: 90, y: 0 },
      isometric: { x: -30, y: 45 }
    };
    setRotation(presets[preset]);
  };

  const getLightingClass = () => {
    switch (lightingMode) {
      case 'day': return 'bg-gradient-to-br from-blue-100 to-blue-300';
      case 'night': return 'bg-gradient-to-br from-gray-900 to-black';
      case 'studio': return 'bg-gradient-to-br from-gray-200 to-gray-400';
      default: return 'bg-gradient-to-br from-gray-900 to-gray-800';
    }
  };

  const getViewModeStyle = (element: any) => {
    const base = {
      background: element.color || '#666',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    };

    switch (currentViewMode) {
      case 'wireframe':
        return {
          ...base,
          background: 'transparent',
          border: '2px solid ' + (element.color || '#00ff00'),
          boxShadow: 'none'
        };
      case 'solid':
        return {
          ...base,
          background: element.color || '#666'
        };
      case 'realistic':
        return {
          ...base,
          background: `linear-gradient(135deg, ${element.color || '#666'} 0%, ${adjustBrightness(element.color || '#666', -20)} 100%)`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
        };
    }
  };

  const adjustBrightness = (color: string, percent: number) => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // Get project elements with enhanced modeling
  const getProjectElements = () => {
    if (projectData?.name?.includes('Starbucks Werribee')) {
      const buildingWidth = 170;
      const buildingDepth = 130;
      const buildingHeight = 110;
      
      return [
        // Foundation
        {
          id: 'foundation',
          name: 'Concrete Slab Foundation 165m²',
          x: 0, y: -10, z: 0,
          width: buildingWidth + 20, height: 15, depth: buildingDepth + 20,
          color: '#696969', cost: 27225, category: 'structural'
        },
        // Main structure
        {
          id: 'main-structure',
          name: 'Precast Concrete Panels',
          x: 0, y: 0, z: 0,
          width: buildingWidth, height: buildingHeight, depth: buildingDepth,
          color: '#D3D3D3', cost: 185000, category: 'structural'
        },
        // Roof
        {
          id: 'roof',
          name: 'Colorbond Metal Roof 285m²',
          x: -10, y: buildingHeight - 5, z: -10,
          width: buildingWidth + 20, height: 8, depth: buildingDepth + 20,
          color: '#4A5568', cost: 22800, category: 'architectural'
        },
        // Drive-thru canopy
        {
          id: 'canopy',
          name: 'Drive-Thru Canopy Structure',
          x: buildingWidth + 30, y: 80, z: 20,
          width: 60, height: 15, depth: 80,
          color: '#00704A', cost: 3500, category: 'external'
        }
      ];
    }
    return elements || [];
  };

  const driveThruElements = getProjectElements();
  const visibleElements = driveThruElements.filter(el => visibleCategories.has(el.category || 'structural'));
  const totalCost = visibleElements.reduce((sum, el) => sum + el.cost, 0);
  const categories = Array.from(new Set(driveThruElements.map(el => el.category || 'structural')));

  const content = (
    <div className="max-w-7xl mx-auto">
      <DialogHeader className="pb-4">
        <div className="flex items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-5 h-5" />
            Enhanced 3D Viewer - {fileName}
            <Badge variant="outline" className="ml-2">{currentViewMode.toUpperCase()}</Badge>
            <Badge variant="secondary" className="ml-2">
              ${totalCost.toLocaleString()}
            </Badge>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </DialogHeader>
      
      <Tabs defaultValue="viewer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <Box className="w-4 h-4" />
            3D Viewer
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Controls
          </TabsTrigger>
          <TabsTrigger value="layers" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Interactive 3D Model</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setAutoRotateActive(!autoRotateActive)}>
                    {autoRotateActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetView}>
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsFullscreen(!isFullscreen)}>
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Enhanced Controls Bar */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
                {/* View Mode Toggles */}
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium mr-2">View:</span>
                  <Toggle 
                    pressed={currentViewMode === 'wireframe'} 
                    onPressedChange={() => setCurrentViewMode('wireframe')}
                    size="sm"
                  >
                    <Grid className="w-3 h-3" />
                  </Toggle>
                  <Toggle 
                    pressed={currentViewMode === 'solid'} 
                    onPressedChange={() => setCurrentViewMode('solid')}
                    size="sm"
                  >
                    <Box className="w-3 h-3" />
                  </Toggle>
                  <Toggle 
                    pressed={currentViewMode === 'realistic'} 
                    onPressedChange={() => setCurrentViewMode('realistic')}
                    size="sm"
                  >
                    <Palette className="w-3 h-3" />
                  </Toggle>
                </div>

                {/* Lighting Controls */}
                <div className="flex items-center gap-1 ml-4">
                  <span className="text-sm font-medium mr-2">Light:</span>
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
                </div>

                {/* Grid Toggle */}
                <div className="flex items-center gap-1 ml-4">
                  <Toggle 
                    pressed={showGrid} 
                    onPressedChange={setShowGrid}
                    size="sm"
                  >
                    <Grid className="w-3 h-3" />
                    Grid
                  </Toggle>
                </div>

                {/* Quick View Presets */}
                <div className="flex items-center gap-1 ml-4">
                  <span className="text-sm font-medium mr-2">View:</span>
                  <Button size="sm" variant="ghost" onClick={() => selectPresetView('front')}>Front</Button>
                  <Button size="sm" variant="ghost" onClick={() => selectPresetView('isometric')}>ISO</Button>
                  <Button size="sm" variant="ghost" onClick={() => selectPresetView('top')}>Top</Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setZoom(zoom / 1.2)}>
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  <span className="text-sm font-mono min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                  <Button size="sm" variant="outline" onClick={() => setZoom(zoom * 1.2)}>
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* 3D Viewport */}
              <div 
                className={`relative ${getLightingClass()} rounded-b-lg overflow-hidden cursor-move transition-all duration-300`}
                style={{ height: isFullscreen ? '80vh' : '500px', perspective: '1200px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Lighting overlay */}
                <div className={`absolute inset-0 pointer-events-none ${
                  lightingMode === 'day' ? 'bg-gradient-to-t from-transparent to-yellow-500/10' :
                  lightingMode === 'night' ? 'bg-gradient-to-t from-transparent to-blue-900/30' :
                  'bg-gradient-to-t from-transparent to-gray-500/20'
                }`} />
                
                {/* 3D Scene Container */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1200px' }}>
                  <div
                    style={{
                      transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
                      transformStyle: 'preserve-3d',
                      transition: isDragging ? 'none' : 'transform 0.3s ease'
                    }}
                  >
                    {/* Enhanced Grid */}
                    {showGrid && (
                      <div
                        className="absolute border border-gray-400/30"
                        style={{
                          width: '600px',
                          height: '600px',
                          transform: 'rotateX(90deg) translateZ(-50px) translate(-300px, -300px)',
                          background: `
                            repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 49px, rgba(255,255,255,0.1) 50px),
                            repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 49px, rgba(255,255,255,0.1) 50px)
                          `
                        }}
                      />
                    )}
                    
                    {/* Render 3D Elements */}
                    {visibleElements.map((element, index) => {
                      const baseTransform = `translate3d(${element.x - 100}px, ${-element.y}px, ${element.z - 60}px)`;
                      const isSelected = selectedElement === element.id;
                      const style = getViewModeStyle(element);
                      
                      return (
                        <div 
                          key={element.id} 
                          className={`absolute cursor-pointer group transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                          style={{ 
                            transform: baseTransform, 
                            transformStyle: 'preserve-3d'
                          }}
                          onClick={() => setSelectedElement(isSelected ? null : element.id)}
                        >
                          {/* Main element body */}
                          <div 
                            className="absolute"
                            style={{
                              width: `${element.width}px`,
                              height: `${element.height}px`,
                              transform: `translateZ(${element.depth/2}px)`,
                              ...style
                            }}
                          />
                          
                          {/* Element depth (back face) */}
                          <div 
                            className="absolute opacity-80"
                            style={{
                              width: `${element.width}px`,
                              height: `${element.height}px`,
                              transform: `translateZ(-${element.depth/2}px)`,
                              background: style.background,
                              border: style.border
                            }}
                          />
                          
                          {/* Side faces for depth */}
                          <div 
                            className="absolute opacity-70"
                            style={{
                              width: `${element.depth}px`,
                              height: `${element.height}px`,
                              transform: `rotateY(90deg) translateZ(${element.width/2}px)`,
                              transformOrigin: 'left',
                              background: adjustBrightness(element.color || '#666', -30),
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          />
                          
                          {/* Cost tooltip */}
                          <div className={`absolute text-white text-xs bg-black/90 px-2 py-1 rounded transition-opacity z-10 ${
                            isSelected || !showCostOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`} 
                          style={{ 
                            transform: `translateZ(${element.depth/2 + 30}px)`, 
                            whiteSpace: 'nowrap' 
                          }}>
                            {element.name}: ${element.cost.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status overlay */}
                <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-4">
                    <span>Elements: {visibleElements.length}</span>
                    <span>Mode: {currentViewMode}</span>
                    <span>Zoom: {Math.round(zoom * 100)}%</span>
                    <span>Cost: ${totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Animation Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Animation Speed</label>
                  <Slider
                    value={[animationSpeed]}
                    onValueChange={(value) => setAnimationSpeed(value[0])}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-500">{animationSpeed.toFixed(1)}x</span>
                </div>
                <div>
                  <label className="text-sm font-medium">Zoom Level</label>
                  <Slider
                    value={[zoom]}
                    onValueChange={(value) => setZoom(value[0])}
                    max={3}
                    min={0.1}
                    step={0.1}
                    className="mt-2"
                  />
                  <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Display Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Grid</span>
                  <Toggle pressed={showGrid} onPressedChange={setShowGrid} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Measurements</span>
                  <Toggle pressed={showMeasurements} onPressedChange={setShowMeasurements} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cost Overlay</span>
                  <Toggle pressed={showCostOverlay} onPressedChange={() => {}} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layer Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: 
                            category === 'structural' ? '#6b7280' :
                            category === 'architectural' ? '#d1d5db' :
                            category === 'mep' ? '#3b82f6' :
                            '#22c55e'
                          }}
                        />
                        <span className="text-sm capitalize">{category}</span>
                        <Badge variant="outline" className="text-xs">
                          {driveThruElements.filter(el => el.category === category).length}
                        </Badge>
                      </div>
                      <Toggle 
                        pressed={visibleCategories.has(category)} 
                        onPressedChange={() => toggleCategory(category)}
                        size="sm"
                      >
                        <Eye className="w-3 h-3" />
                      </Toggle>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Elements:</span>
                    <span className="font-mono">{driveThruElements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Visible Elements:</span>
                    <span className="font-mono">{visibleElements.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-mono">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories:</span>
                    <span className="font-mono">{categories.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {categories.map(category => {
                    const categoryElements = driveThruElements.filter(el => el.category === category);
                    const categoryTotal = categoryElements.reduce((sum, el) => sum + el.cost, 0);
                    const percentage = totalCost > 0 ? (categoryTotal / totalCost * 100) : 0;
                    
                    return (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}:</span>
                        <div className="text-right">
                          <div className="font-mono">${categoryTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Selected Element</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedElement ? (
                  <div className="space-y-2 text-sm">
                    {(() => {
                      const element = driveThruElements.find(el => el.id === selectedElement);
                      if (!element) return <span>No element selected</span>;
                      
                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Name:</span>
                            <span className="font-medium text-right">{element.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost:</span>
                            <span className="font-mono">${element.cost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Category:</span>
                            <span className="capitalize">{element.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span className="font-mono text-right">
                              {element.width}×{element.height}×{element.depth}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Click an element in the 3D view to see details
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return isOpen ? (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto">
        {content}
      </DialogContent>
    </Dialog>
  ) : (
    <div className={containerHeight}>
      {content}
    </div>
  );
}