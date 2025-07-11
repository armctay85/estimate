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
  private drawingStartPoint?: { x: number; y: number };
  private previewShape?: fabric.Object;
  private polygonPoints: { x: number; y: number }[] = [];
  private drawingPath?: fabric.Path;
  private backgroundImage?: fabric.Object;
  private gridVisible = true;
  private gridGroup?: fabric.Group;
  public zoomLevel = 1;
  private isPanning = false;
  private panStartPoint?: { x: number; y: number };

  constructor(canvasElement: HTMLCanvasElement) {
    try {
      // Ensure clean initialization
      if (canvasElement.fabric) {
        canvasElement.fabric = null;
      }

      this.canvas = new fabric.Canvas(canvasElement, {
        width: 800,
        height: 500,
        backgroundColor: "#F9FAFB",
        selection: true,
        enableRetinaScaling: false, // Disable to prevent DOM issues
        preserveObjectStacking: true,
        imageSmoothingEnabled: false,
        renderOnAddRemove: false, // Manual rendering for better control
      });

      this.setupEventListeners();
      this.setupDrawingEvents();
      this.setupZoomAndPan();
      this.createGrid();
      
      // Force render after setup
      this.canvas.renderAll();
      
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

    // Pan with middle mouse or shift + drag
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

  // Enhanced Event Listeners
  private setupEventListeners() {
    this.canvas.on("object:modified", this.handleObjectModified.bind(this));
    this.canvas.on("selection:created", this.handleSelectionCreated.bind(this));
    this.canvas.on("selection:updated", this.handleSelectionUpdated.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
    this.canvas.on("mouse:dblclick", this.handleMouseDoubleClick.bind(this));
    
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
    if (this.isPanning) return;

    const pointer = this.canvas.getPointer(e.e);

    switch (this.currentShape) {
      case "freehand":
        this.isDrawing = true;
        const points = [pointer.x, pointer.y, pointer.x, pointer.y];
        this.drawingPath = new fabric.Path(`M ${pointer.x} ${pointer.y}`, {
          stroke: MATERIALS[this.selectedMaterial].color,
          strokeWidth: 3,
          fill: "",
          selectable: false,
        });
        this.canvas.add(this.drawingPath);
        break;

      case "rectangle":
        this.drawingStartPoint = pointer;
        this.isDrawing = true;
        this.previewShape = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: `${MATERIALS[this.selectedMaterial].color}40`,
          stroke: MATERIALS[this.selectedMaterial].color,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        this.canvas.add(this.previewShape);
        break;

      case "circle":
        this.drawingStartPoint = pointer;
        this.isDrawing = true;
        this.previewShape = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: `${MATERIALS[this.selectedMaterial].color}40`,
          stroke: MATERIALS[this.selectedMaterial].color,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        this.canvas.add(this.previewShape);
        break;

      case "line":
        this.drawingStartPoint = pointer;
        this.isDrawing = true;
        this.previewShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: MATERIALS[this.selectedMaterial].color,
          strokeWidth: 4,
          selectable: false,
          evented: false,
        });
        this.canvas.add(this.previewShape);
        break;

      case "polygon":
        this.polygonPoints.push(pointer);
        if (this.polygonPoints.length === 1) {
          this.isDrawing = true;
        }
        break;
    }
  }

  private handleMouseMove(e: fabric.IEvent) {
    const pointer = this.canvas.getPointer(e.e);

    if (this.currentShape === "freehand" && this.isDrawing && this.drawingPath) {
      const path = this.drawingPath.path!;
      path.push(["L", pointer.x, pointer.y]);
      this.drawingPath.path = path;
      this.canvas.renderAll();
      return;
    }

    if (!this.isDrawing || !this.drawingStartPoint) return;

    switch (this.currentShape) {
      case "rectangle":
        const width = pointer.x - this.drawingStartPoint.x;
        const height = pointer.y - this.drawingStartPoint.y;
        this.previewShape?.set({
          left: width < 0 ? pointer.x : this.drawingStartPoint.x,
          top: height < 0 ? pointer.y : this.drawingStartPoint.y,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        this.canvas.renderAll();
        break;

      case "circle":
        const dx = pointer.x - this.drawingStartPoint.x;
        const dy = pointer.y - this.drawingStartPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        this.previewShape?.set({
          left: this.drawingStartPoint.x - radius,
          top: this.drawingStartPoint.y - radius,
          radius,
        });
        this.canvas.renderAll();
        break;

      case "line":
        this.previewShape?.set({
          x2: pointer.x,
          y2: pointer.y,
        });
        this.canvas.renderAll();
        break;
    }
  }

  private handleMouseUp(e: fabric.IEvent) {
    if (this.currentShape === "freehand" && this.isDrawing) {
      this.isDrawing = false;
      if (this.drawingPath) {
        this.drawingPath.selectable = true;
        this.convertPathToRoom(this.drawingPath);
        this.drawingPath = undefined;
      }
      return;
    }

    if (!this.isDrawing || !this.previewShape) return;

    this.previewShape.selectable = true;
    this.previewShape.evented = true;
    const bounds = this.previewShape.getBoundingRect();
    const room: RoomData = {
      id: Date.now().toString(),
      name: `${this.currentShape.charAt(0).toUpperCase() + this.currentShape.slice(1)} Element`,
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: 0, // Will be calculated
      positionX: bounds.left,
      positionY: bounds.top,
      shapeType: this.currentShape,
      fabricObject: this.previewShape,
    };
    room.cost = this.calculateRoomCost(room);
    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();

    this.previewShape = undefined;
    this.drawingStartPoint = undefined;
    this.isDrawing = false;
    this.canvas.renderAll();
  }

  private handleMouseDoubleClick(e: fabric.IEvent) {
    if (this.currentShape !== "polygon" || !this.isDrawing || this.polygonPoints.length < 3) return;

    if (this.previewShape) {
      this.canvas.remove(this.previewShape);
      this.previewShape = undefined;
    }

    const poly = new fabric.Polygon(this.polygonPoints, {
      fill: `${MATERIALS[this.selectedMaterial].color}40`,
      stroke: MATERIALS[this.selectedMaterial].color,
      strokeWidth: 2,
      selectable: true,
      evented: true,
    });
    this.canvas.add(poly);
    const bounds = poly.getBoundingRect();
    const room: RoomData = {
      id: Date.now().toString(),
      name: "Polygon Element",
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: 0,
      positionX: bounds.left,
      positionY: bounds.top,
      shapeType: "polygon",
      points: this.polygonPoints.flatMap((p) => [p.x, p.y]),
      fabricObject: poly,
    };
    room.cost = this.calculateRoomCost(room);
    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();

    this.polygonPoints = [];
    this.isDrawing = false;
    this.canvas.renderAll();
  }

  private convertPathToRoom(path: fabric.Path) {
    const bounds = path.getBoundingRect();
    const pathCommands = path.path || [];
    const points: { x: number; y: number }[] = [];
    pathCommands.forEach((cmd) => {
      if (cmd[0] === "M" || cmd[0] === "L") {
        points.push({ x: cmd[1], y: cmd[2] });
      }
    });
    const room: RoomData = {
      id: Date.now().toString(),
      name: "Freehand Element",
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: 0,
      positionX: bounds.left,
      positionY: bounds.top,
      shapeType: "freehand",
      points: points.flatMap((p) => [p.x, p.y]),
      fabricObject: path,
    };
    room.cost = this.calculateRoomCost(room);
    this.rooms.set(room.id, room);
    this.updateRoomLabel(room);
    this.notifyRoomsChange();
  }

  private handleObjectModified(e: fabric.IEvent) {
    const obj = e.target;
    if (!obj) return;

    for (const [id, room] of this.rooms) {
      if (room.fabricObject === obj) {
        const bounds = obj.getBoundingRect();
        room.width = bounds.width;
        room.height = bounds.height;
        room.positionX = bounds.left;
        room.positionY = bounds.top;
        room.cost = this.calculateRoomCost(room);
        this.updateRoomLabel(room);
        this.notifyRoomsChange();
        break;
      }
    }
  }

  private handleSelectionCreated(e: fabric.IEvent) {
    // Can implement selection logic, e.g., highlight or show properties
  }

  private handleSelectionUpdated(e: fabric.IEvent) {
    // Can implement updated selection logic
  }

  private handleSelectionCleared(e: fabric.IEvent) {
    // Can implement cleared selection logic
  }

  private shoelace(points: { x: number; y: number }[]): number {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y - points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  private calculateQuantity(room: RoomData): number {
    const obj = room.fabricObject;
    if (!obj) return 0;

    const scaleX = obj.scaleX || 1;
    const scaleY = obj.scaleY || 1;

    if (room.shapeType === "line") {
      const line = obj as fabric.Line;
      const p1 = fabric.util.transformPoint(
        { x: line.x1 || 0, y: line.y1 || 0 },
        obj.calcOwnMatrix()
      );
      const p2 = fabric.util.transformPoint(
        { x: line.x2 || 0, y: line.y2 || 0 },
        obj.calcOwnMatrix()
      );
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    } else {
      let origArea = 0;
      if (room.shapeType === "rectangle") {
        origArea = (obj.width || 0) * (obj.height || 0);
      } else if (room.shapeType === "circle") {
        const r = obj.radius || 0;
        origArea = Math.PI * r * r;
      } else if (room.shapeType === "polygon") {
        origArea = this.shoelace((obj as fabric.Polygon).points || []);
      } else if (room.shapeType === "freehand") {
        const path = (obj as fabric.Path).path || [];
        const points: { x: number; y: number }[] = [];
        path.forEach((cmd: any) => {
          if (cmd[0] === "M" || cmd[0] === "L") {
            points.push({ x: cmd[1], y: cmd[2] });
          }
        });
        if (points.length > 1 && (points[0].x !== points[points.length - 1].x || points[0].y !== points[points.length - 1].y)) {
          points.push(points[0]);
        }
        origArea = this.shoelace(points);
      }
      return origArea * Math.abs(scaleX * scaleY);
    }
  }

  private calculateRoomCost(room: RoomData): number {
    const quantity = this.calculateQuantity(room);
    const scale = room.shapeType === "line" ? 100 : 10000; // Assuming 100 pixels = 1 meter
    const unitQuantity = quantity / scale;
    return Math.round(unitQuantity * MATERIALS[room.material].cost);
  }

  private updateRoomLabel(room: RoomData) {
    // Update room label if needed
  }

  // Add fixed shape (legacy support, drawing is preferred)
  public addRoom(name: string = "New Element"): RoomData {
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

    const bounds = shape.getBoundingRect();
    const room: RoomData = {
      id: Date.now().toString(),
      name,
      width: bounds.width,
      height: bounds.height,
      material: this.selectedMaterial,
      cost: this.calculateRoomCost({ ...room, fabricObject: shape, shapeType: this.currentShape }), // Temp for calc
      positionX: centerX - 50,
      positionY: centerY - 40,
      shapeType: this.currentShape,
      fabricObject: shape,
    };

    if (this.currentShape === "polygon") {
      room.points = [50, 0, 100, 25, 75, 75, 25, 75, 0, 25]; // From hardcoded points
    }

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

    switch (this.currentShape) {
      case "rectangle":
        return new fabric.Rect({
          ...baseStyle,
          width: 100,
          height: 80,
        });

      case "circle":
        return new fabric.Circle({
          ...baseStyle,
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
        });

      case "line":
        return new fabric.Line([0, 0, 100, 100], {
          ...baseStyle,
          strokeWidth: 4,
        });

      default:
        return new fabric.Rect({
          ...baseStyle,
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
          console.log('Server processing failed, creating visual background layer');
          // Create visual background layer for unsupported formats
          await this.createVisualBackgroundLayer(file);
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

  private async createVisualBackgroundLayer(file: File): Promise<void> {
    console.log('Creating visual background layer for:', file.name);
    
    try {
      // Remove existing background
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage);
        console.log('Removed existing background image');
      }
      
      const canvasWidth = this.canvas.getWidth();
      const canvasHeight = this.canvas.getHeight();
      
      const backgroundRect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
        fill: '#fafafa',
        stroke: '#9ca3af',
        strokeWidth: 2,
        selectable: false,
        evented: false,
        opacity: 0.9,
      });
      
      const text = new fabric.Text(`Unsupported format: ${file.name}\nVisual layer created`, {
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        fontSize: 20,
        fill: '#6b7280',
        textAlign: 'center',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center',
      });
      
      this.backgroundImage = new fabric.Group([backgroundRect, text], {
        selectable: false,
        evented: false,
      });
      
      this.canvas.add(this.backgroundImage);
      this.canvas.sendToBack(this.backgroundImage);
      
      // Hide the default grid
      if (this.gridGroup) {
        this.gridGroup.visible = false;
      }
      
      this.canvas.renderAll();
      console.log('Visual background layer created successfully');
    } catch (error) {
      console.error('Error in createVisualBackgroundLayer:', error);
      throw error;
    }
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
      // Show the default grid again
      if (this.gridGroup) {
        this.gridGroup.visible = true;
      }
      this.canvas.renderAll();
    }
  }

  public setBackgroundOpacity(opacity: number): void {
    if (this.backgroundImage) {
      this.backgroundImage.set('opacity', opacity);
      this.canvas.renderAll();
      console.log('Background opacity set to:', opacity);
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
      room.cost = this.calculateRoomCost(room);
      
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
      // Clear all objects first
      this.canvas.clear();
      // Dispose canvas
      this.canvas.dispose();
    } catch (error) {
      console.warn('Canvas disposal error:', error);
    }
  }
}