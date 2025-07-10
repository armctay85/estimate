import { useState, useRef } from "react";
import { MaterialSelector } from "@/components/material-selector";
import { ShapeSelector } from "@/components/shape-selector";
import { Canvas } from "@/components/canvas";
import { CostDisplay } from "@/components/cost-display";
import { RoomDetails } from "@/components/room-details";
import { Header } from "@/components/header";
import { Sidebar, SidebarHeader, SidebarContent, SidebarSection } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
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

  // Desktop/Tablet layout - MS Paint style with sidebar
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - MS Paint style tool palette */}
        <Sidebar className="w-80 border-r-2 border-border shadow-lg">
          <SidebarHeader>
            <h2 className="text-lg font-semibold">BuildCost Sketch</h2>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarSection title="Drawing Tools">
              <ShapeSelector
                selectedShape={selectedShape}
                onShapeSelect={setSelectedShape}
                onBackgroundUpload={handleBackgroundUpload}
                onBackgroundRemove={handleBackgroundRemove}
                onBackgroundOpacity={handleBackgroundOpacity}
                hasBackground={hasBackground}
                backgroundOpacity={backgroundOpacity}
              />
            </SidebarSection>
            
            <SidebarSection title="Floor Materials">
              <MaterialSelector 
                selectedMaterial={selectedMaterial}
                onMaterialSelect={setSelectedMaterial}
              />
            </SidebarSection>
            
            {selectedRoom && (
              <SidebarSection title="Room Properties">
                <RoomDetails
                  selectedRoom={selectedRoom}
                  onRoomUpdate={handleRoomUpdate}
                />
              </SidebarSection>
            )}
            
            <SidebarSection title="Project Cost">
              <CostDisplay rooms={rooms} totalCost={totalCost} />
            </SidebarSection>
          </SidebarContent>
        </Sidebar>
        
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 p-4">
            <div className="h-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-inner">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}