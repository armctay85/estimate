import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MapPin, Building2, Star, DollarSign, Package, FileText } from "lucide-react";

interface Element {
  id: number;
  code: string;
  category: string;
  subcategory: string;
  name: string;
  description: string | null;
  unit: string;
  measurementRules: string | null;
  exclusions: string | null;
}

interface ElementCategory {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

interface CostRate {
  id: number;
  elementId: number;
  region: string;
  buildingType: string;
  quality: string;
  lowRate: string;
  medianRate: string;
  highRate: string;
  sampleSize: number;
  source: string;
  dataQuality: string;
  confidenceScore: string | null;
  lastUpdated: string;
}

export function CostDatabaseExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [filters, setFilters] = useState({
    region: "Sydney",
    buildingType: "residential_detached",
    quality: "standard",
  });

  // Fetch elements
  const { data: elements = [], isLoading: elementsLoading } = useQuery({
    queryKey: ["/api/elements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/elements");
      return res.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/elements/categories/list"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/elements/categories/list");
      return res.json();
    },
  });

  // Fetch cost rates for selected element
  const { data: elementRates = [] } = useQuery({
    queryKey: ["/api/costs/search", selectedElement?.id],
    queryFn: async () => {
      if (!selectedElement) return [];
      const res = await apiRequest("GET", `/api/costs/search?elementId=${selectedElement.id}`);
      return res.json();
    },
    enabled: !!selectedElement,
  });

  // Filter elements
  const filteredElements = elements.filter((el: Element) => {
    const matchesSearch = 
      searchQuery === "" ||
      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (el.description && el.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || el.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group elements by category
  const elementsByCategory = filteredElements.reduce((acc: Record<string, Element[]>, el: Element) => {
    if (!acc[el.category]) acc[el.category] = [];
    acc[el.category].push(el);
    return acc;
  }, {});

  const getConfidenceBadge = (rate: CostRate) => {
    if (rate.dataQuality === "high" && rate.sampleSize >= 30) {
      return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
    } else if (rate.dataQuality === "low" || rate.sampleSize < 10) {
      return <Badge className="bg-amber-100 text-amber-800">Low Confidence</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Medium Confidence</Badge>;
  };

  const getSourceBadge = (source: string) => {
    const sourceColors: Record<string, string> = {
      industry_data: "bg-purple-100 text-purple-800",
      qs_partner: "bg-indigo-100 text-indigo-800",
      user_contributed: "bg-orange-100 text-orange-800",
      calculated: "bg-gray-100 text-gray-800",
    };
    return <Badge className={sourceColors[source] || "bg-gray-100 text-gray-800"}>{source.replace("_", " ")}</Badge>;
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar - Categories */}
      <div className="col-span-3 border-r pr-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Categories
        </h3>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="space-y-1">
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              className="w-full justify-start text-left"
              onClick={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((cat: ElementCategory) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.name ? "default" : "ghost"}
                className="w-full justify-start text-left text-sm"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.code}. {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Element List */}
      <div className="col-span-4 border-r pr-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search elements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-80px)]">
          {elementsLoading ? (
            <div className="text-center py-8 text-gray-500">Loading elements...</div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(elementsByCategory).map(([category, categoryElements]) => (
                <AccordionItem key={category} value={category}>
                  <AccordionTrigger className="text-sm font-medium">
                    {category} ({categoryElements.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1">
                      {categoryElements.map((el: Element) => (
                        <Button
                          key={el.id}
                          variant={selectedElement?.id === el.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-left text-xs h-auto py-2"
                          onClick={() => setSelectedElement(el)}
                        >
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{el.code} - {el.name}</span>
                            <span className="text-gray-500">{el.unit}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </div>

      {/* Right Panel - Element Details */}
      <div className="col-span-5">
        {selectedElement ? (
          <ScrollArea className="h-full">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedElement.name}</CardTitle>
                      <CardDescription>{selectedElement.code}</CardDescription>
                    </div>
                    <Badge variant="outline">{selectedElement.unit}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedElement.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                      <p className="text-sm">{selectedElement.description}</p>
                    </div>
                  )}
                  
                  {selectedElement.measurementRules && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Measurement Rules</h4>
                      <p className="text-sm">{selectedElement.measurementRules}</p>
                    </div>
                  )}
                  
                  {selectedElement.exclusions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Exclusions</h4>
                      <p className="text-sm">{selectedElement.exclusions}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Badge variant="secondary">{selectedElement.category}</Badge>
                    <Badge variant="secondary">{selectedElement.subcategory}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Rates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Cost Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {elementRates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No cost rates available for this element
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {elementRates.map((rate: CostRate) => (
                        <div
                          key={rate.id}
                          className="border rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {rate.region}
                              <Building2 className="w-3 h-3 ml-2" />
                              {rate.buildingType.replace("_", " ")}
                              <Star className="w-3 h-3 ml-2" />
                              {rate.quality}
                            </div>
                            {getConfidenceBadge(rate)}
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mb-2">
                            <div>
                              <span className="text-gray-500">Low:</span>
                              <span className="ml-1 font-medium">${parseFloat(rate.lowRate).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Median:</span>
                              <span className="ml-1 font-semibold text-blue-600">${parseFloat(rate.medianRate).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">High:</span>
                              <span className="ml-1 font-medium">${parseFloat(rate.highRate).toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              {getSourceBadge(rate.source)}
                              <span>n={rate.sampleSize}</span>
                            </div>
                            <span>Updated: {new Date(rate.lastUpdated).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an element to view details and cost rates</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
