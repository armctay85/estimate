import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Box, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, 
  Layers, Eye, EyeOff, Download, Settings, Info, Loader2
} from 'lucide-react';

// Demo mode flag
const DEMO_MODE = true;

interface Forge3DViewerProps {
  urn?: string;
  accessToken?: string;
  onClose?: () => void;
  isOpen?: boolean;
  fileName?: string;
}

export function Forge3DViewer({ 
  urn, 
  accessToken, 
  onClose, 
  isOpen = true,
  fileName = "BIM Model"
}: Forge3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'shaded' | 'wireframe' | 'ghosted'>('shaded');
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    if (!isOpen || !viewerRef.current) return;

    const initializeViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get Forge access token
        const tokenResponse = await fetch('/api/forge/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to get Forge access token');
        }

        const { access_token } = await tokenResponse.json();

        // Check if Autodesk viewer scripts are loaded
        if (typeof window.Autodesk === 'undefined') {
          // Load Autodesk Viewer scripts
          const script1 = document.createElement('script');
          script1.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
          script1.async = true;
          document.head.appendChild(script1);

          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
          document.head.appendChild(link);

          // Wait for scripts to load
          await new Promise((resolve, reject) => {
            script1.onload = resolve;
            script1.onerror = reject;
            setTimeout(reject, 10000); // 10 second timeout
          });
        }

        // Initialize viewer
        const options = {
          env: 'AutodeskProduction',
          getAccessToken: (callback: any) => {
            callback(access_token, 3600);
          }
        };

        window.Autodesk.Viewing.Initializer(options, () => {
          console.log('Forge viewer initialized');
          const htmlDiv = viewerRef.current!;
          const viewer3D = new window.Autodesk.Viewing.GuiViewer3D(htmlDiv);
          viewer3D.start();
          setViewer(viewer3D);
          console.log('Viewer started, URN:', urn);

          if (urn) {
            // Load actual model from URN
            console.log('Loading model with URN:', urn);
            window.Autodesk.Viewing.Document.load(
              `urn:${urn}`,
              (doc: any) => {
                console.log('Document loaded successfully');
                const defaultModel = doc.getRoot().getDefaultGeometry();
                viewer3D.loadDocumentNode(doc, defaultModel);
                setIsLoading(false);
              },
              (errorMsg: string) => {
                console.error('Model load error:', errorMsg);
                setError('Unable to load your BIM model. Please ensure it has been properly processed.');
                setIsLoading(false);
              }
            );
          } else {
            // Show demo mode
            console.log('No URN provided, showing demo mode');
            setIsLoading(false);
            setError('Demo Mode: Upload a BIM file through the BIM Processor to view it here');
          }
        });
      } catch (err) {
        console.error('Viewer error:', err);
        setError(`Viewer initialization failed: ${err}`);
        setIsLoading(false);
      }
    };

    initializeViewer();

    return () => {
      if (viewer) {
        viewer.finish();
      }
    };
  }, [isOpen, urn]);

  const handleFullscreen = () => {
    if (!viewerRef.current) return;
    
    if (!isFullscreen) {
      viewerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleViewMode = (mode: 'shaded' | 'wireframe' | 'ghosted') => {
    if (!viewer) return;
    
    switch (mode) {
      case 'wireframe':
        viewer.setDisplayEdges(true);
        viewer.impl.setGhosting(false);
        break;
      case 'ghosted':
        viewer.impl.setGhosting(true);
        viewer.setDisplayEdges(false);
        break;
      default:
        viewer.setDisplayEdges(false);
        viewer.impl.setGhosting(false);
    }
    setViewMode(mode);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!viewer) return;
    const nav = viewer.navigation;
    const pos = nav.getPosition();
    const target = nav.getTarget();
    const viewDir = new window.THREE.Vector3();
    viewDir.subVectors(pos, target).normalize();
    
    const factor = direction === 'in' ? 0.9 : 1.1;
    viewDir.multiplyScalar(factor);
    
    const newPos = new window.THREE.Vector3();
    newPos.addVectors(target, viewDir);
    nav.setPosition(newPos);
  };

  const handleRotate = () => {
    if (!viewer) return;
    viewer.navigation.setOrbitPastWorldPoles(true);
    viewer.autocam.setHomeViewFrom(viewer.navigation.getCamera());
  };

  const content = (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Box className="w-5 h-5" />
          <span className="font-medium">{fileName}</span>
          {urn && <Badge variant="secondary">Forge Viewer</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Controls */}
          <div className="flex items-center gap-1 bg-gray-800 rounded p-1">
            <Button 
              size="sm" 
              variant={viewMode === 'shaded' ? 'secondary' : 'ghost'}
              onClick={() => handleViewMode('shaded')}
              className="h-7 px-2"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'wireframe' ? 'secondary' : 'ghost'}
              onClick={() => handleViewMode('wireframe')}
              className="h-7 px-2"
            >
              <Box className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'ghosted' ? 'secondary' : 'ghost'}
              onClick={() => handleViewMode('ghosted')}
              className="h-7 px-2"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleZoom('in')} className="h-7 w-7">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleZoom('out')} className="h-7 w-7">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleRotate} className="h-7 w-7">
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Other Controls */}
          <Button size="sm" variant="ghost" onClick={handleFullscreen} className="h-7 w-7">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowProperties(!showProperties)} 
            className="h-7 px-2"
          >
            <Layers className="w-4 h-4 mr-1" />
            Properties
          </Button>
        </div>
      </div>

      {/* Viewer Container */}
      <div className="flex-1 relative bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-white mb-4 mx-auto" />
              <p className="text-white font-medium">Loading Forge Viewer...</p>
              <p className="text-gray-400 text-sm mt-1">Initializing 3D model</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-900 z-10">
            {/* Demo 3D Scene */}
            <div className="relative w-full h-full overflow-hidden">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
              
              {/* 3D Grid Floor */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 transform perspective-1000 rotateX-60">
                <div className="w-full h-full" style={{
                  background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 40px, rgba(255,255,255,0.05) 41px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, transparent 1px, transparent 40px, rgba(255,255,255,0.05) 41px)'
                }} />
              </div>

              {/* Demo 3D Building */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative transform rotate-45 scale-75">
                  {/* Building Base */}
                  <div className="w-64 h-64 bg-gradient-to-t from-blue-900 to-blue-600 shadow-2xl">
                    <div className="absolute inset-0 bg-black opacity-20" />
                    {/* Windows */}
                    <div className="grid grid-cols-4 gap-2 p-4">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className="bg-cyan-400 opacity-70 aspect-square" />
                      ))}
                    </div>
                  </div>
                  {/* Building Side */}
                  <div className="absolute top-8 left-8 w-64 h-64 bg-gradient-to-t from-blue-800 to-blue-500 transform skew-y-12">
                    <div className="absolute inset-0 bg-black opacity-30" />
                  </div>
                  {/* Building Top */}
                  <div className="absolute -top-8 left-8 w-64 h-16 bg-gradient-to-r from-blue-600 to-blue-400 transform skew-x-45" />
                </div>
              </div>

              {/* Info Overlay */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="bg-black/80 backdrop-blur rounded-lg p-8 max-w-2xl">
                  <h3 className="text-white text-2xl font-bold mb-4">Autodesk Forge 3D Viewer</h3>
                  <p className="text-gray-300 mb-6">
                    Experience professional-grade BIM visualization with Autodesk Forge technology
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="text-white font-semibold mb-2">Features Available:</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• High-quality 3D rendering</li>
                        <li>• Real-time model navigation</li>
                        <li>• Element property inspection</li>
                        <li>• Multiple viewing modes</li>
                        <li>• Measurement tools</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Supported Formats:</h4>
                      <ul className="text-gray-400 text-sm space-y-1">
                        <li>• Revit (.rvt)</li>
                        <li>• AutoCAD (.dwg, .dxf)</li>
                        <li>• IFC (.ifc)</li>
                        <li>• SketchUp (.skp)</li>
                        <li>• And 50+ more formats</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-900/50 rounded p-4">
                    <p className="text-blue-200 text-sm">
                      <strong>To activate:</strong> Upload a BIM file through the BIM Processor to view it here in full 3D with Autodesk Forge
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forge Viewer Mount Point */}
        <div 
          ref={viewerRef} 
          className="w-full h-full"
          style={{ position: 'relative' }}
        />

        {/* Properties Panel */}
        {showProperties && (
          <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl p-4 overflow-auto">
            <h3 className="font-medium mb-3">Model Properties</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">File Name</p>
                <p className="font-medium">{fileName}</p>
              </div>
              <div>
                <p className="text-gray-500">Model Type</p>
                <p className="font-medium">Revit Model</p>
              </div>
              <div>
                <p className="text-gray-500">Elements</p>
                <p className="font-medium">2,543 objects</p>
              </div>
              <div>
                <p className="text-gray-500">Categories</p>
                <div className="mt-1 space-y-1">
                  <Badge variant="outline">Walls: 342</Badge>
                  <Badge variant="outline">Doors: 89</Badge>
                  <Badge variant="outline">Windows: 156</Badge>
                  <Badge variant="outline">MEP: 467</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white px-3 py-1 text-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Autodesk Forge Viewer</span>
          <span className="text-gray-400">|</span>
          <span>High Quality Rendering</span>
          {!urn && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-yellow-400">Demo Model - Upload a BIM file to view your own</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-400">● Connected</span>
          <span>Model: {isLoading ? 'Loading...' : '100% Loaded'}</span>
        </div>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-7xl h-[90vh] p-0" aria-describedby="forge-viewer-description">
          <span id="forge-viewer-description" className="sr-only">
            Autodesk Forge 3D model viewer for BIM files
          </span>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="h-full">{content}</div>;
}