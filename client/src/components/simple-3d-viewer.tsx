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

  // Generate Starbucks drive-thru elements
  const driveThruElements = [
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
      cost: 280000
    },
    {
      id: 'drive-lane',
      name: 'Drive-Thru Lane',
      x: 160,
      y: -45,
      z: 20,
      width: 100,
      height: 10,
      depth: 80,
      color: '#4A4A4A',
      cost: 45000
    },
    {
      id: 'canopy',
      name: 'Drive-Thru Canopy',
      x: 180,
      y: 30,
      z: 40,
      width: 60,
      height: 20,
      depth: 40,
      color: '#00563F',
      cost: 25000
    },
    {
      id: 'order-kiosk',
      name: 'Order Kiosk',
      x: 200,
      y: -20,
      z: 70,
      width: 15,
      height: 40,
      depth: 10,
      color: '#2F4F4F',
      cost: 8500
    },
    {
      id: 'kitchen',
      name: 'Kitchen Equipment',
      x: 30,
      y: 0,
      z: 30,
      width: 60,
      height: 50,
      depth: 50,
      color: '#C0C0C0',
      cost: 180000
    }
  ];

  const totalCost = driveThruElements.reduce((sum, el) => sum + el.cost, 0);

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
                    
                    {/* Render drive-thru elements */}
                    {driveThruElements.map(element => (
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
            <CardContent className="space-y-2">
              {driveThruElements.map(element => (
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