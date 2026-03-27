import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ElementSelector } from "./ElementSelector";
import { Upload, FileText, DollarSign, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface Element {
  id: number;
  code: string;
  name: string;
  unit: string;
}

interface CostSubmissionFormProps {
  onSuccess?: () => void;
  initialElement?: Element | null;
}

export function CostSubmissionForm({ onSuccess, initialElement }: CostSubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedElement, setSelectedElement] = useState<Element | null>(initialElement || null);
  const [hasDocumentation, setHasDocumentation] = useState(false);
  const [isQSSubmission, setIsQSSubmission] = useState(false);
  
  const [formData, setFormData] = useState({
    region: "Sydney",
    buildingType: "residential_detached",
    quality: "standard",
    rate: "",
    quantity: "",
    totalCost: "",
    projectName: "",
    projectValue: "",
    projectDate: "",
    contractorName: "",
    projectDescription: "",
    documentationUrl: "",
  });

  // Fetch reference data
  const { data: referenceData } = useQuery({
    queryKey: ["/api/costs/reference"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/costs/reference");
      return res.json();
    },
  });

  const submissionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        elementId: selectedElement?.id,
        region: data.region,
        buildingType: data.buildingType,
        quality: data.quality,
        rate: parseFloat(data.rate),
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        totalCost: data.totalCost ? parseFloat(data.totalCost) : null,
        projectName: data.projectName || null,
        projectValue: data.projectValue ? parseFloat(data.projectValue) : null,
        projectDate: data.projectDate ? new Date(data.projectDate).toISOString() : null,
        contractorName: data.contractorName || null,
        projectDescription: data.projectDescription || null,
        hasDocumentation,
        documentationUrl: data.documentationUrl || null,
        isQsSubmitted: isQSSubmission,
      };

      const res = await apiRequest("POST", "/api/costs/submit", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Submission Successful",
        description: data.message,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/costs/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/costs/search"] });
      
      // Reset form
      setSelectedElement(null);
      setFormData({
        region: "Sydney",
        buildingType: "residential_detached",
        quality: "standard",
        rate: "",
        quantity: "",
        totalCost: "",
        projectName: "",
        projectValue: "",
        projectDate: "",
        contractorName: "",
        projectDescription: "",
        documentationUrl: "",
      });
      setHasDocumentation(false);
      setIsQSSubmission(false);
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit cost data",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedElement) {
      toast({
        title: "Element Required",
        description: "Please select a construction element",
        variant: "destructive",
      });
      return;
    }

    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      toast({
        title: "Rate Required",
        description: "Please enter a valid cost rate",
        variant: "destructive",
      });
      return;
    }

    submissionMutation.mutate(formData);
  };

  const handleElementSelect = (element: Element) => {
    setSelectedElement(element);
  };

  const calculateTotal = () => {
    const rate = parseFloat(formData.rate) || 0;
    const qty = parseFloat(formData.quantity) || 1;
    return (rate * qty).toFixed(2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Element Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Element</CardTitle>
          <CardDescription>
            Choose the construction element you want to submit cost data for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ElementSelector
            onSelect={handleElementSelect}
            region={formData.region}
            buildingType={formData.buildingType}
            quality={formData.quality}
          />

          {selectedElement && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedElement.code}</span>
                  <span>-</span>
                  <span>{selectedElement.name}</span>
                  <Badge variant="outline">{selectedElement.unit}</Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedElement(null)}
              >
                Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Context Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Context Details</CardTitle>
          <CardDescription>
            Specify the location, building type, and quality level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {referenceData?.regions.map((r: any) => (
                    <SelectItem key={r.region} value={r.region}>
                      {r.region} ({r.state})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingType">Building Type</Label>
              <Select
                value={formData.buildingType}
                onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
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
              <Label htmlFor="quality">Quality Level</Label>
              <Select
                value={formData.quality}
                onValueChange={(value) => setFormData({ ...formData, quality: value })}
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
        </CardContent>
      </Card>

      {/* Cost Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Cost Data
          </CardTitle>
          <CardDescription>
            Enter the cost rate and project details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($/{selectedElement?.unit || "unit"})</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (optional)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalCost">Total Cost (optional)</Label>
              <Input
                id="totalCost"
                type="number"
                step="0.01"
                min="0"
                placeholder={calculateTotal()}
                value={formData.totalCost}
                onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
              />
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {formData.rate && formData.quantity &&
              `Calculated Total: $${calculateTotal()} for ${formData.quantity} ${selectedElement?.unit || "units"}`
            }
          </div>
        </CardContent>
      </Card>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Details (Optional)</CardTitle>
          <CardDescription>
            Additional context helps verify cost data accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                placeholder="e.g., Smith Residence"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectValue">Project Value ($)</Label>
              <Input
                id="projectValue"
                type="number"
                step="1000"
                min="0"
                placeholder="e.g., 500000"
                value={formData.projectValue}
                onChange={(e) => setFormData({ ...formData, projectValue: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDate">Project Date</Label>
              <Input
                id="projectDate"
                type="date"
                value={formData.projectDate}
                onChange={(e) => setFormData({ ...formData, projectDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorName">Contractor/Builder</Label>
              <Input
                id="contractorName"
                placeholder="e.g., ABC Construction"
                value={formData.contractorName}
                onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">Project Description</Label>
            <Textarea
              id="projectDescription"
              placeholder="Describe the project scope, any special conditions, etc."
              rows={3}
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasDocumentation"
              checked={hasDocumentation}
              onCheckedChange={(checked) => setHasDocumentation(checked as boolean)}
            />
            <Label htmlFor="hasDocumentation" className="text-sm font-normal">
              I have supporting documentation (quotes, invoices, BOQ)
            </Label>
          </div>

          {hasDocumentation && (
            <div className="space-y-2">
              <Label htmlFor="documentationUrl">Documentation URL (optional)</Label>
              <Input
                id="documentationUrl"
                type="url"
                placeholder="https://..."
                value={formData.documentationUrl}
                onChange={(e) => setFormData({ ...formData, documentationUrl: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Link to cloud storage or document management system
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isQSSubmission"
              checked={isQSSubmission}
              onCheckedChange={(checked) => setIsQSSubmission(checked as boolean)}
            />
            <Label htmlFor="isQSSubmission" className="text-sm font-normal">
              I am a Quantity Surveyor submitting verified data
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <AlertCircle className="w-4 h-4" />
          <span>Your submission will be reviewed by our team</span>
        </div>
        
        <Button
          type="submit"
          size="lg"
          disabled={submissionMutation.isPending || !selectedElement}
        >
          {submissionMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Cost Data
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
