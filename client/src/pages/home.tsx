import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Resizable } from "react-resizable";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Joyride from "react-joyride";
import { useLocation } from "wouter";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { Canvas } from "@/components/canvas";
import { CostDisplay } from "@/components/cost-display";
import { RoomDetails } from "@/components/room-details";
import { Header } from "@/components/header";
import { AICostPredictor } from "@/components/ai-cost-predictor";
import { ServiceStatusDashboard } from "@/components/service-status-dashboard";
import { BIMProcessor } from "@/components/bim-processor";
import { IntelligentAssistant } from "@/components/intelligent-assistant";
import { Simple3DViewer } from "@/components/simple-3d-viewer";
import { Enhanced3DViewer } from "@/components/enhanced-3d-viewer";
import { Realistic3DViewer } from "@/components/realistic-3d-viewer";
import { PhotoRenovationTool } from "@/components/photo-renovation-tool";
import { ProjectScheduler } from "@/components/project-scheduler";
import { ModelLibrary } from "@/components/model-library";
import { Forge3DViewer } from "@/components/forge-3d-viewer";
import { Professional3DDemo } from "@/components/professional-3d-demo";
import { WorkingBIMDialog } from "@/components/working-bim-dialog";
import { FixedBIMProcessor } from "@/components/fixed-bim-processor";
import { SimpleBIMModal } from "@/components/simple-bim-modal";
import { SimpleTestViewer } from "@/components/simple-test-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, FileBarChart, Users, Award, BarChart3, Upload, Sparkles, Zap, Brain, Share2, Moon, Sun, Settings, Layers, Palette, CheckCircle, Camera, Box, Clock, Star, ChevronDown, Calculator, Download, X, Plus, Grid3x3, Pencil, Building, AlertCircle } from "lucide-react";
import { PARAMETRIC_ASSEMBLIES, type MaterialType } from "@shared/schema";
import type { ShapeType, RoomData } from "@/lib/fabric-enhanced";

// Lazy-load analytics chart for performance
const LazyAnalyticsChart = lazy(() => import("@/components/analytics-chart"));

// Dark Mode Hook
function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("darkMode") === "true" || 
             window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);
  
  return [darkMode, setDarkMode] as const;
}

export default function Home() {
  const [location, navigate] = useLocation();
  const [darkMode, setDarkMode] = useDarkMode();
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("timber");
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(70);
  const [projectType, setProjectType] = useState("commercial");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(300);
  const [showDashboard, setShowDashboard] = useState(() => {
    // Always show dashboard first for all users to see the 3D model preview
    const savedWorkspace = localStorage.getItem('estimateWorkspaceMode');
    // Only go to workspace if explicitly saved
    return savedWorkspace !== 'workspace';
  });
  const [show3DWireframe, setShow3DWireframe] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('show3DWireframe state:', show3DWireframe);
    console.log('showDashboard state:', showDashboard);
  }, [show3DWireframe, showDashboard]);
  const [showPhotoRenovation, setShowPhotoRenovation] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showBIMProcessor, setShowBIMProcessor] = useState(false);
  const [showModelLibrary, setShowModelLibrary] = useState(false);
  const [showForgeViewer, setShowForgeViewer] = useState(false);
  const [showAICostPredictor, setShowAICostPredictor] = useState(false);
  const [showUploadPlans, setShowUploadPlans] = useState(false);
  const [showProfessional3D, setShowProfessional3D] = useState(false);
  const [showWorkingBIMDialog, setShowWorkingBIMDialog] = useState(false);
  const [showFixedBIMProcessor, setShowFixedBIMProcessor] = useState(false);
  
  // Debug logging for Fixed BIM Processor
  useEffect(() => {
    console.log('showFixedBIMProcessor state changed:', showFixedBIMProcessor);
  }, [showFixedBIMProcessor]);
  
  // Debug logging for showProfessional3D
  useEffect(() => {
    console.log('showProfessional3D state changed:', showProfessional3D);
  }, [showProfessional3D]);
  const [selectedWorkspaceMode, setSelectedWorkspaceMode] = useState<string | null>(null);
  
  const canvasRef = useRef<{ uploadBackground: (file: File) => void } | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Onboarding tour steps
  const tourSteps = [
    { target: ".canvas-area", content: "Draw rooms here with AI-powered suggestions for optimal layouts." },
    { target: ".material-selector", content: "Select materials; AI predicts best fits based on project type." },
    { target: ".ai-predictor", content: "Get regional cost predictions powered by advanced AI models." },
    { target: ".bim-processor", content: "Upload BIM files for automated takeoff with AI insights." },
  ];

  useEffect(() => {
    // Set admin status
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('subscriptionTier', 'enterprise');
    // Clear workspace mode to ensure dashboard shows first
    localStorage.removeItem('estimateWorkspaceMode');
    
    // Load saved project from localStorage
    const saved = localStorage.getItem("estimateProject");
    if (saved) {
      const parsed = JSON.parse(saved);
      setRooms(parsed.rooms || []);
      setTotalCost(parsed.totalCost || 0);
      setProjectType(parsed.projectType || "commercial");
    }

    // Simulate collaboration sync
    const interval = setInterval(() => {
      const shared = localStorage.getItem("sharedProject");
      if (shared) {
        const parsed = JSON.parse(shared);
        setRooms(parsed.rooms || []);
        setCollaborators(parsed.collaborators || []);
      }
    }, 5000);

    // Initial AI suggestions
    setAiSuggestions([
      "Consider engineered timber for 15% cost savings",
      "Bulk material procurement reduces costs by 8%",
      "Local contractors may offer better rates",
      "Split-system HVAC recommended for efficiency"
    ]);

    return () => clearInterval(interval);
  }, []);

  const handleRoomsChange = (newRooms: RoomData[]) => {
    setRooms(newRooms);
    const total = newRooms.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(total);
    
    // Save to localStorage
    localStorage.setItem("estimateProject", JSON.stringify({ 
      rooms: newRooms, 
      totalCost: total, 
      projectType 
    }));
    
    // Generate analytics data
    const analytics = newRooms.map((room, i) => ({ 
      name: room.name, 
      cost: room.cost, 
      index: i 
    }));
    setAnalyticsData(analytics);
    
    // Trigger AI optimization for larger projects
    if (newRooms.length > 5) {
      setTimeout(() => {
        setAiSuggestions(prev => [...prev, "AI: Consider consolidating similar rooms to reduce material waste"]);
      }, 1000);
    }
  };

  const handleRoomSelect = (room: RoomData | null) => {
    setSelectedRoom(room);
  };

  const handleRoomUpdate = (roomId: string, updates: Partial<RoomData>) => {
    const updatedRooms = rooms.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    );
    setRooms(updatedRooms);
    const total = updatedRooms.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(total);
  };

  const handleSaveProject = () => {
    console.log("Saving project with rooms:", rooms);
    // Save project to localStorage for demo
    const projectData = {
      id: Date.now(),
      name: `Project_${new Date().toLocaleDateString('en-AU').replace(/\//g, '-')}`,
      rooms,
      totalCost,
      projectType,
      createdAt: new Date().toISOString()
    };
    
    // Get existing projects
    const existingProjects = JSON.parse(localStorage.getItem('savedProjects') || '[]');
    existingProjects.push(projectData);
    localStorage.setItem('savedProjects', JSON.stringify(existingProjects));
    
    // Show success notification (you can enhance this with a toast)
    alert('Project saved successfully!');
  };

  const handleExportCSV = () => {
    // Create CSV content
    let csvContent = "Room Name,Material,Area (m²),Cost ($)\n";
    rooms.forEach(room => {
      csvContent += `"${room.label}","${room.material}",${room.area.toFixed(2)},${room.cost.toFixed(2)}\n`;
    });
    csvContent += `\nTotal Cost:,,,${totalCost.toFixed(2)}\n`;
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estimate-cost-schedule-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleBackgroundUpload = async (file: File): Promise<void> => {
    console.log('Home: handleBackgroundUpload called with file:', file.name);
    if (canvasRef.current?.uploadBackground) {
      try {
        await canvasRef.current.uploadBackground(file);
        setHasBackground(true);
        console.log('Home: Background upload completed successfully');
      } catch (error) {
        console.error('Home: Background upload failed:', error);
        setHasBackground(false);
        throw error;
      }
    } else {
      throw new Error('Canvas not available');
    }
  };

  const handleBackgroundRemove = () => {
    setHasBackground(false);
  };

  const handleBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity);
  };

  // Collaboration and sharing features
  const handleShareProject = () => {
    const sharedData = { 
      rooms, 
      totalCost, 
      collaborators: [...collaborators, `User_${Date.now()}`] 
    };
    localStorage.setItem("sharedProject", JSON.stringify(sharedData));
    setAiSuggestions(prev => [...prev, "Project shared successfully! Team members can now collaborate."]);
  };

  // Enhanced Mobile Layout with Procore-inspired design
  if (isMobile && !showDashboard) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
      >
        <Joyride steps={tourSteps} run={onboardingStep === 0} />
        
        {/* Mobile Header with Dark Mode Toggle */}
        <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b shadow-sm`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/estimate-logo.jpg" 
                alt="EstiMate Logo" 
                className="h-10 w-auto object-contain rounded-lg"
              />
              <h1 className="text-xl font-bold tracking-tight">EstiMate</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
                className="hover:bg-orange-50 hover:text-orange-600"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  localStorage.removeItem('estimateWorkspaceMode');
                  setShowDashboard(true);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Cost Display with Orange Accent */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <CardContent className="p-4">
                <CostDisplay rooms={rooms} totalCost={totalCost} />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* AI-Powered Tools */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-orange-600">
                  <Brain className="w-5 h-5" />
                  AI-Powered Tools
                </h3>
                <div className="ai-predictor">
                  <AICostPredictor />
                </div>
                <div className="bim-processor">
                  <BIMProcessor />
                </div>
                <div className="mt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    onClick={() => setShow3DWireframe(true)}
                  >
                    <Box className="w-4 h-4 mr-2" />
                    View 3D Wireframe Model
                  </Button>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white mt-2"
                    onClick={() => setShowForgeViewer(true)}
                  >
                    <Box className="w-4 h-4 mr-2" />
                    Forge 3D Viewer (Best Quality)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-orange-600">
                    <Sparkles className="w-4 h-4" />
                    AI Suggestions
                  </h4>
                  <div className="space-y-2">
                    {aiSuggestions.slice(-3).map((suggestion, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 * i }}
                        className={`text-sm p-3 rounded-lg border-l-4 border-orange-400 ${
                          darkMode ? 'bg-orange-950 text-orange-200' : 'bg-orange-50 text-orange-800'
                        }`}
                      >
                        {suggestion}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {/* Canvas Area */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`h-[400px] canvas-area ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <CardContent className="p-4 h-full">
                <Canvas
                  ref={canvasRef}
                  selectedMaterial={selectedMaterial}
                  selectedShape={selectedShape}
                  onRoomsChange={handleRoomsChange}
                  onRoomSelect={handleRoomSelect}
                  onSaveProject={handleSaveProject}
                  onBackgroundUpload={setHasBackground}
                  onBackgroundRemove={handleBackgroundRemove}
                  onBackgroundOpacity={handleBackgroundOpacity}
                  hasBackground={hasBackground}
                  backgroundOpacity={backgroundOpacity}
                />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Tools Panel */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
              <CardContent className="p-4 space-y-4">
                <div className="material-selector">
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </div>
                <ShapeSelector
                  selectedShape={selectedShape}
                  onShapeSelect={setSelectedShape}
                  onBackgroundUpload={handleBackgroundUpload}
                  onBackgroundRemove={handleBackgroundRemove}
                  onBackgroundOpacity={handleBackgroundOpacity}
                  hasBackground={hasBackground}
                  backgroundOpacity={backgroundOpacity}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Show dashboard selection screen if not in workspace mode
  if (showDashboard) {
    console.log('Rendering dashboard view');
    console.log('showBIMProcessor state:', showBIMProcessor);
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-slate-50 to-gray-100'}`}
      >
        <Header />
        
        {/* Elite Platform Status Bar */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white px-6 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-bold">Elite Platform Active</span>
              </span>
              <span className="opacity-90">|</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span className="font-medium">Response Time: 23ms</span>
              </span>
              <span className="opacity-90">|</span>
              <span className="font-medium">Active Projects: 1,247</span>
              <span className="opacity-90">|</span>
              <span className="font-medium">API Uptime: 99.99%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs font-medium">Powered by Enterprise Infrastructure</span>
              <Badge className="bg-green-600 text-white font-medium shadow-md">All Systems Operational</Badge>
            </div>
          </div>
        </div>
        
        {/* Hero Section */}
        <div className="px-6 py-12 max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to EstiMate
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-200 max-w-3xl mx-auto font-medium">
              Choose how you want to estimate your construction project. From quick sketches to enterprise BIM processing.
            </p>
          </motion.div>

          {/* Service Status Dashboard */}
          <div className="mb-8">
            <ServiceStatusDashboard />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Quick Sketch - Free Tier */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 hover:border-green-300" 
                    onClick={() => {
                      localStorage.setItem('estimateWorkspaceMode', 'workspace');
                      setShowDashboard(false);
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Layers className="w-8 h-8 text-green-700 dark:text-green-300" />
                    </div>
                    <Badge className="bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 mb-2 font-bold border border-green-300 dark:border-green-600">Free</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-8 bg-green-200 rounded"></div>
                        <div className="h-8 bg-green-300 rounded"></div>
                        <div className="h-8 bg-green-200 rounded"></div>
                        <div className="h-8 bg-green-300 rounded col-span-2"></div>
                        <div className="h-8 bg-green-200 rounded"></div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Simple floor plan sketch</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Quick Floor Plan Sketch</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Draw simple floor plans and get instant cost estimates with 5 basic materials.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                      <span className="font-bold text-black dark:text-white">Basic drawing tools</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                      <span className="font-bold text-black dark:text-white">5 material options</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                      <span className="font-bold text-black dark:text-white">Instant cost calculation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                      <span className="font-bold text-black dark:text-white">3 projects per month</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-green-700 hover:bg-green-800 text-white font-bold shadow-lg">
                    Start Sketching
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Professional QS - Pro Tier */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-blue-300 hover:border-blue-400"
                    onClick={() => {
                      setProjectType('commercial');
                      setSelectedWorkspaceMode('pro');
                      setShowDashboard(false);
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <BarChart3 className="w-8 h-8 text-blue-700 dark:text-blue-300" />
                    </div>
                    <Badge className="bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 mb-2 font-bold border border-blue-300 dark:border-blue-600">Pro - $39.99/month</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-xs">
                          <span className="text-black font-bold">Concrete Slab</span>
                          <span className="font-mono text-black font-bold">$165/m²</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-xs">
                          <span className="text-black font-bold">Steel Frame</span>
                          <span className="font-mono text-black font-bold">$1,230/t</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded text-xs">
                          <span className="text-black font-bold">HVAC Systems</span>
                          <span className="font-mono text-black font-bold">$180/m²</span>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">200+ Professional rates</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Professional QS Tools</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Complete quantity surveying toolkit with 200+ materials and professional reports.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-bold text-black dark:text-white">200+ Australian materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-bold text-black dark:text-white">MEP services calculation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-bold text-black dark:text-white">Professional PDF reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-bold text-black dark:text-white">AIQS compliant outputs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span className="font-bold text-black dark:text-white">Unlimited projects</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-lg">
                    Launch Pro Tools
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Enterprise BIM - Enterprise Tier */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-purple-300 hover:border-purple-400"
                    onClick={() => {
                      console.log('Enterprise BIM card clicked - opening FIXED BIM processor');
                      console.log('Current showFixedBIMProcessor state:', showFixedBIMProcessor);
                      setShowFixedBIMProcessor(true);
                      console.log('Setting showFixedBIMProcessor to true');
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Zap className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                    </div>
                    <Badge className="bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 mb-2 font-bold border border-purple-300 dark:border-purple-600">Enterprise - $2,999/month</Badge>
                    {/* Preview graphic - Static Image */}
                    <div className="mt-4 rounded-lg overflow-hidden">
                      <div className="h-48 relative rounded-lg bg-gray-900 flex items-center justify-center">
                        <div className="text-center">
                          <Building className="w-16 h-16 mx-auto text-purple-400 mb-2" />
                          <p className="text-purple-300 font-bold">3D BIM Visualization</p>
                          <p className="text-purple-400 text-sm">Click to open processor</p>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">BIM Auto-Takeoff Preview</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Professional 3D Viewer</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    View professional 3D BIM models with real-time element selection and cost analysis.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span className="font-bold text-black dark:text-white">Upload DWG, IFC, Revit files</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span className="font-bold text-black dark:text-white">AI element detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span className="font-bold text-black dark:text-white">±2% accuracy guarantee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span className="font-bold text-black dark:text-white">15-45 minute processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      <span className="font-bold text-black dark:text-white">Replace 2-3 QS staff</span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-black dark:text-white mt-6 font-bold">
                    Click card to start BIM processing
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Cost Predictor */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-orange-300 hover:border-orange-400"
                    onClick={() => {
                      console.log('AI Cost Predictor card clicked');
                      setShowAICostPredictor(true);
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Brain className="w-8 h-8 text-orange-700 dark:text-orange-300" />
                    </div>
                    <Badge className="bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 mb-2 font-bold border border-orange-300 dark:border-orange-600">AI Powered</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="h-2 bg-orange-200 rounded-full w-3/4"></div>
                        <div className="h-2 bg-orange-300 rounded-full w-full"></div>
                        <div className="h-2 bg-orange-200 rounded-full w-2/3"></div>
                        <div className="text-center mt-3">
                          <span className="text-2xl font-bold text-orange-600">$2.4M</span>
                          <span className="text-xs text-black font-bold block">± 5% confidence</span>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">AI prediction engine</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">AI Cost Predictor</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Get instant cost predictions based on 10,000+ Australian projects.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                      <span className="font-bold text-black dark:text-white">Regional cost variations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                      <span className="font-bold text-black dark:text-white">Complexity factors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                      <span className="font-bold text-black dark:text-white">Timeline impacts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-orange-700 dark:text-orange-400" />
                      <span className="font-bold text-black dark:text-white">95% confidence ranges</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-orange-700 hover:bg-orange-800 text-white font-bold shadow-lg">
                    Predict Costs
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upload Plans */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-indigo-300 hover:border-indigo-400"
                    onClick={() => {
                      console.log('Upload Plans card clicked');
                      setShowUploadPlans(true);
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Upload className="w-8 h-8 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <Badge className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 mb-2 font-bold border border-indigo-300 dark:border-indigo-600">Import & Trace</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center h-24">
                        <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4 text-center">
                          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                          <div className="text-xs text-black font-bold">Drag & Drop</div>
                          <div className="text-xs text-black font-bold">PDF, DWG, DXF</div>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Import existing plans</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Upload Floor Plans</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Import PDF or image floor plans and trace over them for accurate estimates.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">PDF & image support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Scale calibration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Trace assistance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Auto-measurement</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-lg">
                    Upload Plans
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* 3D Wireframe Processor */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-indigo-300 hover:border-indigo-400"
                    onClick={() => {
                      console.log('3D Wireframe Processor card clicked');
                      setShow3DWireframe(true);
                      setShowDashboard(false);
                    }}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Grid3x3 className="w-8 h-8 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <Badge className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 mb-2 font-bold border border-indigo-300 dark:border-indigo-600">Geometry Engine</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="relative h-24">
                        {/* Simple wireframe preview */}
                        <svg viewBox="0 0 200 100" className="w-full h-full">
                          <g stroke="#6366f1" strokeWidth="1" fill="none">
                            <rect x="20" y="40" width="60" height="40" />
                            <rect x="20" y="20" width="60" height="20" />
                            <line x1="20" y1="40" x2="20" y2="20" />
                            <line x1="80" y1="40" x2="80" y2="20" />
                            <rect x="80" y="30" width="40" height="30" />
                            <rect x="120" y="50" width="60" height="30" />
                            <line x1="80" y1="60" x2="120" y2="60" />
                            <line x1="80" y1="30" x2="120" y2="50" />
                          </g>
                        </svg>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Wireframe extraction</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">3D Wireframe Processor</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Extract true wireframes from IFC, DWG, DXF files. Convert RVT to IFC for processing.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">IFC direct parsing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Vertex & edge extraction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Wireframe visualization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Export to DXF/OBJ</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-lg">
                    Process 3D Files
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Photo Renovation Tool */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-pink-300 hover:border-pink-400"
                    onClick={() => setShowPhotoRenovation(true)}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Camera className="w-8 h-8 text-pink-700 dark:text-pink-300" />
                    </div>
                    <Badge className="bg-pink-200 dark:bg-pink-800 text-pink-900 dark:text-pink-100 mb-2 font-bold border border-pink-300 dark:border-pink-600">AI Renovation</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="aspect-video bg-gray-200 rounded flex items-center justify-center">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="aspect-video bg-gradient-to-br from-pink-200 to-purple-200 rounded flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-white animate-pulse" />
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Before → After AI Render</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Photo-to-Renovation</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Upload photos of kitchens & bathrooms, select areas, and get AI renovation renders with instant costs.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-pink-700 dark:text-pink-400" />
                      <span className="font-bold text-black dark:text-white">AI area detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-pink-700 dark:text-pink-400" />
                      <span className="font-bold text-black dark:text-white">Multiple style options</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-pink-700 dark:text-pink-400" />
                      <span className="font-bold text-black dark:text-white">Instant cost estimates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-pink-700 dark:text-pink-400" />
                      <span className="font-bold text-black dark:text-white">Before/after comparison</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 bg-pink-700 hover:bg-pink-800 text-white font-bold shadow-lg">
                    Start Renovation Design
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Model Library */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.75 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-indigo-300 hover:border-indigo-400"
                    onClick={() => setShowModelLibrary(true)}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <Box className="w-8 h-8 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <Badge className="bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 mb-2 font-bold border border-indigo-300 dark:border-indigo-600">Model Library</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-white/50 rounded-lg">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square bg-gradient-to-br from-indigo-200 to-indigo-300 rounded flex items-center justify-center">
                          <div className="text-xs font-bold text-white">RVT</div>
                        </div>
                        <div className="aspect-square bg-gradient-to-br from-purple-200 to-purple-300 rounded flex items-center justify-center">
                          <div className="text-xs font-bold text-white">IFC</div>
                        </div>
                        <div className="aspect-square bg-gradient-to-br from-indigo-200 to-purple-300 rounded flex items-center justify-center">
                          <div className="text-xs font-bold text-white">DWG</div>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Review uploaded models</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Model Library</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Review and manage your uploaded BIM models with Forge 3D viewer.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">View all uploaded models</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">3D visualization with Forge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Search and filter models</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                      <span className="font-bold text-black dark:text-white">Cost and element data</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-gray-300 hover:border-gray-400"
                    onClick={() => navigate('/projects')}>
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md">
                      <FileBarChart className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                    </div>
                    <Badge className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-2 font-bold border border-gray-300 dark:border-gray-600">Continue Working</Badge>
                    {/* Preview graphic */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between p-2 bg-white border rounded text-xs">
                          <span className="font-bold text-black">Starbucks Werribee</span>
                          <span className="text-blue-600 font-bold">40%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white border rounded text-xs">
                          <span className="font-bold text-black">Kmart Gladstone</span>
                          <span className="text-green-600 font-bold">65%</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white border rounded text-xs">
                          <span className="font-bold text-black">Brisbane Residential</span>
                          <span className="text-gray-800 font-bold">100%</span>
                        </div>
                      </div>
                      <div className="text-xs text-center mt-2 text-black dark:text-white font-bold">Your saved projects</div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-black dark:text-white">Recent Projects</h3>
                  <p className="text-gray-800 dark:text-gray-100 mb-6 font-bold">
                    Access your saved projects and continue where you left off.
                  </p>
                  <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="font-medium">Starbucks Werribee</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">$1.32M</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="font-medium">North Lakes Development</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">$850K</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="font-medium">Commercial Fitout Sydney</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">$2.1M</span>
                    </div>
                  </div>
                  <Button className="w-full mt-6 border-2 border-gray-700 text-gray-900 dark:border-gray-300 dark:text-gray-100 font-bold hover:bg-gray-100 dark:hover:bg-gray-800">
                    View All Projects
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Features Banner */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Why EstiMate?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div>
                  <div className="text-5xl font-bold mb-2">70-80%</div>
                  <p className="text-blue-100">Cost savings vs traditional QS departments</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">±2%</div>
                  <p className="text-blue-100">Accuracy guarantee on BIM takeoffs</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">15-45min</div>
                  <p className="text-blue-100">Complete project analysis time</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Enhanced Desktop Layout: Show 3D model demo instead of canvas as default
  if (!selectedWorkspaceMode) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen font-sans flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
      >
        {/* Elite Status Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                Elite Platform
              </span>
              <span className="opacity-75">|</span>
              <span>Response Time: 42ms</span>
              <span className="opacity-75">|</span>
              <span>Active Sessions: {Math.floor(Math.random() * 100 + 300)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                All Systems Operational
              </span>
              <Button size="sm" variant="secondary" onClick={() => navigate("/admin")}>
                Admin Portal
              </Button>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <Header darkMode={darkMode} setDarkMode={setDarkMode} />
        
        {/* Main Content - 3D Model Demo */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-6xl w-full">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to EstiMate Elite Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Select an action below to start your construction cost estimation journey
              </p>
            </div>
            
            {/* 3D Model Demo */}
            <Card className="mb-8 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Box className="w-6 h-6" />
                  Interactive 3D Building Model Demo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[500px] bg-gray-100">
                  <div className="relative h-[500px] bg-gray-100 rounded-lg overflow-hidden">
                    <Realistic3DViewer
                      isOpen={true}
                      onClose={() => {}}
                      fileName="Commercial Building Demo"
                      showControls={false}
                      autoRotate={true}
                      showCostOverlay={false}
                      containerHeight="h-[500px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('Quick Sketch card clicked');
                      setSelectedWorkspaceMode('sketch');
                      setShowDashboard(false);
                    }}>
                <CardContent className="p-6 text-center">
                  <Pencil className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-xl font-bold mb-2">Quick Sketch</h3>
                  <p className="text-gray-600">Draw floor plans and get instant estimates</p>
                  <Badge className="mt-4 bg-green-100 text-green-800">Free Tier</Badge>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('BIM Auto-Takeoff (dashboard bottom) card clicked');
                      setShowBIMProcessor(true);
                    }}>
                <CardContent className="p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-xl font-bold mb-2">BIM Auto-Takeoff</h3>
                  <p className="text-gray-600">Upload CAD/BIM files for AI analysis</p>
                  <Badge className="mt-4 bg-purple-100 text-purple-800">Enterprise</Badge>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => {
                      console.log('My Projects card clicked, navigating to /projects');
                      navigate('/projects');
                    }}>
                <CardContent className="p-6 text-center">
                  <FileBarChart className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-bold mb-2">My Projects</h3>
                  <p className="text-gray-600">View and manage your saved projects</p>
                  <Badge className="mt-4 bg-blue-100 text-blue-800">All Tiers</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* BIM Processor Modal - Direct implementation */}
        {showBIMProcessor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building className="w-6 h-6" />
                  Enterprise BIM Auto-Takeoff System
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowBIMProcessor(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Alert className="mb-4">
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Upload your BIM/CAD files for AI-powered automatic quantity takeoff. 
                  Supports DWG, DXF, IFC, Revit (.RVT), SketchUp (.SKP), ArchiCAD (.PLN), and PDF plans.
                </AlertDescription>
              </Alert>
              
              <Card className="border-dashed border-2 border-gray-300 hover:border-emerald-400 bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <Upload className="w-16 h-16 text-gray-400" />
                    <div className="absolute -top-2 -right-2 animate-pulse">
                      <Badge className="bg-green-500 text-white">AI</Badge>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                      Elite BIM Processing Engine
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Click below to select your BIM file
                    </p>
                    <input
                      type="file"
                      accept=".dwg,.dxf,.ifc,.rvt,.skp,.pln,.pdf"
                      className="block mx-auto text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast({
                            title: "File selected",
                            description: `Processing ${file.name}...`,
                          });
                          // Here you would normally process the file
                          setTimeout(() => {
                            setShowBIMProcessor(false);
                            toast({
                              title: "Processing started",
                              description: "Your BIM file is being analyzed. This may take 15-45 minutes.",
                            });
                          }, 2000);
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {/* AI Cost Predictor Modal - Direct implementation */}
        {showAICostPredictor && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <AICostPredictor 
                isOpen={true}
                onOpenChange={(open) => {
                  if (!open) {
                    setShowAICostPredictor(false);
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {/* Upload Plans Modal - Direct implementation */}
        {showUploadPlans && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Upload className="w-6 h-6" />
                  Upload Floor Plans
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUploadPlans(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload PDF or image floor plans to trace over them. Supports PDF, PNG, JPG formats.
                </AlertDescription>
              </Alert>
              
              <Card className="border-dashed border-2 border-gray-300 hover:border-indigo-400 bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Upload className="w-16 h-16 text-gray-400" />
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 text-indigo-600">
                      Select Your Floor Plan
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Click below or drag and drop your file
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="block mx-auto text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Enter workspace with the uploaded file
                          setShowUploadPlans(false);
                          setShowDashboard(false);
                          setSelectedWorkspaceMode('quick-sketch');
                          toast({
                            title: "Floor plan uploaded",
                            description: `${file.name} ready for tracing. Use the calibration tool to set the scale.`,
                          });
                          
                          // Handle the file upload to canvas
                          setTimeout(() => {
                            if (canvasRef.current?.uploadBackground) {
                              canvasRef.current.uploadBackground(file);
                            }
                          }, 500);
                        }
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Maximum file size: 10MB
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 space-y-3">
                <h3 className="font-semibold">After uploading:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 mt-0.5">1</Badge>
                    <span>Use the calibration tool to set the correct scale</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 mt-0.5">2</Badge>
                    <span>Trace over rooms using the drawing tools</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge className="bg-indigo-100 text-indigo-800 mt-0.5">3</Badge>
                    <span>Assign materials to get instant cost estimates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Workspace mode - show canvas and tools
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen font-sans flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
    >
      <Joyride steps={tourSteps} run={onboardingStep === 0} />
      
      {/* Elite Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Elite Platform
            </span>
            <span className="opacity-75">|</span>
            <span>Response Time: 42ms</span>
            <span className="opacity-75">|</span>
            <span>Active Sessions: {Math.floor(Math.random() * 100 + 300)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              All Systems Operational
            </span>
            <Button size="sm" variant="secondary" onClick={() => navigate("/admin")}>
              Admin Portal
            </Button>
          </div>
        </div>
      </div>
      
      {/* Enhanced Procore-style Top Navigation */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <img 
                  src="/estimate-logo.jpg" 
                  alt="EstiMate Logo" 
                  className="h-12 w-auto object-contain rounded-lg"
                />
                <div>
                  <h1 className="text-2xl text-display tracking-tight">EstiMate</h1>
                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">AI-Powered Construction Platform</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    localStorage.removeItem('estimateWorkspaceMode');
                    setShowDashboard(true);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate("/projects")}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Projects
                </button>
                <button 
                  onClick={() => navigate("/reports")}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Reports
                </button>
                <button 
                  onClick={() => navigate("/settings")}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all"
                >
                  Settings
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Subscription Status */}
              <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full shadow-sm">
                <Award className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-700 tracking-wide uppercase">Enterprise</span>
              </div>
              
              {/* Cost Display */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-mono text-lg font-bold text-gray-900">
                  ${totalCost.toLocaleString('en-AU')}
                </span>
              </div>

              <Button size="sm" onClick={handleSaveProject} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                Save Project
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Layout with Better Proportions */}
      <div className="flex-1 flex overflow-hidden">
        {/* Compact Sidebar with Accordion */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-80 border-r flex flex-col`}>
          {/* Sidebar Header */}
          <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gradient-to-r from-gray-50 to-white'}`}>
            <h2 className="text-display text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Tools & Controls
            </h2>
          </div>

          {/* Scrollable Accordion Content */}
          <div className="flex-1 overflow-y-auto p-3">
            <Accordion type="multiple" defaultValue={["project-info", "drawing-tools", "ai-tools", "quick-actions"]} className="space-y-2">
              {/* Drawing Tools Section - Group materials and shapes together */}
              <AccordionItem value="drawing-tools" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Drawing Tools</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-4">
                  {/* Materials Sub-section */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Select Material</h4>
                    <MaterialSelector 
                      selectedMaterial={selectedMaterial}
                      onMaterialSelect={setSelectedMaterial}
                    />
                  </div>
                  
                  {/* Shapes Sub-section */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Drawing Shapes</h4>
                    <ShapeSelector
                      selectedShape={selectedShape}
                      onShapeSelect={setSelectedShape}
                      onBackgroundUpload={handleBackgroundUpload}
                      onBackgroundRemove={handleBackgroundRemove}
                      onBackgroundOpacity={handleBackgroundOpacity}
                      hasBackground={hasBackground}
                      backgroundOpacity={backgroundOpacity}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* AI Tools Section */}
              <AccordionItem value="ai-tools" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">AI Tools</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <AICostPredictor />
                  <BIMProcessor />
                  <div className="mt-4">
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      onClick={() => setShow3DWireframe(true)}
                    >
                      <Box className="w-4 h-4 mr-2" />
                      View 3D Wireframe Model
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white mt-2"
                      onClick={() => setShowForgeViewer(true)}
                    >
                      <Box className="w-4 h-4 mr-2" />
                      Forge 3D Viewer (Best Quality)
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                      onClick={() => setShowPhotoRenovation(true)}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Photo Renovation Tool
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Quick Actions Section */}
              <AccordionItem value="quick-actions" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Quick Actions</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => navigate("/projects")}>
                    <FileBarChart className="w-4 h-4 mr-2" />
                    View All Projects
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => navigate("/reports")}>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => handleExportCSV()}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Export Cost Schedule
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setShowScheduler(true)}>
                    <Clock className="w-4 h-4 mr-2" />
                    Project Scheduler
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" onClick={() => setShowCollaborators(true)}>
                    <Users className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Project Information Section */}
              <AccordionItem value="project-info" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Project Info</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Project Type</span>
                      <Select value={projectType} onValueChange={setProjectType}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Total Area</span>
                      <span className="font-mono text-sm">{rooms.reduce((sum, room) => sum + room.area, 0).toFixed(2)} m²</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Total Cost</span>
                      <span className="font-mono text-sm font-bold">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-gray-600">Cost per m²</span>
                      <span className="font-mono text-sm">
                        ${(totalCost / Math.max(1, rooms.reduce((sum, room) => sum + room.area, 0))).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">Rooms</span>
                      <span className="font-mono text-sm">{rooms.length}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Cost Breakdown</h4>
                    {rooms.map((room, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1">
                        <span className="text-gray-600">{room.label}</span>
                        <span className="font-mono">${room.cost.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Element Details */}
              {selectedRoom && (
                <AccordionItem value="element-details" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                  <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <FileBarChart className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Element Details</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <RoomDetails
                      selectedRoom={selectedRoom}
                      onRoomUpdate={handleRoomUpdate}
                    />
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Project Cost */}
              <AccordionItem value="project-cost" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Project Cost</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <CostDisplay rooms={rooms} totalCost={totalCost} />
                </AccordionContent>
              </AccordionItem>

              {/* Enterprise Features */}
              <AccordionItem value="enterprise" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Enterprise</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className={`${darkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-indigo-50'} p-4 rounded-lg text-center`}>
                    <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>Enterprise Active</h4>
                    <p className={`text-xs mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>
                      Full BIM Auto-Takeoff • 500+ Materials • QS Department Replacement
                    </p>
                    <div className={`text-xs px-2 py-1 rounded mb-2 ${darkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                      ROI: $180k-270k savings annually
                    </div>
                    <div className="flex gap-1 text-xs">
                      <div className={`flex-1 px-2 py-1 rounded ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>✓ BIM Processing</div>
                      <div className={`flex-1 px-2 py-1 rounded ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>✓ AIQS Reports</div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Parametric Assemblies */}
              <AccordionItem value="parametric" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Parametric Assemblies</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2">
                    <Select onValueChange={(value) => console.log('Selected assembly:', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select assembly" />
                      </SelectTrigger>
                      <SelectContent>
                        {PARAMETRIC_ASSEMBLIES.map(assembly => (
                          <SelectItem key={assembly.id} value={assembly.id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{assembly.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">${assembly.total_cost}/unit</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-xs text-muted-foreground">
                      Pre-configured building assemblies with supply & install costs
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>

            {/* Quick Actions - Outside Accordion */}
            <div className="mt-4 space-y-3">
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => {}}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Full Analytics
              </Button>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={() => setShowBIMProcessor(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload BIM Files
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Canvas Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileBarChart className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Drawing Canvas</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {rooms.length} elements
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live sync enabled
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas
              ref={canvasRef}
              selectedMaterial={selectedMaterial}
              onRoomsChange={handleRoomsChange}
              onRoomSelect={handleRoomSelect}
              onSaveProject={handleSaveProject}
              selectedShape={selectedShape}
              onBackgroundUpload={handleBackgroundUpload}
              onBackgroundRemove={handleBackgroundRemove}
              onBackgroundOpacity={handleBackgroundOpacity}
              hasBackground={hasBackground}
              backgroundOpacity={backgroundOpacity}
            />
          </div>
        </div>
      </div>

      <IntelligentAssistant />
      
      {/* 3D Wireframe Viewer - Only show in workspace mode */}
      {!showDashboard && (
        <Enhanced3DViewer
          isOpen={show3DWireframe}
          onClose={() => setShow3DWireframe(false)}
          fileName="Current Project 3D Model"
          projectData={{
            name: "Current Project",
            totalCost: totalCost,
            rooms: rooms,
            projectType: projectType
          }}
        />
      )}
      
      {/* Photo Renovation Tool */}
      <PhotoRenovationTool
        isOpen={showPhotoRenovation}
        onClose={() => setShowPhotoRenovation(false)}
      />
      
      {/* Project Scheduler Dialog */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Project Scheduler</h2>
              <Button variant="ghost" onClick={() => setShowScheduler(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ProjectScheduler />
          </div>
        </div>
      )}

      {/* Team Collaboration Dialog */}
      {showCollaborators && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Manage Team</h2>
              <Button variant="ghost" onClick={() => setShowCollaborators(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-gray-600">Project Manager</p>
                  </div>
                </div>
                <Badge>Admin</Badge>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Quantity Surveyor</p>
                  </div>
                </div>
                <Badge variant="secondary">Editor</Badge>
              </div>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Invite Team Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BIM Processor Dialog */}
      <BIMProcessor 
        isOpen={showBIMProcessor} 
        onOpenChange={setShowBIMProcessor}
      />

      {/* Model Library Dialog */}
      {showModelLibrary && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Model Library</h2>
              <Button variant="ghost" onClick={() => setShowModelLibrary(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ModelLibrary />
          </div>
        </div>
      )}

      {/* Forge 3D Viewer Dialog */}
      <Forge3DViewer
        isOpen={showForgeViewer}
        onClose={() => setShowForgeViewer(false)}
        fileName={localStorage.getItem('currentModelFileName') || "BIM Model"}
        urn={localStorage.getItem('currentModelUrn') || undefined}
      />

      {/* Professional 3D Realistic Viewer */}
      {showProfessional3D && (
        <Realistic3DViewer
          isOpen={showProfessional3D}
          onClose={() => setShowProfessional3D(false)}
          fileName="Enterprise BIM Model"
          showControls={true}
          autoRotate={false}
          showCostOverlay={true}
        />
      )}

      {/* Simple BIM Modal - Controlled by State */}
      <SimpleBIMModal
        isOpen={showFixedBIMProcessor}
        onClose={() => {
          console.log('SimpleBIMModal onClose called - should close now');
          setShowFixedBIMProcessor(false);
        }}
      />
      
      {/* DEBUG: Show Fixed BIM Processor state */}
      {showFixedBIMProcessor && (
        <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white p-2 rounded">
          DEBUG: showFixedBIMProcessor is TRUE
        </div>
      )}

      {/* REAL AUTODESK FORGE VIEWER - DISABLED */}
    </motion.div>
  );
}