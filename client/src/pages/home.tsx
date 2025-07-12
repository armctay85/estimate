import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Resizable } from "react-resizable";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Joyride from "react-joyride";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { Canvas } from "@/components/canvas";
import { CostDisplay } from "@/components/cost-display";
import { RoomDetails } from "@/components/room-details";
import { Header } from "@/components/header";
import { AICostPredictor } from "@/components/ai-cost-predictor";
import { BIMProcessor } from "@/components/bim-processor";
import { IntelligentAssistant } from "@/components/intelligent-assistant";
import { Sidebar, SidebarHeader, SidebarContent, SidebarSection } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, FileBarChart, Users, Award, BarChart3, Upload, Sparkles, Zap, Brain, Share2, Moon, Sun, Settings, Layers, Palette } from "lucide-react";
import type { MaterialType } from "@shared/schema";
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
  
  const canvasRef = useRef<{ uploadBackground: (file: File) => void } | null>(null);
  const isMobile = useIsMobile();

  // Onboarding tour steps
  const tourSteps = [
    { target: ".canvas-area", content: "Draw rooms here with AI-powered suggestions for optimal layouts." },
    { target: ".material-selector", content: "Select materials; AI predicts best fits based on project type." },
    { target: ".ai-predictor", content: "Get regional cost predictions powered by advanced AI models." },
    { target: ".bim-processor", content: "Upload BIM files for automated takeoff with AI insights." },
  ];

  useEffect(() => {
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
    // TODO: Implement project saving
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
  if (isMobile) {
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
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
                onClick={handleShareProject}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Share2 className="w-4 h-4" />
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

  // Enhanced Desktop Layout: Procore-inspired with orange accents, animations, and resizable panels
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen font-sans flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
    >
      <Joyride steps={tourSteps} run={onboardingStep === 0} />
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
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl text-display tracking-tight">EstiMate</h1>
                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">AI-Powered Construction Platform</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="flex items-center gap-2">
                <button className="px-5 py-2.5 text-sm font-semibold text-orange-700 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200 shadow-sm hover:shadow-md transition-all">
                  Dashboard
                </button>
                <button className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                  Projects
                </button>
                <button className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
                  Reports
                </button>
                <button className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all">
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

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools & Controls */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-display text-base font-bold text-gray-900 uppercase tracking-wider">
              Drawing Tools
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Materials Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-sm"></div>
                Materials
              </h3>
              <Card className="border-gray-200 shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Drawing Tools Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-sm"></div>
                Shapes
              </h3>
              <Card className="border-gray-200 shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-4">
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
            </div>

            {/* AI Tools Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-wide">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-sm"></div>
                AI Tools
              </h3>
              <div className="space-y-3">
                <AICostPredictor />
                <BIMProcessor />
              </div>
            </div>

            {/* Element Details */}
            {selectedRoom && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Element Details
                </h3>
                <Card className="border-gray-200">
                  <CardContent className="p-3">
                    <RoomDetails
                      selectedRoom={selectedRoom}
                      onRoomUpdate={handleRoomUpdate}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Project Cost */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                Project Cost
              </h3>
              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <CostDisplay rooms={rooms} totalCost={totalCost} />
                </CardContent>
              </Card>
            </div>

            {/* Enterprise Features */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-purple-900 mb-1">Enterprise Active</h4>
                <p className="text-xs text-purple-700 mb-2">
                  Full BIM Auto-Takeoff • 500+ Materials • QS Department Replacement
                </p>
                <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded mb-2">
                  ROI: $180k-270k savings annually
                </div>
                <div className="flex gap-1 text-xs">
                  <div className="flex-1 bg-green-100 text-green-700 px-2 py-1 rounded">✓ BIM Processing</div>
                  <div className="flex-1 bg-green-100 text-green-700 px-2 py-1 rounded">✓ AIQS Reports</div>
                </div>
              </div>
            </div>

            {/* Enterprise Analytics */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                Analytics Dashboard
              </h3>
              <Card className="border-gray-200">
                <CardContent className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-medium text-blue-900">Projects This Month</div>
                      <div className="text-lg font-bold text-blue-600">127</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-medium text-green-900">Cost Saved</div>
                      <div className="text-lg font-bold text-green-600">$2.1M</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <div className="font-medium text-purple-900">BIM Files Processed</div>
                      <div className="text-lg font-bold text-purple-600">89</div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded">
                      <div className="font-medium text-orange-900">Accuracy Rate</div>
                      <div className="text-lg font-bold text-orange-600">98.7%</div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Full Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* BIM Auto-Takeoff Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                BIM Processing Queue
              </h3>
              <Card className="border-gray-200">
                <CardContent className="p-3 space-y-2">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-green-700">Office Tower.rvt</span>
                      <span className="text-green-600 font-medium">✓ Complete</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-blue-700">Warehouse.dwg</span>
                      <span className="text-blue-600 font-medium">⏳ Processing 89%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-700">Retail Store.ifc</span>
                      <span className="text-gray-600 font-medium">📁 Queued</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full bg-gradient-to-r from-yellow-600 to-orange-600">
                    <Upload className="w-3 h-3 mr-1" />
                    Upload BIM Files
                  </Button>
                </CardContent>
              </Card>
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
    </motion.div>
  );
}