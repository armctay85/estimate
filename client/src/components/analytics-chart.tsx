import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  name: string;
  cost: number;
  index: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Analysis</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="cost" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}