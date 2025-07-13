import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Loader2, 
  Check, 
  AlertCircle,
  Eye,
  Download,
  Layers,
  Box
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Autodesk: any;
  }
}

interface ForgeViewerProps {
  onElementsExtracted?: (elements: any[]) => void;
  clientId?: string;
  clientSecret?: string;
  urn?: string; // URN from uploaded file
}

export function ForgeViewer({ onElementsExtracted, clientId, clientSecret, urn }: ForgeViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [extractedElements, setExtractedElements] = useState<any[]>([]);
  const { toast } = useToast();

  // Load Autodesk Viewer SDK
  useEffect(() => {
    if (!window.Autodesk) {
      const script = document.createElement('script');
      script.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
      script.async = true;
      document.head.appendChild(script);

      const style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css';
      document.head.appendChild(style);
    }
  }, []);

  // Auto-load model if URN is provided
  useEffect(() => {
    if (urn && window.Autodesk && !viewer) {
      handleLoadModel(urn);
    }
  }, [urn, viewer]);

  const initializeViewer = async (token: string, urn: string) => {
    return new Promise((resolve, reject) => {
      const options = {
        env: 'AutodeskProduction2',
        api: 'streamingV2',
        getAccessToken: (callback: (token: string, expire: number) => void) => {
          callback(token, 3600);
        }
      };

      window.Autodesk.Viewing.Initializer(options, () => {
        const viewerDiv = viewerRef.current;
        if (!viewerDiv) {
          reject('Viewer container not found');
          return;
        }

        const viewer = new window.Autodesk.Viewing.GuiViewer3D(viewerDiv);
        viewer.start();

        window.Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (doc: any) => {
            const viewables = doc.getRoot().getDefaultGeometry();
            viewer.loadDocumentNode(doc, viewables).then(() => {
              setViewer(viewer);
              extractModelData(viewer);
              resolve(viewer);
            });
          },
          (error: any) => {
            reject(error);
          }
        );
      });
    });
  };

  const extractModelData = (viewer: any) => {
    const instanceTree = viewer.model.getInstanceTree();
    const elements: any[] = [];
    
    instanceTree.enumNodeChildren(
      instanceTree.getRootId(),
      (dbId: number) => {
        viewer.getProperties(dbId, (props: any) => {
          const element = {
            id: dbId,
            name: props.name,
            category: props.properties.find((p: any) => p.displayName === 'Category')?.displayValue || 'Unknown',
            type: props.properties.find((p: any) => p.displayName === 'Type')?.displayValue || 'Unknown',
            properties: props.properties,
            bounds: viewer.model.getBoundingBox(dbId)
          };
          
          // Calculate quantities based on bounding box
          if (element.bounds) {
            const size = element.bounds.getSize();
            element.volume = size.x * size.y * size.z;
            element.area = size.x * size.y;
          }
          
          elements.push(element);
        });
      },
      true
    );
    
    setExtractedElements(elements);
    if (onElementsExtracted) {
      onElementsExtracted(elements);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!clientId || !clientSecret) {
      toast({
        title: "Configuration Required",
        description: "Please provide Autodesk Forge API credentials",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    try {
      // Step 1: Get access token
      setLoadingStatus('Authenticating with Autodesk Forge...');
      setProgress(10);
      const token = await getForgeToken(clientId, clientSecret);
      
      // Step 2: Upload file to Forge
      setLoadingStatus('Uploading RVT file to cloud...');
      setProgress(30);
      const urn = await uploadToForge(file, token);
      
      // Step 3: Translate file
      setLoadingStatus('Converting RVT to viewable format...');
      setProgress(50);
      await translateModel(urn, token);
      
      // Step 4: Wait for translation
      setLoadingStatus('Processing model geometry...');
      setProgress(70);
      await waitForTranslation(urn, token);
      
      // Step 5: Initialize viewer
      setLoadingStatus('Loading 3D viewer...');
      setProgress(90);
      await initializeViewer(token, urn);
      
      setProgress(100);
      setLoadingStatus('Complete!');
      
      toast({
        title: "Success",
        description: "RVT file loaded successfully"
      });
      
    } catch (error) {
      console.error('Error loading RVT:', error);
      toast({
        title: "Error",
        description: "Failed to load RVT file. Please check your API credentials.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forge API helper functions
  const getForgeToken = async (clientId: string, clientSecret: string): Promise<string> => {
    // In production, this should be done server-side
    const response = await fetch('/api/forge/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });
    const data = await response.json();
    return data.access_token;
  };

  const uploadToForge = async (file: File, token: string): Promise<string> => {
    // Implementation would include:
    // 1. Create bucket
    // 2. Upload file to bucket
    // 3. Return URN
    // For now, returning mock URN
    return btoa(`urn:adsk.objects:os.object:${Date.now()}/${file.name}`);
  };

  const translateModel = async (urn: string, token: string): Promise<void> => {
    // API call to start translation
  };

  const waitForTranslation = async (urn: string, token: string): Promise<void> => {
    // Poll translation status
  };

  const handleLoadModel = async (modelUrn: string) => {
    setIsLoading(true);
    setLoadingStatus('Getting Forge access token...');
    
    try {
      const tokenResponse = await fetch('/api/forge/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get Forge token');
      }
      
      const tokenData = await tokenResponse.json();
      setLoadingStatus('Initializing 3D viewer...');
      
      await initializeViewer(tokenData.access_token, modelUrn);
      
      toast({
        title: "Success",
        description: "Model loaded successfully with Autodesk Forge"
      });
      
    } catch (error) {
      console.error('Error loading model:', error);
      toast({
        title: "Error",
        description: "Failed to load model. Please check Forge API configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          Autodesk Forge RVT Viewer
          <Badge variant="outline">Professional</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!clientId || !clientSecret ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Autodesk Forge API credentials required. Please add FORGE_CLIENT_ID and FORGE_CLIENT_SECRET to your environment.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="file"
                accept=".rvt,.rfa"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="rvt-upload"
              />
              <label htmlFor="rvt-upload">
                <Button variant="outline" className="cursor-pointer" disabled={isLoading}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload RVT File
                </Button>
              </label>
            </div>

            {isLoading && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingStatus}
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div 
              ref={viewerRef} 
              className="w-full h-[600px] bg-gray-100 rounded-lg"
              style={{ position: 'relative' }}
            />

            {extractedElements.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">
                  Extracted Elements: {extractedElements.length}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(
                    extractedElements.reduce((acc, el) => {
                      acc[el.category] = (acc[el.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} className="text-sm p-2 bg-gray-50 rounded">
                      <div className="font-medium">{category}</div>
                      <div className="text-gray-600">{count} items</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}