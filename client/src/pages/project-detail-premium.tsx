import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  DollarSign,
  Calendar,
  Users,
  FileText,
  Settings,
  MoreHorizontal,
  Edit,
  Download,
  Share2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  MapPin,
  Briefcase,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  Image as ImageIcon,
  Shield,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CostBreakdownChart,
  TrustScoreGauge,
  ActivityFeed,
  QuoteComparisonTable,
  UploadProgress
} from "@/components/premium";
import { BIMViewer } from "@/components/BIMViewer";

// Navigation items for sidebar
const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'costs', label: 'Cost Breakdown', icon: DollarSign },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Mock data
const mockProject = {
  id: "starbucks-werribee",
  name: "Starbucks Werribee Drive-Through",
  client: "Starbucks Australia",
  location: "Werribee, VIC",
  status: "In Progress",
  totalCost: 1320000,
  paidToDate: 528000,
  startDate: "2025-01-01",
  endDate: "2025-04-01",
  completion: 65,
  projectType: "Commercial - QSR",
  area: 285,
  trustScore: 87,
  description: "New drive-through coffee shop with indoor seating, kitchen facilities, and external drive-through lane.",
  phases: [
    { name: "Site Establishment", status: "complete", cost: 35000 },
    { name: "Site Works & Strip", status: "complete", cost: 45000 },
    { name: "Concrete Slab & Footings", status: "in-progress", cost: 85000 },
    { name: "Precast Panels", status: "pending", cost: 120000 },
    { name: "Steel Structure", status: "pending", cost: 95000 },
    { name: "Roofing & Cladding", status: "pending", cost: 75000 },
    { name: "Services Rough-In", status: "pending", cost: 110000 },
    { name: "Internal Fitout", status: "pending", cost: 145000 },
    { name: "Kitchen Equipment", status: "pending", cost: 180000 },
    { name: "External Works & Drive-Thru", status: "pending", cost: 165000 },
    { name: "Services Fit-Off", status: "pending", cost: 55000 },
    { name: "Signage & Landscaping", status: "pending", cost: 85000 },
    { name: "Commissioning", status: "pending", cost: 45000 }
  ],
  costBreakdown: [
    {
      name: "Structural",
      value: 320000,
      color: "#0066FF",
      items: [
        { name: "Concrete Slab 165m²", quantity: 165, unit: "m²", rate: 165, total: 27225 },
        { name: "Footings & Pad Footings", quantity: 45, unit: "m³", rate: 850, total: 38250 },
        { name: "Precast Concrete Panels", quantity: 380, unit: "m²", rate: 280, total: 106400 },
        { name: "Steel Structure & Awnings", quantity: 12, unit: "t", rate: 3500, total: 42000 },
        { name: "Roofing - Colorbond", quantity: 320, unit: "m²", rate: 85, total: 27200 },
        { name: "External Cladding", quantity: 180, unit: "m²", rate: 110, total: 19800 },
        { name: "Miscellaneous Steel", quantity: 1, unit: "item", rate: 15000, total: 15000 }
      ]
    },
    {
      name: "Architectural",
      value: 290000,
      color: "#00D4FF",
      items: [
        { name: "Internal Partitions", quantity: 120, unit: "m²", rate: 85, total: 10200 },
        { name: "Suspended Ceilings", quantity: 185, unit: "m²", rate: 65, total: 12025 },
        { name: "Floor Finishes - Tiles", quantity: 165, unit: "m²", rate: 95, total: 15675 },
        { name: "Wall Finishes", quantity: 380, unit: "m²", rate: 45, total: 17100 },
        { name: "Doors & Hardware", quantity: 12, unit: "no", rate: 1200, total: 14400 },
        { name: "Glazing & Shopfront", quantity: 65, unit: "m²", rate: 450, total: 29250 },
        { name: "Commercial Kitchen Fitout", quantity: 1, unit: "item", rate: 180000, total: 180000 },
        { name: "Joinery & Counters", quantity: 1, unit: "item", rate: 35000, total: 35000 }
      ]
    },
    {
      name: "MEP Services",
      value: 385000,
      color: "#8B5CF6",
      items: [
        { name: "Electrical Installation", quantity: 285, unit: "m²", rate: 125, total: 35625 },
        { name: "Lighting & Power", quantity: 285, unit: "m²", rate: 85, total: 24225 },
        { name: "Fire Services", quantity: 285, unit: "m²", rate: 45, total: 12825 },
        { name: "Plumbing & Drainage", quantity: 285, unit: "m²", rate: 95, total: 27075 },
        { name: "HVAC Systems", quantity: 285, unit: "m²", rate: 185, total: 52725 },
        { name: "Kitchen Exhaust System", quantity: 1, unit: "item", rate: 45000, total: 45000 },
        { name: "Data & Communications", quantity: 285, unit: "m²", rate: 35, total: 9975 },
        { name: "Security & CCTV", quantity: 1, unit: "item", rate: 25000, total: 25000 }
      ]
    },
    {
      name: "External Works",
      value: 245000,
      color: "#F59E0B",
      items: [
        { name: "Site Preparation", quantity: 850, unit: "m²", rate: 25, total: 21250 },
        { name: "Earthworks & Excavation", quantity: 320, unit: "m³", rate: 85, total: 27200 },
        { name: "Drive-Thru Lane", quantity: 180, unit: "m²", rate: 185, total: 33300 },
        { name: "Car Parking", quantity: 420, unit: "m²", rate: 125, total: 52500 },
        { name: "Kerbs & Channels", quantity: 180, unit: "m", rate: 145, total: 26100 },
        { name: "Landscaping", quantity: 280, unit: "m²", rate: 85, total: 23800 },
        { name: "Signage & Wayfinding", quantity: 1, unit: "item", rate: 45000, total: 45000 },
        { name: "External Lighting", quantity: 12, unit: "no", rate: 1200, total: 14400 }
      ]
    },
    {
      name: "Preliminaries",
      value: 80000,
      color: "#10B981",
      items: [
        { name: "Site Establishment", quantity: 1, unit: "item", rate: 35000, total: 35000 },
        { name: "Site Management", quantity: 13, unit: "weeks", rate: 2500, total: 32500 },
        { name: "Safety & Compliance", quantity: 1, unit: "item", rate: 8500, total: 8500 },
        { name: "Insurances", quantity: 1, unit: "item", rate: 4000, total: 4000 }
      ]
    }
  ],
  team: [
    { name: "John Smith", role: "Project Manager", company: "BuildCorp", initials: "JS" },
    { name: "Sarah Chen", role: "Quantity Surveyor", company: "QS Solutions", initials: "SC" },
    { name: "Mike Davis", role: "Site Supervisor", company: "BuildCorp", initials: "MD" },
    { name: "Emma Wilson", role: "Architect", company: "Design Studio", initials: "EW" }
  ],
  activities: [
    {
      id: "1",
      type: "edit" as const,
      user: { name: "Sarah Chen", initials: "SC" },
      content: "Updated concrete slab quantities based on revised drawings",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      metadata: {
        editType: "Quantity Update",
        oldValue: "150m²",
        newValue: "165m²"
      }
    },
    {
      id: "2",
      type: "file_upload" as const,
      user: { name: "John Smith", initials: "JS" },
      content: "Uploaded updated architectural drawings",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      metadata: {
        fileName: "ARCH_RevB_Plans.pdf"
      }
    },
    {
      id: "3",
      type: "comment" as const,
      user: { name: "Emma Wilson", initials: "EW" },
      content: "Please review the shopfront glazing specification - considering upgrading to double glazed units.",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      metadata: {
        commentCount: 3
      }
    }
  ]
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Sidebar Component
function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      <div className="p-4"
      >
        <button 
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1"
      >
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Overview Tab Content
function OverviewTab({ project }: { project: typeof mockProject }) {
  return (
    <div className="space-y-6"
    >
      {/* Project Info Card */}
      <div className="card-premium p-6"
      >
        <div className="flex items-start justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2"
            >
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              >
                {project.projectType}
              </Badge>
              <Badge variant="outline">{project.status}</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl"
            >{project.description}</p>
          </div>
          <div className="flex items-center gap-2"
          >
            <Button variant="outline" size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm"
            >
              <Edit className="w-4 h-4 mr-2" /> Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <div className="flex items-center gap-3"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-medium">{project.client}</p>
            </div>
          </div>
          <div className="flex items-center gap-3"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <MapPin className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{project.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Timeline</p>
              <p className="font-medium">{project.startDate} → {project.endDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Briefcase className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Area</p>
              <p className="font-medium">{project.area} m²</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6"
      >
        {/* Progress Card */}
        <div className="lg:col-span-2 card-premium p-6"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4"
          >Project Progress</h3>
          <div className="mb-4"
          >
            <div className="flex items-center justify-between mb-2"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Completion</span>
              <span className="font-semibold">{project.completion}%</span>
            </div>
            <Progress value={project.completion} className="h-2" />
          </div>
          <div className="space-y-3"
          >
            {project.phases.slice(0, 5).map((phase, index) => (
              <div key={index} className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3"
                >
                  {phase.status === 'complete' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : phase.status === 'in-progress' ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className="text-sm"
                  >{phase.name}</span>
                </div>
                <span className="text-sm font-medium number-display"
                >{formatCurrency(phase.cost)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Score */}
        <div className="card-premium p-6"
        >
          <TrustScoreGauge
            score={project.trustScore}
            size="lg"
            showDetails
            confidenceFactors={[
              { name: "Data Quality", score: 92, description: "Based on completeness of input data" },
              { name: "Market Rates", score: 85, description: "Current as of Q1 2025" },
              { name: "Historical Accuracy", score: 88, description: "Similar projects within 5%" }
            ]}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-premium p-6"
      >
        <div className="flex items-center justify-between mb-4"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white"
          >Recent Activity</h3>
          <Button variant="ghost" size="sm">View all</Button>
        </div>
        <ActivityFeed activities={project.activities} />
      </div>
    </div>
  );
}

export default function ProjectDetailPremium() {
  const [match, params] = useRoute("/project/:id");
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [show3DView, setShow3DView] = useState(false);

  const project = mockProject;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex"
    >
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto"
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800"
        >
          <div className="px-8 py-4"
          >
            <div className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white"
                >{project.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="flex items-center gap-1"
                >
                    <Building2 className="w-4 h-4" />
                    {project.client}
                  </span>
                  <span>•</span>
                  <span>{project.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-3"
              >
                <Button variant="outline" onClick={() => setShow3DView(true)}
                >
                  <Box className="w-4 h-4 mr-2" />
                  3D View
                </Button>
                <Button variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="flex items-center gap-8 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
            >
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white number-display"
                >{formatCurrency(project.totalCost)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid to Date</p>
                <p className="text-2xl font-bold text-green-600 number-display"
                >{formatCurrency(project.paidToDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <div className="flex items-center gap-2"
                >
                  <Progress value={project.completion} className="w-24 h-2" />
                  <span className="font-semibold">{project.completion}%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab project={project} />}
              
              {activeTab === 'costs' && (
                <div className="space-y-6"
                >
                  <CostBreakdownChart
                    data={project.costBreakdown}
                    totalCost={project.totalCost}
                  />
                </div>
              )}

              {activeTab === 'team' && (
                <div className="card-premium p-6"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4"
                  >Project Team</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {project.team.map((member, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
                      >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                        >
                          <span className="font-semibold text-blue-600"
                          >{member.initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white"
                          >{member.name}</p>
                          <p className="text-sm text-gray-500"
                          >{member.role}</p>
                          <p className="text-xs text-gray-400"
                          >{member.company}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="card-premium p-8 text-center py-16"
                >
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  >Schedule View</h3>
                  <p className="text-gray-500">Interactive Gantt chart coming soon</p>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="card-premium p-8 text-center py-16"
                >
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  >Documents</h3>
                  <p className="text-gray-500">Document management coming soon</p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="card-premium p-8 text-center py-16"
                >
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                  >Project Settings</h3>
                  <p className="text-gray-500">Settings panel coming soon</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3D Viewer Modal */}
      <BIMViewer
        urn="demo"
        status="Complete"
      />
    </div>
  );
}
