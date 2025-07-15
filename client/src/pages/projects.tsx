import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Plus, 
  FolderOpen, 
  Clock, 
  DollarSign, 
  BarChart3,
  Calendar,
  Building,
  MoreVertical,
  Trash2,
  Edit,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  type: string;
  area: number;
  cost: number;
  rooms: number;
  status: 'draft' | 'in-progress' | 'completed';
  lastModified: string;
  progress: number;
}

export default function Projects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load projects from localStorage
    const loadProjects = () => {
      try {
        setLoading(true);
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

        // Add the current project if it exists
        const currentProject = localStorage.getItem('estimateProject');
        if (currentProject) {
          try {
            const project = JSON.parse(currentProject);
            const existingIndex = savedProjects.findIndex(p => p.id === 'current');
            if (existingIndex === -1) {
              savedProjects.push({
                id: 'current',
                name: 'Current Project',
                type: 'commercial',
                area: project.totalArea || 0,
                cost: project.totalCost || 0,
                rooms: project.rooms?.length || 0,
                status: 'in-progress',
                lastModified: new Date().toISOString(),
                progress: 65
              });
            }
          } catch (e) {
            console.error('Error parsing current project:', e);
          }
        }

        setProjects(savedProjects);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      if (id === 'current') {
        localStorage.removeItem('estimateProject');
      } else {
        localStorage.removeItem(`project_${id}`);
      }
      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: "Project deleted",
        description: "The project has been removed successfully.",
      });
    }
  };

  const handleViewProject = (id: string) => {
    navigate(`/project/${id}`);
  };

  const handleNewProject = () => {
    navigate('/');
    // Clear current project to start fresh
    localStorage.removeItem('estimateWorkspaceMode');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2 bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            </div>
            <Button
              onClick={handleNewProject}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => p.status === 'in-progress').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(projects.reduce((sum, p) => sum + p.cost, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Progress</p>
                  <p className="text-2xl font-bold">
                    {projects.length > 0 
                      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
                      : 0}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-4">Create your first project to get started</p>
              <Button onClick={handleNewProject}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewProject(project.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline">
                            <Building className="w-3 h-3 mr-1" />
                            {project.type}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewProject(project.id);
                          }}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}/edit`);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Area</p>
                          <p className="font-semibold">{project.area.toLocaleString()} m²</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Rooms</p>
                          <p className="font-semibold">{project.rooms}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-gray-600 text-sm mb-1">Estimated Cost</p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(project.cost)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>Modified {formatDate(project.lastModified)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}