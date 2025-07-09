import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RoomData } from "@/lib/fabric";
import { MATERIALS, type MaterialType } from "@shared/schema";

interface RoomDetailsProps {
  selectedRoom: RoomData | null;
  onRoomUpdate: (roomId: string, updates: Partial<RoomData>) => void;
}

export function RoomDetails({ selectedRoom, onRoomUpdate }: RoomDetailsProps) {
  const [localRoom, setLocalRoom] = useState<RoomData | null>(null);

  useEffect(() => {
    setLocalRoom(selectedRoom);
  }, [selectedRoom]);

  const handleNameChange = (name: string) => {
    if (localRoom) {
      setLocalRoom({ ...localRoom, name });
      onRoomUpdate(localRoom.id, { name });
    }
  };

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    if (localRoom) {
      const numValue = parseFloat(value) || 0;
      const updates = { [field]: numValue };
      setLocalRoom({ ...localRoom, ...updates });
      onRoomUpdate(localRoom.id, updates);
    }
  };

  const handleMaterialChange = (material: MaterialType) => {
    if (localRoom) {
      const updates = { material };
      setLocalRoom({ ...localRoom, ...updates });
      onRoomUpdate(localRoom.id, updates);
    }
  };

  if (!localRoom) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Room Details
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No room selected</p>
            <p className="text-xs mt-1">Select a room to edit its details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const area = ((localRoom.width * localRoom.height) / 10000).toFixed(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Room Details
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Room Name */}
          <div>
            <Label htmlFor="room-name" className="text-sm font-medium text-gray-700">
              Room Name
            </Label>
            <Input
              id="room-name"
              value={localRoom.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Living Room"
              className="mt-1"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="room-width" className="text-sm font-medium text-gray-700">
                Width (px)
              </Label>
              <Input
                id="room-width"
                type="number"
                value={localRoom.width.toFixed(0)}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="120"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="room-height" className="text-sm font-medium text-gray-700">
                Height (px)
              </Label>
              <Input
                id="room-height"
                type="number"
                value={localRoom.height.toFixed(0)}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                placeholder="80"
                className="mt-1"
              />
            </div>
          </div>

          {/* Area Display */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Area</Label>
            <div className="mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-900">{area} m² (approx)</span>
            </div>
          </div>

          {/* Material Selection */}
          <div>
            <Label htmlFor="room-material" className="text-sm font-medium text-gray-700">
              Material
            </Label>
            <Select
              value={localRoom.material}
              onValueChange={handleMaterialChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATERIALS).map(([key, material]) => (
                  <SelectItem key={key} value={key}>
                    {material.name} (${material.cost}/m²)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cost Display */}
          <div>
            <Label className="text-sm font-medium text-gray-700">Estimated Cost</Label>
            <div className="mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-green-50">
              <span className="text-lg font-semibold text-green-800">
                ${localRoom.cost.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
