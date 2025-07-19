import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@/components/canvas";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { Header } from "@/components/header";
// import ServiceStatusDashboard from "@/components/service-status-dashboard";
import { SimpleBIMModal } from "@/components/simple-bim-modal";
// import AIAssistant from "@/components/ai-assistant";
import { 
  Layers, 
  Zap, 
  Upload, 
  Pencil, 
  Box,
  CheckCircle,
  DollarSign,
  Clock,
  Users,
  TrendingUp
} from "lucide-react";
import type { MaterialType, ShapeType, RoomData } from "@/types";

// Dark mode hook
function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);
  
  return [darkMode, setDarkMode] as const;
}

// Mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
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

  // Modal states - removed all dashboard states
  const [showFixedBIMProcessor, setShowFixedBIMProcessor] = useState(false);
  const [showAICostPredictor, setShowAICostPredictor] = useState(false);
  const [showUploadPlans, setShowUploadPlans] = useState(false);
  const [show3DWireframe, setShow3DWireframe] = useState(false);
  
  const canvasRef = useRef<{ uploadBackground: (file: File) => void } | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // User tier detection (simplified)
  const getUserTier = () => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const subscriptionTier = localStorage.getItem('subscriptionTier') || 'free';
    
    if (isAdmin) return 'enterprise';
    return subscriptionTier;
  };

  const userTier = getUserTier();

  // Room change handlers
  const handleRoomsChange = (newRooms: RoomData[]) => {
    setRooms(newRooms);
    const cost = newRooms.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(cost);
  };

  const handleRoomSelect = (room: RoomData | null) => {
    setSelectedRoom(room);
  };

  const handleSaveProject = () => {
    const projectData = {
      rooms,
      totalCost,
      projectType,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('currentProject', JSON.stringify(projectData));
    toast({
      title: "Project Saved",
      description: "Your project has been saved successfully.",
    });
  };

  const handleBackgroundUpload = async (file: File): Promise<void> => {
    if (canvasRef.current?.uploadBackground) {
      try {
        await canvasRef.current.uploadBackground(file);
        setHasBackground(true);
      } catch (error) {
        console.error('Background upload failed:', error);
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

  // Tier-based feature access
  const canAccessFeature = (feature: string) => {
    switch (feature) {
      case 'basic_sketch':
        return true; // Available to all tiers
      case 'pro_tools':
        return userTier === 'pro' || userTier === 'enterprise';
      case 'enterprise_bim':
        return userTier === 'enterprise';
      case 'ai_predictor':
        return userTier === 'pro' || userTier === 'enterprise';
      default:
        return false;
    }
  };

  // Mobile layout
  if (isMobile) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`min-h-screen font-sans ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
      >
        {/* Mobile Header */}
        <div className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800' : 'bg-white'} border-b shadow-sm`}>
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-lg">EstiMate</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2"
            >
              {darkMode ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 space-y-4">
          {/* Status */}
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Tier</p>
                  <Badge className={`mt-1 ${
                    userTier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                    userTier === 'pro' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-lg font-bold text-blue-600">${totalCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas */}
          <Card className={`h-[300px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
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

          {/* Tools */}
          <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <CardContent className="p-4 space-y-4">
              <MaterialSelector 
                selectedMaterial={selectedMaterial}
                onMaterialSelect={setSelectedMaterial}
              />
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
      </motion.div>
    );
  }

  // Desktop layout - Direct workspace with tier-based functionality
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen font-sans flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}
    >
      {/* Status Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              EstiMate Platform
            </span>
            <span className="opacity-75">|</span>
            <span>Tier: {userTier.charAt(0).toUpperCase() + userTier.slice(1)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
      
      {/* Header */}
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Quick Actions */}
        <div className={`w-80 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r overflow-y-auto`}>
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              
              {/* Basic Features - Always Available */}
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                  onClick={() => {/* Already in workspace */}}
                >
                  <Pencil className="w-5 h-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Floor Plan Sketch</div>
                    <div className="text-xs text-gray-500">Draw rooms & calculate costs</div>
                  </div>
                </Button>

                {canAccessFeature('pro_tools') && (
                  <Button 
                    className="w-full justify-start h-auto p-4"
                    variant="outline"
                    onClick={() => navigate('/projects')}
                  >
                    <DollarSign className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Professional QS Tools</div>
                      <div className="text-xs text-gray-500">200+ materials & reports</div>
                    </div>
                  </Button>
                )}

                {canAccessFeature('enterprise_bim') && (
                  <Button 
                    className="w-full justify-start h-auto p-4"
                    variant="outline"
                    onClick={() => setShowFixedBIMProcessor(true)}
                  >
                    <Upload className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">BIM Auto-Takeoff</div>
                      <div className="text-xs text-gray-500">Upload CAD/BIM files</div>
                    </div>
                  </Button>
                )}

                {canAccessFeature('ai_predictor') && (
                  <Button 
                    className="w-full justify-start h-auto p-4"
                    variant="outline"
                    onClick={() => setShowAICostPredictor(true)}
                  >
                    <TrendingUp className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">AI Cost Predictor</div>
                      <div className="text-xs text-gray-500">Intelligent cost estimates</div>
                    </div>
                  </Button>
                )}
              </div>
            </div>

            {/* Current Project Stats */}
            <div>
              <h3 className="text-sm font-medium mb-3">Current Project</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Rooms:</span>
                  <span className="font-medium">{rooms.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-medium text-blue-600">${totalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Project Type:</span>
                  <span className="font-medium capitalize">{projectType}</span>
                </div>
              </div>
            </div>

            {/* Upgrade Prompt for Lower Tiers */}
            {userTier === 'free' && (
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Upgrade to Pro</h3>
                  <p className="text-xs mb-3 opacity-90">Unlock 200+ materials, AI predictions, and professional reports</p>
                  <Button size="sm" variant="secondary" className="w-full">
                    Upgrade Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {userTier === 'pro' && (
              <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Upgrade to Enterprise</h3>
                  <p className="text-xs mb-3 opacity-90">Get BIM Auto-Takeoff and replace your QS department</p>
                  <Button size="sm" variant="secondary" className="w-full">
                    Contact Sales
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Service Status - Temporarily removed */}
          
          {/* Canvas and Tools */}
          <div className="flex-1 p-6 space-y-6">
            {/* Canvas */}
            <Card className={`h-[400px] ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
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
            
            {/* Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <CardHeader>
                  <CardTitle className="text-lg">Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </CardContent>
              </Card>
              
              <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <CardHeader>
                  <CardTitle className="text-lg">Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent>
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
          </div>
        </div>
      </div>

      {/* Modals - Only render what's needed */}
      {showFixedBIMProcessor && (
        <SimpleBIMModal 
          isOpen={showFixedBIMProcessor}
          onClose={() => setShowFixedBIMProcessor(false)}
        />
      )}

      {/* AI Assistant - Temporarily removed */}
    </motion.div>
  );
}