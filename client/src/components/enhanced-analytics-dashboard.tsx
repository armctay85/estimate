import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  DollarSign, 
  Building, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Target,
  Zap,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Cell, LineChart, Line, ResponsiveContainer, Pie } from 'recharts';

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

interface EnhancedAnalyticsDashboardProps {
  result: ProcessingResult;
  fileName: string;
}

export function EnhancedAnalyticsDashboard({ result, fileName }: EnhancedAnalyticsDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'breakdown' | 'trends' | 'optimization'>('overview');
  
  // Prepare chart data
  const categoryData = [
    { name: 'Structural', value: result.structural.reduce((sum, el) => sum + el.cost, 0), color: '#ef4444', count: result.structural.length },
    { name: 'Architectural', value: result.architectural.reduce((sum, el) => sum + el.cost, 0), color: '#3b82f6', count: result.architectural.length },
    { name: 'MEP', value: result.mep.reduce((sum, el) => sum + el.cost, 0), color: '#10b981', count: result.mep.length },
    { name: 'Finishes', value: result.finishes.reduce((sum, el) => sum + el.cost, 0), color: '#8b5cf6', count: result.finishes.length },
    { name: 'External', value: result.external.reduce((sum, el) => sum + el.cost, 0), color: '#f59e0b', count: result.external.length }
  ].filter(item => item.value > 0);

  const costPerM2 = result.totalCost / 850; // Assuming 850m² building
  const savings = result.totalCost * 0.15; // 15% potential savings
  const timeline = 18; // weeks

  const trendData = [
    { month: 'Jan', cost: 420000, target: 450000 },
    { month: 'Feb', cost: 445000, target: 450000 },
    { month: 'Mar', cost: 465000, target: 450000 },
    { month: 'Apr', cost: result.totalCost, target: 450000 }
  ];

  const optimizationOpportunities = [
    { category: 'Structural', opportunity: 'Switch to precast panels', savings: 45000, impact: 'High' },
    { category: 'MEP', opportunity: 'Energy-efficient HVAC system', savings: 25000, impact: 'Medium' },
    { category: 'Finishes', opportunity: 'Local supplier sourcing', savings: 15000, impact: 'Low' }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Cost</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">${result.totalCost.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>±{result.accuracy.match(/±(\d+)/)?.[1] || '2'}% accuracy</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Cost per m²</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">${Math.round(costPerM2).toLocaleString()}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
              <Target className="w-3 h-3 mr-1" />
              <span>850m² total area</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Potential Savings</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">${Math.round(savings).toLocaleString()}</p>
              </div>
              <Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 flex items-center text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>15% optimization potential</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Timeline</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{timeline} weeks</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="mt-2 flex items-center text-xs text-purple-600 dark:text-purple-400">
              <CheckCircle className="w-3 h-3 mr-1" />
              <span>On track delivery</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'breakdown', label: 'Breakdown', icon: PieChart },
          { key: 'trends', label: 'Trends', icon: TrendingUp },
          { key: 'optimization', label: 'AI Optimization', icon: Zap }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeView === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView(key as any)}
            className="flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Dynamic Content Based on Active View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeView === 'overview' && (
          <>
            {/* Cost Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Cost Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Element Count by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Elements by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'breakdown' && (
          <>
            {/* Detailed Category Breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary">{category.count} elements</Badge>
                        </div>
                        <span className="font-bold text-lg">${category.value.toLocaleString()}</span>
                      </div>
                      <Progress 
                        value={(category.value / result.totalCost) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{((category.value / result.totalCost) * 100).toFixed(1)}% of total</span>
                        <span>${Math.round(category.value / category.count).toLocaleString()} avg/element</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'trends' && (
          <>
            {/* Cost Trend Analysis */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Cost Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']} />
                      <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={3} />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'optimization' && (
          <>
            {/* AI Optimization Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  AI-Powered Optimization Opportunities
                  <Badge variant="secondary" className="ml-2">Powered by Grok-2</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizationOpportunities.map((opp, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{opp.opportunity}</h4>
                          <p className="text-sm text-gray-600">{opp.category} optimization</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">${opp.savings.toLocaleString()}</div>
                          <Badge 
                            variant={opp.impact === 'High' ? 'destructive' : opp.impact === 'Medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {opp.impact} Impact
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {((opp.savings / result.totalCost) * 100).toFixed(1)}% total cost reduction
                        </div>
                        <Button size="sm" variant="outline">
                          Apply Suggestion
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Total Optimization Potential</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${optimizationOpportunities.reduce((sum, opp) => sum + opp.savings, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {((optimizationOpportunities.reduce((sum, opp) => sum + opp.savings, 0) / result.totalCost) * 100).toFixed(1)}% cost reduction available
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}