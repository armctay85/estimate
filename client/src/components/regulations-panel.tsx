import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Search, Shield, AlertTriangle, CheckCircle, FileText, ChevronDown, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BuildingRegulation {
  id: string;
  code: string;
  title: string;
  category: string;
  jurisdiction: string;
  effectiveDate: string;
  description: string;
  requirements: string[];
  relatedStandards: string[];
  penalties?: string;
  source: string;
}

interface ComplianceCheck {
  regulation: BuildingRegulation;
  status: 'compliant' | 'non-compliant' | 'review-required';
  notes: string;
  recommendations?: string[];
}

interface RegulationsPanelProps {
  projectType?: string;
  location?: string;
  buildingClass?: string;
  darkMode?: boolean;
}

export function RegulationsPanel({ projectType, location, buildingClass, darkMode }: RegulationsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("all");
  const [expandedRegulations, setExpandedRegulations] = useState<Set<string>>(new Set());

  // Fetch regulations
  const { data: regulations = [], isLoading: regulationsLoading } = useQuery({
    queryKey: ['/api/regulations', selectedCategory, selectedJurisdiction],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedJurisdiction !== "all") params.append("jurisdiction", selectedJurisdiction);
      
      const response = await apiRequest("GET", `/api/regulations?${params.toString()}`);
      return response.json();
    },
  });

  // Check compliance
  const { data: complianceChecks, isLoading: complianceLoading, refetch: checkCompliance } = useQuery({
    queryKey: ['/api/regulations/check-compliance', projectType, location, buildingClass],
    queryFn: async () => {
      if (!projectType || !location || !buildingClass) return [];
      
      const response = await apiRequest("POST", "/api/regulations/check-compliance", {
        projectType,
        location,
        buildingClass
      });
      return response.json();
    },
    enabled: !!(projectType && location && buildingClass),
  });

  // Search regulations
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/regulations/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const response = await apiRequest("GET", `/api/regulations/search?q=${encodeURIComponent(searchQuery)}`);
      return response.json();
    },
    enabled: !!searchQuery,
  });

  const toggleRegulation = (id: string) => {
    const newExpanded = new Set(expandedRegulations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRegulations(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'non-compliant':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'non-compliant':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const displayRegulations = searchQuery ? searchResults : regulations;

  return (
    <Card className={`w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Australian Building Regulations
        </CardTitle>
        <CardDescription className={darkMode ? 'text-gray-300' : ''}>
          Access NCC 2022, state regulations, and Australian Standards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Check</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Structural">Structural</SelectItem>
                  <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                  <SelectItem value="Access">Access</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Sustainability">Sustainability</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  <SelectItem value="National">National (NCC)</SelectItem>
                  <SelectItem value="NSW">New South Wales</SelectItem>
                  <SelectItem value="VIC">Victoria</SelectItem>
                  <SelectItem value="QLD">Queensland</SelectItem>
                  <SelectItem value="SA">South Australia</SelectItem>
                  <SelectItem value="WA">Western Australia</SelectItem>
                  <SelectItem value="TAS">Tasmania</SelectItem>
                  <SelectItem value="NT">Northern Territory</SelectItem>
                  <SelectItem value="ACT">ACT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px]">
              {regulationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {displayRegulations.map((regulation: BuildingRegulation) => (
                    <Collapsible
                      key={regulation.id}
                      open={expandedRegulations.has(regulation.id)}
                      onOpenChange={() => toggleRegulation(regulation.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <h3 className="font-semibold">{regulation.code}</h3>
                                  <Badge variant="outline" className="text-xs">
                                    {regulation.category}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {regulation.jurisdiction}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{regulation.title}</p>
                              </div>
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedRegulations.has(regulation.id) ? 'rotate-180' : ''}`} />
                            </div>
                          </CardHeader>
                        </Card>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Card className={`mt-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <CardContent className="pt-4 space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm">{regulation.description}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold mb-2">Requirements</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {regulation.requirements.map((req, idx) => (
                                  <li key={idx} className="text-sm">{req}</li>
                                ))}
                              </ul>
                            </div>

                            {regulation.relatedStandards.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Related Standards</h4>
                                <div className="flex flex-wrap gap-2">
                                  {regulation.relatedStandards.map((standard, idx) => (
                                    <Badge key={idx} variant="outline">{standard}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {regulation.penalties && (
                              <Alert className={darkMode ? 'bg-red-900 border-red-800' : ''}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Penalties</AlertTitle>
                                <AlertDescription>{regulation.penalties}</AlertDescription>
                              </Alert>
                            )}

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Effective: {new Date(regulation.effectiveDate).toLocaleDateString()}</span>
                              <span>Source: {regulation.source}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            {(!projectType || !location || !buildingClass) ? (
              <Alert>
                <Building className="h-4 w-4" />
                <AlertTitle>Project Information Required</AlertTitle>
                <AlertDescription>
                  Please provide project type, location, and building class to check compliance.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Project: {projectType}</p>
                    <p className="text-sm text-muted-foreground">Location: {location} | Class: {buildingClass}</p>
                  </div>
                  <Button onClick={() => checkCompliance()} size="sm">
                    Refresh Compliance
                  </Button>
                </div>

                <ScrollArea className="h-[450px]">
                  {complianceLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {complianceChecks?.map((check: ComplianceCheck, idx: number) => (
                        <Card key={idx} className={darkMode ? 'bg-gray-700' : ''}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(check.status)}
                                  <h3 className="font-semibold">{check.regulation.code}</h3>
                                  <Badge className={getStatusColor(check.status)}>
                                    {check.status.replace('-', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{check.regulation.title}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm">{check.notes}</p>
                            
                            {check.recommendations && check.recommendations.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-sm mb-2">Recommendations:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {check.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm">{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search regulations, standards, or requirements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery && (
              <ScrollArea className="h-[450px]">
                {searchLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : searchResults?.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No regulations found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults?.map((regulation: BuildingRegulation) => (
                      <Card key={regulation.id} className={darkMode ? 'bg-gray-700' : ''}>
                        <CardHeader>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <h3 className="font-semibold">{regulation.code}</h3>
                              <Badge variant="outline" className="text-xs">
                                {regulation.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{regulation.title}</p>
                            <p className="text-sm mt-2">{regulation.description}</p>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}