import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import { MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RegionalComparison {
  region: string;
  state: string;
  factor: number;
  adjustedRate: number;
  marketCondition: string;
  laborFactor: number;
  materialFactor: number;
}

interface RegionalComparisonChartProps {
  elementName: string;
  baseRate: number;
  baseRegion: string;
  comparisons: RegionalComparison[];
  className?: string;
}

export function RegionalComparisonChart({
  elementName,
  baseRate,
  baseRegion,
  comparisons,
  className = "",
}: RegionalComparisonChartProps) {
  // Sort by adjusted rate
  const sortedData = useMemo(() => {
    return [...comparisons].sort((a, b) => b.adjustedRate - a.adjustedRate);
  }, [comparisons]);

  // Calculate statistics
  const stats = useMemo(() => {
    const rates = comparisons.map(c => c.adjustedRate);
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const diff = max - min;
    const diffPercent = (diff / baseRate) * 100;
    
    return { min, max, avg, diff, diffPercent };
  }, [comparisons, baseRate]);

  // Color scale based on deviation from base
  const getBarColor = (rate: number) => {
    const diff = ((rate - baseRate) / baseRate) * 100;
    if (diff > 10) return "#ef4444"; // Red - significantly higher
    if (diff > 5) return "#f97316"; // Orange - higher
    if (diff < -10) return "#22c55e"; // Green - significantly lower
    if (diff < -5) return "#10b981"; // Emerald - lower
    return "#3b82f6"; // Blue - similar to base
  };

  const getMarketConditionBadge = (condition: string) => {
    switch (condition) {
      case "hot":
        return <Badge className="bg-red-100 text-red-800">Hot Market</Badge>;
      case "warm":
        return <Badge className="bg-orange-100 text-orange-800">Warm</Badge>;
      case "stable":
        return <Badge className="bg-green-100 text-green-800">Stable</Badge>;
      case "cool":
        return <Badge className="bg-blue-100 text-blue-800">Cool</Badge>;
      case "cold":
        return <Badge className="bg-gray-100 text-gray-800">Cold</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as RegionalComparison;
      const diff = ((data.adjustedRate - baseRate) / baseRate) * 100;
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">{data.state}</p>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-bold">
              ${data.adjustedRate.toLocaleString()}
            </p>
            <p className={`text-sm ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}% vs {baseRegion}
            </p>
            <p className="text-xs text-gray-500">
              Factor: {data.factor.toFixed(3)}
            </p>
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
              <div>Labor: {data.laborFactor.toFixed(2)}</div>
              <div>Material: {data.materialFactor.toFixed(2)}</div>
            </div>
          </div>
          {getMarketConditionBadge(data.marketCondition)}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Regional Cost Comparison
        </CardTitle>
        <CardDescription>
          {elementName} - Comparing rates across Australia
          <br />
          <span className="text-sm">
            Base: {baseRegion} at ${baseRate.toLocaleString()}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Highest</div>
            <div className="text-lg font-semibold text-red-600">${stats.max.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{sortedData[0]?.region}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Lowest</div>
            <div className="text-lg font-semibold text-green-600">${stats.min.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{sortedData[sortedData.length - 1]?.region}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Average</div>
            <div className="text-lg font-semibold">${stats.avg.toFixed(0).toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Range</div>
            <div className="text-lg font-semibold">{stats.diffPercent.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">${stats.diff.toLocaleString()} diff</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category" 
                dataKey="region" 
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={baseRate} stroke="#666" strokeDasharray="3 3" />
              <Bar dataKey="adjustedRate" radius={[0, 4, 4, 0]} barSize={20}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.adjustedRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>{'>10% Higher'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>5-10% Higher</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Within 5%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>5-10% Lower</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>{'<10% Lower'}</span>
          </div>
        </div>

        {/* Detailed List */}
        <ScrollArea className="h-[200px] border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2">Region</th>
                <th className="text-left p-2">State</th>
                <th className="text-right p-2">Rate</th>
                <th className="text-right p-2">vs Base</th>
                <th className="text-center p-2">Market</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((comparison) => {
                const diff = ((comparison.adjustedRate - baseRate) / baseRate) * 100;
                
                return (
                  <tr key={comparison.region} className="border-t hover:bg-gray-50">
                    <td className="p-2 font-medium">{comparison.region}</td>
                    <td className="p-2">{comparison.state}</td>
                    <td className="p-2 text-right font-medium">
                      ${comparison.adjustedRate.toLocaleString()}
                    </td>
                    <td className="p-2 text-right">
                      <span className={`flex items-center justify-end gap-1 ${
                        diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3" /> : 
                         diff < 0 ? <TrendingDown className="w-3 h-3" /> : 
                         <Minus className="w-3 h-3" />}
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="scale-75 origin-center">
                        {getMarketConditionBadge(comparison.marketCondition)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
