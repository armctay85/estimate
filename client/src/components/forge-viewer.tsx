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

  useEffect(() => {
    if (!urn) {
      setError('No URN provided');
      setIsLoading(false);
      return;
    }

    // Validate URN (base64 without prefix)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(urn)) {
      setError('Invalid URN format - Must be base64 without prefix');
      setIsLoading(false);
      return;
    }

    console.log('Starting Forge Viewer with URN:', urn);
    setStatus('Initializing viewer...');

    const getAccessToken = async (callback: (token: string, expires: number) => void) => {
      try {
        const response = await fetch('/api/forge/viewer-token');
        const data = await response.json();
        callback(data.access_token, data.expires_in || 3600);
      } catch (err) {
        setError('Token fetch failed: ' + (err as Error).message);
      }
    };

    const loadModel = () => {
      setStatus('Loading model...');
      window.Autodesk.Viewing.Document.load(
        urn,
        (doc: any) => {
          setStatus('Document loaded');
          console.log('Document loaded');
          const viewable = doc.getRoot().getDefaultGeometry();
          if (!viewable) {
            setError('No viewable geometry found in document');
            return;
          }
          viewer.current!.loadDocumentNode(doc, viewable).then(() => {
            setStatus('Model loaded successfully');
            console.log('Model loaded');
            setIsLoading(false);
          }).catch((err: any) => {
            setError(`Node load failed: ${err.message}`);
            console.error('Load node error:', err);
            if (retryCount < maxRetries) {
              setRetryCount(retryCount + 1);
              setStatus(`Retrying... (${retryCount + 1}/${maxRetries})`);
              setTimeout(loadModel, 5000); // Retry after 5s
            }
          });
        },
        (code: string, message: string) => {
          setError(`Document load failed: Code ${code} - ${message}`);
          console.error(`Document load error: Code ${code} - ${message}`);
          if (retryCount < maxRetries) {
            setRetryCount(retryCount + 1);
            setStatus(`Retrying... (${retryCount + 1}/${maxRetries})`);
            setTimeout(loadModel, 5000);
          }
        }
      );
    };

    const initializeViewer = () => {
      // Set proxy for all endpoints
      window.Autodesk.Viewing.endpoint.setEndpointAndApi('/proxy/forge', 'derivativeV2');
      console.log('Endpoint set to proxy for CORS bypass');

      // Enable verbose logging
      if (window.Autodesk?.Viewing?.Private?.Logger) {
        window.Autodesk.Viewing.Private.Logger.setLevel(0);
      }

      const options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',
        getAccessToken: getAccessToken,
        language: 'en',
        useADP: false,
        useConsolidation: true,
        consolidationMemoryLimit: 800 * 1024 * 1024,
        enablePixelRatioAdjustment: true,
        useDevicePixelRatio: true,
        antialias: true,
        alpha: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance',
        forceWebGL: true,
        webGLHelpersExtension: true
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        setStatus('Viewer SDK initialized');
        
        if (!viewerContainer.current) {
          setError('Viewer container not found');
          return;
        }

        viewer.current = new window.Autodesk.Viewing.GuiViewer3D(viewerContainer.current);
        
        // Diagnostic events
        viewer.current.addEventListener(window.Autodesk.Viewing.GEOMETRY_LOADED_EVENT, () => {
          setStatus('Geometry loaded');
          console.log('Geometry loaded');
        });
        viewer.current.addEventListener(window.Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
          setStatus('Model tree created');
          console.log('Object tree created');
        });
        viewer.current.addEventListener(window.Autodesk.Viewing.ERROR_EVENT, (evt: any) => {
          setError(`Viewer error: ${evt.message}`);
          console.error('Viewer error event:', evt);
        });

        const startResult = viewer.current.start();
        if (startResult > 0) {
          setError(`Viewer start failed with code: ${startResult}`);
          return;
        }

        loadModel();
      });
    };

    // Load Forge Viewer script
    if (!window.Autodesk) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      script.onload = () => initializeViewer();
      script.onerror = () => setError('Failed to load Forge Viewer library');
      document.head.appendChild(script);
    } else {
      initializeViewer();
    }

    return () => {
      if (viewer.current) {
        viewer.current.finish();
        viewer.current = null;
      }
    };
  }, [urn, retryCount]);

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setStatus('Retrying...');
    window.location.reload();
  };

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Forge 3D Viewer</CardTitle>
          {fileName && <p className="text-sm text-muted-foreground">{fileName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={error ? 'destructive' : isLoading ? 'secondary' : 'default'}>
            {status}
          </Badge>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full" style={{ height: '600px' }}>
          <div ref={viewerContainer} className="w-full h-full bg-gray-900" />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="absolute top-4 left-4 right-4 max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {!error && !isLoading && viewer.current && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => viewer.current?.navigation.setZoomIn()}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => viewer.current?.navigation.setZoomOut()}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => viewer.current?.navigation.setRequestHomeView()}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => viewer.current?.setViewerMode('fullscreen')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="absolute bottom-4 right-4 text-xs text-white bg-black/50 px-2 py-1 rounded">
            {retryCount > 0 && `Retry ${retryCount}/${maxRetries}`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ForgeViewer;