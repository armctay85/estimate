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

  // Generate project-specific 3D elements based on project data
  const getProjectElements = () => {
    // Check if this is Starbucks Werribee project
    if (projectData?.id === 'starbucks-werribee' || projectData?.name?.includes('Starbucks Werribee')) {
      return [
        // Main building structure (285m² footprint)
        {
          id: 'building-main',
          name: 'Main Building Structure',
          x: 0,
          y: 0,
          z: 0,
          width: 200,
          height: 120,
          depth: 150,
          color: '#8B6F47',
          cost: 320000,
          category: 'structural'
        },
        // Precast concrete panels
        {
          id: 'precast-panels',
          name: 'Precast Concrete Panels',
          x: 0,
          y: 60,
          z: 0,
          width: 205,
          height: 80,
          depth: 155,
          color: '#D3D3D3',
          cost: 106400,
          category: 'structural'
        },
        // Drive-thru lane structure
        {
          id: 'drive-lane-concrete',
          name: 'Drive-Thru Lane & Paving',
          x: 220,
          y: -55,
          z: 20,
          width: 120,
          height: 10,
          depth: 100,
          color: '#696969',
          cost: 65000,
          category: 'external'
        },
        // Drive-thru canopy with steel structure
        {
          id: 'canopy-structure',
          name: 'Drive-Thru Canopy',
          x: 240,
          y: 40,
          z: 50,
          width: 80,
          height: 25,
          depth: 50,
          color: '#00563F',
          cost: 42000,
          category: 'structural'
        },
        // Order point kiosk
        {
          id: 'order-point',
          name: 'Digital Order Point',
          x: 260,
          y: -25,
          z: 90,
          width: 20,
          height: 50,
          depth: 15,
          color: '#2F4F4F',
          cost: 12000,
          category: 'architectural'
        },
        // Commercial kitchen block
        {
          id: 'kitchen-zone',
          name: 'Commercial Kitchen Zone',
          x: 40,
          y: 0,
          z: 40,
          width: 80,
          height: 60,
          depth: 70,
          color: '#C0C0C0',
          cost: 180000,
          category: 'architectural'
        },
        // Shopfront glazing
        {
          id: 'shopfront',
          name: 'Glazing & Shopfront',
          x: -105,
          y: 30,
          z: 0,
          width: 5,
          height: 70,
          depth: 120,
          color: '#87CEEB',
          cost: 29250,
          category: 'architectural'
        },
        // Roofing structure
        {
          id: 'roof',
          name: 'Colorbond Roofing',
          x: 0,
          y: 120,
          z: 0,
          width: 210,
          height: 15,
          depth: 160,
          color: '#708090',
          cost: 27200,
          category: 'structural'
        },
        // MEP services block
        {
          id: 'mep-services',
          name: 'MEP Services Zone',
          x: 120,
          y: 20,
          z: 60,
          width: 40,
          height: 40,
          depth: 40,
          color: '#FFD700',
          cost: 110000,
          category: 'mep'
        }
      ];
    }
    
    // Check if this is Kmart Gladstone project
    if (projectData?.id === 'kmart-gladstone' || projectData?.name?.includes('Kmart Gladstone')) {
      return [
        // Main retail building (8,500m²)
        {
          id: 'retail-floor',
          name: 'Retail Floor Space',
          x: 0,
          y: 0,
          z: 0,
          width: 300,
          height: 150,
          depth: 280,
          color: '#E50019',
          cost: 850000,
          category: 'structural'
        },
        // Suspended ceiling system
        {
          id: 'suspended-ceiling',
          name: 'Suspended Ceiling Grid',
          x: 0,
          y: 140,
          z: 0,
          width: 300,
          height: 10,
          depth: 280,
          color: '#F0F0F0',
          cost: 180000,
          category: 'architectural'
        },
        // Retail fixtures & gondolas
        {
          id: 'retail-fixtures',
          name: 'Retail Fixtures & Gondolas',
          x: 50,
          y: 20,
          z: 50,
          width: 200,
          height: 80,
          depth: 180,
          color: '#4A4A4A',
          cost: 320000,
          category: 'architectural'
        },
        // Loading dock area
        {
          id: 'loading-dock',
          name: 'Loading Dock & Back of House',
          x: 310,
          y: 0,
          z: 100,
          width: 80,
          height: 120,
          depth: 80,
          color: '#808080',
          cost: 125000,
          category: 'external'
        },
        // Shopfront glazing
        {
          id: 'shopfront-glazing',
          name: 'Shopfront & Entry',
          x: -5,
          y: 50,
          z: 0,
          width: 10,
          height: 100,
          depth: 200,
          color: '#87CEEB',
          cost: 95000,
          category: 'architectural'
        },
        // HVAC & services
        {
          id: 'hvac-system',
          name: 'HVAC & Building Services',
          x: 150,
          y: 155,
          z: 140,
          width: 100,
          height: 30,
          depth: 100,
          color: '#FFD700',
          cost: 280000,
          category: 'mep'
        },
        // Fire services
        {
          id: 'fire-services',
          name: 'Fire Services & Sprinklers',
          x: 0,
          y: 150,
          z: 0,
          width: 305,
          height: 5,
          depth: 285,
          color: '#FF4500',
          cost: 145000,
          category: 'mep'
        },
        // External works
        {
          id: 'carpark',
          name: 'Carpark & External Works',
          x: -150,
          y: -10,
          z: 0,
          width: 140,
          height: 5,
          depth: 280,
          color: '#2F4F4F',
          cost: 220000,
          category: 'external'
        }
      ];
    }
    
    // Default elements for other projects
    return [
      {
        id: 'building',
        name: 'Main Building',
        x: 0,
        y: 0,
        z: 0,
        width: 150,
        height: 100,
        depth: 120,
        color: '#8B4513',
        cost: 280000,
        category: 'structural'
      },
      {
        id: 'structure',
        name: 'Structural Frame',
        x: 0,
        y: 50,
        z: 0,
        width: 155,
        height: 60,
        depth: 125,
        color: '#696969',
        cost: 150000,
        category: 'structural'
      }
    ];
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
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: element.color }}
                      />
                      <span className="text-sm">{element.name}</span>
                    </div>
                    <span className="text-sm font-mono">${element.cost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Alert className="mt-4">
            <Info className="w-4 h-4" />
            <AlertDescription>
              This is a representative 3D model. Actual RVT parsing requires specialized CAD libraries.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl" aria-describedby="3d-viewer-description">
        <span id="3d-viewer-description" className="sr-only">
          3D model viewer showing building elements and costs
        </span>
        {content}
      </DialogContent>
    </Dialog>
  );
}