import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MousePointer2, 
  Square, 
  Minus, 
  Trash2, 
  Ruler,
  Save,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  X,
  Calculator,
  MapPin
} from "lucide-react";

export interface Measurement {
  id: string;
  type: 'area' | 'length';
  points: { x: number; y: number }[];
  value: number;
  unit: 'm2' | 'm' | 'mm' | 'ft2' | 'ft';
  label: string;
  elementType: 'floor' | 'wall' | 'ceiling' | 'opening' | 'structural' | 'other';
  pageNumber: number;
  color?: string;
  createdAt: string;
}

interface PDFTakeoffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  takeoff: {
    id: number;
    fileName: string;
    pageCount: number;
    pages: {
      pageNumber: number;
      imageUrl: string;
      width: number;
      height: number;
    }[];
    measurements: Measurement[];
    scaleCalibration?: {
      pixelDistance: number;
      realDistance: number;
      unit: 'm' | 'mm' | 'ft';
    };
    scaleRatio?: number;
  } | null;
  onSaveMeasurements: (measurements: Measurement[], scaleCalibration?: any) => Promise<void>;
}

type Tool = 'select' | 'polygon' | 'line' | 'calibrate';

const ELEMENT_COLORS: Record<string, string> = {
  floor: '#22c55e',
  wall: '#3b82f6',
  ceiling: '#8b5cf6',
  opening: '#f59e0b',
  structural: '#ef4444',
  other: '#6b7280',
};

export function PDFTakeoffViewer({
  isOpen,
  onClose,
  takeoff,
  onSaveMeasurements,
}: PDFTakeoffViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<Partial<Measurement> | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scaleCalibration, setScaleCalibration] = useState<{
    pixelDistance: number;
    realDistance: number;
    unit: 'm' | 'mm' | 'ft';
  } | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number; y: number }[]>([]);
  const [calibrationValue, setCalibrationValue] = useState('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize from takeoff data
  useEffect(() => {
    if (takeoff) {
      setMeasurements(takeoff.measurements || []);
      setScaleCalibration(takeoff.scaleCalibration || null);
    }
  }, [takeoff]);

  // Get current page image
  const currentPageData = takeoff?.pages.find(p => p.pageNumber === currentPage);

  // Calculate scale ratio
  const getScaleRatio = useCallback(() => {
    if (scaleCalibration?.pixelDistance && scaleCalibration?.realDistance) {
      return scaleCalibration.pixelDistance / scaleCalibration.realDistance;
    }
    return takeoff?.scaleRatio || 100; // Default: 100 pixels = 1 meter
  }, [scaleCalibration, takeoff?.scaleRatio]);

  // Calculate measurement value
  const calculateValue = useCallback((type: 'area' | 'length', points: { x: number; y: number }[]): number => {
    const scaleRatio = getScaleRatio();
    
    if (type === 'area') {
      // Shoelace formula for polygon area
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
      }
      area = Math.abs(area) / 2;
      // Convert to square meters
      return area / (scaleRatio * scaleRatio);
    } else {
      // Line length
      let length = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        length += Math.sqrt(dx * dx + dy * dy);
      }
      // Convert to meters
      return length / scaleRatio;
    }
  }, [getScaleRatio]);

  // Canvas coordinate conversion
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    
    if (activeTool === 'calibrate') {
      if (isCalibrating) {
        // Second point of calibration
        const newPoints = [...calibrationPoints, coords];
        if (newPoints.length === 2) {
          setCalibrationPoints(newPoints);
          setIsCalibrating(false);
        }
      } else {
        // First point
        setCalibrationPoints([coords]);
        setIsCalibrating(true);
      }
      return;
    }
    
    if (activeTool === 'select') {
      // Check if clicking on a measurement
      const clickedMeasurement = measurements.find(m => 
        m.pageNumber === currentPage && isPointNearMeasurement(coords, m)
      );
      setSelectedMeasurement(clickedMeasurement?.id || null);
      return;
    }
    
    if (activeTool === 'polygon' || activeTool === 'line') {
      if (!isDrawing) {
        // Start new measurement
        setIsDrawing(true);
        setCurrentMeasurement({
          id: Math.random().toString(36).substring(7),
          type: activeTool === 'polygon' ? 'area' : 'length',
          points: [coords],
          pageNumber: currentPage,
          elementType: 'floor',
          unit: activeTool === 'polygon' ? 'm2' : 'm',
          createdAt: new Date().toISOString(),
        });
      } else {
        // Add point
        const newPoints = [...(currentMeasurement?.points || []), coords];
        setCurrentMeasurement(prev => ({ ...prev, points: newPoints }));
      }
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentMeasurement) return;
    
    const coords = getCanvasCoordinates(e);
    const points = [...currentMeasurement.points!];
    points[points.length - 1] = coords;
    
    // Calculate live value
    const value = calculateValue(currentMeasurement.type!, points);
    
    setCurrentMeasurement(prev => ({
      ...prev,
      points,
      value,
      label: generateLabel(currentMeasurement.type!, currentMeasurement.elementType!),
    }));
  };

  // Handle mouse up (for drag operations)
  const handleMouseUp = () => {
    // Polygon and line tools handle completion via double-click or Enter
  };

  // Handle double click to complete measurement
  const handleDoubleClick = () => {
    if (isDrawing && currentMeasurement) {
      // Remove last point (which is the current mouse position)
      const points = currentMeasurement.points!.slice(0, -1);
      
      if (points.length >= (currentMeasurement.type === 'area' ? 3 : 2)) {
        const value = calculateValue(currentMeasurement.type!, points);
        const newMeasurement: Measurement = {
          ...(currentMeasurement as Measurement),
          points,
          value,
          color: ELEMENT_COLORS[currentMeasurement.elementType!],
        };
        
        setMeasurements(prev => [...prev, newMeasurement]);
      }
      
      setIsDrawing(false);
      setCurrentMeasurement(null);
      setActiveTool('select');
    }
  };

  // Check if point is near a measurement (for selection)
  const isPointNearMeasurement = (point: { x: number; y: number }, measurement: Measurement): boolean => {
    const threshold = 10;
    
    if (measurement.type === 'length') {
      // Check distance to line segments
      for (let i = 0; i < measurement.points.length - 1; i++) {
        const dist = pointToLineDistance(point, measurement.points[i], measurement.points[i + 1]);
        if (dist < threshold) return true;
      }
    } else {
      // Check if inside polygon (simplified - check distance to any point)
      for (const p of measurement.points) {
        const dist = Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2));
        if (dist < threshold) return true;
      }
    }
    
    return false;
  };

  // Point to line distance
  const pointToLineDistance = (
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Generate label for measurement
  const generateLabel = (type: 'area' | 'length', elementType: string): string => {
    const prefix = elementType.charAt(0).toUpperCase() + elementType.slice(1);
    const existing = measurements.filter(m => m.elementType === elementType).length;
    return `${prefix} ${existing + 1}`;
  };

  // Delete measurement
  const deleteMeasurement = (id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
    setSelectedMeasurement(null);
  };

  // Save calibration
  const saveCalibration = () => {
    if (calibrationPoints.length !== 2 || !calibrationValue) return;
    
    const pixelDist = Math.sqrt(
      Math.pow(calibrationPoints[1].x - calibrationPoints[0].x, 2) +
      Math.pow(calibrationPoints[1].y - calibrationPoints[0].y, 2)
    );
    
    setScaleCalibration({
      pixelDistance: pixelDist,
      realDistance: parseFloat(calibrationValue),
      unit: 'm',
    });
    
    setCalibrationPoints([]);
    setCalibrationValue('');
    setActiveTool('select');
  };

  // Save all measurements
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveMeasurements(measurements, scaleCalibration);
    } finally {
      setIsSaving(false);
    }
  };

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !currentPageData) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match image
    canvas.width = currentPageData.width;
    canvas.height = currentPageData.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid if enabled
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
    
    // Draw existing measurements
    measurements.forEach(measurement => {
      if (measurement.pageNumber !== currentPage) return;
      
      ctx.strokeStyle = measurement.color || ELEMENT_COLORS[measurement.elementType];
      ctx.fillStyle = (measurement.color || ELEMENT_COLORS[measurement.elementType]) + '40';
      ctx.lineWidth = 2;
      
      if (measurement.type === 'length') {
        // Draw line
        ctx.beginPath();
        measurement.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Draw endpoints
        measurement.points.forEach(point => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Draw polygon
        ctx.beginPath();
        measurement.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      
      // Draw label
      const center = getCentroid(measurement.points);
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${measurement.label}: ${measurement.value.toFixed(2)} ${measurement.unit}`,
        center.x,
        center.y
      );
    });
    
    // Draw current measurement
    if (isDrawing && currentMeasurement?.points) {
      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      if (currentMeasurement.type === 'length') {
        ctx.beginPath();
        currentMeasurement.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      } else {
        ctx.beginPath();
        currentMeasurement.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        if (currentMeasurement.points.length > 2) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
    
    // Draw calibration
    if (calibrationPoints.length > 0) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      calibrationPoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
      });
      
      if (calibrationPoints.length === 2) {
        ctx.beginPath();
        ctx.moveTo(calibrationPoints[0].x, calibrationPoints[0].y);
        ctx.lineTo(calibrationPoints[1].x, calibrationPoints[1].y);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
    }
    
    // Draw selection highlight
    if (selectedMeasurement) {
      const measurement = measurements.find(m => m.id === selectedMeasurement);
      if (measurement && measurement.pageNumber === currentPage) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        measurement.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        if (measurement.type === 'area') ctx.closePath();
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    }
  }, [
    currentPage,
    currentPageData,
    measurements,
    currentMeasurement,
    isDrawing,
    calibrationPoints,
    selectedMeasurement,
    showGrid,
  ]);

  // Get centroid of points
  const getCentroid = (points: { x: number; y: number }[]): { x: number; y: number } => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  if (!takeoff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-lg">{takeoff.fileName}</DialogTitle>
              <Badge variant="outline">
                Page {currentPage} of {takeoff.pageCount}
              </Badge>
              
              {scaleCalibration && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Ruler className="w-3 h-3 inline mr-1" />
                  Calibrated: {scaleCalibration.realDistance}m = {scaleCalibration.pixelDistance.toFixed(0)}px
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="w-16 border-r bg-gray-50 flex flex-col items-center py-4 gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === 'select' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setActiveTool('select')}
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Select</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === 'polygon' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setActiveTool('polygon');
                      setIsDrawing(false);
                      setCurrentMeasurement(null);
                    }}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Area (Polygon)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === 'line' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setActiveTool('line');
                      setIsDrawing(false);
                      setCurrentMeasurement(null);
                    }}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Length (Line)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTool === 'calibrate' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => {
                      setActiveTool('calibrate');
                      setCalibrationPoints([]);
                      setIsCalibrating(false);
                    }}
                  >
                    <Ruler className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Calibrate Scale</TooltipContent>
              </Tooltip>
              
              <div className="w-8 h-px bg-gray-300 my-2" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>
              
              <div className="w-8 h-px bg-gray-300 my-2" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Page</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(p => Math.min(takeoff.pageCount, p + 1))}
                    disabled={currentPage >= takeoff.pageCount}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Page</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex-1 bg-gray-100 overflow-auto relative"
          >
            <div
              className="relative inline-block"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            >
              <img
                ref={imageRef}
                src={currentPageData?.imageUrl}
                alt={`Page ${currentPage}`}
                className="block"
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                style={{
                  width: currentPageData?.width,
                  height: currentPageData?.height,
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-white flex flex-col">
            {/* Calibration Panel */}
            {activeTool === 'calibrate' && (
              <div className="p-4 border-b bg-amber-50">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Scale Calibration
                </h4>
                
                <p className="text-sm text-gray-600 mb-3">
                  {calibrationPoints.length === 0 && "Click two points on a known dimension"}
                  {calibrationPoints.length === 1 && "Click the second point"}
                  {calibrationPoints.length === 2 && "Enter the real-world distance"}
                </p>
                
                {calibrationPoints.length === 2 && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Distance"
                        value={calibrationValue}
                        onChange={(e) => setCalibrationValue(e.target.value)}
                        className="flex-1"
                      />
                      <Select value="m" disabled>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="m">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={saveCalibration}
                      disabled={!calibrationValue}
                      className="w-full"
                    >
                      Set Scale
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Measurement Properties */}
            {isDrawing && currentMeasurement && (
              <div className="p-4 border-b bg-blue-50">
                <h4 className="font-medium mb-2">New Measurement</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Element Type</Label>
                    <Select
                      value={currentMeasurement.elementType}
                      onValueChange={(value: any) => 
                        setCurrentMeasurement(prev => ({
                          ...prev,
                          elementType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="floor">Floor</SelectItem>
                        <SelectItem value="wall">Wall</SelectItem>
                        <SelectItem value="ceiling">Ceiling</SelectItem>
                        <SelectItem value="opening">Opening</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <p className="text-sm">
                    <span className="text-gray-600">Points: </span>
                    {currentMeasurement.points?.length}
                  </p>
                  
                  <p className="text-sm">
                    <span className="text-gray-600">Live Value: </span>
                    <span className="font-mono font-medium">
                      {currentMeasurement.value?.toFixed(2) || '0.00'} {currentMeasurement.unit}
                    </span>
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    Double-click to complete
                  </p>
                </div>
              </div>
            )}

            {/* Measurements List */}
            <div className="flex-1 overflow-auto p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                Measurements
              </h4>
              
              {measurements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No measurements yet.
                  <br />
                  Use the tools to add measurements.
                </p>
              ) : (
                <div className="space-y-2">
                  {measurements.map((measurement) => (
                    <div
                      key={measurement.id}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedMeasurement === measurement.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => {
                        setSelectedMeasurement(measurement.id);
                        setCurrentPage(measurement.pageNumber);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: measurement.color }}
                          />
                          <span className="font-medium text-sm">
                            {measurement.label}
                          </span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMeasurement(measurement.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="mt-1 text-xs text-gray-500">
                        <span className="capitalize">{measurement.elementType}</span>
                        {' • '}
                        Page {measurement.pageNumber}
                      </div>
                      
                      <div className="mt-1 font-mono text-sm">
                        {measurement.value.toFixed(2)} {measurement.unit}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {measurements.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <h4 className="font-medium mb-2 text-sm">Summary</h4>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Area:</span>
                    <span className="font-mono">
                      {measurements
                        .filter(m => m.type === 'area')
                        .reduce((sum, m) => sum + m.value, 0)
                        .toFixed(2)} m²
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Length:</span>
                    <span className="font-mono">
                      {measurements
                        .filter(m => m.type === 'length')
                        .reduce((sum, m) => sum + m.value, 0)
                        .toFixed(2)} m
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
