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
        // Get access token from backend with enhanced error handling
        console.log('Fetching Forge access token...');
        const tokenResponse = await fetch('/api/forge/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('Token response error:', tokenResponse.status, errorData);
          throw new Error(`Failed to get Forge access token: ${tokenResponse.status} ${errorData}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('Token received successfully');
        
        if (!tokenData.access_token) {
          throw new Error('Invalid token response - no access_token found');
        }
        
        const { access_token } = tokenData;

        // Load Forge Viewer script if not already loaded
        if (!window.Autodesk) {
          console.log('Loading Forge Viewer library...');
          
          // Load CSS first
          const style = document.createElement('link');
          style.rel = 'stylesheet';
          style.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
          document.head.appendChild(style);
          
          // Load JavaScript
          const script = document.createElement('script');
          script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
          script.async = false; // Ensure synchronous loading
          script.onload = () => {
            console.log('Forge Viewer library loaded successfully');
            // Small delay to ensure library is fully initialized
            setTimeout(() => initializeViewer(access_token), 100);
          };
          script.onerror = (error) => {
            console.error('Failed to load Forge Viewer library:', error);
            setError('Failed to load Forge Viewer library. Check internet connection.');
          };
          document.head.appendChild(script);
        } else {
          console.log('Forge Viewer library already loaded');
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
        api: 'derivativeV2',
        getAccessToken: (callback: (token: string, expires: number) => void) => {
          console.log('Providing access token to Forge viewer');
          callback(accessToken, 3600);
        },
        refreshToken: (callback: (token: string, expires: number) => void) => {
          console.log('Refreshing token for Forge viewer');
          callback(accessToken, 3600);
        }
      };

      window.Autodesk.Viewing.Initializer(options, async () => {
        try {
          console.log('Forge Viewer initialized successfully');
          
          if (!viewerContainer.current) {
            setError('Viewer container not found');
            setIsLoading(false);
            return;
          }

          // Ensure container has proper dimensions
          const container = viewerContainer.current;
          if (container.offsetWidth === 0 || container.offsetHeight === 0) {
            console.warn('Container has zero dimensions, setting minimum size');
            container.style.width = '100%';
            container.style.height = '500px';
            container.style.minHeight = '500px';
          }

          console.log('Creating GuiViewer3D instance...');
          
          // Create high-quality viewer with advanced settings
          const viewerInstance = new window.Autodesk.Viewing.GuiViewer3D(container);
          
          // Enable high-quality rendering settings
          const viewerConfig = {
            extensions: [
              'Autodesk.DefaultTools.NavTools',
              'Autodesk.ModelStructure',
              'Autodesk.Properties'
            ],
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
            powerPreference: "high-performance",
            // Force WebGL context
            forceWebGL: true,
            webGLHelpersExtension: true
          };

          console.log('Starting viewer with config:', viewerConfig);
          
          // Start viewer with config
          const startupResult = viewerInstance.start(viewerConfig);
          console.log('Viewer startup result:', startupResult);
          
          if (startupResult > 0) {
            throw new Error(`Viewer startup failed with code: ${startupResult}`);
          }

          console.log('Viewer started successfully');
          setViewer(viewerInstance);
          setViewerInitialized(true);

          // Validate URN exists
          if (!urn || urn === 'undefined') {
            setError('No model URN provided. Please upload a BIM file first.');
            setIsLoading(false);
            return;
          }
          
          console.log('Loading document with URN:', urn);
          
          window.Autodesk.Viewing.Document.load(
            urn,
            (doc) => {
              console.log('Document loaded successfully:', doc);
              
              // Enhanced geometry selection with multiple fallbacks
              let viewables = doc.getRoot().getDefaultGeometry();
              
              if (!viewables) {
                // Fallback 1: Get first 3D viewable
                viewables = doc.getRoot().search({ 'type': 'geometry', 'role': '3d' })[0];
              }
              
              if (!viewables) {
                // Fallback 2: Get any viewable geometry
                const geometries = doc.getRoot().search({ 'type': 'geometry' });
                if (geometries && geometries.length > 0) {
                  viewables = geometries[0];
                }
              }
              
              if (!viewables) {
                // Fallback 3: Get first bubble child
                const bubble = doc.getRoot();
                if (bubble && bubble.children && bubble.children.length > 0) {
                  viewables = bubble.children[0];
                }
              }

              if (!viewables) {
                throw new Error('No viewable geometry found in document. The file may not have been translated properly or may be corrupted.');
              }

              console.log('Selected viewable:', viewables);

              // Load with enhanced configuration
              const loadOptions = {
                keepCurrentModels: false,
                applyRefPoint: true,
                applyScaling: true,
                preserveView: false,
                useConsolidation: true,
                consolidationMemoryLimit: 800,
                // Force high-quality rendering
                antialiasing: true,
                antialiasingMode: 'FXAA'
              };

              viewerInstance.loadDocumentNode(doc, viewables, loadOptions).then((model) => {
                console.log('Model loaded successfully:', model);
                
                // Apply high-quality settings after model load
                applyHighQualitySettings(viewerInstance);
                
                // Auto-fit to view
                viewerInstance.fitToView();
                
                // Enable model tree panel for debugging
                viewerInstance.showModelStructurePanel(true);
                
                setIsLoading(false);
                
                toast({
                  title: "BIM Model Loaded",
                  description: `${fileName || 'BIM Model'} loaded successfully with ${model?.getData()?.instanceTree?.nodeCount || 'unknown'} elements`,
                });
              }).catch((loadError) => {
                console.error('Model load error:', loadError);
                setError(`Model loading failed: ${loadError.message || 'Unknown model load error'}. The file may be corrupted or incompatible.`);
                setIsLoading(false);
              });
            },
            (docError) => {
              console.error('Document load error:', docError);
              const errorMsg = docError?.message || docError?.errorMessage || 'Document load failed';
              setError(`Document loading failed: ${errorMsg}. Check if the file was translated successfully.`);
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
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`}></div>
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