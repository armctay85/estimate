import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  FileBarChart, 
  Upload, 
  Camera, 
  FolderOpen,
  Settings as SettingsIcon,
  TrendingUp,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState({
    totalProjects: 12,
    totalValue: 4850000,
    completedProjects: 8,
    avgAccuracy: 97.2
  });

  const quickActions = [
    {
      id: 'cost-estimator',
      title: 'Quick Cost Estimator',
      description: 'Get instant Australian construction cost estimates',
      icon: Calculator,
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => navigate('/workspace?mode=estimator')
    },
    {
      id: 'photo-renovation',
      title: 'Photo Renovation AI',
      description: 'Upload photos and get AI renovation suggestions',
      icon: Camera,
      color: 'bg-purple-600 hover:bg-purple-700',
      action: () => navigate('/workspace?mode=photo')
    },
    {
      id: 'bim-upload',
      title: 'BIM File Processor',
      description: 'Upload CAD/BIM files for automated takeoff',
      icon: Upload,
      color: 'bg-green-600 hover:bg-green-700',
      action: () => navigate('/workspace?mode=bim')
    },
    {
      id: 'projects',
      title: 'My Projects',
      description: 'View and manage your construction projects',
      icon: FolderOpen,
      color: 'bg-orange-600 hover:bg-orange-700',
      action: () => navigate('/projects')
    },
    {
      id: 'reports',
      title: 'QS Reports',
      description: 'Generate professional quantity surveyor reports',
      icon: FileBarChart,
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => navigate('/reports')
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Account settings and preferences',
      icon: SettingsIcon,
      color: 'bg-gray-600 hover:bg-gray-700',
      action: () => navigate('/settings')
    }
  ];

  const recentActivity = [
    { id: 1, type: 'project', title: 'Starbucks Werribee DT', status: 'completed', value: 1320000, date: '2 hours ago' },
    { id: 2, type: 'estimate', title: 'Kitchen Renovation Quote', status: 'pending', value: 45000, date: '1 day ago' },
    { id: 3, type: 'report', title: 'QS Report - Office Fitout', status: 'generated', value: 180000, date: '3 days ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                EstiMate Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Professional construction cost estimation platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Enterprise Plan
              </Badge>
              <Button 
                onClick={() => navigate('/workspace')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-3"
              >
                New Project
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Projects</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${(stats.totalValue / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completedProjects}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Accuracy</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.avgAccuracy}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6" onClick={action.action}>
                  <div className="flex items-start space-x-4">
                    <div className={`${action.color} p-3 rounded-lg group-hover:scale-105 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              View All
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {activity.type === 'project' && <FolderOpen className="h-8 w-8 text-blue-600" />}
                          {activity.type === 'estimate' && <Calculator className="h-8 w-8 text-green-600" />}
                          {activity.type === 'report' && <FileBarChart className="h-8 w-8 text-purple-600" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {activity.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${activity.value.toLocaleString()}
                        </p>
                        <Badge 
                          variant={activity.status === 'completed' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}