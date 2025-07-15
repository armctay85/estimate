/**
 * GROK-CORRECTED AUTODESK FORGE 3D VIEWER
 * Fixed implementation based on Grok's technical audit feedback
 * 
 * Key Fixes Applied:
 * - Corrected Forge SDK event names and property handling
 * - Fixed cost calculation to use real BIM data instead of placeholders
 * - Implemented proper view mode switching
 * - Enhanced error handling and loading states
 * - Professional enterprise-grade UI controls
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Eye, 
  Layers, 
  Settings, 
  Download, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  Box,
  Grid,
  Palette
} from 'lucide-react';

// Autodesk Forge Viewer Types (Corrected)
interface ForgeViewer {
  start: () => Promise<void>;
  loadDocumentNode: (document: any, viewNode: any, options?: any) => Promise<any>;
  addEventListener: (event: string, callback: Function) => void;
  getSelection: () => number[];
  getProperties: (dbId: number, callback: Function, errorCallback?: Function) => void;
  setThemingColor: (dbId: number, color: any) => void;
  isolate: (dbIds: number[]) => void;
  showAll: () => void;
  tearDown: () => void;
  resize: () => void;
  setDisplayEdges: (show: boolean) => void;
  setGhosting: (enable: boolean) => void;
  setQualityLevel: (enableSAO: boolean, enableFXAA: boolean) => void;
  impl: {
    invalidate: (needsRender: boolean) => void;
  };
  model: {
    getObjectTree: (callback: Function) => void;
  };
}

interface BIMElement {
  id: number;
  name: string;
  category: string;
  properties: any[];
  cost: number;
  material: string;
}

interface CorrectedForge3DViewerProps {
  isOpen: boolean;
  onClose: () => void;
  urn?: string;
  fileName?: string;
  accessToken?: string;
  onElementSelect?: (element: BIMElement) => void;
}

export function CorrectedForge3DViewer({
  isOpen,
  onClose,
  urn,
  fileName = "BIM Model",
  accessToken,
  onElementSelect
}: CorrectedForge3DViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<ForgeViewer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedElements, setSelectedElements] = useState<BIMElement[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [viewMode, setViewMode] = useState<'default' | 'wireframe' | 'transparent'>('default');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [elementCount, setElementCount] = useState(0);

  // CORRECTED: Set up viewer event listeners with proper Forge event names
  const setupViewerEvents = useCallback((viewerInstance: ForgeViewer, model: any) => {
    if (!window.Autodesk) return;

    const { Autodesk } = window as any;
    
    // CORRECTED: Use proper Forge event constant
    viewerInstance.addEventListener(Autodesk.Viewing.SELECTION_CHANGED_EVENT, (event: any) => {
      const selection = viewerInstance.getSelection();
      if (selection.length > 0) {
        const dbId = selection[0];
        
        // CORRECTED: Proper properties callback handling
        viewerInstance.getProperties(dbId, (result: any) => {
          if (result.error) {
            console.error("Error getting properties:", result.error);
            return;
          }
          
          // CORRECTED: Helper to get property value by displayName
          const getProperty = (name: string) => {
            const prop = result.properties.find((p: any) => p.displayName === name);
            return prop?.displayValue || 'Unknown';
          };

          const element: BIMElement = {
            id: dbId,
            name: result.name || `Element ${dbId}`,
            category: getProperty('Category'),
            properties: result.properties || [],
            cost: calculateElementCost(result),
            material: getProperty('Material') || getProperty('Material Name')
          };
          
          setSelectedElements([element]);
          onElementSelect?.(element);
        }, (error: any) => {
          console.error("Failed to get properties:", error);
        });
      } else {
        setSelectedElements([]);
      }
    });

    // CORRECTED: Use proper object tree created event
    viewerInstance.addEventListener(Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT, () => {
      console.log("Model object tree created successfully");
      setIsModelLoaded(true);
      calculateRealTotalModelCost(viewerInstance);
    });

    // Model loaded event
    viewerInstance.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, () => {
      console.log("Model root loaded successfully");
      setLoadingProgress(100);
    });

  }, [onElementSelect]);

  // CORRECTED: Calculate element cost based on real properties
  const calculateElementCost = (result: any): number => {
    const getProperty = (name: string) => {
      const prop = result.properties.find((p: any) => p.displayName === name);
      return parseFloat(prop?.displayValue) || 0;
    };

    const volume = getProperty('Volume');
    const area = getProperty('Area'); 
    const length = getProperty('Length');
    const material = getProperty('Material')?.toLowerCase() || 'concrete';
    
    // Australian construction rates
    const materialRates: Record<string, number> = {
      'concrete': 165, // per m²
      'steel': 1230, // per tonne
      'timber': 1650, // per m³
      'brick': 180, // per m²
      'glass': 400, // per m²
      'aluminum': 85, // per m²
      'plasterboard': 35 // per m²
    };
    
    const rate = materialRates[material] || 200;
    
    // Calculate based on available measurements
    if (volume > 0) {
      return Math.round(volume * rate);
    } else if (area > 0) {
      return Math.round(area * rate);
    } else if (length > 0) {
      return Math.round(length * (rate / 10));
    } else {
      return rate; // Flat rate for elements without measurements
    }
  };

  // CORRECTED: Calculate total model cost from real BIM data
  const calculateRealTotalModelCost = useCallback(async (viewerInstance: ForgeViewer) => {
    if (!viewerInstance.model) return;

    let total = 0;
    let count = 0;

    try {
      // Get object tree and calculate costs
      viewerInstance.model.getObjectTree((tree: any) => {
        const processNode = (dbId: number) => {
          viewerInstance.getProperties(dbId, (result: any) => {
            if (result && result.properties) {
              const cost = calculateElementCost(result);
              total += cost;
              count++;
              
              // Update totals after processing enough elements
              if (count % 50 === 0) {
                setTotalCost(total);
                setElementCount(count);
              }
            }
          });
        };

        // Process all leaf nodes (actual building elements)
        tree.enumNodeChildren(tree.getRootId(), (dbId: number) => {
          if (tree.getNodeType(dbId) === 'object') {
            processNode(dbId);
          }
        }, true);

        // Final update after 3 seconds
        setTimeout(() => {
          setTotalCost(total);
          setElementCount(count);
          console.log(`✅ Calculated total cost: $${total.toLocaleString()} for ${count} elements`);
        }, 3000);
      });

    } catch (error) {
      console.error("Error calculating total cost:", error);
      // Keep existing total if calculation fails
    }
  }, []);

  // CORRECTED: Proper view mode implementation with Forge methods
  const handleViewModeChange = (mode: 'default' | 'wireframe' | 'transparent') => {
    if (!viewer) return;
    
    setViewMode(mode);
    
    switch (mode) {
      case 'wireframe':
        viewer.setDisplayEdges(true);  // Shows edges
        viewer.setQualityLevel(false, false);  // Lower quality for wireframe-like
        break;
      case 'transparent':
        viewer.setGhosting(true);  // Makes hidden elements semi-transparent
        break;
      default:
        viewer.setDisplayEdges(false);
        viewer.setGhosting(false);
        viewer.setQualityLevel(true, true);
        break;
    }
    viewer.impl.invalidate(true);  // Refresh viewer
  };

  // CORRECTED: Enhanced viewer initialization with proper error handling
  const initializeViewer = useCallback(async () => {
    if (!viewerRef.current || !urn || !accessToken) {
      setError("Missing required parameters: URN and access token required");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLoadingProgress(10);

      // Check if Forge Viewer SDK is loaded
      if (typeof window.Autodesk === 'undefined') {
        throw new Error("Autodesk Forge Viewer SDK not loaded. Check script loading.");
      }

      const { Autodesk } = window as any;
      
      // Initialize viewer options
      const options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',
        getAccessToken: (callback: Function) => {
          callback(accessToken, 3600); // CORRECTED: Proper callback format
        },
      };

      setLoadingProgress(25);

      // CORRECTED: Initialize with proper error handling
      Autodesk.Viewing.Initializer(options, async () => {
        try {
          setLoadingProgress(50);

          // Create viewer instance with config
          const config3d = {
            extensions: ['Autodesk.DocumentBrowser'],
            useConsolidation: true,
            consolidationMemoryLimit: 800,
            sharedPropertyDbPath: true
          };
          
          const viewerInstance = new Autodesk.Viewing.GuiViewer3D(
            viewerRef.current,
            config3d
          );

          setLoadingProgress(65);

          // Start the viewer
          const startResult = await viewerInstance.start();
          if (startResult > 0) {
            throw new Error("Viewer failed to start properly");
          }
          
          setViewer(viewerInstance);
          setLoadingProgress(80);

          // Load the document
          const documentId = `urn:${urn}`;
          Autodesk.Viewing.Document.load(documentId, async (doc: any) => {
            try {
              setLoadingProgress(90);

              // Get the default viewable
              const viewables = doc.getRoot().getDefaultGeometry();
              if (!viewables) {
                throw new Error("No 3D viewable content found. File may not be translated correctly.");
              }

              // Load the model
              const model = await viewerInstance.loadDocumentNode(doc, viewables, {
                keepCurrentModels: false,
                applyRefPoint: true
              });
              
              setLoadingProgress(100);
              setIsLoading(false);

              // Set up event listeners
              setupViewerEvents(viewerInstance, model);

              console.log("✅ Forge viewer initialized successfully");

            } catch (loadError: any) {
              console.error("❌ Error loading model:", loadError);
              setError(`Failed to load 3D model: ${loadError.message}`);
              setIsLoading(false);
            }
          }, (loadError: any) => {
            console.error("❌ Error loading document:", loadError);
            setError(`Failed to load document: ${loadError.errorCode} - ${loadError.errorMsg}`);
            setIsLoading(false);
          });

        } catch (viewerError: any) {
          console.error("❌ Error creating viewer:", viewerError);
          setError(`Failed to create viewer: ${viewerError.message}`);
          setIsLoading(false);
        }
      });

    } catch (initError: any) {
      console.error("❌ Error initializing viewer:", initError);
      setError(`Initialization failed: ${initError.message}`);
      setIsLoading(false);
    }
  }, [urn, accessToken, setupViewerEvents]);

  // CORRECTED: Load Forge Viewer SDK with specific version for stability
  useEffect(() => {
    if (isOpen && !window.Autodesk) {
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.97/viewer3D.min.js';
      script.onload = () => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.97/style.min.css';
        document.head.appendChild(link);
        
        // Initialize after SDK loads
        setTimeout(() => {
          if (urn && accessToken) {
            initializeViewer();
          }
        }, 500);
      };
      script.onerror = () => {
        setError("Failed to load Autodesk Forge Viewer SDK");
      };
      document.head.appendChild(script);
    } else if (isOpen && urn && accessToken && window.Autodesk) {
      initializeViewer();
    }

    // Cleanup on unmount
    return () => {
      if (viewer) {
        viewer.tearDown();
        setViewer(null);
      }
    };
  }, [isOpen, urn, accessToken, initializeViewer]);

  // Viewer control functions
  const handleResetView = () => {
    if (viewer) {
      viewer.showAll();
    }
  };

  const handleIsolateSelection = () => {
    if (viewer && selectedElements.length > 0) {
      const dbIds = selectedElements.map(el => el.id);
      viewer.isolate(dbIds);
    }
  };

  const handleShowAll = () => {
    if (viewer) {
      viewer.showAll();
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewer) {
        viewer.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden shadow-2xl">
        {/* CORRECTED: Enhanced Header with proper status indicators */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Corrected Forge BIM Viewer</h2>
              <p className="text-sm text-blue-100">{fileName}</p>
            </div>
            {isModelLoaded && (
              <Badge variant="secondary" className="bg-green-500 text-white">
                Model Loaded
              </Badge>
            )}
            {elementCount > 0 && (
              <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                {elementCount} Elements
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/20 text-white border-white/30">
              ${totalCost.toLocaleString()}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* CORRECTED: Enhanced Controls Bar with proper view mode buttons */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium mr-2">View Mode:</span>
            <Button
              size="sm"
              variant={viewMode === 'default' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('default')}
            >
              <Box className="w-4 h-4 mr-1" />
              Solid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'wireframe' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('wireframe')}
            >
              <Grid className="w-4 h-4 mr-1" />
              Wireframe
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'transparent' ? 'default' : 'outline'}
              onClick={() => handleViewModeChange('transparent')}
            >
              <Palette className="w-4 h-4 mr-1" />
              X-Ray
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleResetView}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset View
            </Button>
            {selectedElements.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={handleIsolateSelection}>
                  <ZoomIn className="w-4 h-4 mr-1" />
                  Isolate
                </Button>
                <Button size="sm" variant="outline" onClick={handleShowAll}>
                  <Eye className="w-4 h-4 mr-1" />
                  Show All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100%-120px)]">
          {/* 3D Viewer */}
          <div className="flex-1 relative">
            {error && (
              <Alert className="absolute top-4 left-4 right-4 z-10" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <Card className="p-6 min-w-[300px]">
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Building className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                      <h3 className="font-semibold">Loading BIM Model</h3>
                      <p className="text-sm text-gray-600">Processing {fileName}...</p>
                    </div>
                    <Progress value={loadingProgress} className="w-full" />
                    <p className="text-xs text-center text-gray-500">
                      {loadingProgress}% Complete
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!urn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="p-8 text-center">
                  <CardContent>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No Model URN</h3>
                    <p className="text-gray-600">
                      Upload and process a BIM file to view the 3D model
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CORRECTED: Forge Viewer Container with proper sizing */}
            <div
              ref={viewerRef}
              className="w-full h-full"
              style={{ minHeight: '400px', position: 'relative' }}
            />
          </div>

          {/* CORRECTED: Enhanced Properties Panel */}
          {selectedElements.length > 0 && (
            <div className="w-80 border-l bg-gray-50 overflow-y-auto">
              <div className="p-4">
                <h3 className="font-semibold mb-4">Element Properties</h3>
                {selectedElements.map((element) => (
                  <Card key={element.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{element.name}</CardTitle>
                      <Badge variant="outline" className="w-fit">
                        {element.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Cost: </span>
                        <span className="text-green-600">${element.cost.toLocaleString()}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Material: </span>
                        <span>{element.material}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Element ID: </span>
                        <span>{element.id}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Properties: </span>
                        <span>{element.properties.length} items</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CorrectedForge3DViewer;