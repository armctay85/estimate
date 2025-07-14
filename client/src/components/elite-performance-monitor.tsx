import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, HardDrive, Wifi, Zap, TrendingUp, Users, Database, Cloud, Globe } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SystemMetrics {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  activeUsers: number;
  apiCalls: number;
  responseTime: number;
  uptime: string;
}

interface PerformanceData {
  time: string;
  responseTime: number;
  throughput: number;
  errors: number;
}

export function ElitePerformanceMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 23,
    memory: 45,
    storage: 67,
    network: 89,
    activeUsers: 423,
    apiCalls: 12847,
    responseTime: 45,
    uptime: "99.99%"
  });

  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([
    { time: "00:00", responseTime: 42, throughput: 1200, errors: 0 },
    { time: "04:00", responseTime: 38, throughput: 800, errors: 1 },
    { time: "08:00", responseTime: 51, throughput: 2400, errors: 0 },
    { time: "12:00", responseTime: 47, throughput: 3200, errors: 2 },
    { time: "16:00", responseTime: 44, throughput: 2800, errors: 0 },
    { time: "20:00", responseTime: 41, throughput: 1600, errors: 1 },
    { time: "24:00", responseTime: 39, throughput: 1000, errors: 0 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(10, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(100, Math.max(20, prev.memory + (Math.random() - 0.5) * 5)),
        storage: prev.storage,
        network: Math.min(100, Math.max(0, prev.network + (Math.random() - 0.5) * 15)),
        activeUsers: Math.max(300, prev.activeUsers + Math.floor((Math.random() - 0.5) * 20)),
        apiCalls: prev.apiCalls + Math.floor(Math.random() * 50),
        responseTime: Math.max(20, prev.responseTime + (Math.random() - 0.5) * 10),
        uptime: prev.uptime
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, type: string = "default") => {
    if (type === "response") {
      if (value < 50) return "text-green-600";
      if (value < 100) return "text-yellow-600";
      return "text-red-600";
    }
    if (value < 50) return "text-green-600";
    if (value < 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <Badge variant="outline" className={getStatusColor(metrics.cpu)}>
                {metrics.cpu.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.cpu} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <Badge variant="outline" className={getStatusColor(metrics.memory)}>
                {metrics.memory.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.memory} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              <Badge variant="outline" className={getStatusColor(metrics.storage)}>
                {metrics.storage.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.storage} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium">Network</span>
              </div>
              <Badge variant="outline" className={getStatusColor(metrics.network)}>
                {metrics.network.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.network} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Real-time Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Response Time Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Response Time</span>
              <span className={`text-lg font-bold ${getStatusColor(metrics.responseTime, "response")}`}>
                {metrics.responseTime.toFixed(0)}ms
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Throughput Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="throughput" 
                    stroke="#10b981" 
                    fill="#10b98133"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Requests/sec</p>
                <p className="text-lg font-bold text-green-600">2,847</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Avg Latency</p>
                <p className="text-lg font-bold text-blue-600">12ms</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Error Rate</p>
                <p className="text-lg font-bold text-red-600">0.02%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Elite Platform Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Active Users</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">API Calls Today</p>
                <p className="text-2xl font-bold text-green-900">{metrics.apiCalls.toLocaleString()}</p>
              </div>
              <Zap className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Platform Uptime</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.uptime}</p>
              </div>
              <Cloud className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700">Global Regions</p>
                <p className="text-2xl font-bold text-indigo-900">7</p>
              </div>
              <Globe className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}