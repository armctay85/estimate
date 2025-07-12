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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { TrendingUp, FileBarChart, Users, Award, BarChart3, Upload, Sparkles, Zap, Brain, Share2, Moon, Sun, Settings, Layers, Palette } from "lucide-react";
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
            <Accordion type="multiple" defaultValue={["materials"]} className="space-y-2">
              {/* Materials Section */}
              <AccordionItem value="materials" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Materials</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </AccordionContent>
              </AccordionItem>

              {/* Drawing Tools Section */}
              <AccordionItem value="shapes" className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg shadow-sm`}>
                <AccordionTrigger className={`px-4 py-3 hover:no-underline ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} text-left`}>
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold uppercase tracking-wide">Shapes</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <ShapeSelector
                    selectedShape={selectedShape}
                    onShapeSelect={setSelectedShape}
                    onBackgroundUpload={handleBackgroundUpload}
                    onBackgroundRemove={handleBackgroundRemove}
                    onBackgroundOpacity={handleBackgroundOpacity}
                    hasBackground={hasBackground}
                    backgroundOpacity={backgroundOpacity}
                  />
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
                onClick={() => {}}
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
    </motion.div>
  );
}