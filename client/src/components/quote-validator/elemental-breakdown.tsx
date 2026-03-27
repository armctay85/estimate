import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  Building2,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Home
} from "lucide-react";

interface ElementalItem {
  elementCode: string;
  elementName: string;
  category: string;
  quoteAmount: number;
  marketAmount: number;
  variance: number;
  variancePercent: string;
  flag: 'ok' | 'warning' | 'critical';
  percentOfTotal: number;
}

interface ElementalBreakdownProps {
  items: ElementalItem[];
  totalQuote: number;
  totalMarket: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Substructure': <Building2 className="w-4 h-4" />,
  'Superstructure': <Home className="w-4 h-4" />,
  'Finishes': <Paintbrush className="w-4 h-4" />,
  'Services': <Zap className="w-4 h-4" />,
  'Plumbing': <Droplets className="w-4 h-4" />,
  'External Works': <Hammer className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  'Substructure': 'bg-amber-100 text-amber-800 border-amber-200',
  'Superstructure': 'bg-blue-100 text-blue-800 border-blue-200',
  'Finishes': 'bg-purple-100 text-purple-800 border-purple-200',
  'Services': 'bg-green-100 text-green-800 border-green-200',
  'Plumbing': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  'External Works': 'bg-gray-100 text-gray-800 border-gray-200',
};

export function ElementalBreakdown({ items, totalQuote, totalMarket }: ElementalBreakdownProps) {
  const getFlagColor = (flag: ElementalItem['flag']) => {
    switch (flag) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 5) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (variance < -5) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Group by category
  const groupedByCategory = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ElementalItem[]>);

  const categories = Object.keys(groupedByCategory).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="w-5 h-5" />
          Elemental Cost Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500 uppercase">Quote Total</p>
            <p className="text-xl font-bold">${totalQuote.toLocaleString()}</p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Market Estimate</p>
            <p className="text-xl font-bold">${totalMarket.toLocaleString()}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryItems = groupedByCategory[category];
            const categoryQuote = categoryItems.reduce((sum, i) => sum + i.quoteAmount, 0);
            const categoryMarket = categoryItems.reduce((sum, i) => sum + i.marketAmount, 0);
            const categoryPercent = (categoryQuote / totalQuote) * 100;
            const categoryVariance = ((categoryQuote - categoryMarket) / categoryMarket) * 100;
            const hasIssues = categoryItems.some(i => i.flag === 'warning' || i.flag === 'critical');

            return (
              <div key={category} className="border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={cn(categoryColors[category] || 'bg-gray-100')}>
                      <div className="flex items-center gap-1">
                        {categoryIcons[category] || <Layers className="w-4 h-4" />}
                        <span>{category}</span>
                      </div>
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {categoryItems.length} items
                    </span>
                    {hasIssues && (
                      <span className="text-xs text-amber-600">⚠ Issues found</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${categoryQuote.toLocaleString()}</p>
                    <div className="flex items-center justify-end gap-1 text-xs">
                      {getVarianceIcon(categoryVariance)}
                      <span className={cn(
                        categoryVariance > 5 ? "text-red-600" : 
                        categoryVariance < -5 ? "text-green-600" : "text-gray-500"
                      )}>
                        {categoryVariance > 0 ? '+' : ''}{categoryVariance.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar showing % of total */}
                <div className="px-4 pb-2">
                  <Progress value={categoryPercent} className="h-1" />
                  <p className="text-xs text-gray-400 mt-1">
                    {categoryPercent.toFixed(1)}% of total quote
                  </p>
                </div>

                {/* Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="text-xs">Element</TableHead>
                      <TableHead className="text-xs text-right">Quote</TableHead>
                      <TableHead className="text-xs text-right">Market</TableHead>
                      <TableHead className="text-xs text-right">Variance</TableHead>
                      <TableHead className="text-xs text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryItems.map((item) => (
                      <TableRow key={item.elementCode}>
                        <TableCell className="py-2">
                          <div>
                            <p className="font-medium text-sm">{item.elementName}</p>
                            <p className="text-xs text-gray-500">{item.elementCode}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          ${item.quoteAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          ${item.marketAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex items-center justify-end gap-1">
                            {getVarianceIcon(item.variance)}
                            <span className={cn(
                              "text-sm",
                              item.variance > 5 ? "text-red-600" : 
                              item.variance < -5 ? "text-green-600" : "text-gray-500"
                            )}>
                              {item.variancePercent}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <Badge className={cn("text-xs", getFlagColor(item.flag))}>
                            {item.flag === 'ok' ? '✓' : item.flag === 'warning' ? '!' : '✗'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-100"></span>
            Within 10% of market rate
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-100"></span>
            10-25% above market
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-100"></span>
            &gt;25% above market
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
