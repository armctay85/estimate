import { useEffect, useRef, useState } from "react";
import { CanvasManager, type RoomData, type ShapeType } from "@/lib/fabric";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ShapeSelector } from "@/components/shape-selector";
import { 
  Square, 
  Eraser, 
  Undo, 
  Save, 
  ZoomIn, 
  ZoomOut, 
  Info 
} from "lucide-react";
import { type MaterialType } from "@shared/schema";

interface CanvasProps {
  selectedMaterial: MaterialType;
  onRoomsChange: (rooms: RoomData[]) => void;
  onRoomSelect: (room: RoomData | null) => void;
  onSaveProject: () => void;
}

export function Canvas({ 
  selectedMaterial, 
  onRoomsChange, 
  onRoomSelect, 
  onSaveProject 
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);

  useEffect(() => {
    if (canvasRef.current && !canvasManagerRef.current) {
      canvasManagerRef.current = new CanvasManager(canvasRef.current);
      canvasManagerRef.current.onRoomsChangeCallback((rooms) => {
        onRoomsChange(rooms);
        const selectedRoom = canvasManagerRef.current?.getSelectedRoom();
        onRoomSelect(selectedRoom);
      });
    }

    return () => {
      if (canvasManagerRef.current) {
        canvasManagerRef.current.dispose();
        canvasManagerRef.current = null;
      }
    };
  }, [onRoomsChange, onRoomSelect]);

  useEffect(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setSelectedMaterial(selectedMaterial);
    }
  }, [selectedMaterial]);

  useEffect(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setCurrentShape(selectedShape);
    }
  }, [selectedShape]);

  const handleAddRoom = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.addRoom();
    }
  };

  const handleClearCanvas = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.clearCanvas();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setSelectedShape(shape);
  };

  const handleBackgroundUpload = async (file: File) => {
    if (canvasManagerRef.current) {
      try {
        await canvasManagerRef.current.loadBackgroundImage(file);
        setHasBackground(true);
      } catch (error) {
        console.error("Failed to load background image:", error);
      }
    }
  };

  const handleBackgroundRemove = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.removeBackgroundImage();
      setHasBackground(false);
    }
  };

  const handleBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity);
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setBackgroundOpacity(opacity);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Floor Plan Canvas
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Click and drag to draw rooms</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Canvas Container */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden mb-4"
          style={{ height: "500px" }}
        >
          {/* Grid Background */}
          {showGrid && (
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(#d1d5db 1px, transparent 1px),
                  linear-gradient(90deg, #d1d5db 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px"
              }}
            />
          )}
          
          {/* Fabric.js Canvas */}
          <canvas 
            ref={canvasRef}
            width={800}
            height={500}
            className="absolute inset-0 cursor-crosshair"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
          />
        </div>

        {/* Canvas Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6">
            {/* Drawing Tools */}
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleAddRoom}
                className="bg-primary hover:bg-blue-700"
              >
                <Square className="w-4 h-4 mr-1" />
                Add Room
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCanvas}
              >
                <Eraser className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Grid Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Grid:</span>
              <Switch
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="default"
            onClick={onSaveProject}
            className="bg-secondary hover:bg-orange-600"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
