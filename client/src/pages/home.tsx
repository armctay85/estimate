import { useState, useRef } from "react";
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
import { TrendingUp, FileBarChart, Users, Award, BarChart3, Upload } from "lucide-react";
import type { MaterialType } from "@shared/schema";
import type { ShapeType, RoomData } from "@/lib/fabric-enhanced";

export default function Home() {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("timber");
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(70);
  
  const canvasRef = useRef<{ uploadBackground: (file: File) => void } | null>(null);
  const isMobile = useIsMobile();

  const handleRoomsChange = (newRooms: RoomData[]) => {
    setRooms(newRooms);
    const total = newRooms.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(total);
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

  // Mobile layout - simplified for access rather than markup
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <CostDisplay rooms={rooms} totalCost={totalCost} />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-3">Professional Tools</h3>
              <AICostPredictor />
              <BIMProcessor />
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <FileBarChart className="w-4 h-4 mr-2" />
                Generate QS Report
              </Button>
              <Button className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                <Users className="w-4 h-4 mr-2" />
                Share Project
              </Button>
            </CardContent>
          </Card>
          
          <Card className="h-[400px]">
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
          
          <Card>
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
      </div>
    );
  }

  // Desktop layout - Procore-inspired professional design
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Procore-style Top Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                  E
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">EstiMate</h1>
                  <p className="text-xs text-gray-500">Professional QS Platform</p>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <nav className="flex items-center gap-1">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg border border-blue-200">
                  Dashboard
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                  Projects
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                  Reports
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
                  Settings
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Subscription Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-full">
                <Award className="w-3 h-3 text-purple-600" />
                <span className="text-xs font-medium text-purple-700">Enterprise</span>
              </div>
              
              {/* Cost Display */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">
                  ${totalCost.toLocaleString()}
                </span>
              </div>

              <Button size="sm" onClick={handleSaveProject} className="bg-blue-600 hover:bg-blue-700">
                Save Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools & Controls */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Drawing Tools
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Materials Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                Materials
              </h3>
              <Card className="border-gray-200">
                <CardContent className="p-3">
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Drawing Tools Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Shapes
              </h3>
              <Card className="border-gray-200">
                <CardContent className="p-3">
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
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
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
    </div>
  );
}