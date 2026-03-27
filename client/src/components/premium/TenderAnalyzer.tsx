import React, { useState, useMemo } from 'react';
import { 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  Download,
  BarChart3,
  Scale,
  DollarSign,
  Percent,
  ChevronDown,
  ChevronRight,
  Building2,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TrustScoreGauge } from './TrustScoreGauge';
import { CostBreakdownChart } from './CostBreakdownChart';

// Types
interface BenchmarkRate {
  code: string;
  trade: string;
  category: string;
  description: string;
  unit: string;
  rate: number;
  region: string;
  source: string;
}

interface TenderLineItem {
  id: string;
  code?: string;
  description: string;
  quantity: number;
  unit: string;
  contractorRate: number;
  contractorTotal: number;
  benchmarkRate?: number;
  variance?: number;
  variancePercent?: number;
  status: 'within_range' | 'above_benchmark' | 'below_benchmark' | 'no_benchmark';
  category?: string;
}

interface TenderAnalysis {
  id: string;
  projectName: string;
  contractorName: string;
  region: string;
  projectType: string;
  uploadDate: string;
  totalValue: number;
  benchmarkValue: number;
  variance: number;
  variancePercent: number;
  trustScore: number;
  itemCount: number;
  flags: AnalysisFlag[];
  lineItems: TenderLineItem[];
}

interface AnalysisFlag {
  type: 'red' | 'yellow' | 'green';
  category: string;
  message: string;
  details?: string;
  items?: string[];
}

// Mock benchmark database (in production, load from seed data)
const BENCHMARK_DATA: BenchmarkRate[] = [
  { code: 'HOA0004', trade: 'Hoardings', category: '0 - Preliminaries', description: '1200 high hoarding panels', unit: 'lm', rate: 25.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'HOA0005', trade: 'Hoardings', category: '0 - Preliminaries', description: '2500 high hoarding panels', unit: 'lm', rate: 45.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'EL201', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'LED downlight 12W dimmable', unit: 'ea', rate: 85.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'EL202', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'LED panel light 600x600', unit: 'ea', rate: 145.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'EL301', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'GPO double power point', unit: 'ea', rate: 95.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'ME001', trade: 'Mechanical', category: '8.2 - Mechanical Services', description: 'Split system 3.5kW', unit: 'ea', rate: 1850.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'FC001', trade: 'Floor Coverings', category: '6.1 - Floor Finishes', description: 'Vinyl flooring 2mm', unit: 'm2', rate: 45.00, region: 'gladstone_qld', source: 'kmart' },
  { code: 'DC001', trade: 'Decorations', category: '7 - Decorating', description: 'Paint plasterboard walls', unit: 'm2', rate: 22.50, region: 'gladstone_qld', source: 'kmart' },
  { code: 'SC001', trade: 'Suspended Ceilings', category: '6.2 - Ceiling Finishes', description: 'Ceiling grid 600x600', unit: 'm2', rate: 28.50, region: 'gladstone_qld', source: 'kmart' },
  { code: 'GB001', trade: 'General Builders', category: '6 - Internal Finishes', description: '90mm timber stud wall', unit: 'm2', rate: 65.00, region: 'gladstone_qld', source: 'kmart' },
  // Regional variations
  { code: 'EL201', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'LED downlight 12W dimmable', unit: 'ea', rate: 98.00, region: 'sydney_nsw', source: 'kmart' },
  { code: 'EL201', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'LED downlight 12W dimmable', unit: 'ea', rate: 92.00, region: 'melbourne_vic', source: 'kmart' },
  { code: 'EL201', trade: 'Electrical', category: '8.1 - Electrical Services', description: 'LED downlight 12W dimmable', unit: 'ea', rate: 89.00, region: 'brisbane_qld', source: 'kmart' },
];

// Analysis functions
function analyzeTender(lineItems: Omit<TenderLineItem, 'benchmarkRate' | 'variance' | 'variancePercent' | 'status' | 'category'>[], region: string): TenderLineItem[] {
  return lineItems.map(item => {
    // Find matching benchmark
    const benchmark = BENCHMARK_DATA.find(b => 
      b.region === region && (
        b.code === item.code || 
        b.description.toLowerCase().includes(item.description.toLowerCase().substring(0, 10))
      )
    );
    
    if (!benchmark) {
      return {
        ...item,
        benchmarkRate: undefined,
        variance: undefined,
        variancePercent: undefined,
        status: 'no_benchmark',
        category: undefined
      };
    }
    
    const variance = item.contractorRate - benchmark.rate;
    const variancePercent = (variance / benchmark.rate) * 100;
    
    let status: TenderLineItem['status'];
    if (Math.abs(variancePercent) <= 10) {
      status = 'within_range';
    } else if (variancePercent > 10) {
      status = 'above_benchmark';
    } else {
      status = 'below_benchmark';
    }
    
    return {
      ...item,
      benchmarkRate: benchmark.rate,
      variance,
      variancePercent,
      status,
      category: benchmark.category
    };
  });
}

function generateFlags(items: TenderLineItem[]): AnalysisFlag[] {
  const flags: AnalysisFlag[] = [];
  
  // High variance items
  const highVariance = items.filter(i => i.variancePercent > 25);
  if (highVariance.length > 0) {
    flags.push({
      type: 'red',
      category: 'Pricing',
      message: `${highVariance.length} items significantly above benchmark (>25%)`,
      details: 'These rates may indicate insufficient competition or excessive markup',
      items: highVariance.slice(0, 5).map(i => i.description.substring(0, 40))
    });
  }
  
  // Suspiciously low rates
  const lowRates = items.filter(i => i.variancePercent < -20);
  if (lowRates.length > 0) {
    flags.push({
      type: 'yellow',
      category: 'Risk',
      message: `${lowRates.length} items below benchmark (>20%)`,
      details: 'May indicate scope omissions, low quality specifications, or provisional sums',
      items: lowRates.slice(0, 3).map(i => i.description.substring(0, 40))
    });
  }
  
  // Missing benchmarks
  const noBenchmark = items.filter(i => i.status === 'no_benchmark');
  if (noBenchmark.length > items.length * 0.3) {
    flags.push({
      type: 'yellow',
      category: 'Data',
      message: `${noBenchmark.length} items without benchmark data`,
      details: 'Consider adding these items to the database or requesting clarification'
    });
  }
  
  // Good coverage
  const withinRange = items.filter(i => i.status === 'within_range');
  if (withinRange.length > items.length * 0.6) {
    flags.push({
      type: 'green',
      category: 'Overall',
      message: 'Most items within acceptable range',
      details: `${withinRange.length} of ${items.length} items align with benchmark data`
    });
  }
  
  return flags;
}

// Components
export function TenderAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TenderAnalysis | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Mock analysis on mount (in production, this would come from API)
  React.useEffect(() => {
    const mockLineItems = [
      { id: '1', code: 'EL201', description: 'LED downlight 12W dimmable', quantity: 45, unit: 'ea', contractorRate: 95.00, contractorTotal: 4275 },
      { id: '2', code: 'EL202', description: 'LED panel light 600x600', quantity: 24, unit: 'ea', contractorRate: 165.00, contractorTotal: 3960 },
      { id: '3', code: 'EL301', description: 'GPO double power point', quantity: 18, unit: 'ea', contractorRate: 110.00, contractorTotal: 1980 },
      { id: '4', code: 'ME001', description: 'Split system air con 3.5kW', quantity: 4, unit: 'ea', contractorRate: 2100.00, contractorTotal: 8400 },
      { id: '5', code: 'FC001', description: 'Vinyl flooring 2mm', quantity: 180, unit: 'm2', contractorRate: 52.00, contractorTotal: 9360 },
      { id: '6', code: 'DC001', description: 'Paint plasterboard walls', quantity: 450, unit: 'm2', contractorRate: 28.50, contractorTotal: 12825 },
      { id: '7', code: 'SC001', description: 'Suspended ceiling grid', quantity: 180, unit: 'm2', contractorRate: 35.00, contractorTotal: 6300 },
      { id: '8', description: 'Custom feature lighting', quantity: 6, unit: 'ea', contractorRate: 450.00, contractorTotal: 2700 },
      { id: '9', code: 'HOA0004', description: '1200 hoarding panels', quantity: 85, unit: 'lm', contractorRate: 32.00, contractorTotal: 2720 },
      { id: '10', description: 'Specialist acoustic treatment', quantity: 45, unit: 'm2', contractorRate: 125.00, contractorTotal: 5625 },
    ];
    
    const analyzedItems = analyzeTender(mockLineItems, 'gladstone_qld');
    const contractorTotal = analyzedItems.reduce((sum, i) => sum + i.contractorTotal, 0);
    const benchmarkTotal = analyzedItems.reduce((sum, i) => sum + (i.benchmarkRate ? i.benchmarkRate * i.quantity : i.contractorTotal), 0);
    const variance = contractorTotal - benchmarkTotal;
    
    // Calculate trust score
    const withBenchmark = analyzedItems.filter(i => i.benchmarkRate);
    const withinRange = withBenchmark.filter(i => i.status === 'within_range').length;
    const trustScore = withBenchmark.length > 0 ? Math.round((withinRange / withBenchmark.length) * 100) : 50;
    
    setAnalysis({
      id: 'TA-2024-001',
      projectName: 'Kmart Gladstone Refit',
      contractorName: 'Samways Australia',
      region: 'gladstone_qld',
      projectType: 'Retail Fitout',
      uploadDate: new Date().toISOString(),
      totalValue: contractorTotal,
      benchmarkValue: benchmarkTotal,
      variance,
      variancePercent: (variance / benchmarkTotal) * 100,
      trustScore,
      itemCount: analyzedItems.length,
      flags: generateFlags(analyzedItems),
      lineItems: analyzedItems
    });
  }, []);
  
  const filteredItems = useMemo(() => {
    if (!analysis) return [];
    return analysis.lineItems.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [analysis, searchTerm, filterStatus]);
  
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, TenderLineItem[]> = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems]);
  
  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing tender...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tender Analysis</h1>
          <p className="text-muted-foreground">
            {analysis.projectName} • {analysis.contractorName}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {analysis.region.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {analysis.projectType}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {analysis.itemCount} items
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <TrustScoreGauge score={analysis.trustScore} size="md" />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contractor Total</p>
                <p className="text-2xl font-bold">${analysis.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Benchmark Value</p>
                <p className="text-2xl font-bold">${Math.round(analysis.benchmarkValue).toLocaleString()}</p>
              </div>
              <Scale className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variance</p>
                <p className={cn(
                  "text-2xl font-bold",
                  analysis.variance > 0 ? "text-red-500" : "text-green-500"
                )}>
                  {analysis.variance > 0 ? '+' : ''}${Math.round(analysis.variance).toLocaleString()}
                </p>
              </div>
              <Percent className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Variance %</p>
                <p className={cn(
                  "text-2xl font-bold",
                  analysis.variancePercent > 10 ? "text-red-500" : 
                  analysis.variancePercent > 0 ? "text-yellow-500" : "text-green-500"
                )}>
                  {analysis.variancePercent > 0 ? '+' : ''}{analysis.variancePercent.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Flags */}
      {analysis.flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Analysis Flags</h3>
          <div className="space-y-2">
            {analysis.flags.map((flag, i) => (
              <Alert key={i} variant={flag.type === 'red' ? 'destructive' : flag.type === 'yellow' ? 'default' : 'success'}>
                <AlertTitle className="flex items-center gap-2">
                  {flag.type === 'red' && <XCircle className="w-4 h-4" />}
                  {flag.type === 'yellow' && <AlertTriangle className="w-4 h-4" />}
                  {flag.type === 'green' && <CheckCircle2 className="w-4 h-4" />}
                  {flag.category}: {flag.message}
                </AlertTitle>
                {flag.details && <AlertDescription>{flag.details}</AlertDescription>}
              </Alert>
            ))}
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={filterStatus === null ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus(null)}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === 'above_benchmark' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('above_benchmark')}
            className="text-red-600"
          >
            Above Benchmark
          </Button>
          <Button 
            variant={filterStatus === 'within_range' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('within_range')}
            className="text-green-600"
          >
            Within Range
          </Button>
          <Button 
            variant={filterStatus === 'no_benchmark' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterStatus('no_benchmark')}
          >
            No Benchmark
          </Button>
        </div>
      </div>
      
      {/* Line Items by Category */}
      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <Card key={category}>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                const newExpanded = new Set(expandedCategories);
                if (newExpanded.has(category)) {
                  newExpanded.delete(category);
                } else {
                  newExpanded.add(category);
                }
                setExpandedCategories(newExpanded);
              }}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{category}</CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{items.length} items</Badge>
                  <span className="text-sm text-muted-foreground">
                    ${items.reduce((s, i) => s + i.contractorTotal, 0).toLocaleString()}
                  </span>
                  {expandedCategories.has(category) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
            
            {expandedCategories.has(category) && (
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Item</th>
                        <th className="p-3 text-left">Qty</th>
                        <th className="p-3 text-right">Contractor</th>
                        <th className="p-3 text-right">Benchmark</th>
                        <th className="p-3 text-right">Variance</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              {item.code && <span className="text-xs text-muted-foreground font-mono">{item.code} </span>}
                              <span className="font-medium">{item.description}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{item.trade}</div>
                          </td>
                          <td className="p-3">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="p-3 text-right">
                            <div>${item.contractorRate.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">${item.contractorTotal.toLocaleString()}</div>
                          </td>
                          <td className="p-3 text-right">
                            {item.benchmarkRate ? (
                              <div>
                                <div>${item.benchmarkRate.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${Math.round(item.benchmarkRate * item.quantity).toLocaleString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {item.variancePercent !== undefined ? (
                              <div className={cn(
                                "font-medium",
                                item.variancePercent > 10 ? "text-red-600" :
                                item.variancePercent < -10 ? "text-yellow-600" :
                                "text-green-600"
                              )}>
                                {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {item.status === 'within_range' && <Badge className="bg-green-100 text-green-800">Good</Badge>}
                            {item.status === 'above_benchmark' && <Badge className="bg-red-100 text-red-800">High</Badge>}
                            {item.status === 'below_benchmark' && <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>}
                            {item.status === 'no_benchmark' && <Badge variant="outline">No Data</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Alert component for flags
function Alert({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'destructive' | 'success';
}) {
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      variant === 'destructive' && "border-red-200 bg-red-50 text-red-900",
      variant === 'success' && "border-green-200 bg-green-50 text-green-900",
      variant === 'default' && "border-yellow-200 bg-yellow-50 text-yellow-900"
    )}>
      {children}
    </div>
  );
}

function AlertTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h5 className={cn("font-medium mb-1", className)}>{children}</h5>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm opacity-90">{children}</p>;
}
