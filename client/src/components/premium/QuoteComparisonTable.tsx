import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  Download,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  estimates: {
    [quoteId: string]: {
      rate: number;
      total: number;
      notes?: string;
      confidence?: 'high' | 'medium' | 'low';
    };
  };
}

interface Quote {
  id: string;
  name: string;
  contractor: string;
  total: number;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  validityDays: number;
}

interface QuoteComparisonTableProps {
  quotes: Quote[];
  items: QuoteItem[];
  onSelectWinner?: (quoteId: string) => void;
  onExport?: () => void;
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-700' },
  under_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700' },
  approved: { label: 'Approved', color: 'bg-green-50 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700' },
};

const confidenceConfig = {
  high: { color: 'text-green-600', bg: 'bg-green-50', label: 'High' },
  medium: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Medium' },
  low: { color: 'text-red-600', bg: 'bg-red-50', label: 'Low' },
};

export function QuoteComparisonTable({ 
  quotes, 
  items, 
  onSelectWinner,
  onExport 
}: QuoteComparisonTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate variance
  const calculateVariance = (values: number[]) => {
    if (values.length < 2) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      range: max - min,
      rangePercent: ((max - min) / avg) * 100,
      lowest: min,
      highest: max,
    };
  };

  const totals = quotes.map(q => q.total);
  const variance = calculateVariance(totals);
  const lowestQuote = quotes.reduce((min, q) => q.total < min.total ? q : min, quotes[0]);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="card-premium p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Quote Comparison
            </h3>
            <p className="text-sm text-gray-500">
              Comparing {quotes.length} quotes across {items.length} line items
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
            >
              {viewMode === 'summary' ? 'Detailed View' : 'Summary View'}
            </button>
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Quote Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quotes.map((quote, index) => {
            const isLowest = quote.id === lowestQuote.id;
            const status = statusConfig[quote.status];
            const savings = isLowest ? 0 : quote.total - lowestQuote.total;
            const savingsPercent = isLowest ? 0 : (savings / quote.total) * 100;

            return (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedQuote(selectedQuote === quote.id ? null : quote.id)}
                className={`
                  relative p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedQuote === quote.id 
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${isLowest ? 'ring-2 ring-green-500/20' : ''}
                `}
              >
                {isLowest && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                    Lowest
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{quote.contractor}</p>
                    <p className="text-sm text-gray-500">{quote.name}</p>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>

                <div className="mb-3">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white number-display">
                    {formatCurrency(quote.total)}
                  </p>
                  {!isLowest && (
                    <p className="text-sm text-red-600">
                      +{formatCurrency(savings)} ({savingsPercent.toFixed(1)}%)
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Valid for {quote.validityDays} days</span>
                  <span>{new Date(quote.submittedDate).toLocaleDateString()}</span>
                </div>

                {onSelectWinner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectWinner(quote.id);
                    }}
                    className="w-full mt-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  >
                    Select as Winner
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Variance Alert */}
        {variance && variance.rangePercent > 20 && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                High Variance Detected
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Quotes vary by {variance.rangePercent.toFixed(1)}% ({formatCurrency(variance.range)} difference). 
                Review line items for discrepancies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Comparison Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white min-w-[250px]">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Qty
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Unit
                </th>
                {quotes.map(quote => (
                  <th 
                    key={quote.id}
                    className={`
                      px-4 py-3 text-right text-sm font-semibold min-w-[150px]
                      ${selectedQuote === quote.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}
                    `}
                  >
                    <div className={quote.id === lowestQuote.id ? 'text-green-600' : 'text-gray-900 dark:text-white'}>
                      {quote.contractor}
                    </div>
                    <div className="text-xs font-normal text-gray-500">
                      Rate / Total
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                  Variance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item, index) => {
                const itemEstimates = Object.values(item.estimates).map(e => e.total);
                const itemVariance = calculateVariance(itemEstimates);
                const isExpanded = expandedItems.has(item.id);
                const hasNotes = Object.values(item.estimates).some(e => e.notes);

                return (
                  <>
                    <tr 
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => hasNotes && toggleItem(item.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          {hasNotes && (
                            isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            )
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.description}
                          </span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        {item.unit}
                      </td>
                      {quotes.map(quote => {
                        const estimate = item.estimates[quote.id];
                        const isLowest = estimate?.total === Math.min(...itemEstimates);

                        return (
                          <td 
                            key={quote.id}
                            className={`
                              px-4 py-3 text-right
                              ${selectedQuote === quote.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                            `}
                          >
                            {estimate ? (
                              <div>
                                <div className={`
                                  text-sm font-medium number-display
                                  ${isLowest ? 'text-green-600' : 'text-gray-900 dark:text-white'}
                                `}>
                                  ${estimate.rate}
                                </div>
                                <div className="text-xs text-gray-500 number-display">
                                  ${estimate.total.toLocaleString()}
                                </div>
                                {estimate.confidence && (
                                  <Badge 
                                    variant="secondary"
                                    className={`
                                      text-[10px] mt-1
                                      ${confidenceConfig[estimate.confidence].bg}
                                      ${confidenceConfig[estimate.confidence].color}
                                    `}
                                  >
                                    {confidenceConfig[estimate.confidence].label}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        {itemVariance ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className={`
                                  inline-flex items-center gap-1 text-sm font-medium
                                  ${itemVariance.rangePercent > 20 ? 'text-red-600' : 'text-green-600'}
                                `}>
                                  {itemVariance.rangePercent > 20 && <AlertTriangle className="w-3 h-3" />}
                                  {itemVariance.rangePercent.toFixed(0)}%
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Range: {formatCurrency(itemVariance.range)}</p>
                                <p>Lowest: {formatCurrency(itemVariance.lowest)}</p>
                                <p>Highest: {formatCurrency(itemVariance.highest)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Notes */}
                    <AnimatePresence>
                      {isExpanded && hasNotes && (
                        <motion.tr
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <td colSpan={4 + quotes.length} className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                            <div className="space-y-2">
                              {quotes.map(quote => {
                                const estimate = item.estimates[quote.id];
                                if (!estimate?.notes) return null;

                                return (
                                  <div key={quote.id} className="flex items-start gap-2 text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 min-w-[100px]">
                                      {quote.contractor}:
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">{estimate.notes}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                  Total
                </td>
                {quotes.map(quote => {
                  const isLowest = quote.id === lowestQuote.id;
                  return (
                    <td 
                      key={quote.id}
                      className={`
                        px-4 py-3 text-right
                        ${selectedQuote === quote.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}
                      `}
                    >
                      <span className={`
                        text-lg font-bold number-display
                        ${isLowest ? 'text-green-600' : 'text-gray-900 dark:text-white'}
                      `}>
                        {formatCurrency(quote.total)}
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
