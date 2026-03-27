import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Calculator, 
  Database, 
  Link2, 
  Unlink, 
  ArrowRight, 
  DollarSign, 
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Building,
  MapPin,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ElementSelector } from '@/components/cost-database/ElementSelector';

// Types
interface Measurement {
  id: string;
  name: string;
  type: 'polygon' | 'line';
  value: number; // m2 for polygon, m for line
  unit: string;
  color: string;
}

interface CostLineItem {
  id: string;
  measurementId: string;
  elementId: number;
  elementCode: string;
  elementName: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  region: string;
  confidence: 'high' | 'medium' | 'low';
}

interface TakeoffCostIntegrationProps {
  measurements: Measurement[];
  projectId: string;
  onSave?: (items: CostLineItem[]) => void;
}

// API hooks
function useElementDatabase(region: string, buildingType: string) {
  return useQuery({
    queryKey: ['elements', region, buildingType],
    queryFn: async () => {
      const res = await fetch(`/api/elements?region=${region}&buildingType=${buildingType}`);
      return res.json();
    }
  });
}

function useCostEstimate(elementId: number, region: string, buildingType: string, quantity: number) {
  return useQuery({
    queryKey: ['cost-estimate', elementId, region, buildingType, quantity],
    queryFn: async () => {
      const res = await fetch('/api/costs/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elementId, region, buildingType, quality: 'standard', quantity })
      });
      return res.json();
    },
    enabled: elementId > 0 && quantity > 0
  });
}

// Components
export function TakeoffCostIntegration({ measurements, projectId, onSave }: TakeoffCostIntegrationProps) {
  const [region, setRegion] = useState('gladstone_qld');
  const [buildingType, setBuildingType] = useState('retail_fitout');
  const [lineItems, setLineItems] = useState<CostLineItem[]>([]);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [showElementSelector, setShowElementSelector] = useState(false);
  
  // Auto-link measurements to default elements based on name patterns
  useEffect(() => {
    const autoLinked = measurements.map(m => {
      const defaultElement = getDefaultElementForMeasurement(m);
      return {
        id: `link-${m.id}`,
        measurementId: m.id,
        elementId: defaultElement?.id || 0,
        elementCode: defaultElement?.code || '',
        elementName: defaultElement?.name || m.name,
        category: defaultElement?.category || 'Uncategorized',
        description: m.name,
        quantity: m.value,
        unit: m.type === 'polygon' ? 'm2' : 'm',
        rate: 0,
        total: 0,
        region,
        confidence: defaultElement ? 'high' : 'low'
      };
    });
    
    setLineItems(autoLinked);
  }, [measurements, region]);
  
  const totalCost = lineItems.reduce((sum, item) => sum + item.total, 0);
  const linkedCount = lineItems.filter(i => i.elementId > 0).length;
  
  const handleElementSelect = (measurementId: string, element: any, rate: number) => {
    setLineItems(prev => prev.map(item => {
      if (item.measurementId !== measurementId) return item;
      
      return {
        ...item,
        elementId: element.id,
        elementCode: element.code,
        elementName: element.name,
        category: element.category,
        rate,
        total: rate * item.quantity,
        confidence: 'high'
      };
    }));
    setShowElementSelector(false);
  };
  
  const handleSave = () => {
    onSave?.(lineItems);
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Cost Integration</h3>
            <p className="text-sm text-muted-foreground">
              {linkedCount} of {lineItems.length} measurements linked to database
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg">
            <DollarSign className="w-4 h-4 mr-1" />
            {totalCost.toLocaleString()}
          </Badge>
          <Button onClick={handleSave} disabled={linkedCount === 0}>
            Save Estimate
          </Button>
        </div>
      </div>
      
      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Project Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Region
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gladstone_qld">Gladstone, QLD</SelectItem>
                <SelectItem value="sydney_nsw">Sydney, NSW</SelectItem>
                <SelectItem value="melbourne_vic">Melbourne, VIC</SelectItem>
                <SelectItem value="brisbane_qld">Brisbane, QLD</SelectItem>
                <SelectItem value="perth_wa">Perth, WA</SelectItem>
                <SelectItem value="adelaide_sa">Adelaide, SA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building className="w-3 h-3" />
              Building Type
            </Label>
            <Select value={buildingType} onValueChange={setBuildingType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="retail_fitout">Retail Fitout</SelectItem>
                <SelectItem value="office_fitout">Office Fitout</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Line Items Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left">Measurement</th>
                <th className="p-3 text-left">Qty</th>
                <th className="p-3 text-left">Element</th>
                <th className="p-3 text-right">Rate</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map(item => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-xs text-muted-foreground">
                      From: {measurements.find(m => m.id === item.measurementId)?.name}
                    </div>
                  </td>
                  <td className="p-3">
                    {item.quantity.toFixed(2)} {item.unit}
                  </td>
                  <td className="p-3">
                    {item.elementId > 0 ? (
                      <div>
                        <div className="font-medium">{item.elementName}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.elementCode} • {item.category}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Not linked</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {item.rate > 0 ? (
                      <span>${item.rate.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-medium">
                    {item.total > 0 ? (
                      <span>${item.total.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {item.confidence === 'high' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Linked
                      </Badge>
                    )}
                    {item.confidence === 'low' && (
                      <Badge variant="outline">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unlinked
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <Dialog open={showElementSelector && selectedMeasurement?.id === item.measurementId} 
                           onOpenChange={(open) => {
                             if (!open) setShowElementSelector(false);
                           }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedMeasurement(measurements.find(m => m.id === item.measurementId) || null);
                            setShowElementSelector(true);
                          }}
                        >
                          {item.elementId > 0 ? (
                            <><Link2 className="w-4 h-4 mr-1" />Change</>
                          ) : (
                            <><ArrowRight className="w-4 h-4 mr-1" />Link</>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Select Element for {item.description}</DialogTitle>
                        </DialogHeader>
                        <ElementSelector
                          onSelect={(element, rate) => handleElementSelect(item.measurementId, element, rate)}
                          region={region}
                          buildingType={buildingType}
                          quality="standard"
                        />
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to auto-map measurement names to elements
function getDefaultElementForMeasurement(measurement: Measurement): { id: number; code: string; name: string; category: string } | null {
  const name = measurement.name.toLowerCase();
  const type = measurement.type;
  
  // Floor measurements
  if (name.includes('floor') || name.includes('ground')) {
    return { 
      id: 1, 
      code: 'FC001', 
      name: 'Vinyl floor covering 2mm', 
      category: '6.1 - Floor Finishes' 
    };
  }
  
  // Wall measurements
  if (name.includes('wall') || name.includes('partition')) {
    return { 
      id: 2, 
      code: 'GB001', 
      name: '90mm timber stud wall', 
      category: '6 - Internal Finishes' 
    };
  }
  
  // Ceiling measurements
  if (name.includes('ceiling')) {
    return { 
      id: 3, 
      code: 'SC001', 
      name: 'Suspended ceiling grid 600x600', 
      category: '6.2 - Ceiling Finishes' 
    };
  }
  
  // Electrical / lighting
  if (name.includes('light') || name.includes('electrical')) {
    return { 
      id: 4, 
      code: 'EL201', 
      name: 'LED downlight 12W dimmable', 
      category: '8.1 - Electrical Services' 
    };
  }
  
  // Painting / decorating
  if (name.includes('paint') || name.includes('decoration')) {
    return { 
      id: 5, 
      code: 'DC001', 
      name: 'Paint finish to plasterboard walls', 
      category: '7 - Decorating' 
    };
  }
  
  // HVAC / Mechanical
  if (name.includes('air') || name.includes('mechanical') || name.includes('hvac')) {
    return { 
      id: 6, 
      code: 'ME001', 
      name: 'Split system air conditioner 3.5kW', 
      category: '8.2 - Mechanical Services' 
    };
  }
  
  return null;
}

export default TakeoffCostIntegration;
