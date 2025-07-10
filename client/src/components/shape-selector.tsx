import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type ShapeType } from "@/lib/fabric-enhanced";
import { 
  Square, 
  Circle, 
  Pentagon, 
  Minus, 
  Pen, 
  Upload, 
  X, 
  ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useRef, useState } from "react";

interface ShapeSelectorProps {
  selectedShape: ShapeType;
  onShapeSelect: (shape: ShapeType) => void;
  onBackgroundUpload: (file: File) => Promise<void>;
  onBackgroundRemove: () => void;
  onBackgroundOpacity: (opacity: number) => void;
  hasBackground: boolean;
  backgroundOpacity: number;
}

export function ShapeSelector({ 
  selectedShape, 
  onShapeSelect, 
  onBackgroundUpload,
  onBackgroundRemove,
  onBackgroundOpacity,
  hasBackground,
  backgroundOpacity
}: ShapeSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const shapes = [
    { type: "rectangle" as const, icon: Square, label: "Rectangle" },
    { type: "circle" as const, icon: Circle, label: "Circle" },
    { type: "polygon" as const, icon: Pentagon, label: "Polygon" },
    { type: "line" as const, icon: Minus, label: "Line" },
    { type: "freehand" as const, icon: Pen, label: "Freehand" },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('ShapeSelector: File selected:', file.name, file.type);
      setUploadStatus('uploading');
      setUploadMessage('Processing file...');
      setUploadedFileName(file.name);
      
      try {
        await onBackgroundUpload(file);
        setUploadStatus('success');
        setUploadMessage(`${file.type === 'application/pdf' ? 'PDF uploaded successfully! Placeholder shown.' : 'Image uploaded successfully!'}`);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 3000);
      } catch (error) {
        setUploadStatus('error');
        setUploadMessage(`Failed to upload ${file.name}. Please try again.`);
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadMessage('');
        }, 5000);
      }
    } else {
      console.log('ShapeSelector: No file selected');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Drawing Tools
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Shape Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Room Shapes
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map((shape) => {
              const IconComponent = shape.icon;
              const isSelected = selectedShape === shape.type;
              
              return (
                <Button
                  key={shape.type}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onShapeSelect(shape.type)}
                  className={`h-12 flex flex-col items-center gap-1 ${
                    isSelected 
                      ? "bg-blue-600 text-white" 
                      : "hover:bg-gray-50"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-xs">{shape.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Background Image */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Background Image
          </Label>
          
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".jpg,.jpeg,.png,.svg,.pdf,.dwg,.dxf"
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus === 'uploading'}
              className="w-full h-12 flex items-center gap-2"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload PDF/Image/CAD
                </>
              )}
            </Button>
            
            {/* Upload Status Messages */}
            {uploadStatus !== 'idle' && uploadMessage && (
              <Alert className={`${
                uploadStatus === 'success' ? 'border-green-200 bg-green-50' :
                uploadStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadStatus === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                  {uploadStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {uploadStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  <AlertDescription className={`${
                    uploadStatus === 'success' ? 'text-green-800' :
                    uploadStatus === 'error' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {uploadedFileName && (
                      <div className="font-medium text-xs mb-1">{uploadedFileName}</div>
                    )}
                    {uploadMessage}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            
            {hasBackground && (
              <>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Background loaded</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBackgroundRemove}
                    className="h-6 w-6 p-0 text-green-600 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">
                    Background Opacity: {Math.round(backgroundOpacity * 100)}%
                  </Label>
                  <Slider
                    value={[backgroundOpacity]}
                    onValueChange={(value) => onBackgroundOpacity(value[0])}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Drawing Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Rectangle/Circle/Polygon:</strong> Click "Add Room" to create</p>
          <p><strong>Line:</strong> Click "Add Room" to create straight lines</p>
          <p><strong>Freehand:</strong> Click and drag to draw custom shapes</p>
          <p><strong>Background:</strong> Upload PDF or image to trace over</p>
        </div>
      </CardContent>
    </Card>
  );
}