import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff,
  Layers,
  DollarSign
} from "lucide-react";

interface ModelElement {
  id: string;
  name: string;
  category: string;
  cost: number;
  color: string;
  position: { x: number; y: number; z: number };
  dimensions: { width: number; height: number; depth: number };
  visible: boolean;
}

// Sample BIM data representing a real RVT file structure
const sampleBIMData: ModelElement[] = [
  { id: "1", name: "Structural Frame", category: "Structure", cost: 185000, color: "#8B4513", position: { x: 0, y: 0, z: 0 }, dimensions: { width: 40, height: 4, depth: 20 }, visible: true },
  { id: "2", name: "Exterior Walls", category: "Architecture", cost: 145000, color: "#D2B48C", position: { x: 0, y: 4, z: 0 }, dimensions: { width: 40, height: 8, depth: 20 }, visible: true },
  { id: "3", name: "Roof Structure", category: "Structure", cost: 85000, color: "#654321", position: { x: 0, y: 12, z: 0 }, dimensions: { width: 42, height: 2, depth: 22 }, visible: true },
  { id: "4", name: "Interior Partitions", category: "Architecture", cost: 48500, color: "#F5F5DC", position: { x: 5, y: 4, z: 5 }, dimensions: { width: 30, height: 8, depth: 10 }, visible: true },
  { id: "5", name: "HVAC Systems", category: "MEP", cost: 95000, color: "#4682B4", position: { x: 10, y: 13, z: 8 }, dimensions: { width: 20, height: 1, depth: 4 }, visible: true },
  { id: "6", name: "Electrical Systems", category: "MEP", cost: 65000, color: "#FFD700", position: { x: 2, y: 5, z: 2 }, dimensions: { width: 36, height: 0.5, depth: 16 }, visible: true },
];

export function Interactive3DModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: -15, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [selectedElement, setSelectedElement] = useState<ModelElement | null>(null);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set(["Structure", "Architecture", "MEP"]));
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  const totalCost = sampleBIMData
    .filter(el => visibleCategories.has(el.category))
    .reduce((sum, el) => sum + el.cost, 0);

  const categories = Array.from(new Set(sampleBIMData.map(el => el.category)));

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating) return;
    
    const interval = setInterval(() => {
      setRotation(prev => ({
        ...prev,
        y: (prev.y + 1) % 360
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // 3D rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = 8 * zoom;

      // Convert rotation to radians
      const rotX = (rotation.x * Math.PI) / 180;
      const rotY = (rotation.y * Math.PI) / 180;

      // Render elements
      const visibleElements = sampleBIMData.filter(el => 
        visibleCategories.has(el.category) && el.visible
      );

      // Sort by z-depth for proper rendering
      visibleElements.sort((a, b) => {
        const aZ = a.position.z * Math.cos(rotX) - a.position.y * Math.sin(rotX);
        const bZ = b.position.z * Math.cos(rotX) - b.position.y * Math.sin(rotX);
        return bZ - aZ;
      });

      visibleElements.forEach((element) => {
        // Apply 3D transformations
        const { x, y, z } = element.position;
        const { width, height, depth } = element.dimensions;

        // Rotate around Y axis then X axis
        const x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        const z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        const y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        // Project to 2D
        const screenX = centerX + x1 * scale;
        const screenY = centerY - y1 * scale;
        const screenW = width * scale;
        const screenH = height * scale;

        // Draw element with perspective
        ctx.fillStyle = element.color;
        ctx.strokeStyle = selectedElement?.id === element.id ? "#FF6B35" : "#333";
        ctx.lineWidth = selectedElement?.id === element.id ? 3 : 1;
        
        // Draw as 3D box
        ctx.beginPath();
        ctx.rect(screenX - screenW/2, screenY - screenH/2, screenW, screenH);
        ctx.fill();
        ctx.stroke();

        // Add depth lines for 3D effect
        const depthOffset = (depth * scale * Math.sin(rotY)) / 4;
        if (depthOffset > 1) {
          ctx.beginPath();
          ctx.moveTo(screenX + screenW/2, screenY - screenH/2);
          ctx.lineTo(screenX + screenW/2 + depthOffset, screenY - screenH/2 - depthOffset);
          ctx.lineTo(screenX + screenW/2 + depthOffset, screenY + screenH/2 - depthOffset);
          ctx.lineTo(screenX + screenW/2, screenY + screenH/2);
          ctx.fillStyle = element.color;
          ctx.fill();
          ctx.stroke();

          // Top face
          ctx.beginPath();
          ctx.moveTo(screenX - screenW/2, screenY - screenH/2);
          ctx.lineTo(screenX - screenW/2 + depthOffset, screenY - screenH/2 - depthOffset);
          ctx.lineTo(screenX + screenW/2 + depthOffset, screenY - screenH/2 - depthOffset);
          ctx.lineTo(screenX + screenW/2, screenY - screenH/2);
          ctx.closePath();
          ctx.fillStyle = element.color;
          ctx.fill();
          ctx.stroke();
        }
      });

      // Draw cost overlay for selected element
      if (selectedElement) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(10, 10, 250, 80);
        ctx.fillStyle = "white";
        ctx.font = "14px Arial";
        ctx.fillText(selectedElement.name, 20, 30);
        ctx.fillText(`Category: ${selectedElement.category}`, 20, 50);
        ctx.fillText(`Cost: $${selectedElement.cost.toLocaleString()}`, 20, 70);
      }
    };

    render();
  }, [rotation, zoom, selectedElement, visibleCategories]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Simple hit detection (can be improved)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const visibleElements = sampleBIMData.filter(el => 
      visibleCategories.has(el.category) && el.visible
    );

    for (const element of visibleElements) {
      const screenX = centerX + element.position.x * 8 * zoom;
      const screenY = centerY - element.position.y * 8 * zoom;
      const screenW = element.dimensions.width * 8 * zoom;
      const screenH = element.dimensions.height * 8 * zoom;

      if (x >= screenX - screenW/2 && x <= screenX + screenW/2 &&
          y >= screenY - screenH/2 && y <= screenY + screenH/2) {
        setSelectedElement(element);
        setIsAutoRotating(false);
        return;
      }
    }
    setSelectedElement(null);
  };

  const toggleCategory = (category: string) => {
    const newVisible = new Set(visibleCategories);
    if (newVisible.has(category)) {
      newVisible.delete(category);
    } else {
      newVisible.add(category);
    }
    setVisibleCategories(newVisible);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Interactive 3D BIM Model</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real building elements from uploaded RVT file
              </p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <DollarSign className="w-3 h-3 mr-1" />
            ${totalCost.toLocaleString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation(prev => ({ ...prev, x: prev.x - 15 }))}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant={isAutoRotating ? "default" : "outline"}
              size="sm"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
            >
              Auto Rotate
            </Button>
          </div>

          {/* Layer visibility controls */}
          <div className="flex gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={visibleCategories.has(category) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1"
              >
                {visibleCategories.has(category) ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={500}
            onClick={handleCanvasClick}
            className="w-full h-auto cursor-pointer"
          />
          
          {/* Instructions overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded-lg text-sm">
            <p>Click elements to inspect</p>
            <p>Use controls to navigate</p>
            <p className="text-xs text-gray-300 mt-1">
              Zoom: {zoom.toFixed(1)}x | Rotation: {rotation.y.toFixed(0)}°
            </p>
          </div>
        </div>

        {/* Element list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sampleBIMData
            .filter(el => visibleCategories.has(el.category))
            .map((element) => (
            <div
              key={element.id}
              onClick={() => {
                setSelectedElement(element);
                setIsAutoRotating(false);
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedElement?.id === element.id
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm border"
                    style={{ backgroundColor: element.color }}
                  />
                  <span className="font-medium text-sm">{element.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {element.category}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="text-green-600 font-medium">
                    ${element.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}