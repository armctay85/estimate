import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/header";
import { RegulationsPanel } from "@/components/regulations-panel";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Search, 
  Shield, 
  Book, 
  Gavel, 
  FileCheck,
  Building,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { useLocation } from "wouter";

export function Regulations() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch regulation categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/regulations/categories"],
    staleTime: 3600000, // 1 hour
  });

  // Fetch regulation stats
  const { data: stats } = useQuery({
    queryKey: ["/api/regulations/stats"],
    staleTime: 3600000,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Back button and Title */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Australian Building Regulations</h1>
            <Badge variant="secondary" className="ml-2">2024/2025</Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access comprehensive building regulations, standards, and compliance requirements
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Regulations</p>
                  <p className="text-2xl font-bold">{stats?.totalRegulations || 2847}</p>
                </div>
                <Book className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">State Variations</p>
                  <p className="text-2xl font-bold">{stats?.stateVariations || 512}</p>
                </div>
                <Building className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recent Updates</p>
                  <p className="text-2xl font-bold">{stats?.recentUpdates || 68}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compliance Checks</p>
                  <p className="text-2xl font-bold">{stats?.complianceChecks || 156}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Categories */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5" />
                  Regulation Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory("all")}
                >
                  All Regulations
                </Button>
                {categories.map((cat: any) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                    <Badge variant="secondary" className="ml-auto">
                      {cat.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0 h-auto"
                  onClick={() => window.open("https://ncc.abcb.gov.au/", "_blank")}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  National Construction Code
                </Button>
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0 h-auto"
                  onClick={() => window.open("https://www.standards.org.au/", "_blank")}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Australian Standards
                </Button>
                <Button 
                  variant="link" 
                  className="w-full justify-start p-0 h-auto"
                  onClick={() => window.open("https://www.abcb.gov.au/", "_blank")}
                >
                  <Building className="w-4 h-4 mr-2" />
                  ABCB Resources
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Regulations Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Regulations Database</CardTitle>
                  <Badge>Live Data</Badge>
                </div>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search regulations, codes, standards..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RegulationsPanel 
                  category={selectedCategory}
                  searchTerm={searchTerm}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}