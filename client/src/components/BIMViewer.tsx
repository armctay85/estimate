import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Maximize2, Minimize2, RotateCw, Layers } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BIMViewerProps {
  urn: string;
  status: string;
  darkMode?: boolean;
}

interface BIMElement {
  element: string;
  quantity: string;
  unitCost: number;
  total: number;
}

export function BIMViewer({ urn, status, darkMode }: BIMViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [elements, setElements] = useState<BIMElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMeasure, setShowMeasure] = useState(false);
  const [showSection, setShowSection] = useState(false);

  // Initialize Forge Viewer
  useEffect(() => {
    if (status === 'Complete' && urn && !viewer) {
      initViewer();
    }
  }, [status, urn]);

  // Fetch cost breakdown elements
  useEffect(() => {
    if (status === 'Complete' && urn) {
      fetchElements();
    }
  }, [status, urn]);

  const fetchElements = async () => {
    try {
      const response = await apiRequest("GET", `/api/forge/extract-elements?urn=${urn}`);
      const data = await response.json();
      setElements(data);
    } catch (error) {
      console.error('Failed to fetch elements:', error);
    }
  };

  const initViewer = () => {
    const options = {
      env: 'AutodeskProduction',
      getAccessToken: async (onTokenReady: (token: string, expires: number) => void) => {
        try {
          const response = await apiRequest("GET", "/api/forge/viewer-token");
          const data = await response.json();
          onTokenReady(data.access_token, data.expires_in);
        } catch (error) {
          console.error('Failed to get viewer token:', error);
        }
      }
    };

    // @ts-ignore - Autodesk global
    Autodesk.Viewing.Initializer(options, () => {
      // @ts-ignore
      const v = new Autodesk.Viewing.GuiViewer3D(viewerRef.current, {
        extensions: ['Autodesk.Measure', 'Autodesk.Section']
      });
      v.start();
      
      // Load extensions
      v.loadExtension('Autodesk.Measure').then(() => console.log('Measure extension loaded'));
      v.loadExtension('Autodesk.Section').then(() => console.log('Section extension loaded'));
      
      // Load model
      v.loadModel(`urn:${urn}`, {
        onLoadModelSuccess: () => {
          console.log('Model loaded successfully');
          setIsLoading(false);
        },
        onLoadModelError: (error: any) => {
          console.error('Model loading failed:', error);
          setIsLoading(false);
        }
      });
      
      setViewer(v);
    });
  };

  const toggleFullscreen = () => {
    if (!viewerRef.current) return;
    
    if (!isFullscreen) {
      viewerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleMeasure = () => {
    if (!viewer) return;
    const measureExt = viewer.getExtension('Autodesk.Measure');
    if (measureExt) {
      if (showMeasure) {
        measureExt.deactivate();
      } else {
        measureExt.activate();
      }
      setShowMeasure(!showMeasure);
    }
  };

  const toggleSection = () => {
    if (!viewer) return;
    const sectionExt = viewer.getExtension('Autodesk.Section');
    if (sectionExt) {
      if (showSection) {
        sectionExt.deactivate();
      } else {
        sectionExt.activate();
      }
      setShowSection(!showSection);
    }
  };

  const resetView = () => {
    if (!viewer) return;
    viewer.fitToView();
  };

  // Calculate total cost
  const totalCost = elements.reduce((sum, el) => sum + el.total, 0);

  return (
    <div className={`w-full space-y-4 ${darkMode ? 'dark' : ''}`}>
      {/* 3D Viewer */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>BIM 3D Model</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={showMeasure ? "default" : "outline"}
                onClick={toggleMeasure}
                disabled={!viewer || isLoading}
              >
                Measure
              </Button>
              <Button 
                size="sm" 
                variant={showSection ? "default" : "outline"}
                onClick={toggleSection}
                disabled={!viewer || isLoading}
              >
                Section
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={resetView}
                disabled={!viewer || isLoading}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={viewerRef} 
            className={`w-full h-[600px] border rounded-b-lg relative ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cost Breakdown</CardTitle>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Total: ${totalCost.toLocaleString()} AUD
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="p-3 text-left font-semibold">Element</th>
                  <th className="p-3 text-left font-semibold">Quantity</th>
                  <th className="p-3 text-right font-semibold">Unit Cost (AUD)</th>
                  <th className="p-3 text-right font-semibold">Total (AUD)</th>
                </tr>
              </thead>
              <tbody>
                {elements.map((el, i) => (
                  <tr 
                    key={i} 
                    className={`border-b transition-colors ${
                      darkMode 
                        ? 'border-gray-700 hover:bg-gray-800' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <td className="p-3 font-medium">{el.element}</td>
                    <td className="p-3">{el.quantity}</td>
                    <td className="p-3 text-right">${el.unitCost.toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold">${el.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <td colSpan={3} className="p-3 text-right font-bold">Total Project Cost:</td>
                  <td className="p-3 text-right font-bold text-lg">
                    ${totalCost.toLocaleString()} AUD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}