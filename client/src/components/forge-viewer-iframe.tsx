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
    setIsLoading(false);
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
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