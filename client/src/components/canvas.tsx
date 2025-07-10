import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { CanvasManager, type RoomData, type ShapeType } from "@/lib/fabric-enhanced";
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
  Grid3X3,
  Move,
  RotateCcw,
  Home,
  Info 
} from "lucide-react";
import { type MaterialType } from "@shared/schema";

interface CanvasProps {
  selectedMaterial: MaterialType;
  onRoomsChange: (rooms: RoomData[]) => void;
  onRoomSelect: (room: RoomData | null) => void;
  onSaveProject: () => void;
  selectedShape?: ShapeType;
  onBackgroundUpload?: (file: File) => void;
  onBackgroundRemove?: () => void;
  onBackgroundOpacity?: (opacity: number) => void;
  hasBackground?: boolean;
  backgroundOpacity?: number;
}

export const Canvas = forwardRef<
  { uploadBackground: (file: File) => void },
  CanvasProps
>(function Canvas({ 
  selectedMaterial, 
  onRoomsChange, 
  onRoomSelect, 
  onSaveProject,
  selectedShape: propSelectedShape,
  onBackgroundUpload: propOnBackgroundUpload,
  onBackgroundRemove: propOnBackgroundRemove,
  onBackgroundOpacity: propOnBackgroundOpacity,
  hasBackground: propHasBackground,
  backgroundOpacity: propBackgroundOpacity
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasManagerRef = useRef<CanvasManager | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [selectedShape, setSelectedShape] = useState<ShapeType>(propSelectedShape || "rectangle");
  const [hasBackground, setHasBackground] = useState(propHasBackground || false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(propBackgroundOpacity || 0.7);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const initializeCanvas = () => {
      if (canvasRef.current && !canvasManagerRef.current) {
        console.log('Canvas: Initializing CanvasManager');
        try {
          // Clear any existing canvas elements
          const canvasElement = canvasRef.current;
          while (canvasElement.nextSibling) {
            canvasElement.parentNode?.removeChild(canvasElement.nextSibling);
          }
          
          canvasManagerRef.current = new CanvasManager(canvasElement);
          canvasManagerRef.current.onRoomsChangeCallback((rooms) => {
            onRoomsChange(rooms);
            const selectedRoom = canvasManagerRef.current?.getSelectedRoom();
            onRoomSelect(selectedRoom);
          });
          console.log('Canvas: CanvasManager initialized successfully');
        } catch (error) {
          console.error('Canvas: Failed to initialize CanvasManager:', error);
          // Retry after a delay
          timeoutId = setTimeout(initializeCanvas, 100);
        }
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    timeoutId = setTimeout(initializeCanvas, 50);

    return () => {
      clearTimeout(timeoutId);
      if (canvasManagerRef.current) {
        try {
          canvasManagerRef.current.dispose();
        } catch (error) {
          console.warn('Canvas: Error during cleanup:', error);
        }
        canvasManagerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setSelectedMaterial(selectedMaterial);
      if (propSelectedShape) {
        canvasManagerRef.current.setCurrentShape(propSelectedShape);
      }
    }
  }, [selectedMaterial, propSelectedShape]);

  useEffect(() => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setCurrentShape(selectedShape);
    }
  }, [selectedShape]);

  // Sync with prop values
  useEffect(() => {
    if (propSelectedShape !== undefined) setSelectedShape(propSelectedShape);
  }, [propSelectedShape]);

  useEffect(() => {
    if (propHasBackground !== undefined) setHasBackground(propHasBackground);
  }, [propHasBackground]);

  useEffect(() => {
    if (propBackgroundOpacity !== undefined) setBackgroundOpacity(propBackgroundOpacity);
  }, [propBackgroundOpacity]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    uploadBackground: handleBackgroundUpload
  }), []);

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
    if (canvasManagerRef.current) {
      canvasManagerRef.current.zoomIn();
      setZoom(Math.round(canvasManagerRef.current.zoomLevel * 100));
    }
  };

  const handleZoomOut = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.zoomOut();
      setZoom(Math.round(canvasManagerRef.current.zoomLevel * 100));
    }
  };

  const handleZoomToFit = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.zoomToFit();
      setZoom(100);
    }
  };

  const handleToggleGrid = (checked: boolean) => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.toggleGrid();
      setShowGrid(checked);
    }
  };

  const handleShapeSelect = (shape: ShapeType) => {
    setSelectedShape(shape);
  };

  const handleBackgroundUpload = async (file: File) => {
    console.log('Canvas handleBackgroundUpload called with file:', file.name, file.type);
    if (canvasManagerRef.current) {
      try {
        await canvasManagerRef.current.loadBackgroundImage(file);
        setHasBackground(true);
        if (propOnBackgroundUpload) {
          propOnBackgroundUpload(file);
        }
        console.log('Background loaded successfully for:', file.name);
      } catch (error) {
        console.error("Failed to load background:", error);
        setHasBackground(false);
        throw error;
      }
    } else {
      console.error('Canvas manager not available');
      throw new Error('Canvas manager not available');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide overlay if leaving the container, not child elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'application/pdf'];
      const validExtensions = ['.dwg', '.dxf'];
      
      const isValidType = validTypes.includes(file.type);
      const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

      if (!isValidType && !isValidExtension) {
        console.error('Invalid file type:', file.type, file.name);
        return;
      }

      console.log('Processing dropped file:', file.name);
      await handleBackgroundUpload(file);
    } catch (error) {
      console.error('Drag and drop upload failed:', error);
    }
  };

  const handleBackgroundRemove = () => {
    if (canvasManagerRef.current) {
      canvasManagerRef.current.removeBackgroundImage();
      setHasBackground(false);
      propOnBackgroundRemove?.();
    }
  };

  const handleBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity);
    if (canvasManagerRef.current) {
      canvasManagerRef.current.setBackgroundOpacity(opacity);
    }
    propOnBackgroundOpacity?.(opacity);
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
        {/* Canvas Container with Drag and Drop */}
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 relative overflow-hidden mb-4"
          style={{ height: "500px" }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Fabric.js Canvas */}
          <canvas 
            ref={canvasRef}
            width={800}
            height={500}
            className="absolute inset-0 cursor-crosshair"
            style={{ width: '100%', height: '100%', pointerEvents: isDragOver ? 'none' : 'auto' }}
          />

          {/* Drag and Drop Overlay */}
          {isDragOver && (
            <div 
              className="absolute inset-0 bg-blue-600 bg-opacity-20 border-4 border-dashed border-blue-400 z-50 flex items-center justify-center"
              style={{ pointerEvents: 'none' }}
            >
              <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-blue-400">
                <div className="text-4xl text-blue-600 mb-4">📁</div>
                <h3 className="text-xl font-semibold text-blue-800 mb-2">Drop Base Layer Here</h3>
                <p className="text-blue-600">
                  Supports: PDF, Images, CAD files (.dwg, .dxf)
                </p>
              </div>
            </div>
          )}
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

            {/* Enhanced Controls */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomToFit}
                title="Zoom to Fit"
              >
                <Home className="w-4 h-4" />
              </Button>
              
              <Button
                variant={showGrid ? "default" : "ghost"}
                size="sm"
                onClick={() => handleToggleGrid(!showGrid)}
                title="Toggle Grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
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
});
