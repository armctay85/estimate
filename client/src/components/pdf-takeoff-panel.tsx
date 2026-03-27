import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Upload, 
  Ruler, 
  Trash2, 
  Eye,
  Calculator,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { PDFUploadModal } from "./pdf-upload-modal";
import { PDFTakeoffViewer, type Measurement } from "./pdf-takeoff-viewer";
import { usePDFTakeoff } from "@/hooks/use-pdf-takeoff";

interface PDFTakeoffPanelProps {
  projectId: number;
}

export function PDFTakeoffPanel({ projectId }: PDFTakeoffPanelProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewerTakeoff, setViewerTakeoff] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const {
    takeoffs,
    currentTakeoff,
    isLoading,
    fetchTakeoffs,
    fetchTakeoff,
    updateMeasurements,
    deleteTakeoff,
  } = usePDFTakeoff();

  useEffect(() => {
    fetchTakeoffs(projectId);
  }, [projectId, fetchTakeoffs]);

  const handleUploadComplete = async (result: any) => {
    setIsUploadModalOpen(false);
    
    if (result?.takeoff?.id) {
      // Fetch the full takeoff data and open viewer
      await fetchTakeoff(parseInt(result.takeoff.id));
      
      if (currentTakeoff) {
        setViewerTakeoff(currentTakeoff);
        setIsViewerOpen(true);
      }
    }
  };

  const handleViewTakeoff = async (takeoffId: number) => {
    await fetchTakeoff(takeoffId);
    
    if (currentTakeoff) {
      setViewerTakeoff(currentTakeoff);
      setIsViewerOpen(true);
    }
  };

  const handleSaveMeasurements = async (measurements: Measurement[], scaleCalibration?: any) => {
    if (viewerTakeoff?.id) {
      await updateMeasurements(viewerTakeoff.id, measurements, scaleCalibration);
    }
  };

  const handleDeleteTakeoff = async (takeoffId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this drawing?')) {
      await deleteTakeoff(takeoffId);
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalArea = (measurements: Measurement[]): number => {
    return measurements
      .filter(m => m.type === 'area')
      .reduce((sum, m) => sum + m.value, 0);
  };

  const getTotalLength = (measurements: Measurement[]): number => {
    return measurements
      .filter(m => m.type === 'length')
      .reduce((sum, m) => sum + m.value, 0);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Drawings & Takeoffs
            </CardTitle>
          </div>
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Drawing
          </Button>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : takeoffs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No drawings uploaded yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Upload PDF floor plans, sections, or elevations to take measurements
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {takeoffs.map((takeoff) => (
                  <div
                    key={takeoff.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    onClick={() => handleViewTakeoff(takeoff.id)}
                  >
                    <div className="w-16 h-16 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{takeoff.fileName}</p>
                      
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{takeoff.pageCount} page{takeoff.pageCount !== 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>{formatDate(takeoff.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {takeoff.measurements && takeoff.measurements.length > 0 ? (
                          <>
                            {getTotalArea(takeoff.measurements) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Calculator className="w-3 h-3 mr-1 inline" />
                                {getTotalArea(takeoff.measurements).toFixed(1)} m²
                              </Badge>
                            )}
                            {getTotalLength(takeoff.measurements) > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Ruler className="w-3 h-3 mr-1 inline" />
                                {getTotalLength(takeoff.measurements).toFixed(1)} m
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {takeoff.measurements.length} measurement{takeoff.measurements.length !== 1 ? 's' : ''}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs text-gray-400">
                            No measurements
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTakeoff(takeoff.id);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={(e) => handleDeleteTakeoff(takeoff.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <PDFUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
      />

      <PDFTakeoffViewer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewerTakeoff(null);
        }}
        takeoff={viewerTakeoff}
        onSaveMeasurements={handleSaveMeasurements}
      />
    </>
  );
}
