import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  Search, 
  Command,
  Plus,
  FileText,
  TrendingUp,
  Users,
  Building,
  Clock,
  DollarSign,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Download,
  Settings,
  Bell,
  HelpCircle,
  Keyboard,
  Zap,
  Activity,
  BarChart3,
  Layers,
  Briefcase,
  Target,
  ChevronRight,
  ChevronDown,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import "../styles/enterprise.css";

// ============================================
// ENTERPRISE DATA TYPES
// ============================================
interface Project {
  id: string;
  code: string;
  name: string;
  client: string;
  type: 'commercial' | 'residential' | 'industrial' | 'infrastructure';
  status: 'draft' | 'pricing' | 'submitted' | 'won' | 'lost' | 'on-hold';
  value: number;
  margin: number;
  confidence: number;
  lastModified: string;
  assignedTo: string;
  location: string;
  area: number;
  deadline: string;
  version: number;
}

interface Metric {
  label: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
  format: 'currency' | 'percent' | 'number';
}

// ============================================
// MOCK DATA - ENTERPRISE SCALE
// ============================================
const MOCK_PROJECTS: Project[] = [
  { id: "1", code: "PRJ-2025-001", name: "Westfield Parramatta Expansion", client: "Scentre Group", type: "commercial", status: "pricing", value: 45000000, margin: 18.5, confidence: 87, lastModified: "2025-03-27T14:32:00Z", assignedTo: "Sarah Chen", location: "Parramatta, NSW", area: 25000, deadline: "2025-06-15", version: 12 },
  { id: "2", code: "PRJ-2025-002", name: "Lendlease Barangaroo Tower 3", client: "Lendlease", type: "commercial", status: "submitted", value: 128000000, margin: 22.3, confidence: 92, lastModified: "2025-03-27T12:15:00Z", assignedTo: "Michael Torres", location: "Barangaroo, NSW", area: 45000, deadline: "2025-05-30", version: 8 },
  { id: "3", code: "PRJ-2025-003", name: "Mirvac Residential Stage 4", client: "Mirvac", type: "residential", status: "won", value: 67000000, margin: 19.8, confidence: 95, lastModified: "2025-03-26T16:45:00Z", assignedTo: "Emma Wilson", location: "Green Square, NSW", area: 18000, deadline: "2025-08-20", version: 23 },
  { id: "4", code: "PRJ-2025-004", name: "CIMIC Western Sydney Airport", client: "CIMIC Group", type: "infrastructure", status: "pricing", value: 245000000, margin: 15.2, confidence: 78, lastModified: "2025-03-27T09:20:00Z", assignedTo: "David Park", location: "Badgerys Creek, NSW", area: 150000, deadline: "2025-04-30", version: 5 },
  { id: "5", code: "PRJ-2025-005", name: "GPT Office Refurbishment", client: "GPT Group", type: "commercial", status: "draft", value: 8500000, margin: 24.1, confidence: 65, lastModified: "2025-03-25T11:30:00Z", assignedTo: "Sarah Chen", location: "North Sydney, NSW", area: 3500, deadline: "2025-07-10", version: 3 },
  { id: "6", code: "PRJ-2025-006", name: "Stockland Industrial Park", client: "Stockland", type: "industrial", status: "submitted", value: 34000000, margin: 20.5, confidence: 89, lastModified: "2025-03-27T15:00:00Z", assignedTo: "James Liu", location: "Eastern Creek, NSW", area: 42000, deadline: "2025-06-01", version: 7 },
  { id: "7", code: "PRJ-2025-007", name: "Government School Upgrade", client: "NSW Government", type: "infrastructure", status: "pricing", value: 12000000, margin: 16.8, confidence: 82, lastModified: "2025-03-26T14:20:00Z", assignedTo: "Lisa Thompson", location: "Penrith, NSW", area: 8000, deadline: "2025-09-15", version: 4 },
  { id: "8", code: "PRJ-2025-008", name: "Meriton High-Rise Stage 2", client: "Meriton", type: "residential", status: "won", value: 89000000, margin: 21.4, confidence: 94, lastModified: "2025-03-24T10:15:00Z", assignedTo: "Michael Torres", location: "Chatswood, NSW", area: 22000, deadline: "2025-11-30", version: 31 },
  { id: "9", code: "PRJ-2025-009", name: "Charter Hall Logistics", client: "Charter Hall", type: "industrial", status: "lost", value: 28000000, margin: 17.9, confidence: 0, lastModified: "2025-03-20T16:00:00Z", assignedTo: "David Park", location: "Prestons, NSW", area: 38000, deadline: "2025-05-15", version: 12 },
  { id: "10", code: "PRJ-2025-010", name: "Dexus Office Tower", client: "Dexus", type: "commercial", status: "draft", value: 156000000, margin: 19.2, confidence: 58, lastModified: "2025-03-27T08:45:00Z", assignedTo: "Emma Wilson", location: "Parramatta, NSW", area: 32000, deadline: "2025-10-20", version: 2 },
];

// ============================================
// COMMAND PALETTE
// ============================================
interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: any;
  action: () => void;
  category: string;
}

function CommandPalette({ 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSelect: (action: () => void) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, navigate] = useLocation();

  const commands: CommandItem[] = useMemo(() => [
    { id: "new", label: "New Project", shortcut: "⌘N", icon: Plus, action: () => navigate("/sketch"), category: "Create" },
    { id: "projects", label: "View All Projects", shortcut: "⌘P", icon: Briefcase, action: () => navigate("/projects"), category: "Navigation" },
    { id: "reports", label: "Reports & Analytics", shortcut: "⌘R", icon: BarChart3, action: () => navigate("/reports"), category: "Navigation" },
    { id: "settings", label: "Settings", shortcut: "⌘,", icon: Settings, action: () => navigate("/settings"), category: "Navigation" },
    { id: "export", label: "Export Data", shortcut: "⌘E", icon: Download, action: () => {}, category: "Actions" },
    { id: "filter", label: "Filter Projects", shortcut: "⌘F", icon: Filter, action: () => {}, category: "Actions" },
    { id: "help", label: "Help & Documentation", shortcut: "?", icon: HelpCircle, action: () => {}, category: "Help" },
    { id: "shortcuts", label: "Keyboard Shortcuts", shortcut: "⇧?", icon: Keyboard, action: () => {}, category: "Help" },
  ], [navigate]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [commands, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex(i => (i + 1) % filteredCommands.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex].action);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose, onSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-[640px] max-w-[90vw] bg-[#111118] border border-[#27272a] rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-[#27272a]">
          <Search className="w-5 h-5 text-[#71717a]" />
          <input
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-[#fafafa] placeholder-[#52525b] outline-none text-base"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs bg-[#27272a] text-[#71717a] rounded">ESC</kbd>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.map((cmd, index) => {
            const Icon = cmd.icon;
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={cmd.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-[#2a2a36]" : "hover:bg-[#1a1a24]"
                }`}
                onClick={() => onSelect(cmd.action)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {Icon && <Icon className="w-4 h-4 text-[#71717a]" />}
                <span className="flex-1 text-sm text-[#fafafa]">{cmd.label}</span>
                <span className="text-xs text-[#71717a]">{cmd.category}</span>
                {cmd.shortcut && (
                  <kbd className="px-2 py-0.5 text-xs bg-[#27272a] text-[#a1a1aa] rounded font-mono">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#27272a] text-xs text-[#71717a]">
          <span>{filteredCommands.length} commands</span>
          <div className="flex items-center gap-4">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// METRIC CARD
// ============================================
function MetricCard({ 
  label, 
  value, 
  change, 
  prefix = "", 
  suffix = "", 
  format = "currency",
  isPositiveGood = true 
}: { 
  label: string; 
  value: number; 
  change: number;
  prefix?: string;
  suffix?: string;
  format?: "currency" | "percent" | "number";
  isPositiveGood?: boolean;
}) {
  const formattedValue = format === "currency" 
    ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(value)
    : format === "percent"
    ? `${value.toFixed(1)}%`
    : new Intl.NumberFormat("en-AU").format(value);

  const isPositive = change >= 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;
  const colorClass = isGood ? "text-[#22c55e]" : "text-[#ef4444]";

  return (
    <div className="p-4 bg-[#111118] border border-[#27272a] rounded-md">
      <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">{label}</div>
      <div className="text-xl font-semibold font-mono text-[#fafafa]">{formattedValue}</div>
      <div className={`text-xs font-mono mt-1 ${colorClass}`}>
        {isPositive ? "+" : ""}{change.toFixed(1)}% vs last month
      </div>
    </div>
  );
}

// ============================================
// PROJECT TABLE
// ============================================
function ProjectTable({ 
  projects, 
  selectedId, 
  onSelect 
}: { 
  projects: Project[]; 
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [sortKey, setSortKey] = useState<keyof Project>("lastModified");
  const [sortDesc, setSortDesc] = useState(true);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDesc ? bVal - aVal : aVal - bVal;
      }
      return 0;
    });
  }, [projects, sortKey, sortDesc]);

  const handleSort = (key: keyof Project) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  };

  const getStatusBadge = (status: Project["status"]) => {
    const config = {
      draft: { color: "bg-[#27272a] text-[#a1a1aa]", label: "DRAFT" },
      pricing: { color: "bg-[#f59e0b]/15 text-[#fbbf24]", label: "PRICING" },
      submitted: { color: "bg-[#3b82f6]/15 text-[#60a5fa]", label: "SUBMITTED" },
      won: { color: "bg-[#22c55e]/15 text-[#4ade80]", label: "WON" },
      lost: { color: "bg-[#ef4444]/15 text-[#f87171]", label: "LOST" },
      "on-hold": { color: "bg-[#71717a]/15 text-[#a1a1aa]", label: "ON HOLD" },
    };
    const cfg = config[status];
    return <span className={`px-2 py-0.5 text-[10px] font-semibold rounded ${cfg.color}`}>{cfg.label}</span>;
  };

  const getTypeIcon = (type: Project["type"]) => {
    switch (type) {
      case "commercial": return <Building className="w-3.5 h-3.5 text-[#3b82f6]" />;
      case "residential": return <Briefcase className="w-3.5 h-3.5 text-[#8b5cf6]" />;
      case "industrial": return <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />;
      case "infrastructure": return <Target className="w-3.5 h-3.5 text-[#22c55e]" />;
    }
  };

  return (
    <div className="flex-1 overflow-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead className="bg-[#1a1a24] sticky top-0 z-10">
          <tr className="border-b border-[#27272a]">
            <th className="px-3 py-2 text-left">
              <button onClick={() => handleSort("code")} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#71717a] hover:text-[#a1a1aa]">
                Code {sortKey === "code" && (sortDesc ? "↓" : "↑")}
              </button>
            </th>
            <th className="px-3 py-2 text-left">
              <button onClick={() => handleSort("name")} className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#71717a] hover:text-[#a1a1aa]">
                Project {sortKey === "name" && (sortDesc ? "↓" : "↑")}
              </button>
            </th>
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#71717a]">Client</th>
            <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-[#71717a]">Type</th>
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#71717a]">Status</th>
            <th className="px-3 py-2 text-right">
              <button onClick={() => handleSort("value")} className="flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wider text-[#71717a] hover:text-[#a1a1aa]">
                Value {sortKey === "value" && (sortDesc ? "↓" : "↑")}
              </button>
            </th>
            <th className="px-3 py-2 text-right">
              <button onClick={() => handleSort("margin")} className="flex items-center gap-1 ml-auto text-[10px] uppercase tracking-wider text-[#71717a] hover:text-[#a1a1aa]">
                Margin {sortKey === "margin" && (sortDesc ? "↓" : "↑")}
              </button>
            </th>
            <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wider text-[#71717a]">Conf</th>
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#71717a]">Assigned</th>
            <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-[#71717a]">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#27272a]">
          {sortedProjects.map((project) => (
            <tr
              key={project.id}
              className={`cursor-pointer transition-colors ${
                selectedId === project.id ? "bg-[#3b82f6]/10" : "hover:bg-[#1a1a24]"
              }`}
              onClick={() => onSelect(project.id)}
            >
              <td className="px-3 py-2 font-mono text-xs text-[#a1a1aa]">{project.code}</td>
              <td className="px-3 py-2">
                <div className="font-medium text-[#fafafa]">{project.name}</div>
                <div className="text-xs text-[#71717a]">{project.location}</div>
              </td>
              <td className="px-3 py-2 text-[#a1a1aa]">{project.client}</td>
              <td className="px-3 py-2 text-center">{getTypeIcon(project.type)}</td>
              <td className="px-3 py-2">{getStatusBadge(project.status)}</td>
              <td className="px-3 py-2 text-right font-mono text-[#fafafa]">{formatCurrency(project.value)}</td>
              <td className={`px-3 py-2 text-right font-mono ${project.margin >= 20 ? "text-[#22c55e]" : project.margin >= 15 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
                {project.margin.toFixed(1)}%
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-8 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        project.confidence >= 90 ? "bg-[#22c55e]" : 
                        project.confidence >= 70 ? "bg-[#f59e0b]" : "bg-[#ef4444]"
                      }`}
                      style={{ width: `${project.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-[#71717a]">{project.confidence}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-[#a1a1aa]">{project.assignedTo}</td>
              <td className="px-3 py-2 text-right text-xs text-[#71717a]">{formatDate(project.lastModified)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// ACTIVITY FEED
// ============================================
function ActivityFeed() {
  const activities = [
    { id: 1, user: "Sarah Chen", action: "updated estimate", target: "Westfield Parramatta", time: "2m ago", type: "edit" },
    { id: 2, user: "System", action: "synced rates", target: "Cost database v2025.03", time: "5m ago", type: "system" },
    { id: 3, user: "Michael Torres", action: "submitted quote", target: "Lendlease Barangaroo", time: "12m ago", type: "submit" },
    { id: 4, user: "Emma Wilson", action: "won project", target: "Mirvac Residential", time: "1h ago", type: "win" },
    { id: 5, user: "David Park", action: "commented on", target: "CIMIC Airport", time: "2h ago", type: "comment" },
  ];

  return (
    <div className="w-72 bg-[#111118] border-l border-[#27272a] flex flex-col">
      <div className="px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2 text-[#a1a1aa]">
          <Activity className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Activity</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activities.map((activity) => (
          <div key={activity.id} className="p-2 rounded hover:bg-[#1a1a24] cursor-pointer group">
            <div className="flex items-start gap-2">
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                activity.type === "edit" ? "bg-[#3b82f6]" :
                activity.type === "submit" ? "bg-[#f59e0b]" :
                activity.type === "win" ? "bg-[#22c55e]" :
                activity.type === "system" ? "bg-[#8b5cf6]" : "bg-[#71717a]"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#a1a1aa]">
                  <span className="text-[#fafafa] font-medium">{activity.user}</span>
                  {" "}{activity.action}{" "}
                  <span className="text-[#fafafa]">{activity.target}</span>
                </div>
                <div className="text-[10px] text-[#52525b] mt-0.5">{activity.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================
export default function EnterpriseDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return MOCK_PROJECTS;
    const q = searchQuery.toLowerCase();
    return MOCK_PROJECTS.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.client.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = MOCK_PROJECTS.length;
    const active = MOCK_PROJECTS.filter(p => ["pricing", "submitted"].includes(p.status)).length;
    const won = MOCK_PROJECTS.filter(p => p.status === "won").length;
    const totalValue = MOCK_PROJECTS.reduce((sum, p) => sum + p.value, 0);
    const avgMargin = MOCK_PROJECTS.reduce((sum, p) => sum + p.margin, 0) / total;
    const pipelineValue = MOCK_PROJECTS.filter(p => ["draft", "pricing", "submitted"].includes(p.status))
      .reduce((sum, p) => sum + p.value, 0);
    
    return { total, active, won, totalValue, avgMargin, pipelineValue };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] text-[#fafafa] overflow-hidden">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-[#27272a]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#3b82f6] rounded flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">ESTIMATE</span>
          </div>
          
          <nav className="flex items-center gap-1">
            {[
              { label: "Dashboard", path: "/", active: true },
              { label: "Projects", path: "/projects", active: false },
              { label: "Reports", path: "/reports", active: false },
              { label: "Team", path: "/team", active: false },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  item.active 
                    ? "text-[#fafafa] bg-[#27272a]" 
                    : "text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a24]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#71717a] bg-[#1a1a24] border border-[#27272a] rounded hover:border-[#3f3f46] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#27272a] rounded">⌘K</kbd>
          </button>
          
          <div className="flex items-center gap-1">
            <button className="p-1.5 text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a24] rounded transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#1a1a24] rounded transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 bg-[#3b82f6] rounded-full flex items-center justify-center text-[10px] font-medium ml-2">
              JD
            </div>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div className="grid grid-cols-6 gap-px bg-[#27272a]">
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Total Projects</div>
          <div className="text-lg font-semibold font-mono">{metrics.total}</div>
        </div>
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Active Pricing</div>
          <div className="text-lg font-semibold font-mono text-[#3b82f6]">{metrics.active}</div>
        </div>
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Won YTD</div>
          <div className="text-lg font-semibold font-mono text-[#22c55e]">{metrics.won}</div>
        </div>
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Total Value</div>
          <div className="text-lg font-semibold font-mono">
            ${(metrics.totalValue / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Pipeline</div>
          <div className="text-lg font-semibold font-mono text-[#f59e0b]">
            ${(metrics.pipelineValue / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="bg-[#111118] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-1">Avg Margin</div>
          <div className="text-lg font-semibold font-mono">{metrics.avgMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Projects Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#27272a] bg-[#111118]">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Projects</h2>
              <div className="h-4 w-px bg-[#27272a]" />
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#a1a1aa] bg-[#1a1a24] border border-[#27272a] rounded hover:border-[#3f3f46] transition-colors">
                  <Filter className="w-3 h-3" />
                  Filter
                </button>
                <button className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#a1a1aa] bg-[#1a1a24] border border-[#27272a] rounded hover:border-[#3f3f46] transition-colors">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525b]" />
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-8 pr-3 py-1.5 text-xs bg-[#0a0a0f] border border-[#27272a] rounded focus:border-[#3b82f6] focus:outline-none transition-colors placeholder-[#52525b]"
                />
              </div>
              <button 
                onClick={() => navigate("/sketch")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#3b82f6] rounded hover:bg-[#2563eb] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          </div>

          {/* Project Table */}
          <ProjectTable 
            projects={filteredProjects}
            selectedId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#111118] border-t border-[#27272a] text-[11px] text-[#71717a]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Live</span>
              </div>
              <span>{filteredProjects.length} projects</span>
              <span>Last sync: 2s ago</span>
            </div>
            <div className="flex items-center gap-4">
              <span>v3.2.1</span>
              <span className="text-[#3b82f6]">Pro Plan</span>
            </div>
          </div>
        </div>

        {/* Activity Sidebar */}
        <ActivityFeed />
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <CommandPalette
            isOpen={commandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onSelect={(action) => {
              action();
              setCommandPaletteOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
