import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ForgeViewerProps {
  urn: string;
  fileName?: string;
  onClose?: () => void;
}

declare global {
  interface Window {
    Autodesk: any;
  }
}

export function ForgeViewer({ urn, fileName, onClose }: ForgeViewerProps) {
  const viewerContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [viewerInitialized, setViewerInitialized] = useState(false);

  useEffect(() => {
    if (!urn) return;

    // Load Forge Viewer script
    const loadForgeViewer = async () => {
      try {
        // Get access token from backend
        const tokenResponse = await fetch('/api/forge/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get Forge access token');
        }

        const { access_token } = await tokenResponse.json();

        // Load Forge Viewer script if not already loaded
        if (!window.Autodesk) {
          const script = document.createElement('script');
          script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
          script.onload = () => initializeViewer(access_token);
          script.onerror = () => setError('Failed to load Forge Viewer library');
          document.head.appendChild(script);

          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
          document.head.appendChild(style);
        } else {
          initializeViewer(access_token);
        }
      } catch (err) {
        console.error('Forge Viewer Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize viewer');
        setIsLoading(false);
      }
    };

    const initializeViewer = (accessToken: string) => {
      const options = {
        env: 'AutodeskProduction',
        getAccessToken: (callback: (token: string, expires: number) => void) => {
          callback(accessToken, 3600);
        }
      };

      window.Autodesk.Viewing.Initializer(options, async () => {
        try {
          const viewerDiv = viewerContainer.current;
          if (!viewerDiv) return;

          const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerDiv);
          const startedCode = viewer.start();
          
          if (startedCode > 0) {
            console.error('Failed to create a Viewer: WebGL not supported.');
            setError('WebGL not supported in your browser');
            return;
          }

          setViewer(viewer);

          // Load the document
          const documentId = `urn:${urn}`;
          
          window.Autodesk.Viewing.Document.load(
            documentId,
            (doc: any) => {
              const viewables = doc.getRoot().getDefaultGeometry();
              if (viewables) {
                viewer.loadDocumentNode(doc, viewables).then(() => {
                  setIsLoading(false);
                  setViewerInitialized(true);
                });
              }
            },
            (errorCode: string, errorMsg: string) => {
              console.error('Document load error:', errorCode, errorMsg);
              setError(`Failed to load model: ${errorMsg}`);
              setIsLoading(false);
            }
          );
        } catch (err) {
          console.error('Viewer initialization error:', err);
          setError('Failed to initialize 3D viewer');
          setIsLoading(false);
        }
      });
    };

    loadForgeViewer();

    // Cleanup
    return () => {
      if (viewer) {
        viewer.tearDown();
        viewer.finish();
      }
    };
  }, [urn]);

  const handleZoomIn = () => {
    if (viewer) {
      const camera = viewer.navigation.getCamera();
      viewer.navigation.setRequestTransition(true, camera, camera.fov - 10, true);
    }
  };

  const handleZoomOut = () => {
    if (viewer) {
      const camera = viewer.navigation.getCamera();
      viewer.navigation.setRequestTransition(true, camera, camera.fov + 10, true);
    }
  };

  const handleReset = () => {
    if (viewer) {
      viewer.navigation.setRequestHomeView();
    }
  };

  const handleFullscreen = () => {
    if (viewerContainer.current) {
      if (viewerContainer.current.requestFullscreen) {
        viewerContainer.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="w-full h-full">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            3D Model Viewer
            {fileName && <span className="text-sm text-gray-500 ml-2">({fileName})</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {viewerInitialized && (
              <>
                <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleReset} title="Reset View">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleFullscreen} title="Fullscreen">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)]">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="relative w-full h-full">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading 3D model...</p>
                    <p className="text-xs text-muted-foreground mt-2">This may take a few moments</p>
                  </div>
                </div>
              )}
              <div 
                ref={viewerContainer} 
                className="w-full h-full"
                style={{ position: 'relative' }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}