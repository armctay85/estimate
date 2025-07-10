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
  points?: number[];
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
  private backgroundImage?: fabric.Object;
  private gridVisible = true;
  private gridGroup?: fabric.Group;
  public zoomLevel = 1;
  private isPanning = false;
  private panStartPoint?: { x: number; y: number };

  constructor(canvasElement: HTMLCanvasElement) {
    try {
      this.canvas = new fabric.Canvas(canvasElement, {
        width: 800,
        height: 500,
        backgroundColor: "#F9FAFB",
        selection: true,
        enableRetinaScaling: true,
        preserveObjectStacking: true,
        imageSmoothingEnabled: false,
      });

      this.setupEventListeners();
      this.setupDrawingEvents();
      this.setupZoomAndPan();
      this.createGrid();
      
      console.log('CanvasManager: Enhanced canvas initialized');
    } catch (error) {
      console.error('CanvasManager: Failed to initialize:', error);
      throw error;
    }
  }

  // Enhanced Grid System
  private createGrid(): void {
    const gridSize = 20;
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();
    const lines: fabric.Line[] = [];

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      lines.push(new fabric.Line([i, 0, i, canvasHeight], {
        stroke: '#E5E7EB',
        strokeWidth: i % (gridSize * 5) === 0 ? 1.5 : 0.5,
        selectable: false,
        evented: false,
      }));
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      lines.push(new fabric.Line([0, i, canvasWidth, i], {
        stroke: '#E5E7EB',
        strokeWidth: i % (gridSize * 5) === 0 ? 1.5 : 0.5,
        selectable: false,
        evented: false,
      }));
    }

    this.gridGroup = new fabric.Group(lines, {
      selectable: false,
      evented: false,
      opacity: 0.7,
    });

    this.canvas.add(this.gridGroup);
    this.gridGroup.visible = this.gridVisible;
    this.canvas.renderAll();
  }

  // Zoom and Pan System
  private setupZoomAndPan(): void {
    // Mouse wheel zoom
    this.canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 20) zoom = 20;
      if (zoom < 0.1) zoom = 0.1;
      
      this.zoomLevel = zoom;
      this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Pan with middle mouse or space + drag
    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e;
      if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) { // Middle mouse or Shift+click
        this.isPanning = true;
        this.canvas.selection = false;
        this.panStartPoint = { x: evt.clientX, y: evt.clientY };
        opt.e.preventDefault();
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (this.isPanning && this.panStartPoint) {
        const evt = opt.e;
        const vpt = this.canvas.viewportTransform!;
        vpt[4] += evt.clientX - this.panStartPoint.x;
        vpt[5] += evt.clientY - this.panStartPoint.y;
        this.canvas.requestRenderAll();
        this.panStartPoint = { x: evt.clientX, y: evt.clientY };
      }
    });

    this.canvas.on('mouse:up', () => {
      if (this.isPanning) {
        this.isPanning = false;
        this.canvas.selection = true;
        this.panStartPoint = undefined;
      }
    });
  }

  // Enhanced Drawing System
  private setupEventListeners() {
    this.canvas.on("object:modified", this.handleObjectModified.bind(this));
    this.canvas.on("selection:created", this.handleSelectionCreated.bind(this));
    this.canvas.on("selection:updated", this.handleSelectionUpdated.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
    
    // Enable object selection and movement
    this.canvas.selection = true;
    this.canvas.skipTargetFind = false;
  }

  private setupDrawingEvents() {
    this.canvas.on("mouse:down", this.handleMouseDown.bind(this));
    this.canvas.on("mouse:move", this.handleMouseMove.bind(this));
    this.canvas.on("mouse:up", this.handleMouseUp.bind(this));
  }

  private handleMouseDown(e: fabric.IEvent) {
    // Skip if panning
    if (this.isPanning) return;

    if (this.currentShape === "freehand") {
      this.isDrawing = true;
      const pointer = this.canvas.getPointer(e.e);
      const points = [pointer.x, pointer.y, pointer.x, pointer.y];
      this.drawingPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
        stroke: MATERIALS[this.selectedMaterial].color,
        strokeWidth: 3,
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

    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();
  }

  private handleObjectModified(e: fabric.IEvent) {
    const obj = e.target;
    if (!obj) return;

    // Find the room associated with this object
    for (const [id, room] of this.rooms) {
      if (room.fabricObject === obj) {
        const bounds = obj.getBoundingRect();
        room.width = bounds.width;
        room.height = bounds.height;
        room.positionX = bounds.left;
        room.positionY = bounds.top;
        room.cost = this.calculateRoomCost(room.width, room.height, room.material);
        this.updateRoomLabel(room);
        this.notifyRoomsChange();
        break;
      }
    }
  }

  private handleSelectionCreated(e: fabric.IEvent) {
    // Implementation for selection created
  }

  private handleSelectionUpdated(e: fabric.IEvent) {
    // Implementation for selection updated
  }

  private handleSelectionCleared(e: fabric.IEvent) {
    // Implementation for selection cleared
  }

  private calculateRoomCost(width: number, height: number, material: MaterialType): number {
    const areaSquareMeters = (width * height) / 10000; // Convert from canvas units to square meters
    return Math.round(areaSquareMeters * MATERIALS[material].cost);
  }

  private updateRoomLabel(room: RoomData) {
    // Update room label if needed
  }

  // Enhanced Room Creation
  public addRoom(name: string = "New Room"): RoomData {
    const centerX = this.canvas.getWidth() / 2;
    const centerY = this.canvas.getHeight() / 2;
    
    const shape = this.createShape();
    shape.set({
      left: centerX - 50,
      top: centerY - 40,
    });

    this.canvas.add(shape);
    this.canvas.setActiveObject(shape);
    this.canvas.renderAll();

    const room: RoomData = {
      id: Date.now().toString(),
      name,
      width: 100,
      height: 80,
      material: this.selectedMaterial,
      cost: this.calculateRoomCost(100, 80, this.selectedMaterial),
      positionX: centerX - 50,
      positionY: centerY - 40,
      shapeType: this.currentShape,
      fabricObject: shape,
    };

    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();

    return room;
  }

  private createShape(): fabric.Object {
    const baseStyle = {
      fill: `${MATERIALS[this.selectedMaterial].color}40`,
      stroke: MATERIALS[this.selectedMaterial].color,
      strokeWidth: 2,
      selectable: true,
      evented: true,
    };

    const position = { left: 50, top: 50 };

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

  // Enhanced PDF/Image/CAD Background
  public async loadBackgroundImage(file: File): Promise<void> {
    console.log('Loading background file:', file.name, file.type);
    
    try {
      // Handle CAD files (DWG, DXF) and PDFs via server processing
      if (file.type === 'application/pdf' || 
          file.name.toLowerCase().endsWith('.dwg') || 
          file.name.toLowerCase().endsWith('.dxf')) {
        
        // Upload to server for processing
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload-background', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.success && result.dataUrl) {
          await this.loadImageFromDataUrl(result.dataUrl, file.name);
        } else {
          // Create enhanced placeholder for unsupported formats
          this.createCADPlaceholder(file);
        }
        return;
      }

      // For regular images, process normally
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-background', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success && result.dataUrl) {
        await this.loadImageFromDataUrl(result.dataUrl, file.name);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Background loading failed:', error);
      throw error;
    }
  }

  private createCADPlaceholder(file: File): void {
    console.log('Creating enhanced CAD/PDF placeholder for:', file.name);
    
    // Remove existing background
    if (this.backgroundImage) {
      this.canvas.remove(this.backgroundImage);
    }
    
    const canvasWidth = this.canvas.getWidth();
    const canvasHeight = this.canvas.getHeight();
    
    // Determine file type for appropriate icon and color
    const fileType = file.name.toLowerCase().endsWith('.dwg') ? 'DWG CAD' :
                     file.name.toLowerCase().endsWith('.dxf') ? 'DXF CAD' : 
                     'PDF';
    const icon = fileType.includes('CAD') ? '📐' : '📄';
    const color = fileType.includes('CAD') ? '#10B981' : '#3B82F6';
    
    // Create enhanced placeholder with construction grid pattern
    const placeholder = new fabric.Rect({
      left: 10,
      top: 10,
      width: canvasWidth - 20,
      height: canvasHeight - 20,
      fill: `rgba(${fileType.includes('CAD') ? '16, 185, 129' : '59, 130, 246'}, 0.08)`,
      stroke: color,
      strokeWidth: 2,
      strokeDashArray: [10, 5],
      selectable: false,
      evented: false,
    });
    
    const text = new fabric.Text(`${icon} ${fileType}: ${file.name}\n\nReady for Drawing!\nDraw rooms and shapes over this base layer`, {
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      fontSize: 16,
      fill: color,
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      selectable: false,
      evented: false,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 15,
    });
    
    // Add construction corner markers
    const cornerSize = 20;
    const corners = [
      { x: 20, y: 20 },
      { x: canvasWidth - 40, y: 20 },
      { x: 20, y: canvasHeight - 40 },
      { x: canvasWidth - 40, y: canvasHeight - 40 }
    ];
    
    corners.forEach(corner => {
      const marker = new fabric.Rect({
        left: corner.x,
        top: corner.y,
        width: cornerSize,
        height: cornerSize,
        fill: 'transparent',
        stroke: color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });
      this.canvas.add(marker);
    });
    
    // Add elements to canvas
    this.canvas.add(placeholder);
    this.canvas.add(text);
    
    this.canvas.renderAll();
    this.backgroundImage = placeholder;
    
    console.log('Enhanced CAD/PDF placeholder created successfully');
  }

  private async loadImageFromDataUrl(dataUrl: string, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
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
        
        this.canvas.renderAll();
        resolve();
      };
      imgElement.onerror = () => reject(new Error(`Failed to load: ${filename}`));
      imgElement.src = dataUrl;
    });
  }

  // Enhanced Canvas Controls
  public toggleGrid(): void {
    this.gridVisible = !this.gridVisible;
    if (this.gridGroup) {
      this.gridGroup.visible = this.gridVisible;
      this.canvas.renderAll();
    }
  }

  public zoomToFit(): void {
    this.canvas.setZoom(1);
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.zoomLevel = 1;
  }

  public zoomIn(): void {
    const zoom = Math.min(this.zoomLevel * 1.2, 20);
    this.canvas.setZoom(zoom);
    this.zoomLevel = zoom;
  }

  public zoomOut(): void {
    const zoom = Math.max(this.zoomLevel * 0.8, 0.1);
    this.canvas.setZoom(zoom);
    this.zoomLevel = zoom;
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
    console.log('Current shape set to:', shape);
  }

  public getCurrentShape(): ShapeType {
    return this.currentShape;
  }

  public deleteRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room && room.fabricObject) {
      this.canvas.remove(room.fabricObject);
      this.rooms.delete(roomId);
      this.notifyRoomsChange();
    }
  }

  public updateRoomMaterial(roomId: string, material: MaterialType) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.material = material;
      room.cost = this.calculateRoomCost(room.width, room.height, material);
      
      if (room.fabricObject) {
        room.fabricObject.set({
          fill: `${MATERIALS[material].color}40`,
          stroke: MATERIALS[material].color,
        });
        this.canvas.renderAll();
      }
      
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
    this.backgroundImage = undefined;
    this.createGrid();
    this.notifyRoomsChange();
  }

  public setSelectedMaterial(material: MaterialType) {
    this.selectedMaterial = material;
  }

  public getSelectedRoom(): RoomData | null {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return null;

    for (const room of this.rooms.values()) {
      if (room.fabricObject === activeObject) {
        return room;
      }
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
    try {
      this.canvas.dispose();
    } catch (error) {
      console.warn('Canvas disposal error:', error);
    }
  }
}