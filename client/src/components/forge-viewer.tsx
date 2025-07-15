import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // High-quality rendering settings
  const applyHighQualitySettings = (viewerInstance: any) => {
    try {
      // Enable Screen Space Ambient Occlusion (SSAO) for better depth perception
      viewerInstance.setQualityLevel(true, true);
      
      // Enable progressive rendering for better quality during navigation
      viewerInstance.setProgressiveRendering(true);
      
      // Optimize navigation for smooth interaction
      viewerInstance.setOptimizeNavigation(true);
      
      // Set high-quality rendering preferences
      viewerInstance.prefs.set('ambientShadows', true);
      viewerInstance.prefs.set('antialiasing', true);
      viewerInstance.prefs.set('groundShadow', true);
      viewerInstance.prefs.set('groundReflection', true);
      
      // Enable advanced lighting
      viewerInstance.setLightPreset(8); // High-quality lighting preset
      
      // Set render quality
      viewerInstance.impl.setOptimizeNavigation(false); // Disable navigation optimization for quality
      
      console.log('High-quality viewer settings applied successfully');
    } catch (error) {
      console.warn('Some high-quality settings could not be applied:', error);
    }
  };

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
          if (!viewerContainer.current) {
            setError('Viewer container not found');
            setIsLoading(false);
            return;
          }

          // Create high-quality viewer with advanced settings
          const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(viewerContainer.current);
          
          // Enable high-quality rendering settings
          const viewerConfig = {
            extensions: ['Autodesk.DefaultTools.NavTools'],
            useConsolidation: true,
            consolidationMemoryLimit: 800,
            sharedPropertyDbPath: window.location.origin,
            // Enable high-quality features
            enablePixelRatioAdjustment: true,
            useDevicePixelRatio: true,
            antialias: true,
            alpha: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
            powerPreference: "high-performance"
          };

          // Start viewer with config
          const startupResult = viewerInstance.start(viewerConfig);
          if (startupResult > 0) {
            throw new Error(`Viewer startup failed with code: ${startupResult}`);
          }

          setViewer(viewerInstance);
          setViewerInitialized(true);

          // Load the document
          window.Autodesk.Viewing.Document.load(
            'urn:' + urn,
            (doc) => {
              const viewables = doc.getRoot().getDefaultGeometry();
              if (!viewables) {
                throw new Error('No viewable geometry found in document');
              }

              viewerInstance.loadDocumentNode(doc, viewables).then(() => {
                // Apply high-quality settings after model load
                applyHighQualitySettings(viewerInstance);
                setIsLoading(false);
                
                toast({
                  title: "Model Loaded Successfully",
                  description: `${fileName || 'BIM Model'} loaded with high-quality rendering`,
                });
              }).catch((loadError) => {
                console.error('Model load error:', loadError);
                setError(`Failed to load model: ${loadError.message}`);
                setIsLoading(false);
              });
            },
            (docError) => {
              console.error('Document load error:', docError);
              setError(`Failed to load document: ${docError.message || 'Document load failed'}`);
              setIsLoading(false);
            }
          );
        } catch (initError) {
          console.error('Viewer initialization error:', initError);
          setError(`Viewer initialization failed: ${initError.message}`);
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
              <Button 
                variant="default" 
                size="sm" 
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
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