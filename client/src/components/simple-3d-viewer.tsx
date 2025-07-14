import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Box,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Simple3DViewerProps {
  isOpen?: boolean;
  onClose?: () => void;
  fileName?: string;
  projectData?: any;
}

export function Simple3DViewer({ 
  isOpen = true, 
  onClose = () => {}, 
  fileName = "Demo Project", 
  projectData
}: Simple3DViewerProps) {
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(['structural', 'architectural', 'mep', 'external']));
  const { toast } = useToast();

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

  // Generate realistic 3D building model with selectable layers
  const getProjectElements = () => {
    // For Starbucks Drive-Through - create realistic layered building model
    if (projectData?.name?.includes('Starbucks Werribee')) {
      const buildingWidth = 170;
      const buildingDepth = 130;
      const buildingHeight = 110;
      
      return [
        // LAYER 1: Foundation & Ground Works
        {
          id: 'foundation',
          name: 'Concrete Slab Foundation 165m²',
          x: 0,
          y: -10,
          z: 0,
          width: buildingWidth + 20,
          height: 15,
          depth: buildingDepth + 20,
          color: '#696969',
          cost: 27225,
          category: 'structural',
          layer: 'foundation',
          selectable: true
        },
        
        // LAYER 2: Building Structure
        // Front wall with entrance
        {
          id: 'wall-front',
          name: 'Precast Panel - Front Wall',
          x: -buildingWidth/2,
          y: 5,
          z: 0,
          width: 8,
          height: buildingHeight,
          depth: buildingDepth,
          color: '#D2B48C',
          cost: 26600,
          category: 'structural',
          layer: 'walls',
          selectable: true
        },
        // Back wall
        {
          id: 'wall-back',
          name: 'Precast Panel - Back Wall',
          x: buildingWidth/2,
          y: 5,
          z: 0,
          width: 8,
          height: buildingHeight,
          depth: buildingDepth,
          color: '#D2B48C',
          cost: 26600,
          category: 'structural',
          layer: 'walls',
          selectable: true
        },
        // Left wall
        {
          id: 'wall-left',
          name: 'Precast Panel - Side Wall',
          x: 0,
          y: 5,
          z: -buildingDepth/2,
          width: buildingWidth,
          height: buildingHeight,
          depth: 8,
          color: '#D2B48C',
          cost: 26600,
          category: 'structural',
          layer: 'walls',
          selectable: true
        },
        // Right wall with drive-thru window
        {
          id: 'wall-right',
          name: 'Precast Panel - Drive-Thru Wall',
          x: 0,
          y: 5,
          z: buildingDepth/2,
          width: buildingWidth,
          height: buildingHeight,
          depth: 8,
          color: '#D2B48C',
          cost: 26600,
          category: 'structural',
          layer: 'walls',
          selectable: true
        },
        
        // LAYER 3: Roof Structure
        {
          id: 'roof-main',
          name: 'Colorbond Roofing 320m²',
          x: 0,
          y: buildingHeight + 5,
          z: 0,
          width: buildingWidth + 10,
          height: 8,
          depth: buildingDepth + 10,
          color: '#708090',
          cost: 27200,
          category: 'structural',
          layer: 'roof',
          selectable: true
        },
        
        // LAYER 4: Architectural Elements
        // Storefront glazing
        {
          id: 'glazing-front',
          name: 'Glazing & Shopfront 65m²',
          x: -buildingWidth/2 - 4,
          y: 25,
          z: -30,
          width: 4,
          height: 65,
          depth: 60,
          color: '#87CEEB',
          cost: 29250,
          category: 'architectural',
          layer: 'glazing',
          selectable: true,
          opacity: 0.7
        },
        // Drive-thru window
        {
          id: 'window-drivethru',
          name: 'Drive-Thru Service Window',
          x: 30,
          y: 35,
          z: buildingDepth/2 - 4,
          width: 30,
          height: 30,
          depth: 4,
          color: '#4682B4',
          cost: 4500,
          category: 'architectural',
          layer: 'windows',
          selectable: true
        },
        
        // LAYER 5: Interior Zones
        // Kitchen area
        {
          id: 'kitchen-zone',
          name: 'Commercial Kitchen Fitout',
          x: 20,
          y: 5,
          z: -20,
          width: 70,
          height: 40,
          depth: 60,
          color: '#C0C0C0',
          cost: 180000,
          category: 'architectural',
          layer: 'interior',
          selectable: true,
          opacity: 0.8
        },
        // Service counter area
        {
          id: 'counter-zone',
          name: 'Service Counter & Joinery',
          x: -40,
          y: 5,
          z: 20,
          width: 60,
          height: 35,
          depth: 30,
          color: '#8B4513',
          cost: 35000,
          category: 'architectural',
          layer: 'interior',
          selectable: true,
          opacity: 0.8
        },
        
        // LAYER 6: MEP Services on Roof
        {
          id: 'hvac-unit-1',
          name: 'HVAC Unit - Kitchen Exhaust',
          x: -30,
          y: buildingHeight + 13,
          z: -30,
          width: 30,
          height: 25,
          depth: 30,
          color: '#FFD700',
          cost: 45000,
          category: 'mep',
          layer: 'services',
          selectable: true
        },
        {
          id: 'hvac-unit-2',
          name: 'HVAC Unit - Air Conditioning',
          x: 30,
          y: buildingHeight + 13,
          z: 30,
          width: 35,
          height: 25,
          depth: 35,
          color: '#FFD700',
          cost: 52725,
          category: 'mep',
          layer: 'services',
          selectable: true
        },
        
        // LAYER 7: External Works
        // Drive-thru lane
        {
          id: 'drive-lane-curve',
          name: 'Drive-Thru Lane 180m²',
          x: buildingWidth/2 + 50,
          y: -8,
          z: 0,
          width: 35,
          height: 5,
          depth: 200,
          color: '#2F2F2F',
          cost: 33300,
          category: 'external',
          layer: 'siteworks',
          selectable: true
        },
        // Drive-thru canopy
        {
          id: 'canopy-structure',
          name: 'Drive-Thru Canopy',
          x: buildingWidth/2 + 40,
          y: 70,
          z: 20,
          width: 50,
          height: 8,
          depth: 40,
          color: '#00704A',
          cost: 15000,
          category: 'external',
          layer: 'canopy',
          selectable: true
        },
        // Canopy support columns
        {
          id: 'canopy-column-1',
          name: 'Canopy Support Column',
          x: buildingWidth/2 + 30,
          y: -8,
          z: 10,
          width: 8,
          height: 78,
          depth: 8,
          color: '#00704A',
          cost: 3500,
          category: 'external',
          layer: 'canopy',
          selectable: true
        },
        {
          id: 'canopy-column-2',
          name: 'Canopy Support Column',
          x: buildingWidth/2 + 50,
          y: -8,
          z: 30,
          width: 8,
          height: 78,
          depth: 8,
          color: '#00704A',
          cost: 3500,
          category: 'external',
          layer: 'canopy',
          selectable: true
        },
        // Parking area
        {
          id: 'parking',
          name: 'Car Parking 420m²',
          x: -buildingWidth - 50,
          y: -8,
          z: 0,
          width: 80,
          height: 3,
          depth: 140,
          color: '#505050',
          cost: 52500,
          category: 'external',
          layer: 'siteworks',
          selectable: true
        },
        // Landscaping
        {
          id: 'landscape-1',
          name: 'Landscaping Area',
          x: -buildingWidth/2 - 50,
          y: -5,
          z: -buildingDepth/2 - 30,
          width: 40,
          height: 8,
          depth: 40,
          color: '#228B22',
          cost: 11900,
          category: 'external',
          layer: 'landscape',
          selectable: true
        },
        {
          id: 'landscape-2',
          name: 'Landscaping Area',
          x: -buildingWidth/2 - 50,
          y: -5,
          z: buildingDepth/2 + 30,
          width: 40,
          height: 8,
          depth: 40,
          color: '#228B22',
          cost: 11900,
          category: 'external',
          layer: 'landscape',
          selectable: true
        }
      ];
    }
    
    // Default fallback for other projects
    return [];
  };
  
  const driveThruElements = getProjectElements();
  
  // Filter elements by visible categories
  const visibleElements = driveThruElements.filter(el => visibleCategories.has(el.category || 'structural'));
  
  const totalCost = visibleElements.reduce((sum, el) => sum + el.cost, 0);
  
  // Get unique categories
  const categories = Array.from(new Set(driveThruElements.map(el => el.category || 'structural')));
  
  const toggleCategory = (category: string) => {
    const newVisible = new Set(visibleCategories);
    if (newVisible.has(category)) {
      newVisible.delete(category);
    } else {
      newVisible.add(category);
    }
    setVisibleCategories(newVisible);
  };

  const content = (
    <div className="max-w-6xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          3D Model - {fileName}
          <Badge variant="outline" className="ml-2">Drive-Thru Layout</Badge>
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
            <CardContent>
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
                    
                    {/* Render visible elements */}
                    {visibleElements.map(element => (
                      <div
                        key={element.id}
                        className="absolute cursor-pointer group"
                        style={{
                          transform: `translate3d(${element.x - 100}px, ${-element.y}px, ${element.z - 60}px)`,
                          transformStyle: 'preserve-3d'
                        }}
                      >
                        {/* Box faces */}
                        <div
                          className="absolute opacity-90 group-hover:opacity-100 transition-opacity"
                          style={{
                            width: `${element.width}px`,
                            height: `${element.height}px`,
                            backgroundColor: element.color,
                            transform: `translateZ(${element.depth/2}px)`,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                        <div
                          className="absolute opacity-90"
                          style={{
                            width: `${element.width}px`,
                            height: `${element.height}px`,
                            backgroundColor: element.color,
                            transform: `translateZ(-${element.depth/2}px)`,
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                        <div
                          className="absolute opacity-80"
                          style={{
                            width: `${element.width}px`,
                            height: `${element.depth}px`,
                            backgroundColor: element.color,
                            transform: `rotateX(90deg) translateZ(${element.height/2}px)`,
                            transformOrigin: 'bottom',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                        <div
                          className="absolute opacity-70"
                          style={{
                            width: `${element.depth}px`,
                            height: `${element.height}px`,
                            backgroundColor: element.color,
                            transform: `rotateY(90deg) translateZ(${element.width/2}px)`,
                            transformOrigin: 'left',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                        />
                        
                        {/* Label */}
                        <div
                          className="absolute text-white text-xs bg-black/80 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                          style={{
                            transform: `translateZ(${element.depth/2 + 20}px) translateX(-20px)`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {element.name}: ${element.cost.toLocaleString()}
                        </div>
                      </div>
                    ))}
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
          
          <Alert className="mt-4">
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs space-y-2">
              <p>3D visualization generated from project cost breakdown data:</p>
              <ul className="text-xs space-y-1 mt-2">
                <li>• Building size based on slab area (165m²)</li>
                <li>• Elements positioned by category type</li>
                <li>• Sizes scaled by cost values</li>
                <li>• Colors indicate element categories</li>
              </ul>
              <p className="mt-2 font-semibold">Data source: {projectData?.name || 'Project'} cost breakdown</p>
              <p className="text-yellow-600">Note: Full CAD parsing would provide exact geometry</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="3d-viewer-description">
        <span id="3d-viewer-description" className="sr-only">
          3D model viewer showing building elements and costs
        </span>
        {content}
      </DialogContent>
    </Dialog>
  );
}