import * as fabric from "fabric";
import { MATERIALS, type MaterialType } from "@shared/schema";

export interface RoomData {
  id: string;
  name: string;
  width: number;
  height: number;
  material: MaterialType;
  cost: number;
  positionX: number;
  positionY: number;
  fabricObject?: fabric.Rect;
}

export class CanvasManager {
  private canvas: fabric.Canvas;
  private rooms: Map<string, RoomData> = new Map();
  private onRoomsChange?: (rooms: RoomData[]) => void;
  private selectedMaterial: MaterialType = "timber";

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: 800,
      height: 500,
      backgroundColor: "#F9FAFB",
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.on("object:modified", this.handleObjectModified.bind(this));
    this.canvas.on("selection:created", this.handleSelectionCreated.bind(this));
    this.canvas.on("selection:updated", this.handleSelectionUpdated.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
  }

  private handleObjectModified(e: fabric.IEvent) {
    const obj = e.target as fabric.Rect & { roomId?: string };
    if (obj && obj.roomId) {
      const room = this.rooms.get(obj.roomId);
      if (room) {
        room.width = (obj.width || 0) * (obj.scaleX || 1);
        room.height = (obj.height || 0) * (obj.scaleY || 1);
        room.positionX = obj.left || 0;
        room.positionY = obj.top || 0;
        room.cost = this.calculateRoomCost(room.width, room.height, room.material);
        this.updateRoomLabel(room);
        this.notifyRoomsChange();
      }
    }
  }

  private handleSelectionCreated(e: fabric.IEvent) {
    // Handle room selection
  }

  private handleSelectionUpdated(e: fabric.IEvent) {
    // Handle room selection update
  }

  private handleSelectionCleared(e: fabric.IEvent) {
    // Handle room deselection
  }

  private calculateRoomCost(width: number, height: number, material: MaterialType): number {
    const area = (width * height) / 10000; // Convert pixels to square meters (rough approximation)
    return area * MATERIALS[material].cost;
  }

  private updateRoomLabel(room: RoomData) {
    const area = ((room.width * room.height) / 10000).toFixed(1);
    const text = `${room.name}\n${area}m²\n${MATERIALS[room.material].name}\n$${room.cost.toFixed(0)}`;
    
    // Find and update the text object
    const objects = this.canvas.getObjects();
    const textObj = objects.find(obj => (obj as any).roomId === room.id && obj.type === 'text') as fabric.Text;
    if (textObj) {
      textObj.set('text', text);
      this.canvas.renderAll();
    }
  }

  public addRoom(name: string = "New Room"): RoomData {
    const id = `room_${Date.now()}`;
    const width = 120;
    const height = 80;
    const positionX = 50 + Math.random() * 200;
    const positionY = 50 + Math.random() * 200;

    const room: RoomData = {
      id,
      name,
      width,
      height,
      material: this.selectedMaterial,
      cost: this.calculateRoomCost(width, height, this.selectedMaterial),
      positionX,
      positionY,
    };

    // Create room rectangle
    const rect = new fabric.Rect({
      left: positionX,
      top: positionY,
      width,
      height,
      fill: MATERIALS[this.selectedMaterial].color + "20", // 20% opacity
      stroke: MATERIALS[this.selectedMaterial].color,
      strokeWidth: 2,
      selectable: true,
      hasControls: true,
      hasBorders: true,
    });

    (rect as any).roomId = id;
    room.fabricObject = rect;

    // Create room label
    const area = ((width * height) / 10000).toFixed(1);
    const text = new fabric.Text(`${name}\n${area}m²\n${MATERIALS[this.selectedMaterial].name}\n$${room.cost.toFixed(0)}`, {
      left: positionX + width / 2,
      top: positionY + height / 2,
      fontSize: 12,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      fontFamily: 'Inter, sans-serif',
    });

    (text as any).roomId = id;

    this.canvas.add(rect);
    this.canvas.add(text);
    this.canvas.renderAll();

    this.rooms.set(id, room);
    this.notifyRoomsChange();

    return room;
  }

  public deleteRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      // Remove fabric objects
      const objects = this.canvas.getObjects();
      const roomObjects = objects.filter(obj => (obj as any).roomId === roomId);
      roomObjects.forEach(obj => this.canvas.remove(obj));
      
      this.rooms.delete(roomId);
      this.canvas.renderAll();
      this.notifyRoomsChange();
    }
  }

  public updateRoomMaterial(roomId: string, material: MaterialType) {
    const room = this.rooms.get(roomId);
    if (room && room.fabricObject) {
      room.material = material;
      room.cost = this.calculateRoomCost(room.width, room.height, material);
      
      // Update room appearance
      room.fabricObject.set({
        fill: MATERIALS[material].color + "20",
        stroke: MATERIALS[material].color,
      });
      
      this.updateRoomLabel(room);
      this.canvas.renderAll();
      this.notifyRoomsChange();
    }
  }

  public updateRoomName(roomId: string, name: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.name = name;
      this.updateRoomLabel(room);
      this.notifyRoomsChange();
    }
  }

  public clearCanvas() {
    this.canvas.clear();
    this.rooms.clear();
    this.canvas.setBackgroundColor("#F9FAFB", this.canvas.renderAll.bind(this.canvas));
    this.notifyRoomsChange();
  }

  public setSelectedMaterial(material: MaterialType) {
    this.selectedMaterial = material;
  }

  public getSelectedRoom(): RoomData | null {
    const activeObject = this.canvas.getActiveObject() as fabric.Rect & { roomId?: string };
    if (activeObject && activeObject.roomId) {
      return this.rooms.get(activeObject.roomId) || null;
    }
    return null;
  }

  public getRooms(): RoomData[] {
    return Array.from(this.rooms.values());
  }

  public getTotalCost(): number {
    return Array.from(this.rooms.values()).reduce((total, room) => total + room.cost, 0);
  }

  public onRoomsChangeCallback(callback: (rooms: RoomData[]) => void) {
    this.onRoomsChange = callback;
  }

  private notifyRoomsChange() {
    if (this.onRoomsChange) {
      this.onRoomsChange(this.getRooms());
    }
  }

  public dispose() {
    this.canvas.dispose();
  }
}
