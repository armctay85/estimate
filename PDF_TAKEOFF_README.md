# PDF/DWG Take-off Engine

A complete PDF take-off system for extracting quantities from architectural drawings directly in the browser.

## Features

### ✅ Phase 1 (Complete)
- **PDF Upload**: Multi-page PDF support with drag-and-drop
- **Canvas Viewer**: Interactive drawing canvas for measurements
- **Scale Calibration**: Calibrate drawings with known dimensions
- **Area Measurement**: Polygon-based area calculations (m²)
- **Length Measurement**: Line-based length calculations (m)
- **Measurement Labels**: Auto-generated labels with element types
- **Save/Load**: Persistent storage of measurements
- **Export Integration**: Link measurements to cost estimates

### 🚧 Phase 2 (Planned)
- DWG/DXF file support
- Auto-detection of walls, rooms, openings
- OCR for text/labels extraction
- Layer support

### 🔮 Phase 3 (Future)
- AI-powered element detection
- YOLO/Detectron2 integration
- Automatic quantity generation

## Components

### 1. PDFUploadModal (`pdf-upload-modal.tsx`)
- File selection with drag-and-drop support
- Progress tracking for uploads
- Multi-file upload queue
- PDF validation

### 2. PDFTakeoffViewer (`pdf-takeoff-viewer.tsx`)
- Full-screen canvas-based viewer
- Zoom and pan controls
- Grid overlay toggle
- Multiple page navigation

**Drawing Tools:**
- **Select Tool**: Select and manage existing measurements
- **Polygon Tool**: Draw areas (double-click to complete)
- **Line Tool**: Draw length measurements
- **Calibrate Tool**: Set scale using known dimensions

**Features:**
- Real-time value calculation
- Color-coded element types
- Snap-to-line detection
- Measurement labels
- Element categorization (floor, wall, ceiling, opening, structural, other)

### 3. PDFTakeoffPanel (`pdf-takeoff-panel.tsx`)
- Project-level drawing management
- Measurement summary display
- Quick access to viewer
- Drawing list with metadata

### 4. usePDFTakeoff Hook (`use-pdf-takeoff.ts`)
- React hook for takeoff operations
- CRUD operations for takeoffs
- Measurement persistence
- Error handling

### 5. Server-side PDF Parser (`server/pdf-parser.ts`)
- PDF to image conversion using pdf2pic
- Page extraction and storage
- Scale calculation utilities
- Area/length calculation algorithms

## API Endpoints

```
POST   /api/pdf-takeoff/upload          - Upload new PDF
GET    /api/pdf-takeoff/:id             - Get takeoff details
GET    /api/projects/:id/pdf-takeoffs   - List project takeoffs
PUT    /api/pdf-takeoff/:id/measurements - Update measurements
DELETE /api/pdf-takeoff/:id             - Delete takeoff
```

## Data Model

```typescript
interface PdfTakeoff {
  id: number;
  projectId: number;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  pageCount: number;
  scaleRatio: number | null;
  scaleCalibration: {
    pixelDistance: number;
    realDistance: number;
    unit: 'm' | 'mm' | 'ft';
  } | null;
  measurements: Measurement[];
}

interface Measurement {
  id: string;
  type: 'area' | 'length';
  points: { x: number; y: number }[];
  value: number;
  unit: 'm2' | 'm' | 'mm' | 'ft2' | 'ft';
  label: string;
  elementType: 'floor' | 'wall' | 'ceiling' | 'opening' | 'structural' | 'other';
  pageNumber: number;
  color?: string;
  createdAt: string;
}
```

## Usage

### For QS/Estimators:

1. **Upload Drawing**
   - Go to Project → Takeoffs tab
   - Click "Upload Drawing"
   - Drag and drop PDF files

2. **Calibrate Scale**
   - Open the drawing
   - Click the Ruler (Calibrate) tool
   - Click two points on a known dimension (e.g., "5m grid line")
   - Enter the real-world distance

3. **Take Measurements**
   - Select Area (polygon) or Length (line) tool
   - Click to create points
   - Double-click to complete
   - Choose element type from sidebar

4. **Review Quantities**
   - View measurements list in sidebar
   - See total area/length summary
   - Measurements feed into cost estimate

## Technical Implementation

### Area Calculation (Shoelace Formula)
```typescript
function calculatePolygonArea(points): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}
```

### Scale Conversion
```typescript
// scaleRatio = pixels per meter
realMeters = pixels / scaleRatio;
realArea = pixelArea / (scaleRatio * scaleRatio);
```

### Canvas Rendering
- Base layer: PDF page image
- Overlay layer: HTML5 Canvas for drawings
- Zoom: CSS transform scale
- Pan: Scrollable container

## File Structure

```
client/src/components/
├── pdf-upload-modal.tsx       # Upload dialog
├── pdf-takeoff-viewer.tsx     # Main viewer with tools
└── pdf-takeoff-panel.tsx      # Project integration

client/src/hooks/
└── use-pdf-takeoff.ts         # Data management hook

server/
├── pdf-parser.ts              # PDF processing
└── routes.ts                  # API routes (updated)

shared/
└── schema.ts                  # Database schema (updated)
```

## Dependencies

**Client:**
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Server:**
- pdf2pic (PDF to image conversion)
- multer (File uploads)
- drizzle-orm (Database)

## Future Enhancements

1. **DWG Support**: Use ODA File Converter or Teigha
2. **Auto-detection**: Computer vision for wall/room detection
3. **OCR**: Tesseract.js for text extraction
4. **Layers**: Support for layered drawings
5. **Compare**: Side-by-side drawing comparison
6. **Markup**: Annotation tools for collaboration
7. **Export**: PDF reports with takeoff summary
8. **Import**: Link to elemental cost database

## Integration Points

### Cost Estimation
- Measurements feed directly into project cost calculations
- Element types map to material databases
- Quantities update in real-time

### BIM Integration
- Can import BIM-derived PDFs
- Complements 3D model quantities
- 2D drawing verification

### Report Generation
- Measurements included in QS reports
- Visual takeoff summaries
- Audit trail for quantities
