import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Info,
  Building2,
  DollarSign,
  Percent,
  Scale
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AnalyzedItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  quoteRate: number;
  marketRate: number;
  variance: number;
  variancePercent: string;
  flag: 'ok' | 'warning' | 'critical';
  element?: string;
  category: string;
  notes?: string;
}

export interface QuoteAnalysis {
  trustScore: number;
  verdict: string;
  items: AnalyzedItem[];
  summaryFlags: string[];
  laborPercentage: number;
  materialPercentage: number;
  hasContingency: boolean;
  contingencyAmount: number;
  totalQuoteAmount: number;
  estimatedMarketTotal: number;
  potentialSavings: number;
}

interface QuoteAnalyzerProps {
  analysis: QuoteAnalysis;
  onRequestNegotiation: () => void;
}

export function QuoteAnalyzer({ analysis, onRequestNegotiation }: QuoteAnalyzerProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const getFlagColor = (flag: AnalyzedItem['flag']) => {
    switch (flag) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFlagIcon = (flag: AnalyzedItem['flag']) => {
    switch (flag) {
      case 'ok': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 10) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (variance < -10) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const criticalCount = analysis.items.filter(i => i.flag === 'critical').length;
  const warningCount = analysis.items.filter(i => i.flag === 'warning').length;
  const okCount = analysis.items.filter(i => i.flag === 'ok').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={cn(
          criticalCount > 0 ? "border-red-200" : "border-green-200"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600">Critical</span>
            </div>
            <p className="text-2xl font-bold mt-1">{criticalCount}</p>
          </CardContent>
        </Card>

        <Card className={warningCount > 0 ? "border-amber-200" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-600">Warnings</span>
            </div>
            <p className="text-2xl font-bold mt-1">{warningCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">Fair</span>
            </div>
            <p className="text-2xl font-bold mt-1">{okCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-600">Potential Savings</span>
            </div>
            <p className={cn(
              "text-2xl font-bold mt-1",
              analysis.potentialSavings > 0 ? "text-green-600" : "text-gray-600"
            )}>
              ${analysis.potentialSavings.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Flags */}
      {analysis.summaryFlags.length > 0 && (
        <Alert className={cn(
          criticalCount > 0 
            ? "bg-red-50 border-red-200" 
            : warningCount > 0 
              ? "bg-amber-50 border-amber-200" 
              : "bg-green-50 border-green-200"
        )}>
          <AlertCircle className={cn(
            "h-5 w-5",
            criticalCount > 0 
              ? "text-red-600" 
              : warningCount > 0 
                ? "text-amber-600" 
                : "text-green-600"
          )} />
          <AlertDescription className="ml-2">
            <ul className="list-disc list-inside space-y-1">
              {analysis.summaryFlags.map((flag, index) => (
                <li key={index} className={cn(
                  criticalCount > 0 
                    ? "text-red-800" 
                    : warningCount > 0 
                      ? "text-amber-800" 
                      : "text-green-800"
                )}>
                  {flag}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" />
            Cost Composition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Labor ({analysis.laborPercentage.toFixed(1)}%)</span>
              <span className={cn(
                analysis.laborPercentage > 35 ? "text-red-600 font-medium" : ""
              )}>
                {analysis.laborPercentage > 35 && "Higher than typical (25-30%)"}
              </span>
            </div>
            <Progress 
              value={analysis.laborPercentage} 
              className={cn(
                analysis.laborPercentage > 35 ? "text-red-500" : ""
              )}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Materials ({analysis.materialPercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={analysis.materialPercentage} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Contingency:</span>
            </div>
            {analysis.hasContingency ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                ${analysis.contingencyAmount.toLocaleString()}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                Not included (recommend 5-10%)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Line Item Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="w-4 h-4" />
            Line Item Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {analysis.items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getFlagIcon(item.flag)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-gray-500">
                        {item.category} {item.element && `• ${item.element}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">${item.quoteRate.toLocaleString()}/{item.unit}</p>
                      <div className="flex items-center justify-end gap-1 text-xs">
                        {getVarianceIcon(item.variance)}
                        <span className={cn(
                          item.variance > 10 
                            ? "text-red-600" 
                            : item.variance < -10 
                              ? "text-green-600" 
                              : "text-gray-500"
                        )}>
                          {item.variancePercent}
                        </span>
                      </div>
                    </div>

                    <Badge className={cn("ml-2", getFlagColor(item.flag))}>
                      {item.flag === 'ok' ? 'Fair' : item.flag === 'warning' ? 'High' : 'Very High'}
                    </Badge>

                    {expandedItems.has(item.id) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedItems.has(item.id) && (
                  <div className="mt-4 pl-7 space-y-3">
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500">Quote Rate</p>
                        <p className="font-medium">${item.quoteRate.toLocaleString()}/{item.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Market Rate</p>
                        <p className="font-medium">${item.marketRate.toLocaleString()}/{item.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Variance</p>
                        <p className={cn(
                          "font-medium",
                          item.variance > 10 ? "text-red-600" : "text-green-600"
                        )}>
                          {item.variancePercent}
                        </p>
                      </div>
                    </div>

                    {item.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-600">{item.notes}</p>
                      </div>
                    )}

                    <div className="text-sm">
                      <p className="text-gray-500">
                        Total: {item.quantity} {item.unit} × ${item.quoteRate.toLocaleString()} = 
                        <span className="font-semibold">${(item.quantity * item.quoteRate).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      {(criticalCount > 0 || warningCount > 0) && (
        <Button 
          onClick={onRequestNegotiation}
          className="w-full"
          variant="outline"
        >
          Get Negotiation Tips
        </Button>
      )}
    </div>
  );
}
