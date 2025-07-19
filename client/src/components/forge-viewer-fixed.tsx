import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface ForgeViewerFixedProps {
  urn: string;
  accessToken?: string;
}

export function ForgeViewerFixed({ urn, accessToken }: ForgeViewerFixedProps) {
  const viewerContainer = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    if (!urn || !viewerContainer.current) return;

    const initializeViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get token if not provided
        let token = accessToken;
        if (!token) {
          console.log('Fetching Forge access token...');
          const tokenResponse = await fetch('/api/forge/token', { method: 'POST' });
          const tokenData = await tokenResponse.json();
          token = tokenData.access_token;
          console.log('Token received successfully');
        }

        // Load Forge Viewer script if not already loaded
        if (!window.Autodesk?.Viewing) {
          console.log('Loading Forge Viewer library...');
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
            script.onload = () => {
              console.log('Forge Viewer library loaded');
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Forge Viewer library'));
            document.head.appendChild(script);
          });

          // Load CSS
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
          document.head.appendChild(link);
        }

        // Initialize viewer with proper options
        const options = {
          env: 'AutodeskProduction',
          getAccessToken: (callback: (token: string, expires: number) => void) => {
            callback(token!, 3600);
          },
          api: 'derivativeV2',
          language: 'en'
        };

        // Initialize the viewer
        return new Promise<void>((resolve, reject) => {
          window.Autodesk.Viewing.Initializer(options, () => {
            console.log('Viewer initialized');
            
            // Create viewer instance
            const config = {
              extensions: ['Autodesk.DocumentBrowser']
            };
            
            viewer.current = new window.Autodesk.Viewing.GuiViewer3D(
              viewerContainer.current!,
              config
            );
            
            // Start the viewer
            const startResult = viewer.current.start();
            if (startResult > 0) {
              console.error('Failed to start viewer');
              reject(new Error('Failed to start viewer'));
              return;
            }
            
            console.log('Viewer started successfully');
            
            // Load the document
            window.Autodesk.Viewing.Document.load(
              urn,
              (doc: any) => {
                console.log('Document loaded successfully');
                
                // Get default viewable
                const viewables = doc.getRoot().getDefaultGeometry();
                if (!viewables) {
                  reject(new Error('No viewable geometry found'));
                  return;
                }
                
                // Load the viewable
                viewer.current.loadDocumentNode(doc, viewables, {
                  keepCurrentModels: false,
                  placementTransform: undefined,
                  globalOffset: { x: 0, y: 0, z: 0 },
                  sharedPropertyDbPath: doc.getPropertyDbPath()
                }).then(() => {
                  console.log('Model loaded successfully');
                  setIsLoading(false);
                  resolve();
                }).catch((error: any) => {
                  console.error('Failed to load model:', error);
                  reject(error);
                });
              },
              (errorCode: number, errorMsg: string) => {
                console.error('Document load error:', errorCode, errorMsg);
                reject(new Error(`Failed to load document: ${errorMsg} (${errorCode})`));
              }
            );
          });
        });
      } catch (error: any) {
        console.error('Viewer initialization error:', error);
        setError(error.message || 'Failed to initialize viewer');
        setIsLoading(false);
      }
    };

    initializeViewer();

    // Cleanup
    return () => {
      if (viewer.current) {
        viewer.current.finish();
        viewer.current = null;
      }
    };
  }, [urn, accessToken]);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div 
        ref={viewerContainer} 
        className="w-full h-full"
        style={{ position: 'relative', minHeight: '600px' }}
      />
    </div>
  );
}