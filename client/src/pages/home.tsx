import { useState, useEffect } from "react";
// import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Canvas } from "@/components/canvas";
import { MaterialSelector } from "@/components/material-selector";
import { CostDisplay } from "@/components/cost-display";
import { RoomDetails } from "@/components/room-details";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { type RoomData } from "@/lib/fabric";
import { type MaterialType } from "@shared/schema";
import { TriangleAlert } from "lucide-react";

const AUSTRALIAN_LOCATIONS = [
  "Sydney, NSW",
  "Melbourne, VIC", 
  "Brisbane, QLD",
  "Perth, WA",
  "Adelaide, SA",
  "Canberra, ACT",
  "Darwin, NT",
  "Hobart, TAS"
];

export default function Home() {
  // Bypass authentication completely for demo mode
  const user = null;
  const isLoading = false;
  // const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Project state
  const [projectName, setProjectName] = useState("New Renovation");
  const [projectLocation, setProjectLocation] = useState("Sydney, NSW");
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType>("timber");
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  // Skip authentication for now
  // useEffect(() => {
  //   if (!isLoading && !user) {
  //     setLocation("/auth");
  //   }
  // }, [user, isLoading, setLocation]);

  // Calculate total cost when rooms change
  useEffect(() => {
    const total = rooms.reduce((sum, room) => sum + room.cost, 0);
    setTotalCost(total);
  }, [rooms]);

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      // Skip saving for now when no authentication
      if (!user) {
        return { message: "Project saved locally (demo mode)" };
      }

      const projectData = {
        name: projectName,
        location: projectLocation,
        rooms: JSON.stringify(rooms.map(room => ({
          name: room.name,
          width: room.width,
          height: room.height,
          material: room.material,
          cost: room.cost,
          positionX: room.positionX,
          positionY: room.positionY,
        }))),
        totalCost,
      };

      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Project saved!",
        description: "Your project has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: (error: any) => {
      if (error.message.includes('project limit reached')) {
        toast({
          title: "Project limit reached",
          description: "Upgrade to Pro to create unlimited projects.",
          variant: "destructive",
        });
        setLocation("/subscribe");
      } else {
        toast({
          title: "Save failed",
          description: error.message || "Failed to save project",
          variant: "destructive",
        });
      }
    },
  });

  const handleRoomsChange = (newRooms: RoomData[]) => {
    setRooms(newRooms);
  };

  const handleRoomSelect = (room: RoomData | null) => {
    setSelectedRoom(room);
  };

  const handleRoomUpdate = (roomId: string, updates: Partial<RoomData>) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, ...updates } : room
    ));
  };

  const handleSaveProject = () => {
    saveProjectMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Skip auth check for demo mode
  // if (!user) {
  //   return null; // Will redirect in useEffect
  // }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar - Project Info and Tools */}
          <div className="lg:col-span-1 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Project Details
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-name" className="text-sm font-medium text-gray-700">
                    Project Name
                  </Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="New Renovation"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-location" className="text-sm font-medium text-gray-700">
                    Location
                  </Label>
                  <Select value={projectLocation} onValueChange={setProjectLocation}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUSTRALIAN_LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Material Selector */}
            <MaterialSelector 
              selectedMaterial={selectedMaterial}
              onMaterialSelect={setSelectedMaterial}
            />
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <Canvas
              selectedMaterial={selectedMaterial}
              onRoomsChange={handleRoomsChange}
              onRoomSelect={handleRoomSelect}
              onSaveProject={handleSaveProject}
            />
          </div>

          {/* Right Sidebar - Room Details and Cost */}
          <div className="lg:col-span-1 space-y-6">
            {/* Room Details */}
            <RoomDetails
              selectedRoom={selectedRoom}
              onRoomUpdate={handleRoomUpdate}
            />

            {/* Cost Display */}
            <CostDisplay
              rooms={rooms}
              totalCost={totalCost}
            />
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <Alert className="bg-yellow-50 border-yellow-200">
            <TriangleAlert className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700">
              <strong>Cost Disclaimer:</strong> Costs are estimates based on national averages from sources like Hipages and Matrix Estimating, 2025. 
              Actual costs may vary significantly based on location, quality, installation complexity, and market conditions. 
              Always consult licensed professionals for accurate quotes.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col md:flex-row justify-between items-center mt-6">
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>&copy; 2025 BuildCost Sketch</span>
              <a href="#" className="hover:text-primary">Privacy Policy</a>
              <a href="#" className="hover:text-primary">Terms of Service</a>
              <a href="#" className="hover:text-primary">Support</a>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-500">Made for Australian builders</span>
              <span className="text-lg">🇦🇺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
