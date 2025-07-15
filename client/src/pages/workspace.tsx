import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Canvas } from "@/components/canvas";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { CostDisplay } from "@/components/cost-display";
import { RoomDetails } from "@/components/room-details";
import { Header } from "@/components/header";
import { AICostPredictor } from "@/components/ai-cost-predictor";
import { BIMProcessor } from "@/components/bim-processor";
import { PhotoRenovationTool } from "@/components/photo-renovation-tool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Download, Calculator, Camera, Upload } from "lucide-react";
import { PARAMETRIC_ASSEMBLIES, type MaterialType } from "@shared/schema";
import type { ShapeType, RoomData } from "@/lib/fabric-enhanced";

export default function Workspace() {
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const mode = params.get('mode') || 'estimator';
  
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("timber");
  const [selectedShape, setSelectedShape] = useState<ShapeType>("rectangle");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [projectType, setProjectType] = useState("commercial");
  const [projectName, setProjectName] = useState("New Project");
  
  // Mode-specific states
  const [showAICostPredictor, setShowAICostPredictor] = useState(mode === 'ai-predictor');
  const [showBIMProcessor, setShowBIMProcessor] = useState(mode === 'bim');
  const [showPhotoRenovation, setShowPhotoRenovation] = useState(mode === 'photo');

  const canvasRef = useRef<{ uploadBackground: (file: File) => void } | null>(null);

  const handleRoomAdded = (room: RoomData) => {
    setRooms(prev => [...prev, room]);
    calculateTotalCost([...rooms, room]);
  };

  const handleRoomUpdated = (updatedRoom: RoomData) => {
    setRooms(prev => prev.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
    calculateTotalCost(rooms.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
  };

  const handleRoomDeleted = (roomId: string) => {
    const updatedRooms = rooms.filter(room => room.id !== roomId);
    setRooms(updatedRooms);
    calculateTotalCost(updatedRooms);
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
    }
  };

  const calculateTotalCost = (roomList: RoomData[]) => {
    const total = roomList.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(total);
  };

  const saveProject = () => {
    const project = {
      id: Date.now().toString(),
      name: projectName,
      type: projectType,
      rooms,
      totalCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const existingProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    localStorage.setItem('projects', JSON.stringify([...existingProjects, project]));
    
    alert('Project saved successfully!');
  };

  const getModeTitle = () => {
    switch (mode) {
      case 'photo': return 'Photo Renovation AI';
      case 'bim': return 'BIM File Processor';
      case 'ai-predictor': return 'AI Cost Predictor';
      default: return 'Quick Cost Estimator';
    }
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'photo': return 'Upload photos and get AI-powered renovation suggestions with cost estimates';
      case 'bim': return 'Upload CAD/BIM files for automated quantity takeoff and cost analysis';
      case 'ai-predictor': return 'Get AI-powered cost predictions based on project parameters';
      default: return 'Create floor plans and get instant Australian construction cost estimates';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Workspace Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getModeTitle()}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {getModeDescription()}
                </p>
              </div>
            </div>
            
            {mode === 'estimator' && (
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  Total: ${totalCost.toLocaleString()}
                </Badge>
                <Button onClick={saveProject} className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Project</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Mode-specific content */}
        {mode === 'photo' && (
          <PhotoRenovationTool 
            isOpen={showPhotoRenovation}
            onClose={() => setShowPhotoRenovation(false)}
          />
        )}

        {mode === 'bim' && (
          <BIMProcessor 
            isOpen={showBIMProcessor}
            onClose={() => setShowBIMProcessor(false)}
          />
        )}

        {mode === 'ai-predictor' && (
          <AICostPredictor 
            isOpen={showAICostPredictor}
            onClose={() => setShowAICostPredictor(false)}
          />
        )}

        {mode === 'estimator' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Tools Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Drawing Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ShapeSelector 
                    selectedShape={selectedShape}
                    onShapeSelect={setSelectedShape}
                  />
                  <MaterialSelector 
                    selectedMaterial={selectedMaterial}
                    onMaterialSelect={setSelectedMaterial}
                    projectType={projectType}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Type</label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="retail">Retail</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <CostDisplay totalCost={totalCost} rooms={rooms} />
            </div>

            {/* Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  <Canvas
                    ref={canvasRef}
                    selectedMaterial={selectedMaterial}
                    selectedShape={selectedShape}
                    onRoomAdded={handleRoomAdded}
                    onRoomUpdated={handleRoomUpdated}
                    onRoomDeleted={handleRoomDeleted}
                    onRoomSelected={setSelectedRoom}
                    projectType={projectType}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Room Details */}
            <div className="lg:col-span-1">
              <RoomDetails
                rooms={rooms}
                selectedRoom={selectedRoom}
                onRoomSelect={setSelectedRoom}
                onRoomUpdate={handleRoomUpdated}
                onRoomDelete={handleRoomDeleted}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}