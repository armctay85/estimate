import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Box,
  Move,
  X
} from "lucide-react";

interface Working3DViewerProps {
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

// Demo 3D elements for the viewer
const demo3DElements = [
  { id: 1, name: 'Foundation Slab', category: 'structural', cost: 45000, x: 0, y: -5, z: 0, width: 120, height: 8, depth: 100, color: '#8B5CF6' },
  { id: 2, name: 'Main Walls', category: 'structural', cost: 85000, x: 0, y: 15, z: 0, width: 120, height: 35, depth: 100, color: '#3B82F6' },
  { id: 3, name: 'Roof Structure', category: 'structural', cost: 65000, x: 0, y: 50, z: 0, width: 120, height: 12, depth: 100, color: '#10B981' },
  { id: 4, name: 'Windows & Doors', category: 'architectural', cost: 25000, x: 10, y: 20, z: 0, width: 20, height: 25, depth: 4, color: '#F59E0B' },
  { id: 5, name: 'MEP Systems', category: 'mep', cost: 35000, x: 20, y: 45, z: 20, width: 80, height: 6, depth: 60, color: '#EF4444' },
  { id: 6, name: 'External Works', category: 'external', cost: 28000, x: -60, y: 0, z: -40, width: 100, height: 3, depth: 60, color: '#6B7280' }
];

export function Working3DViewer({ 
  isOpen = true, 
  onClose = () => {}, 
  fileName = "Demo Project", 
  projectData,
  elements = demo3DElements,
  showControls = true,
  autoRotate = false,
  showCostOverlay = true,
  containerHeight = "h-[600px]"
}: Working3DViewerProps) {
  const [rotation, setRotation] = useState({ x: -15, y: 35 });
  const [zoom, setZoom] = useState(0.8);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(['structural', 'architectural', 'mep', 'external'])
  );
  const viewerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation effect
  useEffect(() => {
    if (!autoRotate) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + 0.5
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, [autoRotate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.3)),
      y: prev.y + deltaX * 0.3
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation({ x: -15, y: 35 });
    setZoom(0.8);
    setSelectedElement(null);
  };

  const toggleCategory = (category: string) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const totalCost = elements.reduce((sum, element) => sum + element.cost, 0);

  const render3DElement = (element: any, index: number) => {
    if (!visibleCategories.has(element.category)) return null;
    
    const isSelected = selectedElement?.id === element.id;
    const scale = zoom;
    
    // Calculate 3D transform
    const transform = `
      perspective(800px)
      rotateX(${rotation.x}deg)
      rotateY(${rotation.y}deg)
      translateX(${element.x * scale}px)
      translateY(${-element.y * scale}px)
      translateZ(${element.z * scale}px)
      scale3d(${scale}, ${scale}, ${scale})
    `;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-pointer transition-all duration-200 border-2 rounded ${
          isSelected ? 'border-yellow-400 shadow-xl' : 'border-white border-opacity-40'
        } hover:border-yellow-300`}
        style={{
          width: `${element.width}px`,
          height: `${element.height}px`,
          backgroundColor: element.color,
          opacity: isSelected ? 0.95 : 0.75,
          transform: transform,
          transformStyle: 'preserve-3d',
          left: '50%',
          top: '50%',
          marginLeft: `-${element.width/2}px`,
          marginTop: `-${element.height/2}px`,
          zIndex: 100 - index,
          boxShadow: isSelected ? '0 0 20px rgba(255, 255, 0, 0.5)' : '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onClick={() => setSelectedElement(element)}
        title={`${element.name} - $${element.cost.toLocaleString()}`}
      >
        {/* Cost overlay */}
        {isSelected && showCostOverlay && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap z-50 shadow-lg">
            <div className="font-semibold">{element.name}</div>
            <div className="text-yellow-300">${element.cost.toLocaleString()}</div>
          </div>
        )}
        
        {/* Element label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-xs font-medium text-center px-2 drop-shadow-lg">
            {element.name.split(' ')[0]}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Box className="h-6 w-6 text-blue-600" />
              3D Model Viewer - {fileName}
              <Badge variant="secondary" className="ml-2">
                Interactive 3D
              </Badge>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* 3D Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full relative overflow-hidden">
                <div
                  ref={viewerRef}
                  className="w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 relative cursor-move select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ 
                    height: '500px',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px'
                  }}
                >
                  {/* Grid background */}
                  <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#333" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  
                  {/* 3D Elements */}
                  <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
                    {elements.map((element, index) => render3DElement(element, index))}
                  </div>
                  
                  {/* Instructions */}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Move className="h-4 w-4" />
                      <span>Drag to rotate • Zoom controls on right</span>
                    </div>
                    <div>Click elements to view details</div>
                  </div>
                  
                  {/* Total cost display */}
                  <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Project Cost</div>
                    <div className="text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</div>
                  </div>
                </div>
                
                {/* Controls */}
                {showControls && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
                      className="bg-white dark:bg-gray-800"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.3))}
                      className="bg-white dark:bg-gray-800"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={resetView}
                      className="bg-white dark:bg-gray-800"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Project Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Project Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Total Cost</div>
                  <div className="text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Elements</div>
                  <div className="text-lg font-semibold">{elements.length} components</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">View Angle</div>
                  <div className="text-sm">X: {rotation.x.toFixed(0)}° Y: {rotation.y.toFixed(0)}°</div>
                </div>
              </CardContent>
            </Card>

            {/* Layer Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Layer Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['structural', 'architectural', 'mep', 'external'].map(category => {
                  const categoryElements = elements.filter(e => e.category === category);
                  const categoryCount = categoryElements.length;
                  const categoryCost = categoryElements.reduce((sum, e) => sum + e.cost, 0);
                  
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={category}
                          checked={visibleCategories.has(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded"
                        />
                        <label htmlFor={category} className="text-sm font-medium capitalize cursor-pointer">
                          {category}
                        </label>
                      </div>
                      <div className="text-xs text-gray-500 ml-6">
                        {categoryCount} items • ${categoryCost.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Selected Element Info */}
            {selectedElement && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Element Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-3 text-lg">{selectedElement.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="font-medium capitalize">{selectedElement.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium text-green-600">${selectedElement.cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="font-medium">{selectedElement.width}×{selectedElement.height}×{selectedElement.depth}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    size="sm"
                    onClick={() => setSelectedElement(null)}
                  >
                    Clear Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}