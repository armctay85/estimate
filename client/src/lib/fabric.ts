import * as fabric from "fabric";
import { MATERIALS, type MaterialType } from "@shared/schema";

export type ShapeType = "rectangle" | "circle" | "polygon" | "line" | "freehand";

export interface RoomData {
  id: string;
  name: string;
  width: number;
  height: number;
  material: MaterialType;
  cost: number;
  positionX: number;
  positionY: number;
  shapeType: ShapeType;
  points?: number[]; // For polygons and freehand
  fabricObject?: fabric.Object;
}

export class CanvasManager {
  private canvas: fabric.Canvas;
  private rooms: Map<string, RoomData> = new Map();
  private onRoomsChange?: (rooms: RoomData[]) => void;
  private selectedMaterial: MaterialType = "timber";
  private currentShape: ShapeType = "rectangle";
  private isDrawing = false;
  private drawingPath?: fabric.Path;
  private backgroundImage?: fabric.Image;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = new fabric.Canvas(canvasElement, {
      width: 800,
      height: 500,
      backgroundColor: "#F9FAFB",
      selection: true,
      enableRetinaScaling: true,
    });

    console.log('CanvasManager: Canvas initialized with dimensions:', this.canvas.getWidth(), 'x', this.canvas.getHeight());
    this.setupEventListeners();
    this.setupDrawingEvents();
  }

  private setupEventListeners() {
    this.canvas.on("object:modified", this.handleObjectModified.bind(this));
    this.canvas.on("selection:created", this.handleSelectionCreated.bind(this));
    this.canvas.on("selection:updated", this.handleSelectionUpdated.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
  }

  private setupDrawingEvents() {
    this.canvas.on("mouse:down", this.handleMouseDown.bind(this));
    this.canvas.on("mouse:move", this.handleMouseMove.bind(this));
    this.canvas.on("mouse:up", this.handleMouseUp.bind(this));
  }

  private handleMouseDown(e: fabric.IEvent) {
    if (this.currentShape === "freehand") {
      this.isDrawing = true;
      const pointer = this.canvas.getPointer(e.e);
      const points = [pointer.x, pointer.y, pointer.x, pointer.y];
      this.drawingPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        stroke: "#000",
        strokeWidth: 2,
        fill: "",
        selectable: false,
      });
      this.canvas.add(this.drawingPath);
    }
  }

  private handleMouseMove(e: fabric.IEvent) {
    if (!this.isDrawing || this.currentShape !== "freehand" || !this.drawingPath) return;
    
    const pointer = this.canvas.getPointer(e.e);
    const path = this.drawingPath.path!;
    path.push(["L", pointer.x, pointer.y]);
    this.drawingPath.path = path;
    this.canvas.renderAll();
  }

  private handleMouseUp(e: fabric.IEvent) {
    if (this.currentShape === "freehand" && this.isDrawing) {
      this.isDrawing = false;
      if (this.drawingPath) {
        this.drawingPath.selectable = true;
        this.convertPathToRoom(this.drawingPath);
        this.drawingPath = undefined;
      }
    }
  }

  private convertPathToRoom(path: fabric.Path) {
    const bounds = path.getBoundingRect();
    const room: RoomData = {
      id: Date.now().toString(),
      name: "Freehand Room",
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: this.calculateRoomCost(bounds.width, bounds.height, this.selectedMaterial),
      positionX: bounds.left,
      positionY: bounds.top,
      shapeType: "freehand",
      fabricObject: path,
    };
    
    (path as any).roomId = room.id;
    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();
  }

  private handleObjectModified(e: fabric.IEvent) {
    const obj = e.target as fabric.Object & { roomId?: string };
    if (obj && obj.roomId) {
      const room = this.rooms.get(obj.roomId);
      if (room) {
        const bounds = obj.getBoundingRect();
        room.width = bounds.width;
        room.height = bounds.height;
        room.positionX = bounds.left;
        room.positionY = bounds.top;
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
    const shape = this.createShape();
    const bounds = shape.getBoundingRect();

    const room: RoomData = {
      id: Date.now().toString(),
      name,
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: this.calculateRoomCost(bounds.width, bounds.height, this.selectedMaterial),
      positionX: bounds.left,
      positionY: bounds.top,
      shapeType: this.currentShape,
      fabricObject: shape,
    };

    (shape as any).roomId = room.id;
    this.rooms.set(room.id, room);
    this.canvas.add(shape);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();
    
    return room;
  }

  private createShape(): fabric.Object {
    const baseStyle = {
      fill: "rgba(59, 130, 246, 0.1)",
      stroke: MATERIALS[this.selectedMaterial].color,
      strokeWidth: 2,
      cornerStyle: "circle" as const,
      cornerSize: 8,
      transparentCorners: false,
      cornerColor: "#3B82F6",
    };

    const position = {
      left: 50 + (this.rooms.size * 20),
      top: 50 + (this.rooms.size * 20),
    };

    switch (this.currentShape) {
      case "rectangle":
        return new fabric.Rect({
          ...baseStyle,
          ...position,
          width: 100,
          height: 80,
        });

      case "circle":
        return new fabric.Circle({
          ...baseStyle,
          ...position,
          radius: 50,
        });

      case "polygon":
        const points = [
          { x: 50, y: 0 },
          { x: 100, y: 25 },
          { x: 75, y: 75 },
          { x: 25, y: 75 },
          { x: 0, y: 25 }
        ];
        return new fabric.Polygon(points, {
          ...baseStyle,
          ...position,
        });

      case "line":
        return new fabric.Line([0, 0, 100, 100], {
          ...baseStyle,
          ...position,
          strokeWidth: 4,
        });

      default:
        return new fabric.Rect({
          ...baseStyle,
          ...position,
          width: 100,
          height: 80,
        });
    }
  }

  // PDF/Image underlay methods
  public async loadBackgroundImage(file: File): Promise<void> {
    console.log('Loading background file:', file.name, file.type);
    
    try {
      // Upload file to server for processing
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-background', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Upload failed');
      }
      
      console.log('File processed by server:', result);
      
      // Handle PDFs with placeholder for now
      if (result.isPdf) {
        await this.loadPDFAsBackground(file);
        console.log('PDF placeholder created successfully');
        return;
      }
      
      // Handle regular images with server-processed data
      if (result.dataUrl) {
        await this.loadImageFromDataUrl(result.dataUrl, file.name);
      } else {
        throw new Error('No image data received from server');
      }
      
    } catch (error) {
      console.error('Server upload failed, falling back to client processing:', error);
      // Fallback to client-side processing
      try {
        await this.loadImageClientSide(file);
      } catch (fallbackError) {
        console.error('Client-side processing also failed:', fallbackError);
        throw new Error(`Failed to load background: ${file.name}`);
      }
    }
  }

  private async loadImageFromDataUrl(dataUrl: string, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        // Get canvas dimensions
        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();
        
        // Calculate scale to fit the image within canvas while maintaining aspect ratio
        const scaleX = canvasWidth / imgElement.width;
        const scaleY = canvasHeight / imgElement.height;
        const scale = Math.min(scaleX, scaleY);
        
        const img = new fabric.Image(imgElement, {
          left: 0,
          top: 0,
          selectable: false,
          evented: false,
          opacity: 0.7,
          scaleX: scale,
          scaleY: scale,
        });
        
        if (this.backgroundImage) {
          this.canvas.remove(this.backgroundImage);
        }
        
        this.backgroundImage = img;
        this.canvas.add(img);
        this.canvas.sendToBack(img);
        this.canvas.renderAll();
        
        console.log('Background image loaded successfully', {
          filename,
          originalSize: { width: imgElement.width, height: imgElement.height },
          canvasSize: { width: canvasWidth, height: canvasHeight },
          scale: scale
        });
        
        resolve();
      };
      imgElement.onerror = (error) => {
        console.error('Failed to load processed image:', error);
        reject(new Error(`Failed to load processed image: ${filename}`));
      };
      imgElement.src = dataUrl;
    });
  }

  private async loadImageClientSide(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        this.loadPDFAsBackground(file).then(resolve).catch(reject);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgElement = new Image();
        imgElement.onload = () => {
          const canvasWidth = this.canvas.getWidth();
          const canvasHeight = this.canvas.getHeight();
          const scaleX = canvasWidth / imgElement.width;
          const scaleY = canvasHeight / imgElement.height;
          const scale = Math.min(scaleX, scaleY);
          
          const img = new fabric.Image(imgElement, {
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
            opacity: 0.7,
            scaleX: scale,
            scaleY: scale,
          });
          
          if (this.backgroundImage) {
            this.canvas.remove(this.backgroundImage);
          }
          
          this.backgroundImage = img;
          this.canvas.add(img);
          this.canvas.sendToBack(img);
          this.canvas.renderAll();
          
          console.log('Background image loaded via client fallback');
          resolve();
        };
        imgElement.onerror = reject;
        imgElement.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async loadPDFAsBackground(file: File): Promise<void> {
    return new Promise((resolve) => {
      // Remove existing background
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage);
      }
      
      // Create a placeholder rectangle with PDF info
      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();
      
      const placeholder = new fabric.Rect({
        left: 10,
        top: 10,
        width: canvasWidth - 20,
        height: canvasHeight - 20,
        fill: 'rgba(59, 130, 246, 0.1)',
        stroke: '#3B82F6',
        strokeWidth: 2,
        strokeDashArray: [10, 10],
        selectable: false,
        evented: false,
      });
      
      const text = new fabric.Text(`📄 PDF: ${file.name}\nUploaded successfully!\nFull PDF rendering coming soon...`, {
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        originX: 'center',
        originY: 'center',
        fontSize: 18,
        fill: '#3B82F6',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        selectable: false,
        evented: false,
      });
      
      // Add placeholder rectangle
      this.canvas.add(placeholder);
      this.canvas.sendToBack(placeholder);
      
      // Add text on top
      this.canvas.add(text);
      this.canvas.sendToBack(text);
      
      this.canvas.renderAll();
      
      // Store reference to placeholder for removal
      this.backgroundImage = placeholder;
      
      console.log('PDF placeholder created successfully');
      resolve();
    });
  }

  public removeBackgroundImage(): void {
    if (this.backgroundImage) {
      this.canvas.remove(this.backgroundImage);
      this.backgroundImage = undefined;
      this.canvas.renderAll();
    }
  }

  public setBackgroundOpacity(opacity: number): void {
    if (this.backgroundImage) {
      this.backgroundImage.set('opacity', opacity);
      this.canvas.renderAll();
    }
  }

  public setCurrentShape(shape: ShapeType): void {
    this.currentShape = shape;
  }

  public getCurrentShape(): ShapeType {
    return this.currentShape;
  }

  // Clean up duplicate code - removed old addRoom method remnants

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
