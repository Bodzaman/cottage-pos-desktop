


import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Grid3X3, ZoomIn, ZoomOut, RotateCcw, Maximize2, 
  Move, Layers, Settings2, Eye, EyeOff, Copy, Trash2,
  ArrowUp, ArrowDown, RotateCw, Undo, Redo
} from 'lucide-react';
import { 
  CanvasElement, 
  PAPER_WIDTH_PX, 
  THERMAL_CONSTANTS, 
  GridDensity,
  GRID_DENSITY_SETTINGS
} from 'utils/visualTemplateTypes';
import { globalColors as QSAITheme } from 'utils/QSAIDesign';

export interface VisualCanvasProps {
  paperWidth: 58 | 80;
  elements: CanvasElement[];
  selectedElementId: string | null;
  selectedElementIds?: string[]; // Multi-selection support
  onElementSelect: (elementId: string | null) => void;
  onElementsSelect?: (elementIds: string[]) => void; // Multi-selection callback
  onElementMove: (elementId: string, x: number, y: number) => void;
  onElementResize: (elementId: string, width: number, height: number) => void;
  onElementDelete?: (elementIds: string[]) => void; // Delete multiple elements
  onElementCopy?: (elementIds: string[]) => void; // Copy multiple elements
  onElementDuplicate?: (elementIds: string[]) => void; // Duplicate elements
  onElementBringToFront?: (elementId: string) => void; // Layer management
  onElementSendToBack?: (elementId: string) => void; // Layer management
  onUndo?: () => void; // Undo last action
  onRedo?: () => void; // Redo last undone action
  canUndo?: boolean; // Whether undo is available
  canRedo?: boolean; // Whether redo is available
  className?: string;
}

interface CanvasSettings {
  showGrid: boolean;
  gridDensity: GridDensity;
  snapToGrid: boolean;
  showBoundaries: boolean;
  zoom: number;
}

interface DraggableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  isMultiSelected: boolean;
  scale: number;
  onSelect: (ctrlKey?: boolean) => void;
  onResize: (width: number, height: number) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const DraggableElement: React.FC<DraggableElementProps> = ({ 
  element, 
  isSelected, 
  isMultiSelected,
  scale, 
  onSelect,
  onResize
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const handleMouseDown = (e: React.MouseEvent, handle: ResizeHandle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height
    });
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle) return;
    
    const deltaX = (e.clientX - resizeStart.x) / scale;
    const deltaY = (e.clientY - resizeStart.y) / scale;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    
    // Calculate new dimensions based on handle
    switch (resizeHandle) {
      case 'e':
      case 'ne':
      case 'se':
        newWidth = Math.max(20, resizeStart.width + deltaX);
        break;
      case 'w':
      case 'nw':
      case 'sw':
        newWidth = Math.max(20, resizeStart.width - deltaX);
        break;
    }
    
    switch (resizeHandle) {
      case 's':
      case 'se':
      case 'sw':
        newHeight = Math.max(10, resizeStart.height + deltaY);
        break;
      case 'n':
      case 'ne':
      case 'nw':
        newHeight = Math.max(10, resizeStart.height - deltaY);
        break;
    }
    
    onResize(newWidth, newHeight);
  }, [isResizing, resizeHandle, resizeStart, scale, onResize]);
  
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);
  
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  // Handle style based on selection state
  const getElementStyle = () => {
    let borderColor = 'transparent';
    let backgroundColor = 'transparent';
    let shadow = 'none';
    
    if (isSelected) {
      borderColor = QSAITheme.primary[500];
      backgroundColor = `${QSAITheme.primary[500]}08`;
      shadow = `0 0 0 1px ${QSAITheme.primary[500]}`;
    } else if (isMultiSelected) {
      borderColor = QSAITheme.secondary[500];
      backgroundColor = `${QSAITheme.secondary[500]}08`;
      shadow = `0 0 0 1px ${QSAITheme.secondary[500]}`;
    }
    
    return {
      borderColor,
      backgroundColor,
      boxShadow: shadow
    };
  };
  
  // Resize handle positions
  const resizeHandles: { handle: ResizeHandle; style: React.CSSProperties; cursor: string }[] = [
    { handle: 'nw', style: { top: -4, left: -4 }, cursor: 'nw-resize' },
    { handle: 'n', style: { top: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 'n-resize' },
    { handle: 'ne', style: { top: -4, right: -4 }, cursor: 'ne-resize' },
    { handle: 'e', style: { top: '50%', right: -4, transform: 'translateY(-50%)' }, cursor: 'e-resize' },
    { handle: 'se', style: { bottom: -4, right: -4 }, cursor: 'se-resize' },
    { handle: 's', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' }, cursor: 's-resize' },
    { handle: 'sw', style: { bottom: -4, left: -4 }, cursor: 'sw-resize' },
    { handle: 'w', style: { top: '50%', left: -4, transform: 'translateY(-50%)' }, cursor: 'w-resize' }
  ];
  
  return (
    <div
      className={`absolute border-2 transition-all duration-200 hover:border-gray-300 group ${
        isSelected || isMultiSelected ? 'border-2' : 'border-transparent'
      }`}
      style={{
        left: element.x * scale,
        top: element.y * scale,
        width: element.width * scale,
        height: element.height * scale,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        cursor: isResizing ? 'inherit' : 'move',
        ...getElementStyle()
      }}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
    >
      {/* Element Content Preview */}
      <div 
        className="w-full h-full flex items-center justify-center text-xs font-mono p-1 pointer-events-none"
        style={{
          fontSize: Math.max(8, element.style.font_size * scale * 0.7),
          fontFamily: element.style.font_family,
          color: element.style.color,
          textAlign: element.style.text_align,
          backgroundColor: element.style.background_color || 'transparent'
        }}
      >
        {element.data.text || element.data.placeholder || element.type.toUpperCase()}
      </div>
      
      {/* 8-Point Resize Handles - Only show for selected element */}
      {isSelected && (
        <>
          {resizeHandles.map(({ handle, style, cursor }) => (
            <div
              key={handle}
              className="absolute w-2 h-2 bg-white border border-gray-400 hover:bg-blue-500 hover:border-blue-600 transition-colors duration-150"
              style={{
                ...style,
                cursor,
                opacity: isSelected ? 1 : 0
              }}
              onMouseDown={(e) => handleMouseDown(e, handle)}
            />
          ))}
        </>
      )}
      
      {/* Multi-selection indicator */}
      {isMultiSelected && !isSelected && (
        <div className="absolute top-1 left-1 w-3 h-3 bg-orange-500 rounded-full border border-white" />
      )}
    </div>
  );
};

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  paperWidth,
  elements,
  selectedElementId,
  selectedElementIds = [],
  onElementSelect,
  onElementsSelect,
  onElementMove,
  onElementResize,
  onElementDelete,
  onElementCopy,
  onElementDuplicate,
  onElementBringToFront,
  onElementSendToBack,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  className
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<CanvasSettings>({
    showGrid: true,
    gridDensity: 'medium',
    snapToGrid: true,
    showBoundaries: true,
    zoom: 1
  });
  
  // Multi-selection state
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedElementIds);
  
  // Context menu handlers
  const handleContextMenuAction = useCallback((action: string, elementId: string) => {
    const selectedIds = selectedElementIds.length > 0 ? selectedElementIds : 
                       selectedElementId ? [selectedElementId] : [elementId];
    
    switch (action) {
      case 'copy':
        if (onElementCopy) onElementCopy(selectedIds);
        break;
      case 'duplicate':
        if (onElementDuplicate) onElementDuplicate(selectedIds);
        break;
      case 'delete':
        if (onElementDelete) onElementDelete(selectedIds);
        break;
      case 'bringToFront':
        if (onElementBringToFront) onElementBringToFront(elementId);
        break;
      case 'sendToBack':
        if (onElementSendToBack) onElementSendToBack(elementId);
        break;
    }
  }, [selectedElementId, selectedElementIds, onElementCopy, onElementDuplicate, onElementDelete, onElementBringToFront, onElementSendToBack]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const selectedIds = selectedElementIds.length > 0 ? selectedElementIds : 
                         selectedElementId ? [selectedElementId] : [];
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selectedIds.length > 0 && onElementDelete) {
            e.preventDefault();
            onElementDelete(selectedIds);
          }
          break;
          
        case 'c':
          if ((e.ctrlKey || e.metaKey) && selectedIds.length > 0 && onElementCopy) {
            e.preventDefault();
            onElementCopy(selectedIds);
          }
          break;
          
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey && onRedo && canRedo) {
              onRedo();
            } else if (onUndo && canUndo) {
              onUndo();
            }
          }
          break;
          
        case 'y':
          if ((e.ctrlKey || e.metaKey) && onRedo && canRedo) {
            e.preventDefault();
            onRedo();
          }
          break;
          
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = elements.map(el => el.id);
            if (onElementsSelect) {
              onElementsSelect(allIds);
            }
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          onElementSelect(null);
          if (onElementsSelect) {
            onElementsSelect([]);
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selectedElementIds, elements, onElementSelect, onElementsSelect, onElementDelete, onElementCopy]);
  
  // Handle element selection with multi-select support
  const handleElementSelect = useCallback((elementId: string, ctrlKey?: boolean) => {
    if (ctrlKey && onElementsSelect) {
      const currentIds = selectedElementIds.length > 0 ? selectedElementIds : 
                        selectedElementId ? [selectedElementId] : [];
      
      if (currentIds.includes(elementId)) {
        // Remove from selection
        const newIds = currentIds.filter(id => id !== elementId);
        onElementsSelect(newIds);
        if (newIds.length === 1) {
          onElementSelect(newIds[0]);
        } else if (newIds.length === 0) {
          onElementSelect(null);
        }
      } else {
        // Add to selection
        const newIds = [...currentIds, elementId];
        onElementsSelect(newIds);
        onElementSelect(elementId); // Set as primary selection
      }
    } else {
      // Single selection
      onElementSelect(elementId);
      if (onElementsSelect) {
        onElementsSelect([elementId]);
      }
    }
  }, [selectedElementId, selectedElementIds, onElementSelect, onElementsSelect]);
  
  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onElementSelect(null);
      if (onElementsSelect) {
        onElementsSelect([]);
      }
    }
  }, [onElementSelect, onElementsSelect]);
  
  // Handle element resize
  const handleElementResize = useCallback((elementId: string, width: number, height: number) => {
    onElementResize(elementId, width, height);
  }, [onElementResize]);
  
  // Calculate canvas dimensions
  const canvasWidth = PAPER_WIDTH_PX[paperWidth];
  const canvasHeight = 800; // Auto-expandable
  const scaledWidth = canvasWidth * settings.zoom;
  const scaledHeight = canvasHeight * settings.zoom;
  
  // Grid settings
  const gridSpacing = GRID_DENSITY_SETTINGS[settings.gridDensity].spacing;
  const gridOpacity = GRID_DENSITY_SETTINGS[settings.gridDensity].opacity;
  
  // Snap to grid function
  const snapToGrid = useCallback((value: number): number => {
    if (!settings.snapToGrid) return value;
    return Math.round(value / gridSpacing) * gridSpacing;
  }, [settings.snapToGrid, gridSpacing]);
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    onElementSelect(event.active.id as string);
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const elementId = active.id as string;
    const element = elements.find(el => el.id === elementId);
    
    if (element && delta) {
      const newX = snapToGrid(element.x + delta.x / settings.zoom);
      const newY = snapToGrid(element.y + delta.y / settings.zoom);
      onElementMove(elementId, newX, newY);
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setSettings(prev => ({ 
      ...prev, 
      zoom: Math.min(prev.zoom * 1.2, 3) 
    }));
  };
  
  const handleZoomOut = () => {
    setSettings(prev => ({ 
      ...prev, 
      zoom: Math.max(prev.zoom / 1.2, 0.3) 
    }));
  };
  
  const handleZoomReset = () => {
    setSettings(prev => ({ ...prev, zoom: 1 }));
  };
  
  // Grid pattern for background
  const gridPattern = settings.showGrid ? (
    <defs>
      <pattern 
        id="grid" 
        width={gridSpacing * settings.zoom} 
        height={gridSpacing * settings.zoom} 
        patternUnits="userSpaceOnUse"
      >
        <path 
          d={`M ${gridSpacing * settings.zoom} 0 L 0 0 0 ${gridSpacing * settings.zoom}`} 
          fill="none" 
          stroke={QSAITheme.gray[200]} 
          strokeWidth="1"
          opacity={gridOpacity}
        />
      </pattern>
    </defs>
  ) : null;
  
  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Canvas Controls */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {paperWidth}mm
          </Badge>
          <Separator orientation="vertical" className="h-4" />
          {/* Toolbar */}
          <Card className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 p-2">
              {/* Undo/Redo Controls */}
              <Button
                variant="outline"
                size="sm"
                disabled={!canUndo}
                onClick={onUndo}
                title="Undo (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canRedo}
                onClick={onRedo}
                title="Redo (Ctrl+Y)"
              >
                <Redo className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-4" />
              
              {/* Existing Controls */}
              <Button
                variant={settings.showGrid ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, showGrid: !prev.showGrid }))}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={settings.snapToGrid ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
              >
                <Move className="w-4 h-4 mr-1" />
                Snap
              </Button>
              <Button
                variant={settings.showBoundaries ? "default" : "outline"}
                size="sm"
                onClick={() => setSettings(prev => ({ ...prev, showBoundaries: !prev.showBoundaries }))}
              >
                <Eye className="w-4 h-4 mr-1" />
                Bounds
              </Button>
            </div>
          </Card>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomReset}>
            {Math.round(settings.zoom * 100)}%
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Canvas Container */}
      <div className="flex-1 overflow-auto p-8">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="mx-auto" style={{ width: scaledWidth, height: scaledHeight }}>
            {/* Canvas Background */}
            <div 
              ref={canvasRef}
              className="relative border-2 border-gray-300 shadow-lg"
              style={{
                width: scaledWidth,
                height: scaledHeight,
                backgroundColor: THERMAL_CONSTANTS.PAPER_COLOR,
                backgroundImage: settings.showGrid ? `url("data:image/svg+xml,${encodeURIComponent(`
                  <svg width="${gridSpacing * settings.zoom}" height="${gridSpacing * settings.zoom}" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="smallGrid" width="${gridSpacing * settings.zoom}" height="${gridSpacing * settings.zoom}" patternUnits="userSpaceOnUse">
                        <path d="M ${gridSpacing * settings.zoom} 0 L 0 0 0 ${gridSpacing * settings.zoom}" fill="none" stroke="#e5e7eb" stroke-width="1" opacity="${gridOpacity}"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#smallGrid)" />
                  </svg>
                `)}")` : 'none'
              }}
              onClick={handleCanvasClick}
            >
              {/* Paper Boundaries */}
              {settings.showBoundaries && (
                <>
                  {/* Safe Area */}
                  <div 
                    className="absolute border-2 border-dashed border-green-400 pointer-events-none"
                    style={{
                      left: THERMAL_CONSTANTS.MARGINS.left * settings.zoom,
                      top: THERMAL_CONSTANTS.MARGINS.top * settings.zoom,
                      width: (canvasWidth - THERMAL_CONSTANTS.MARGINS.left - THERMAL_CONSTANTS.MARGINS.right) * settings.zoom,
                      height: (canvasHeight - THERMAL_CONSTANTS.MARGINS.top - THERMAL_CONSTANTS.MARGINS.bottom) * settings.zoom,
                      opacity: 0.6
                    }}
                  />
                  
                  {/* Print Area Label */}
                  <div 
                    className="absolute text-xs text-green-600 font-medium pointer-events-none"
                    style={{
                      left: THERMAL_CONSTANTS.MARGINS.left * settings.zoom + 4,
                      top: THERMAL_CONSTANTS.MARGINS.top * settings.zoom + 4
                    }}
                  >
                    Safe Print Area
                  </div>
                </>
              )}
              
              {/* Elements */}
              {elements.map((element) => (
                <ContextMenu key={element.id}>
                  <ContextMenuTrigger asChild>
                    <div>
                      <DraggableElement
                        element={element}
                        isSelected={element.id === selectedElementId}
                        isMultiSelected={selectedElementIds.includes(element.id) && element.id !== selectedElementId}
                        scale={settings.zoom}
                        onSelect={(ctrlKey) => handleElementSelect(element.id, ctrlKey)}
                        onResize={(width, height) => handleElementResize(element.id, width, height)}
                      />
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => handleContextMenuAction('copy', element.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleContextMenuAction('duplicate', element.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => handleContextMenuAction('bringToFront', element.id)}>
                      <ArrowUp className="w-4 h-4 mr-2" />
                      Bring to Front
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleContextMenuAction('sendToBack', element.id)}>
                      <ArrowDown className="w-4 h-4 mr-2" />
                      Send to Back
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem 
                      onClick={() => handleContextMenuAction('delete', element.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </div>
        </DndContext>
      </div>
      
      {/* Canvas Info */}
      <div className="p-4 bg-white border-t text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Canvas: {canvasWidth} × {canvasHeight}px</span>
            <span>Paper: {paperWidth}mm thermal</span>
            <span>DPI: {THERMAL_CONSTANTS.DPI}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Elements: {elements.length}</span>
            {selectedElementId && (
              <span className="text-blue-600">Selected: {selectedElementId}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
