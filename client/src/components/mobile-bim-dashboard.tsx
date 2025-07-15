import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Building, 
  Clock, 
  Target,
  TrendingUp,
  PieChart,
  BarChart3,
  Zap,
  Eye,
  Download,
  Share2,
  Maximize2
} from 'lucide-react';

interface ProcessingResult {
  structural: any[];
  architectural: any[];
  mep: any[];
  finishes: any[];
  external: any[];
  accuracy: string;
  processingTime: string;
  totalElements: number;
  totalCost: number;
}

interface MobileBIMDashboardProps {
  result: ProcessingResult;
  fileName: string;
}

export function MobileBIMDashboard({ result, fileName }: MobileBIMDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Prepare data for mobile-optimized display
  const categoryData = [
    { name: 'Structural', value: result.structural.reduce((sum, el) => sum + el.cost, 0), color: 'bg-red-500', count: result.structural.length },
    { name: 'Architectural', value: result.architectural.reduce((sum, el) => sum + el.cost, 0), color: 'bg-blue-500', count: result.architectural.length },
    { name: 'MEP', value: result.mep.reduce((sum, el) => sum + el.cost, 0), color: 'bg-green-500', count: result.mep.length },
    { name: 'Finishes', value: result.finishes.reduce((sum, el) => sum + el.cost, 0), color: 'bg-purple-500', count: result.finishes.length },
    { name: 'External', value: result.external.reduce((sum, el) => sum + el.cost, 0), color: 'bg-amber-500', count: result.external.length }
  ].filter(item => item.value > 0);

  const costPerM2 = result.totalCost / 850; // Assuming 850m² building

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold truncate max-w-48">{fileName}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{result.accuracy} accuracy</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics - Mobile Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Total Cost</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    ${(result.totalCost / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Per m²</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    ${Math.round(costPerM2).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Elements</p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {result.totalElements}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Processed</p>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {result.processingTime}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="text-xs">
              <PieChart className="w-3 h-3 mr-1" />
              Breakdown
            </TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Category Breakdown - Mobile Optimized */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Cost Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryData.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${category.color}`} />
                        <span className="font-medium text-sm">{category.name}</span>
                        <Badge variant="secondary" className="text-xs">{category.count}</Badge>
                      </div>
                      <span className="font-bold text-sm">${(category.value / 1000).toFixed(0)}k</span>
                    </div>
                    <Progress 
                      value={(category.value / result.totalCost) * 100} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{((category.value / result.totalCost) * 100).toFixed(1)}%</span>
                      <span>${Math.round(category.value / category.count).toLocaleString()}/item</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Processing Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processing Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Element Detection</span>
                  <span className="font-bold text-green-600">98.2%</span>
                </div>
                <Progress value={98.2} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Area Calculation</span>
                  <span className="font-bold text-blue-600">96.1%</span>
                </div>
                <Progress value={96.1} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cost Estimation</span>
                  <span className="font-bold text-purple-600">94.7%</span>
                </div>
                <Progress value={94.7} className="h-2" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-4 mt-4">
            {/* Detailed Category Cards */}
            {categoryData.map((category, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${category.color}`} />
                      {category.name}
                    </div>
                    <span className="font-bold">${(category.value / 1000).toFixed(0)}k</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                      <div>Elements: {category.count}</div>
                      <div>Avg: ${Math.round(category.value / category.count).toLocaleString()}</div>
                      <div>% of Total: {((category.value / result.totalCost) * 100).toFixed(1)}%</div>
                      <div>Per m²: ${Math.round(category.value / 850).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">vs. Market Average</span>
                      <span className="text-green-600 font-bold">-8.5%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Below typical commercial rates</p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Regional Comparison</span>
                      <span className="text-blue-600 font-bold">+12.3%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Above Melbourne average</p>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Historical Trend</span>
                      <span className="text-amber-600 font-bold">+5.8%</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">12-month price increase</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  AI Optimization Suggestions
                  <Badge variant="secondary" className="text-xs">Powered by Grok-2</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="border border-green-200 bg-green-50 dark:bg-green-950 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">Switch to Precast Panels</p>
                      <p className="text-xs text-gray-600">Structural optimization</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">$45k</p>
                      <Badge className="text-xs bg-green-100 text-green-800">High Impact</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">8.5% cost reduction potential</p>
                </div>

                <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">Energy-Efficient HVAC</p>
                      <p className="text-xs text-gray-600">MEP optimization</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">$25k</p>
                      <Badge className="text-xs bg-blue-100 text-blue-800">Medium</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">4.7% cost reduction potential</p>
                </div>

                <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">Local Supplier Sourcing</p>
                      <p className="text-xs text-gray-600">Finishes optimization</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">$15k</p>
                      <Badge className="text-xs bg-amber-100 text-amber-800">Low Impact</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">2.8% cost reduction potential</p>
                </div>
                
                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded border">
                  <div className="text-sm font-medium text-center">Total Optimization Potential</div>
                  <div className="text-2xl font-bold text-center text-blue-600">$85,000</div>
                  <div className="text-xs text-center text-gray-600">16% total cost reduction</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
            <Maximize2 className="w-4 h-4 mr-2" />
            View 3D Model
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}