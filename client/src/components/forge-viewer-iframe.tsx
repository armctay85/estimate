import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

interface ForgeViewerIframeProps {
  urn: string;
}

export function ForgeViewerIframe({ urn }: ForgeViewerIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string>('');

  useEffect(() => {
    if (!urn) return;

    const setupViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get access token
        const tokenResponse = await fetch('/api/forge/token', { method: 'POST' });
        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
          throw new Error('Failed to get access token');
        }

        // Create viewer URL with token and URN
        const params = new URLSearchParams({
          urn: urn,
          token: tokenData.access_token,
          env: 'AutodeskProduction',
          api: 'derivativeV2'
        });

        setViewerUrl(`/api/forge/viewer?${params.toString()}`);
        
      } catch (error: any) {
        console.error('Viewer setup error:', error);
        setError(error.message || 'Failed to setup viewer');
        setIsLoading(false);
      }
    };

    setupViewer();
  }, [urn]);

  const handleIframeLoad = () => {
    // Keep loading state for a bit to ensure viewer is fully initialized
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="text-center bg-white p-6 rounded-lg shadow-lg">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-medium text-gray-800 mb-2">Loading 3D Model</p>
            <p className="text-sm text-gray-600">Initializing Forge Viewer...</p>
            <p className="text-xs text-gray-500 mt-2">This may take a few seconds</p>
          </div>
        </div>
      )}
      
      {error && (
        <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {viewerUrl && (
        <iframe
          src={viewerUrl}
          className="w-full h-full border-0"
          style={{ minHeight: '600px' }}
          onLoad={handleIframeLoad}
          title="Forge 3D Viewer"
        />
      )}
    </div>
  );
}