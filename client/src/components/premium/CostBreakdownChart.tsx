import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";

interface CostCategory {
  name: string;
  value: number;
  color: string;
  items?: { name: string; quantity: number; unit: string; rate: number; total: number }[];
}

interface CostBreakdownChartProps {
  data: CostCategory[];
  totalCost: number;
  previousCost?: number;
  title?: string;
  showComparison?: boolean;
}

const COLORS = {
  structural: "#0066FF",
  architectural: "#00D4FF", 
  mep: "#8B5CF6",
  external: "#F59E0B",
  preliminaries: "#10B981",
  contingency: "#EF4444",
};

export function CostBreakdownChart({
  data,
  totalCost,
  previousCost,
  title = "Cost Breakdown",
  showComparison = false,
}: CostBreakdownChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pie" | "bar">("pie");

  const percentChange = previousCost 
    ? ((totalCost - previousCost) / previousCost) * 100 
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${((value / totalCost) * 100).toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-gray-800">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(data.value)} ({formatPercentage(data.value)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card-premium p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white number-display">
              {formatCurrency(totalCost)}
            </span>
            {percentChange !== null && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                percentChange >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {percentChange >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>+{percentChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    <span>{percentChange.toFixed(1)}%</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("pie")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === "pie" 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewMode("bar")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              viewMode === "bar" 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? '#fff' : 'transparent'}
                    strokeWidth={2}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                      transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.2s ease-out'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 4, 4, 0]}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend / Breakdown */}
      <div className="space-y-2">
        {data.map((category, index) => (
          <div key={category.name}>
            <motion.button
              onClick={() => setExpandedCategory(
                expandedCategory === category.name ? null : category.name
              )}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {category.name}
                </span>
                {category.items && category.items.length > 0 && (
                  <span className="text-xs text-gray-400">
                    {category.items.length} items
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900 dark:text-white number-display">
                  {formatCurrency(category.value)}
                </span>
                <span className="text-sm text-gray-500 w-14 text-right">
                  {formatPercentage(category.value)}
                </span>
                {category.items && category.items.length > 0 && (
                  expandedCategory === category.name ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )
                )}
              </div>
            </motion.button>

            {/* Expanded Items */}
            <AnimatePresence>
              {expandedCategory === category.name && category.items && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-2 py-2">
                    {category.items.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">
                            {item.quantity} {item.unit} × ${item.rate}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-gray-300 number-display w-24 text-right">
                            ${item.total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
