import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  ArrowUpDown,
  FolderOpen,
  Clock,
  DollarSign,
  TrendingUp,
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectCard } from "@/components/premium/ProjectCard";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  client?: string;
  type: string;
  area: number;
  cost: number;
  rooms: number;
  status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
  lastModified: string;
  progress: number;
}

const filterOptions = [
  { value: 'all', label: 'All Projects' },
  { value: 'draft', label: 'Drafts' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const sortOptions = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'cost-high', label: 'Highest Cost' },
  { value: 'cost-low', label: 'Lowest Cost' },
  { value: 'name', label: 'Name A-Z' },
];

// Empty state illustration component
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6"
      >
        <FolderOpen className="w-12 h-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No projects yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6"
      >
        Create your first project to start estimating costs and managing your construction budgets.
      </p>
      <Button onClick={onCreate} className="btn-primary"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Project
      </Button>
    </motion.div>
  );
}

// Stats Card Component
function StatCard({ 
  title, 
  value, 
  change,
  icon: Icon,
  color 
}: { 
  title: string; 
  value: string; 
  change?: { value: string; positive: boolean };
  icon: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-5"
    >
      <div className="flex items-start justify-between"
      >
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white number-display">{value}</p>
          {change && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              change.positive ? 'text-green-600' : 'text-red-600'
            }`}
            >
              {change.positive ? '↑' : '↓'} {change.value}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectsPremium() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const savedProjects: Project[] = [];
      
      // Get all localStorage keys that start with 'project_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('project_')) {
          const projectData = localStorage.getItem(key);
          if (projectData) {
            try {
              const project = JSON.parse(projectData);
              savedProjects.push({
                id: key.replace('project_', ''),
                name: project.name || `Project ${savedProjects.length + 1}`,
                client: project.client || 'Unknown Client',
                type: project.type || 'commercial',
                area: project.totalArea || 0,
                cost: project.totalCost || 0,
                rooms: project.rooms?.length || 0,
                status: project.status || 'draft',
                lastModified: project.lastModified || new Date().toISOString(),
                progress: project.progress || Math.floor(Math.random() * 100)
              });
            } catch (e) {
              console.error('Error parsing project:', e);
            }
          }
        }
      }

      // Add demo projects if empty
      if (savedProjects.length === 0) {
        savedProjects.push(
          {
            id: 'demo-1',
            name: 'Starbucks Werribee Drive-Through',
            client: 'Starbucks Australia',
            type: 'commercial',
            area: 285,
            cost: 1320000,
            rooms: 12,
            status: 'in-progress',
            lastModified: new Date().toISOString(),
            progress: 65
          },
          {
            id: 'demo-2',
            name: 'Kmart Gladstone Renovation',
            client: 'Kmart Australia',
            type: 'retail',
            area: 2400,
            cost: 2450000,
            rooms: 8,
            status: 'completed',
            lastModified: new Date(Date.now() - 86400000 * 7).toISOString(),
            progress: 100
          },
          {
            id: 'demo-3',
            name: 'Office Tower Level 12',
            client: 'ABC Corporation',
            type: 'office',
            area: 850,
            cost: 890000,
            rooms: 15,
            status: 'draft',
            lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
            progress: 25
          }
        );
      }

      setProjects(savedProjects);
      setLoading(false);
    }, 500);
  };

  // Filter and sort projects
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.client?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        case 'oldest':
          return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        case 'cost-high':
          return b.cost - a.cost;
        case 'cost-low':
          return a.cost - b.cost;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      localStorage.removeItem(`project_${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast({ title: "Project deleted", description: "The project has been removed." });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    totalValue: projects.reduce((sum, p) => sum + p.cost, 0),
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800"
      >
        <div className="container-premium"
        >
          <div className="flex items-center justify-between h-16"
          >
            <div className="flex items-center gap-4"
            >
              <h1 className="text-xl font-bold text-gray-900 dark:text-white"
              >Projects</h1>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>

            <div className="flex items-center gap-3"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="hidden sm:flex"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => navigate('/sketch')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-premium py-8"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            title="Total Projects"
            value={stats.total.toString()}
            icon={FolderOpen}
            color="bg-blue-500"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress.toString()}
            icon={Clock}
            color="bg-amber-500"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={DollarSign}
            color="bg-green-500"
          />
          <StatCard
            title="Avg. Progress"
            value={`${stats.avgProgress}%`}
            icon={TrendingUp}
            color="bg-purple-500"
          />
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto"
          >
            <div className="relative flex-1 sm:flex-none"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-40"
              >
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3"
          >
            <Select value={sortBy} onValueChange={setSortBy}
            >
              <SelectTrigger className="w-44"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
            >
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="card-premium p-6 h-80 animate-pulse"
              >
                <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState onCreate={() => navigate('/sketch')} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  index={index}
                  onView={(id) => navigate(`/project/${id}`)}
                  onEdit={(id) => navigate(`/project/${id}/edit`)}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="card-premium overflow-hidden"
          >
            <div className="overflow-x-auto"
            >
              <table className="w-full"
            >
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700"
                  >
                    <th className="px-6 py-4 text-left text-sm font-semibold"
                    >Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold"
                    >Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold"
                    >Area</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold"
                    >Cost</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold"
                    >Progress</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold"
                    >Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800"
                >
                  {filteredProjects.map((project, index) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-6 py-4"
                      >
                        <div className="flex items-center gap-3"
                        >
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"
                          >
                            <FolderOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white"
                            >{project.name}</p>
                            <p className="text-sm text-gray-500">{project.client}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"
                      >
                        <Badge variant={
                          project.status === 'completed' ? 'default' :
                          project.status === 'in-progress' ? 'secondary' : 'outline'
                        }>
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400"
                      >
                        {project.area.toLocaleString()} m²
                      </td>
                      <td className="px-6 py-4 font-medium number-display"
                      >
                        {formatCurrency(project.cost)}
                      </td>
                      <td className="px-6 py-4"
                      >
                        <div className="flex items-center gap-3"
                        >
                          <Progress value={project.progress} className="w-24 h-2" />
                          <span className="text-sm text-gray-500">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/project/${project.id}`)}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/project/${project.id}/edit`)}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(project.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
