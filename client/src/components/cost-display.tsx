import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { type RoomData } from "@/lib/fabric-enhanced";
import { MATERIALS } from "@shared/schema";
import { FileText, FileSpreadsheet, Share, Crown } from "lucide-react";
// import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface CostDisplayProps {
  rooms: RoomData[];
  totalCost: number;
}

export function CostDisplay({ rooms, totalCost }: CostDisplayProps) {
  // Bypass auth for demo mode  
  const user = null;
  // const { user } = useAuth();
  const [, setLocation] = useLocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // REMOVED EXPORT RESTRICTIONS - Full unrestricted access
  const canExport = true;

  const handleExportPDF = () => {
    if (!canExport) {
      setLocation("/subscribe");
      return;
    }
    // TODO: Implement PDF export
    console.log("Export PDF");
  };

  const handleExportCSV = () => {
    if (!canExport) {
      setLocation("/subscribe");
      return;
    }
    // TODO: Implement CSV export
    console.log("Export CSV");
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share project");
  };

  return (
    <div className="space-y-6">
      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {rooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No rooms added yet</p>
              <p className="text-xs mt-1">Click "Add Room" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => {
                const area = ((room.width * room.height) / 10000).toFixed(1);
                const material = MATERIALS[room.material];
                
                return (
                  <div key={room.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{room.name}</p>
                      <p className="text-sm text-gray-500">
                        {area}m² × {material.name}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(room.cost)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          {rooms.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total Cost</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(totalCost)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Including GST</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Export & Share
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportPDF}
              disabled={rooms.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
              {!canExport && <Crown className="w-4 h-4 ml-auto text-amber-500" />}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportCSV}
              disabled={rooms.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
              {!canExport && <Crown className="w-4 h-4 ml-auto text-amber-500" />}
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleShare}
              disabled={rooms.length === 0}
            >
              <Share className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Prompt */}
      {user?.subscriptionTier === 'free' && (
        <Card className="bg-gradient-to-r from-primary to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2" />
            <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
            <p className="text-sm text-blue-100 mb-4">
              Unlimited projects & advanced reports
            </p>
            <Button
              variant="secondary"
              className="w-full bg-white text-primary hover:bg-gray-100"
              onClick={() => setLocation("/subscribe")}
            >
              Upgrade Now - $9.99/month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
