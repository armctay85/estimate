import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface BIMElement {
  id: string;
  category: 'structural' | 'architectural' | 'mep' | 'finishes' | 'external';
  type: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface ProcessingResult {
  structural: BIMElement[];
  architectural: BIMElement[];
  mep: BIMElement[];
  finishes: BIMElement[];
  external: BIMElement[];
  accuracy: string;
  processingTime: string;
  totalElements: number;
  totalCost: number;
}

interface InteractiveBIMViewerProps {
  elements: ProcessingResult;
  fileName: string;
  onElementSelect?: (element: BIMElement) => void;
}

// Enhanced CSS 3D Building Component with real interactivity
function Building3D({ elements, onElementSelect }: { elements: ProcessingResult, onElementSelect?: (element: BIMElement) => void }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastMouse.current.x;
    const deltaY = e.clientY - lastMouse.current.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5,
      z: prev.z
    }));
    
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  };

  // Color mapping for categories with cost-based intensity
  const getCategoryColor = (category: string, cost: number, maxCost: number) => {
    const intensity = Math.min(cost / maxCost, 1);
    const alpha = 0.3 + (intensity * 0.4); // 0.3 to 0.7 opacity based on cost
    
    switch (category) {
      case 'structural': return `rgba(239, 68, 68, ${alpha})`; // Red
      case 'architectural': return `rgba(59, 130, 246, ${alpha})`; // Blue
      case 'mep': return `rgba(16, 185, 129, ${alpha})`; // Green
      case 'finishes': return `rgba(139, 92, 246, ${alpha})`; // Purple
      case 'external': return `rgba(245, 158, 11, ${alpha})`; // Amber
      default: return `rgba(107, 114, 128, ${alpha})`; // Gray
    }
  };

  const maxCost = Math.max(...Object.values(elements).flat().map(el => el.cost));

  const allElements = [
    ...elements.structural,
    ...elements.architectural,
    ...elements.mep,
    ...elements.finishes,
    ...elements.external
  ];

  return (
    <div 
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ perspective: '1000px' }}
    >
      <div
        className="w-full h-full relative"
        style={{
          transform: `
            rotateX(${rotation.x}deg) 
            rotateY(${rotation.y}deg) 
            rotateZ(${rotation.z}deg) 
            scale(${zoom})
          `,
          transformStyle: 'preserve-3d',
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Building Foundation - showing all structural elements */}
        {elements.structural.map((element, i) => (
          <div
            key={`structural-${i}`}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              hoveredElement === element.id ? 'border-white shadow-lg scale-105' : 'border-red-400'
            } ${selectedElement === element.id ? 'ring-2 ring-white' : ''}`}
            style={{
              width: `${80 + i * 10}px`,
              height: element.type.toLowerCase().includes('slab') ? '20px' : `${60 + i * 20}px`,
              left: `${150 + (i % 3) * 80}px`,
              top: element.type.toLowerCase().includes('slab') ? '300px' : `${200 - i * 30}px`,
              backgroundColor: getCategoryColor(element.category, element.cost, maxCost),
              transform: element.type.toLowerCase().includes('column') 
                ? `translateZ(${30 + i * 10}px) rotateX(90deg)` 
                : `translateZ(${i * 5}px)`,
              borderRadius: '4px'
            }}
            onClick={() => {
              setSelectedElement(element.id);
              onElementSelect?.(element);
            }}
            onMouseEnter={() => setHoveredElement(element.id)}
            onMouseLeave={() => setHoveredElement(null)}
          >
            {hoveredElement === element.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {element.type}: ${element.cost.toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {/* Architectural Elements */}
        {elements.architectural.map((element, i) => (
          <div
            key={`arch-${i}`}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              hoveredElement === element.id ? 'border-white shadow-lg scale-105' : 'border-blue-400'
            } ${selectedElement === element.id ? 'ring-2 ring-white' : ''}`}
            style={{
              width: element.type.toLowerCase().includes('wall') ? '20px' : `${60 + i * 10}px`,
              height: element.type.toLowerCase().includes('wall') ? '120px' : `${40 + i * 10}px`,
              left: element.type.toLowerCase().includes('wall') 
                ? `${100 + i * 200}px` 
                : `${180 + (i % 2) * 100}px`,
              top: element.type.toLowerCase().includes('wall') ? '180px' : `${250 + i * 30}px`,
              backgroundColor: getCategoryColor(element.category, element.cost, maxCost),
              transform: `translateZ(${20 + i * 8}px)`,
              borderRadius: '4px'
            }}
            onClick={() => {
              setSelectedElement(element.id);
              onElementSelect?.(element);
            }}
            onMouseEnter={() => setHoveredElement(element.id)}
            onMouseLeave={() => setHoveredElement(null)}
          >
            {hoveredElement === element.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {element.type}: ${element.cost.toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {/* MEP Systems as circles */}
        {elements.mep.map((element, i) => (
          <div
            key={`mep-${i}`}
            className={`absolute border-2 cursor-pointer transition-all duration-200 rounded-full ${
              hoveredElement === element.id ? 'border-white shadow-lg scale-110' : 'border-green-400'
            } ${selectedElement === element.id ? 'ring-2 ring-white' : ''}`}
            style={{
              width: '40px',
              height: '40px',
              left: `${200 + (i % 4) * 60}px`,
              top: `${220 + Math.floor(i / 4) * 60}px`,
              backgroundColor: getCategoryColor(element.category, element.cost, maxCost),
              transform: `translateZ(${40 + i * 5}px)`,
            }}
            onClick={() => {
              setSelectedElement(element.id);
              onElementSelect?.(element);
            }}
            onMouseEnter={() => setHoveredElement(element.id)}
            onMouseLeave={() => setHoveredElement(null)}
          >
            {hoveredElement === element.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {element.type}: ${element.cost.toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {/* Roof Elements */}
        {elements.external.filter(el => el.type.toLowerCase().includes('roof')).map((element, i) => (
          <div
            key={`roof-${i}`}
            className={`absolute border-2 cursor-pointer transition-all duration-200 ${
              hoveredElement === element.id ? 'border-white shadow-lg scale-105' : 'border-amber-400'
            } ${selectedElement === element.id ? 'ring-2 ring-white' : ''}`}
            style={{
              width: '300px',
              height: '200px',
              left: '100px',
              top: '150px',
              backgroundColor: getCategoryColor(element.category, element.cost, maxCost),
              transform: `translateZ(80px) rotateX(-20deg)`,
              borderRadius: '8px',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
            }}
            onClick={() => {
              setSelectedElement(element.id);
              onElementSelect?.(element);
            }}
            onMouseEnter={() => setHoveredElement(element.id)}
            onMouseLeave={() => setHoveredElement(null)}
          >
            {hoveredElement === element.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                {element.type}: ${element.cost.toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {/* Grid lines for depth */}
        <div 
          className="absolute border border-gray-600/30"
          style={{
            width: '400px',
            height: '300px',
            left: '50px',
            top: '150px',
            transform: 'translateZ(-20px)',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />
      </div>

      {/* Rotation controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/50 hover:bg-black/70"
          onClick={() => setRotation({ x: 0, y: 0, z: 0 })}
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/50 hover:bg-black/70"
          onClick={() => setZoom(z => Math.min(3, z + 0.2))}
        >
          <ZoomIn className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-black/50 text-white border-white/50 hover:bg-black/70"
          onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
        >
          <ZoomOut className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function InteractiveBIMViewer({ elements, fileName, onElementSelect }: InteractiveBIMViewerProps) {
  const [viewMode, setViewMode] = useState<'wireframe' | 'solid' | 'realistic'>('realistic');
  const [showCategories, setShowCategories] = useState({
    structural: true,
    architectural: true,
    mep: true,
    finishes: true,
    external: true
  });

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-lg overflow-hidden">
      {/* Main 3D Viewer */}
      <div className="w-full h-[460px]">
        <Building3D elements={elements} onElementSelect={onElementSelect} />
      </div>

      {/* View Mode Controls */}
      <div className="absolute top-3 right-3 flex gap-1">
        {['wireframe', 'solid', 'realistic'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              viewMode === mode 
                ? 'bg-white text-black shadow-lg' 
                : 'bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {/* Category Toggle Controls */}
      <div className="absolute top-3 left-3 space-y-1">
        <Badge variant="secondary" className="bg-black/70 text-white border-white/20 mb-2">
          {elements.totalElements} Elements
        </Badge>
        <div className="space-y-1">
          {Object.entries(showCategories).map(([category, visible]) => {
            const count = elements[category as keyof ProcessingResult]?.length || 0;
            const color = {
              structural: 'bg-red-500',
              architectural: 'bg-blue-500', 
              mep: 'bg-green-500',
              finishes: 'bg-purple-500',
              external: 'bg-amber-500'
            }[category];
            
            return (
              <button
                key={category}
                onClick={() => setShowCategories(prev => ({ ...prev, [category]: !prev[category as keyof typeof prev] }))}
                className={`flex items-center gap-2 px-2 py-1 text-xs rounded transition-all ${
                  visible ? 'bg-black/60 text-white' : 'bg-black/30 text-gray-400'
                } hover:bg-black/80`}
              >
                <div className={`w-2 h-2 rounded-full ${color} ${visible ? '' : 'opacity-40'}`} />
                {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg">
        <div>🖱️ Drag to rotate • 🖱️ Scroll to zoom</div>
        <div>Click elements for details</div>
      </div>
    </div>
  );
}