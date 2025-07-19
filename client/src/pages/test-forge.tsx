import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BIMUploadModal } from "@/components/BIMUploadModal";
import { ForgeViewer } from "@/components/forge-viewer";

export function TestForge() {
  const { toast } = useToast();
  const [showBIMUpload, setShowBIMUpload] = useState(false);
  const [urn, setUrn] = useState<string>("");
  const [authStatus, setAuthStatus] = useState<'checking' | 'success' | 'failed'>('checking');

  useEffect(() => {
    // Set admin status
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('subscriptionTier', 'enterprise');
    
    // Test authentication
    fetch('/api/forge/viewer-token')
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          setAuthStatus('success');
          toast({
            title: "Authentication Success",
            description: "Forge API is working correctly",
          });
        } else {
          setAuthStatus('failed');
          toast({
            title: "Authentication Failed",
            description: data.error || "Failed to get viewer token",
            variant: "destructive"
          });
        }
      })
      .catch(err => {
        setAuthStatus('failed');
        toast({
          title: "Connection Error",
          description: err.message,
          variant: "destructive"
        });
      });
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Forge Viewer Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={authStatus === 'success' ? 'default' : authStatus === 'failed' ? 'destructive' : 'secondary'}>
              {authStatus === 'checking' ? 'Checking...' : authStatus === 'success' ? 'Connected' : 'Failed'}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Proxy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Configured</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Current URN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono truncate">{urn || 'No file uploaded yet'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={() => setShowBIMUpload(true)}
          disabled={authStatus !== 'success'}
          className="w-full md:w-auto"
        >
          Upload BIM File
        </Button>
        
        {urn && (
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">3D Model Viewer</h2>
            <div style={{ height: '600px' }}>
              <ForgeViewer urn={urn} />
            </div>
          </div>
        )}
      </div>

      <BIMUploadModal
        isOpen={showBIMUpload}
        onClose={() => setShowBIMUpload(false)}
        onUploadSuccess={(uploadedUrn) => {
          setUrn(uploadedUrn);
          setShowBIMUpload(false);
          toast({
            title: "Upload Successful",
            description: "Model is ready for viewing",
          });
        }}
      />
    </div>
  );
}