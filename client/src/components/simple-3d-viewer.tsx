import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Box,
  Info,
  Settings,
  Layers,
  Square,
  Pause,
  Play,
  Monitor,
  Maximize2
} from "lucide-react";

interface Simple3DViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  fileName?: string;
  projectData?: any;
  elements?: any[];
  showControls?: boolean;
  autoRotate?: boolean;
  showCostOverlay?: boolean;
  containerHeight?: string;
  viewMode?: 'wireframe' | 'solid' | 'realistic';
  showStats?: boolean;
}

export function Simple3DViewer({ 
  isOpen = true, 
  onClose = () => {}, 
  fileName = "Demo Project", 
  projectData,
  elements,
  showControls = true,
  autoRotate = false,
  showCostOverlay = true,
  containerHeight = "h-[500px]",
  viewMode = 'realistic',
  showStats = false
}: Simple3DViewerProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(['structural', 'architectural', 'mep', 'external']));
  const [currentViewMode, setCurrentViewMode] = useState<'wireframe' | 'solid' | 'realistic'>('realistic');
  const [autoRotateActive, setAutoRotateActive] = useState(autoRotate);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotateActive) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + 0.5
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

  // Get project elements
  const getProjectElements = () => {
    if (elements) return elements;
    
    if (projectData?.name?.includes('Starbucks Werribee')) {
      const buildingWidth = 170;
      const buildingDepth = 130;
      const buildingHeight = 110;
      
      return [
        {
          id: 'foundation',
          name: 'Concrete Slab Foundation 165m²',
          x: 0, y: -10, z: 0,
          width: buildingWidth + 20, height: 15, depth: buildingDepth + 20,
          color: '#696969', cost: 27225, category: 'structural'
        },
        {
          id: 'main-structure',
          name: 'Precast Concrete Panels',
          x: 0, y: 0, z: 0,
          width: buildingWidth, height: buildingHeight, depth: buildingDepth,
          color: '#D3D3D3', cost: 185000, category: 'structural'
        },
        {
          id: 'roof',
          name: 'Colorbond Metal Roof 285m²',
          x: -10, y: buildingHeight - 5, z: -10,
          width: buildingWidth + 20, height: 8, depth: buildingDepth + 20,
          color: '#4A5568', cost: 22800, category: 'architectural'
        },
        {
          id: 'canopy',
          name: 'Drive-Thru Canopy Structure',
          x: buildingWidth + 30, y: 80, z: 20,
          width: 60, height: 15, depth: 80,
          color: '#00704A', cost: 3500, category: 'external'
        }
      ];
    }
    return [];
  };

  const driveThruElements = getProjectElements();
  const visibleElements = driveThruElements.filter(el => visibleCategories.has(el.category || 'structural'));
  const totalCost = visibleElements.reduce((sum, el) => sum + el.cost, 0);
  const categories = Array.from(new Set(driveThruElements.map(el => el.category || 'structural')));

  const content = (
    <div className="max-w-6xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          3D Model - {fileName}
          <Badge variant="outline" className="ml-2">{currentViewMode.toUpperCase()}</Badge>
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
        {/* 3D Viewer */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">3D Visualization</CardTitle>
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
            </CardHeader>
            <CardContent className="p-0">
              <div 
                className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden cursor-move"
                style={{ height: '500px', perspective: '1000px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 3D Scene */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    style={{
                      transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
                      transformStyle: 'preserve-3d',
                      transition: isDragging ? 'none' : 'transform 0.3s ease'
                    }}
                  >
                    {/* Ground plane */}
                    <div
                      className="absolute border border-gray-600"
                      style={{
                        width: '400px',
                        height: '300px',
                        transform: 'rotateX(90deg) translateZ(-50px) translate(-200px, -150px)',
                        background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 19px, rgba(255,255,255,0.05) 20px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 19px, rgba(255,255,255,0.05) 20px)'
                      }}
                    />
                    
                    {/* Render 3D elements */}
                    {visibleElements.map(element => {
                      const baseTransform = `translate3d(${element.x - 100}px, ${-element.y}px, ${element.z - 60}px)`;
                      
                      return (
                        <div key={element.id} className="absolute cursor-pointer group" style={{ transform: baseTransform, transformStyle: 'preserve-3d' }}>
                          <div 
                            className="absolute"
                            style={{
                              width: `${element.width}px`,
                              height: `${element.height}px`,
                              transform: `translateZ(${element.depth/2}px)`,
                              background: `linear-gradient(135deg, ${element.color} 0%, ${element.color}dd 50%, ${element.color}bb 100%)`,
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          />
                          <div 
                            className="absolute opacity-80"
                            style={{
                              width: `${element.width}px`,
                              height: `${element.height}px`,
                              transform: `translateZ(-${element.depth/2}px)`,
                              backgroundColor: element.color,
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          />
                          <div 
                            className="absolute opacity-70"
                            style={{
                              width: `${element.depth}px`,
                              height: `${element.height}px`,
                              transform: `rotateY(90deg) translateZ(${element.width/2}px)`,
                              transformOrigin: 'left',
                              backgroundColor: element.color,
                              border: '1px solid rgba(0,0,0,0.2)'
                            }}
                          />
                          {showCostOverlay && (
                            <div className="absolute text-white text-xs bg-black/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" 
                                 style={{ transform: `translateZ(${element.depth/2 + 30}px)`, whiteSpace: 'nowrap' }}>
                              {element.name}: ${element.cost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Info overlay */}
                <div className="absolute top-2 left-2 text-white text-xs">
                  <Badge variant="secondary">Total Cost: ${totalCost.toLocaleString()}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Element List */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Building Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Category toggles */}
              <div className="space-y-2 pb-3 border-b">
                <p className="text-xs text-gray-600 mb-2">Toggle Categories:</p>
                {categories.map(category => (
                  <label key={category} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCategories.has(category)}
                      onChange={() => toggleCategory(category)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{category}</span>
                  </label>
                ))}
              </div>
              
              {/* Element list */}
              <div className="space-y-2">
                {visibleElements.map(element => (
                  <div key={element.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300" 
                        style={{ backgroundColor: element.color }}
                      />
                      <span className="text-sm text-gray-800">{element.name}</span>
                    </div>
                    <span className="text-sm font-mono text-gray-800">${element.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // If onClose is not provided, render without dialog (embedded mode)
  if (!onClose || showControls === false) {
    return (
      <div 
        className={`relative ${containerHeight} bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden`}
        style={{ perspective: '1000px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Simplified 3D Scene for embedded view */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom * 0.3})`,
              transformStyle: 'preserve-3d',
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
          >
            {/* Render simplified elements for embedded view */}
            {driveThruElements.map(element => (
              <div 
                key={element.id} 
                className="absolute"
                style={{
                  transform: `translate3d(${element.x * 0.5}px, ${-element.y * 0.5}px, ${element.z * 0.5}px)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <div 
                  style={{
                    width: `${element.width * 0.5}px`,
                    height: `${element.height * 0.5}px`,
                    background: element.color,
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '2px'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Cost overlay for embedded view */}
        <div className="absolute bottom-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded">
          ${totalCost.toLocaleString()}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        {content}
      </DialogContent>
    </Dialog>
  );
}