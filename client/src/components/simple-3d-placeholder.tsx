import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Box, Info } from "lucide-react";

interface Simple3DPlaceholderProps {
  onClose?: () => void;
  fileName?: string;
}

export function Simple3DPlaceholder({ 
  onClose = () => {}, 
  fileName = "Demo Project"
}: Simple3DPlaceholderProps) {
  return (
    <div className="w-full space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>3D Viewer Temporarily Disabled</strong> - This feature requires specialized 3D libraries. 
          Use the 2D floor plan tools and BIM file upload for accurate cost estimation.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="p-12 text-center">
          <Box className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            3D Visualization
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            The 3D model viewer will be restored in the next update. 
            For now, use the professional 2D tools for accurate cost estimation.
          </p>
          <div className="flex justify-center space-x-4">
            <Button onClick={onClose} variant="outline" className="px-6">
              Continue with 2D Tools
            </Button>
            <Button onClick={() => window.location.href = '/workspace?mode=bim'} className="px-6">
              Try BIM Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}