import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, Download, FileText, DollarSign, Calendar, Users, 
  Building, Layers, TrendingUp, Clock, AlertCircle, CheckCircle,
  BarChart3, FileSpreadsheet, Hammer
} from "lucide-react";

// Mock project data with comprehensive details
const getProjectData = (id: string) => {
  const projects: Record<string, any> = {
    "starbucks-werribee": {
      id: "starbucks-werribee",
      name: "Starbucks Werribee Drive-Through",
      client: "Starbucks Australia",
      location: "Werribee, VIC",
      status: "In Progress",
      totalCost: 1320000,
      paidToDate: 528000,
      startDate: "2025-01-01",
      endDate: "2025-04-01",
      completion: 40,
      projectType: "Commercial - QSR",
      area: 285,
      phases: [
        { name: "Site Establishment", status: "complete", cost: 35000 },
        { name: "Site Works & Strip", status: "complete", cost: 45000 },
        { name: "Concrete Slab & Footings", status: "in-progress", cost: 85000 },
        { name: "Precast Panels", status: "pending", cost: 120000 },
        { name: "Steel Structure", status: "pending", cost: 95000 },
        { name: "Roofing & Cladding", status: "pending", cost: 75000 },
        { name: "Services Rough-In", status: "pending", cost: 110000 },
        { name: "Internal Fitout", status: "pending", cost: 145000 },
        { name: "Kitchen Equipment", status: "pending", cost: 180000 },
        { name: "External Works & Drive-Thru", status: "pending", cost: 165000 },
        { name: "Services Fit-Off", status: "pending", cost: 55000 },
        { name: "Signage & Landscaping", status: "pending", cost: 85000 },
        { name: "Commissioning", status: "pending", cost: 45000 }
      ],
      costBreakdown: {
        structural: {
          total: 320000,
          items: [
            { name: "Concrete Slab 165m²", quantity: 165, unit: "m²", rate: 165, total: 27225 },
            { name: "Footings & Pad Footings", quantity: 45, unit: "m³", rate: 850, total: 38250 },
            { name: "Precast Concrete Panels", quantity: 380, unit: "m²", rate: 280, total: 106400 },
            { name: "Steel Structure & Awnings", quantity: 12, unit: "t", rate: 3500, total: 42000 },
            { name: "Roofing - Colorbond", quantity: 320, unit: "m²", rate: 85, total: 27200 },
            { name: "External Cladding", quantity: 180, unit: "m²", rate: 110, total: 19800 },
            { name: "Miscellaneous Steel", quantity: 1, unit: "item", rate: 15000, total: 15000 }
          ]
        },
        architectural: {
          total: 290000,
          items: [
            { name: "Internal Partitions", quantity: 120, unit: "m²", rate: 85, total: 10200 },
            { name: "Suspended Ceilings", quantity: 185, unit: "m²", rate: 65, total: 12025 },
            { name: "Floor Finishes - Tiles", quantity: 165, unit: "m²", rate: 95, total: 15675 },
            { name: "Wall Finishes", quantity: 380, unit: "m²", rate: 45, total: 17100 },
            { name: "Doors & Hardware", quantity: 12, unit: "no", rate: 1200, total: 14400 },
            { name: "Glazing & Shopfront", quantity: 65, unit: "m²", rate: 450, total: 29250 },
            { name: "Commercial Kitchen Fitout", quantity: 1, unit: "item", rate: 180000, total: 180000 },
            { name: "Joinery & Counters", quantity: 1, unit: "item", rate: 35000, total: 35000 }
          ]
        },
        mep: {
          total: 385000,
          items: [
            { name: "Electrical Installation", quantity: 285, unit: "m²", rate: 125, total: 35625 },
            { name: "Lighting & Power", quantity: 285, unit: "m²", rate: 85, total: 24225 },
            { name: "Fire Services", quantity: 285, unit: "m²", rate: 45, total: 12825 },
            { name: "Plumbing & Drainage", quantity: 285, unit: "m²", rate: 95, total: 27075 },
            { name: "HVAC Systems", quantity: 285, unit: "m²", rate: 185, total: 52725 },
            { name: "Kitchen Exhaust System", quantity: 1, unit: "item", rate: 45000, total: 45000 },
            { name: "Data & Communications", quantity: 285, unit: "m²", rate: 35, total: 9975 },
            { name: "Security & CCTV", quantity: 1, unit: "item", rate: 25000, total: 25000 }
          ]
        },
        external: {
          total: 245000,
          items: [
            { name: "Site Preparation", quantity: 850, unit: "m²", rate: 25, total: 21250 },
            { name: "Earthworks & Excavation", quantity: 320, unit: "m³", rate: 85, total: 27200 },
            { name: "Drive-Thru Lane", quantity: 180, unit: "m²", rate: 185, total: 33300 },
            { name: "Car Parking", quantity: 420, unit: "m²", rate: 125, total: 52500 },
            { name: "Kerbs & Channels", quantity: 180, unit: "m", rate: 145, total: 26100 },
            { name: "Landscaping", quantity: 280, unit: "m²", rate: 85, total: 23800 },
            { name: "Signage & Wayfinding", quantity: 1, unit: "item", rate: 45000, total: 45000 },
            { name: "External Lighting", quantity: 12, unit: "no", rate: 1200, total: 14400 }
          ]
        },
        preliminaries: {
          total: 80000,
          items: [
            { name: "Site Establishment", quantity: 1, unit: "item", rate: 35000, total: 35000 },
            { name: "Site Management", quantity: 13, unit: "weeks", rate: 2500, total: 32500 },
            { name: "Safety & Compliance", quantity: 1, unit: "item", rate: 8500, total: 8500 },
            { name: "Insurances", quantity: 1, unit: "item", rate: 4000, total: 4000 }
          ]
        }
      },
      team: [
        { name: "John Smith", role: "Project Manager", company: "BuildCorp" },
        { name: "Sarah Chen", role: "Quantity Surveyor", company: "QS Solutions" },
        { name: "Mike Davis", role: "Site Supervisor", company: "BuildCorp" },
        { name: "Emma Wilson", role: "Architect", company: "Design Studio" }
      ],
      risks: [
        { level: "high", description: "Weather delays during external works phase" },
        { level: "medium", description: "Kitchen equipment lead time - 8 weeks" },
        { level: "low", description: "Minor design changes pending client approval" }
      ]
    }
  };

  return projects[id] || projects["starbucks-werribee"];
};

export default function ProjectDetail() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  
  const project = getProjectData(params?.id || "starbucks-werribee");

  const totalByCategory = {
    structural: project.costBreakdown.structural.total,
    architectural: project.costBreakdown.architectural.total,
    mep: project.costBreakdown.mep.total,
    external: project.costBreakdown.external.total,
    preliminaries: project.costBreakdown.preliminaries.total
  };

  const grandTotal = Object.values(totalByCategory).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/projects")}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {project.client}
                </span>
                <span>•</span>
                <span>{project.location}</span>
                <span>•</span>
                <Badge variant={project.status === "In Progress" ? "default" : "secondary"}>
                  {project.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Budget</p>
                  <p className="text-2xl font-bold">${grandTotal.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-2xl font-bold">{project.completion}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-2xl font-bold">13 weeks</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Area</p>
                  <p className="text-2xl font-bold">{project.area}m²</p>
                </div>
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Project Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Project Progress by Phase</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.phases.map((phase: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{phase.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            ${phase.cost.toLocaleString()}
                          </span>
                          {phase.status === "complete" && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {phase.status === "in-progress" && (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                      <Progress
                        value={
                          phase.status === "complete" ? 100 :
                          phase.status === "in-progress" ? 50 : 0
                        }
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Summary by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Structural</span>
                    <span className="font-mono">${totalByCategory.structural.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Architectural</span>
                    <span className="font-mono">${totalByCategory.architectural.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">MEP Services</span>
                    <span className="font-mono">${totalByCategory.mep.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">External Works</span>
                    <span className="font-mono">${totalByCategory.external.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="font-medium">Preliminaries</span>
                    <span className="font-mono">${totalByCategory.preliminaries.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded border border-orange-200">
                    <span className="font-bold">Total Project Cost</span>
                    <span className="font-mono font-bold text-orange-600">
                      ${grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cost-breakdown" className="space-y-6">
            {Object.entries(project.costBreakdown).map(([category, data]: [string, any]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {category} - ${data.total.toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Unit</th>
                          <th className="text-right py-2">Rate</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{item.name}</td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">{item.unit}</td>
                            <td className="text-right py-2">${item.rate}</td>
                            <td className="text-right py-2 font-medium">
                              ${item.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-bold">
                          <td colSpan={4} className="py-2">Subtotal</td>
                          <td className="text-right py-2">${data.total.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Project Schedule - Gantt View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Interactive Gantt chart would be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Project Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.team.map((member: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-xs text-gray-500">{member.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Project Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Contract Documents</p>
                        <p className="text-sm text-gray-500">Updated 3 days ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">Download</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Cost Plan Rev B</p>
                        <p className="text-sm text-gray-500">Updated 1 week ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">Download</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Hammer className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">Construction Program</p>
                        <p className="text-sm text-gray-500">Updated 2 weeks ago</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}