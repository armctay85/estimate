import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Canvas } from "@/components/canvas";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { Header } from "@/components/header";
import { ArrowLeft, Save, FileText, Calculator } from "lucide-react";
import { useLocation } from "wouter";
import { type MaterialType, MATERIALS } from "@shared/schema";
import { type RoomData } from "@/lib/fabric-enhanced";

export function Sketch() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const canvasRef = useRef<{ uploadBackground: (file: File) => void }>(null);
  
  // Canvas state
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("concrete_slab");
  const [selectedShape, setSelectedShape] = useState<"rectangle" | "circle" | "polygon" | "line" | "freehand">("rectangle");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [projectName, setProjectName] = useState("New Floor Plan");
  
  // Background image state
  const [hasBackground, setHasBackground] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.5);

  const totalCost = rooms.reduce((sum, room) => sum + room.cost, 0);
  const totalArea = rooms.reduce((sum, room) => sum + room.area, 0);

  const handleSaveProject = () => {
    const projectData = {
      id: Date.now(),
      name: projectName,
      rooms,
      totalCost,
      totalArea,
      createdAt: new Date().toISOString(),
      type: "residential"
    };

    const existingProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    existingProjects.push(projectData);
    localStorage.setItem("projects", JSON.stringify(existingProjects));

    toast({
      title: "Project Saved",
      description: `${projectName} has been saved successfully.`,
    });
  };

  const handleBackgroundUpload = async (file: File) => {
    if (canvasRef.current) {
      canvasRef.current.uploadBackground(file);
      setHasBackground(true);
    }
  };

  const handleBackgroundRemove = () => {
    setHasBackground(false);
  };

  const handleBackgroundOpacity = (opacity: number) => {
    setBackgroundOpacity(opacity);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <div className="container mx-auto p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Floor Plan Sketch</h1>
              <p className="text-gray-600 dark:text-gray-400">Draw rooms and assign materials for cost estimation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Area</p>
              <p className="text-lg font-semibold">{totalArea.toFixed(1)} m²</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-lg font-semibold text-green-600">${totalCost.toLocaleString()}</p>
            </div>
            <Button onClick={handleSaveProject} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shape Selector */}
            <ShapeSelector
              selectedShape={selectedShape}
              onShapeSelect={setSelectedShape}
              onBackgroundUpload={handleBackgroundUpload}
              onBackgroundRemove={handleBackgroundRemove}
              onBackgroundOpacity={handleBackgroundOpacity}
              hasBackground={hasBackground}
              backgroundOpacity={backgroundOpacity}
            />

            {/* Material Selector */}
            <MaterialSelector
              selectedMaterial={selectedMaterial}
              onMaterialSelect={setSelectedMaterial}
            />

            {/* Selected Room Info */}
            {selectedRoom && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Room Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Material</p>
                    <p className="font-medium">{MATERIALS[selectedRoom.material]?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Area</p>
                    <p className="font-medium">{selectedRoom.area.toFixed(1)} m²</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cost</p>
                    <p className="font-medium text-green-600">${selectedRoom.cost.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Canvas
              ref={canvasRef}
              selectedMaterial={selectedMaterial}
              selectedShape={selectedShape}
              onRoomsChange={setRooms}
              onRoomSelect={setSelectedRoom}
              onSaveProject={handleSaveProject}
              onBackgroundUpload={handleBackgroundUpload}
              onBackgroundRemove={handleBackgroundRemove}
              onBackgroundOpacity={handleBackgroundOpacity}
              hasBackground={hasBackground}
              backgroundOpacity={backgroundOpacity}
            />
          </div>
        </div>

        {/* Rooms Summary */}
        {rooms.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Cost Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm border"
                          style={{ backgroundColor: MATERIALS[room.material]?.color }}
                        />
                        <span className="font-medium">Room {index + 1}</span>
                      </div>
                      <Badge variant="secondary">{MATERIALS[room.material]?.name}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Area:</span>
                        <span>{room.area.toFixed(1)} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="text-green-600 font-medium">${room.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}