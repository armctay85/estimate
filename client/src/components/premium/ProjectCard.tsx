import { motion } from "framer-motion";
import { Building2, MoreHorizontal, Clock, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    type: string;
    area: number;
    cost: number;
    rooms: number;
    status: 'draft' | 'in-progress' | 'completed' | 'on-hold';
    lastModified: string;
    progress: number;
    thumbnail?: string;
    client?: string;
  };
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

const statusConfig = {
  'draft': { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: null },
  'in-progress': { label: 'In Progress', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', icon: null },
  'completed': { label: 'Completed', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: null },
  'on-hold': { label: 'On Hold', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: null },
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

export function ProjectCard({ project, onView, onEdit, onDelete, index = 0 }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div 
        onClick={() => onView(project.id)}
        className="card-premium cursor-pointer overflow-hidden h-full flex flex-col"
      >
        {/* Thumbnail / Header */}
        <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 overflow-hidden">
          {/* Abstract Pattern */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 400 160" fill="none">
              <rect x="20" y="40" width="120" height="80" rx="4" fill="currentColor" className="text-blue-500/20" />
              <rect x="160" y="60" width="80" height="60" rx="4" fill="currentColor" className="text-blue-500/15" />
              <rect x="260" y="30" width="100" height="100" rx="4" fill="currentColor" className="text-blue-500/10" />
              <circle cx="340" cy="120" r="20" fill="currentColor" className="text-blue-500/25" />
            </svg>
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <Badge className={`${status.color} border-0 font-medium text-xs`}>
              {status.label}
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(project.id); }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project.id); }}>
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                  className="text-red-600 focus:text-red-600"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Project Type Icon */}
          <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span className="text-xs font-medium capitalize">{project.type}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>

          {project.client && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{project.client}</p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <TrendingUp className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Area</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{project.area.toLocaleString()} m²</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                <DollarSign className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Est. Cost</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(project.cost)}</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{project.progress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Modified {formatDate(project.lastModified)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
