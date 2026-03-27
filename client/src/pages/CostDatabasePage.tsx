import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  CostDatabaseExplorer, 
  ElementSelector,
  CostSubmissionForm,
  RegionalComparisonChart,
  CostSubmissionAdmin 
} from "@/components/cost-database";
import { 
  Database, 
  Upload, 
  MapPin, 
  Calculator, 
  Search,
  DollarSign,
  Building2,
  Star,
  ArrowRight,
  Loader2
} from "lucide-react";

interface Element {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
}

interface EstimateResult {
  low: number;
  median: number;
  high: number;
  confidence: "high" | "medium" | "low";
  regionalFactor: number;
  source: string;
  dataQuality: string;
  sampleSize: number;
}

export default function CostDatabasePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("explore");
  
  // Quick Estimator State
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [estimateParams, setEstimateParams] = useState({
    region: "Sydney",
    buildingType: "residential_detached",
    quality: "standard",
    quantity: "1",
  });
  const [estimateResult, setEstimateResult] = useState<EstimateResult | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Fetch reference data
  const { data: referenceData } = useQuery({
    queryKey: ["/api/costs/reference"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/costs/reference");
      return res.json();
    },
  });

  const handleEstimate = async () => {
    if (!selectedElement) {
      toast({
        title: "Select an Element",
        description: "Please select a construction element first",
        variant: "destructive",
      });
      return;
    }

    setIsEstimating(true);
    try {
      const res = await apiRequest("POST", "/api/costs/estimate", {
        elementId: selectedElement.id,
        region: estimateParams.region,
        buildingType: estimateParams.buildingType,
        quality: estimateParams.quality,
        quantity: parseFloat(estimateParams.quantity) || 1,
      });

      const data = await res.json();
      setEstimateResult(data);
    } catch (error) {
      toast({
        title: "Estimation Failed",
        description: "Could not retrieve cost estimate",
        variant: "destructive",
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-800">Medium Confidence</Badge>;
      case "low":
        return <Badge className="bg-amber-100 text-amber-800">Low Confidence</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          Elemental Cost Database
        </h1>
        <p className="text-gray-500 mt-2">
          NRM1/AIQS aligned construction cost database with regional adjustments and crowdsourced rates
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Explore
          </TabsTrigger>
          <TabsTrigger value="estimate" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Quick Estimate
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Regional Comparison
          </TabsTrigger>
          <TabsTrigger value="submit" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Submit Data
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="mt-6">
          <CostDatabaseExplorer />
        </TabsContent>

        {/* Quick Estimate Tab */}
        <TabsContent value="estimate" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Quick Cost Estimator
                </CardTitle>
                <CardDescription>
                  Select an element and get instant cost estimates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Element</Label>
                  <ElementSelector
                    onSelect={(el) => setSelectedElement(el)}
                    region={estimateParams.region}
                    buildingType={estimateParams.buildingType}
                    quality={estimateParams.quality}
                  />
                </div>

                {selectedElement && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedElement.code}</span>
                      <span>-</span>
                      <span>{selectedElement.name}</span>
                      <Badge variant="outline">{selectedElement.unit}</Badge>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select
                      value={estimateParams.region}
                      onValueChange={(value) => 
                        setEstimateParams({ ...estimateParams, region: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceData?.regions.map((r: any) => (
                          <SelectItem key={r.region} value={r.region}>
                            {r.region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Building Type</Label>
                    <Select
                      value={estimateParams.buildingType}
                      onValueChange={(value) => 
                        setEstimateParams({ ...estimateParams, buildingType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceData?.buildingTypes.map((bt: any) => (
                          <SelectItem key={bt.code} value={bt.code}>
                            {bt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quality</Label>
                    <Select
                      value={estimateParams.quality}
                      onValueChange={(value) => 
                        setEstimateParams({ ...estimateParams, quality: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {referenceData?.qualityLevels.map((q: any) => (
                          <SelectItem key={q.code} value={q.code}>
                            {q.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity ({selectedElement?.unit || "units"})</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={estimateParams.quantity}
                      onChange={(e) => 
                        setEstimateParams({ ...estimateParams, quantity: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleEstimate} 
                  disabled={!selectedElement || isEstimating}
                  className="w-full"
                >
                  {isEstimating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Get Estimate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Estimate Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {estimateResult ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-500">Low (10th %ile)</div>
                        <div className="text-2xl font-bold text-green-700">
                          ${estimateResult.low.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-500">Median (50th %ile)</div>
                        <div className="text-2xl font-bold text-blue-700">
                          ${estimateResult.median.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-sm text-gray-500">High (90th %ile)</div>
                        <div className="text-2xl font-bold text-amber-700">
                          ${estimateResult.high.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">Data Confidence</div>
                        {getConfidenceBadge(estimateResult.confidence)}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Regional Factor</div>
                        <div className="font-medium">{estimateResult.regionalFactor.toFixed(3)}</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500">
                      Based on {estimateResult.sampleSize} projects • {estimateResult.dataQuality} quality
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select an element and click "Get Estimate" to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regional Comparison Tab */}
        <TabsContent value="regional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Cost Comparison</CardTitle>
              <CardDescription>
                Compare construction costs across different regions in Australia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Element</Label>
                  <ElementSelector
                    onSelect={(el) => setSelectedElement(el)}
                    placeholder="Search for an element..."
                  />
                </div>
                
                <div>
                  <Label>Building Type</Label>
                  <Select
                    value={estimateParams.buildingType}
                    onValueChange={(value) => 
                      setEstimateParams({ ...estimateParams, buildingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData?.buildingTypes.map((bt: any) => (
                        <SelectItem key={bt.code} value={bt.code}>
                          {bt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quality</Label>
                  <Select
                    value={estimateParams.quality}
                    onValueChange={(value) => 
                      setEstimateParams({ ...estimateParams, quality: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {referenceData?.qualityLevels.map((q: any) => (
                        <SelectItem key={q.code} value={q.code}>
                          {q.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedElement && (
                <RegionalComparison
                  elementId={selectedElement.id}
                  elementName={selectedElement.name}
                  buildingType={estimateParams.buildingType}
                  quality={estimateParams.quality}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submit Data Tab */}
        <TabsContent value="submit" className="mt-6">
          <CostSubmissionForm 
            onSuccess={() => {
              toast({
                title: "Thank You!",
                description: "Your submission helps improve our cost database.",
              });
            }}
          />
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="mt-6">
          <CostSubmissionAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Regional Comparison Component
function RegionalComparison({ 
  elementId, 
  elementName,
  buildingType, 
  quality 
}: { 
  elementId: number;
  elementName: string;
  buildingType: string;
  quality: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/costs/regions", elementId, buildingType, quality],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/costs/regions?elementId=${elementId}&buildingType=${buildingType}&quality=${quality}`
      );
      return res.json();
    },
    enabled: !!elementId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available for comparison
      </div>
    );
  }

  return (
    <RegionalComparisonChart
      elementName={elementName}
      baseRate={data.baseRate}
      baseRegion={data.baseRegion}
      comparisons={data.comparisons}
    />
  );
}
