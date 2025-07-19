// client/src/components/forge-viewer.tsx
// Best-in-class Forge Viewer: Proxy-integrated, with retries, detailed logging, error UI, and events for diagnostics.
// Quality: Starlink-level - Typed, state-managed, resilient (auto-retry on transients), optimized for Replit CORS.

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, RotateCcw, Maximize2, RefreshCw } from 'lucide-react';
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
  const [status, setStatus] = useState<string>('Initializing');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const viewer = useRef<any>(null);
  const maxRetries = 3;
  const { toast } = useToast();

  // Auto-retry mechanism
  const handleViewerError = (errorMessage: string, retry = true) => {
    console.error('Forge Viewer Error:', errorMessage);
    setError(errorMessage);
    
    if (retry && retryCount < maxRetries) {
      const nextRetry = retryCount + 1;
      setRetryCount(nextRetry);
      setStatus(`Retrying... (${nextRetry}/${maxRetries})`);
      setTimeout(() => initializeViewer(), 2000 * nextRetry);
    } else {
      setStatus('Failed');
      setIsLoading(false);
      toast({
        title: "Viewer Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const initializeViewer = async () => {
    if (!viewerContainer.current) return;

    try {
      setStatus('Loading Forge SDK...');
      setIsLoading(true);
      setError(null);

      // Load Forge SDK if not already loaded
      if (!window.Autodesk) {
        await loadForgeSDK();
      }

      setStatus('Getting viewer token...');
      const token = await getViewerToken();
      
      setStatus('Initializing viewer...');
      const options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',
        accessToken: token
      };

      // Configure proxy endpoints
      window.Autodesk.Viewing.endpoint.setEndpointAndApi('/proxy/forge', 'derivativeV2');

      const Viewer3D = window.Autodesk.Viewing.GuiViewer3D;
      viewer.current = new Viewer3D(viewerContainer.current, {});

      viewer.current.addEventListener(window.Autodesk.Viewing.VIEWER_INITIALIZED, () => {
        setStatus('Loading model...');
        loadDocument(urn);
      });

      viewer.current.addEventListener(window.Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
        setStatus('Ready');
        setIsLoading(false);
        toast({
          title: "Model Loaded",
          description: "3D model loaded successfully",
        });
      });

      viewer.current.addEventListener(window.Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, () => {
        console.log('Model root loaded');
      });

      viewer.current.start();

    } catch (err: any) {
      handleViewerError(err.message);
    }
  };

  const loadForgeSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Autodesk) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Forge SDK'));
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);
    });
  };

  const getViewerToken = async (): Promise<string> => {
    const response = await fetch('/api/forge/viewer-token');
    if (!response.ok) {
      throw new Error('Failed to get viewer token');
    }
    const data = await response.json();
    return data.access_token;
  };

  const loadDocument = (urn: string) => {
    const documentId = urn.startsWith('urn:') ? urn : `urn:adsk.objects:os.object:${urn}`;
    
    window.Autodesk.Viewing.Document.load(documentId, (doc: any) => {
      const viewables = doc.getRoot().getDefaultGeometry();
      if (viewables) {
        viewer.current.loadDocumentNode(doc, viewables);
      } else {
        handleViewerError('No viewable items found in the model');
      }
    }, (error: any) => {
      handleViewerError(`Document load failed: ${error}`);
    });
  };

  useEffect(() => {
    initializeViewer();
    
    return () => {
      if (viewer.current) {
        viewer.current.finish();
        viewer.current = null;
      }
    };
  }, [urn]);

  const handleZoomIn = () => viewer.current?.navigation.setZoomTowards(1.2);
  const handleZoomOut = () => viewer.current?.navigation.setZoomTowards(0.8);
  const handleReset = () => viewer.current?.navigation.setRequestHomeView(true);
  const handleFullscreen = () => viewer.current?.setFullscreen(true);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Forge 3D Viewer</CardTitle>
          {fileName && <p className="text-sm text-gray-600">{fileName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isLoading ? "secondary" : error ? "destructive" : "default"}>
            {status}
          </Badge>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {error && (
          <Alert className="m-4 mb-0" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {retryCount < maxRetries && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    setRetryCount(0);
                    initializeViewer();
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="relative h-96">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">{status}</p>
              </div>
            </div>
          )}
          
          <div 
            ref={viewerContainer} 
            className="w-full h-full border rounded-b-lg"
            style={{ minHeight: '400px' }}
          />

          {!isLoading && !error && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleFullscreen}>
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}