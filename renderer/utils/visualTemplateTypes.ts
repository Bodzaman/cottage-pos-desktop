// Core TypeScript interfaces for Visual Canvas Receipt Template Designer

/**
 * OrderType for visual template designer (lowercase, extended set)
 * NOTE: This is different from the canonical OrderType in masterTypes.ts
 * Used specifically for visual template designer with additional types (ai, online)
 */
export type OrderType = 'ai' | 'online' | 'dine_in' | 'waiting' | 'collection' | 'delivery';
export type TemplateType = 'foh' | 'kitchen';
export type ElementType = 'header' | 'order_info' | 'item_section' | 'customer_info' | 'totals' | 'footer' | 'decorative';
export type GridDensity = 'fine' | 'medium' | 'coarse';
export type PaperWidth = 58 | 80 | 'custom';
export type FontFamily = 'JetBrains Mono' | 'Fira Code' | 'Hack' | 'Inconsolata' | 'Space Mono' | 'IBM Plex Mono' | 
                         'Inter' | 'Poppins' | 'Nunito Sans' | 'Work Sans' | 'Lato' | 'Open Sans' | 
                         'Montserrat' | 'Source Sans Pro' | 'Rubik' | 'Barlow' | 'Roboto' | 
                         'Arial' | 'Times' | 'Courier' | 'Impact';
export type FontWeight = 'normal' | 'bold';
export type TextAlign = 'left' | 'center' | 'right';

// Font and styling constants
export const FONT_FAMILIES: FontFamily[] = [
  'JetBrains Mono', 'Fira Code', 'Hack', 'Inconsolata', 'Space Mono', 'IBM Plex Mono',
  'Inter', 'Poppins', 'Nunito Sans', 'Work Sans', 'Lato', 'Open Sans',
  'Montserrat', 'Source Sans Pro', 'Rubik', 'Barlow', 'Roboto',
  'Arial', 'Times', 'Courier', 'Impact'
];

export const FONT_WEIGHTS: FontWeight[] = ['normal', 'bold'];

export const TEXT_ALIGNMENTS: TextAlign[] = ['left', 'center', 'right'];

// Canvas Element Base Interface
export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  data: ElementData;
  style: ElementStyle;
}

// Element Data (content)
export interface ElementData {
  text?: string;
  placeholder?: string;
  dynamic_field?: string; // For data binding like {order.total}
  image_url?: string;
  conditional_visibility?: ConditionalVisibility;
}

// Element Styling
export interface ElementStyle {
  font_family: FontFamily;
  font_size: number;
  font_weight: FontWeight;
  text_align: TextAlign;
  color: string;
  background_color?: string;
  border_width?: number;
  border_color?: string;
  padding_top: number;
  padding_bottom: number;
  padding_left: number;
  padding_right: number;
  margin_top: number;
  margin_bottom: number;
}

// Conditional Visibility Rules
export interface ConditionalVisibility {
  show_on_order_types?: OrderType[];
  show_on_template_types?: TemplateType[];
  show_if_field_exists?: string;
  show_if_field_not_empty?: string;
}

// Grid System Settings
export interface GridSettings {
  show_grid: boolean;
  grid_density: GridDensity;
  snap_to_grid: boolean;
  show_safe_area: boolean;
  show_margins: boolean;
  grid_color: string;
  safe_area_color: string;
  margin_color: string;
}

// Layout Settings
export interface LayoutSettings {
  paper_width: PaperWidth;
  custom_width?: number;
  padding_top: number;
  padding_bottom: number;
  padding_left: number;
  padding_right: number;
  background_color: string;
}

// Print Settings
export interface PrintSettings {
  paper_width_mm: number;
  dpi: number;
  margins_mm: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  cut_at_end: boolean;
  feed_lines: number;
}

// Main Receipt Template Interface
export interface ReceiptTemplate {
  id: string;
  name: string;
  description: string;
  order_type: OrderType;
  template_type: TemplateType;
  is_default: boolean;
  is_deployed: boolean;
  canvas_elements: CanvasElement[];
  layout_settings: LayoutSettings;
  print_settings: PrintSettings;
  grid_settings: GridSettings;
  created_at: string;
  updated_at: string;
  version: number;
}

// Element Palette Item
export interface PaletteElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  icon: string;
  default_data: ElementData;
  default_style: ElementStyle;
  category: 'header' | 'content' | 'footer' | 'decoration';
}

// Canvas State Management
export interface CanvasState {
  selectedElementId: string | null;
  draggedElementId: string | null;
  clipboard: CanvasElement | null;
  history: CanvasElement[][];
  historyIndex: number;
  zoom: number;
  pan: { x: number; y: number };
}

// Design Mode State
export interface DesignModeState {
  mode: 'design' | 'preview' | 'data' | 'print';
  showGrid: boolean;
  showSafeArea: boolean;
  snapToGrid: boolean;
  gridDensity: GridDensity;
}

// Template Manager State
export interface TemplateManagerState {
  templates: ReceiptTemplate[];
  currentTemplate: ReceiptTemplate | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    order_type?: OrderType;
    template_type?: TemplateType;
    search?: string;
  };
}

// Default Element Styles
export const DEFAULT_ELEMENT_STYLE: ElementStyle = {
  font_family: 'Arial',
  font_size: 12,
  font_weight: 'normal',
  text_align: 'left',
  color: '#000000',
  padding_top: 2,
  padding_bottom: 2,
  padding_left: 4,
  padding_right: 4,
  margin_top: 0,
  margin_bottom: 4
};

// Default Grid Settings
export const DEFAULT_GRID_SETTINGS: GridSettings = {
  show_grid: false,
  grid_density: 'medium',
  snap_to_grid: true,
  show_safe_area: true,
  show_margins: true,
  grid_color: '#E5E7EB',
  safe_area_color: '#10B981',
  margin_color: '#EF4444'
};

// Default Layout Settings
export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  paper_width: 80,
  padding_top: 10,
  padding_bottom: 10,
  padding_left: 5,
  padding_right: 5,
  background_color: '#FFFFFF'
};

// Default Print Settings
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paper_width_mm: 80,
  dpi: 203,
  margins_mm: {
    top: 2,
    bottom: 5,
    left: 2,
    right: 2
  },
  cut_at_end: true,
  feed_lines: 3
};

// Order Type Display Names
export const ORDER_TYPE_NAMES: Record<OrderType, string> = {
  ai: '📱 AI Orders',
  online: '🌐 Online Orders',
  dine_in: '🍽️ Dine-In',
  waiting: '⏰ Waiting',
  collection: '📦 Collection',
  delivery: '🚚 Delivery'
};

// Template Type Display Names
export const TEMPLATE_TYPE_NAMES: Record<TemplateType, string> = {
  foh: '👥 Front of House (Customer)',
  kitchen: '👨‍🍳 Kitchen Ticket'
};

// Grid Density Settings
export const GRID_DENSITY_SETTINGS: Record<GridDensity, { spacing: number; opacity: number }> = {
  fine: { spacing: 5, opacity: 0.3 },
  medium: { spacing: 10, opacity: 0.4 },
  coarse: { spacing: 20, opacity: 0.5 }
};

// Paper Width Settings in Pixels (at 203 DPI)
export const PAPER_WIDTH_PX: Record<PaperWidth | number, number> = {
  58: 464, // 58mm at 203 DPI
  80: 637, // 80mm at 203 DPI (EXACT: 80 * 203 / 25.4 = 637.007...)
  custom: 637 // Default fallback for 80mm
};

// **NEW: Thermal Printer Specific Constants**
export const THERMAL_CONSTANTS = {
  // Epson T-20III specific settings
  DPI: 203,
  
  // Character matrix sizes (pixels)
  FONT_A: {
    width: 12,
    height: 24,
    charactersPerLine: 48, // at normal width
    name: 'Font A (12x24)'
  },
  
  FONT_B: {
    width: 9,
    height: 17,
    charactersPerLine: 64, // at normal width
    name: 'Font B (9x17)'
  },
  
  // Thermal paper appearance
  PAPER_COLOR: '#FEFCF0', // Off-white thermal paper
  PAPER_TEXTURE: 'linear-gradient(45deg, transparent 25%, rgba(0,0,0,0.01) 25%, rgba(0,0,0,0.01) 50%, transparent 50%, transparent 75%, rgba(0,0,0,0.01) 75%)',
  
  // Print boundaries (margins in pixels at 203 DPI)
  MARGINS: {
    top: 8,    // ~1mm
    bottom: 20, // ~2.5mm  
    left: 8,   // ~1mm
    right: 8   // ~1mm
  },
  
  // Character spacing
  LINE_HEIGHT_MULTIPLIER: 1.2,
  CHAR_SPACING_PX: 1
};

// **NEW: Thermal Font Definitions**
export const THERMAL_FONTS = {
  'Thermal Font A': {
    family: 'monospace',
    size: 16, // Approximates 12x24 thermal matrix
    weight: 'normal' as FontWeight,
    thermalEquivalent: 'FONT_A'
  },
  'Thermal Font B': {
    family: 'monospace', 
    size: 12, // Approximates 9x17 thermal matrix
    weight: 'normal' as FontWeight,
    thermalEquivalent: 'FONT_B'
  },
  'Thermal Bold A': {
    family: 'monospace',
    size: 16,
    weight: 'bold' as FontWeight,
    thermalEquivalent: 'FONT_A_BOLD'
  },
  'Thermal Bold B': {
    family: 'monospace',
    size: 12,
    weight: 'bold' as FontWeight, 
    thermalEquivalent: 'FONT_B_BOLD'
  }
} as const;

// **NEW: Helper Functions for Thermal Calculations**
export const thermalHelpers = {
  // Calculate how many characters fit on a line
  getCharactersPerLine: (fontType: 'A' | 'B', doubleWidth: boolean = false): number => {
    const base = fontType === 'A' ? THERMAL_CONSTANTS.FONT_A.charactersPerLine : THERMAL_CONSTANTS.FONT_B.charactersPerLine;
    return doubleWidth ? Math.floor(base / 2) : base;
  },
  
  // Convert text to thermal line count
  calculateThermalLines: (text: string, charsPerLine: number): number => {
    if (!text) return 1;
    const lines = text.split('\n');
    return lines.reduce((total, line) => {
      return total + Math.max(1, Math.ceil(line.length / charsPerLine));
    }, 0);
  },
  
  // Get printable area dimensions
  getPrintableArea: () => ({
    width: PAPER_WIDTH_PX[80] - THERMAL_CONSTANTS.MARGINS.left - THERMAL_CONSTANTS.MARGINS.right,
    height: 9999, // Thermal paper is continuous
    marginLeft: THERMAL_CONSTANTS.MARGINS.left,
    marginTop: THERMAL_CONSTANTS.MARGINS.top
  })
};

// Utility Functions
export const createNewTemplate = (orderType: OrderType, templateType: TemplateType): Partial<ReceiptTemplate> => ({
  name: `New ${ORDER_TYPE_NAMES[orderType]} ${TEMPLATE_TYPE_NAMES[templateType]}`,
  description: '',
  order_type: orderType,
  template_type: templateType,
  is_default: false,
  is_deployed: false,
  canvas_elements: [],
  layout_settings: DEFAULT_LAYOUT_SETTINGS,
  print_settings: DEFAULT_PRINT_SETTINGS,
  grid_settings: DEFAULT_GRID_SETTINGS,
  version: 1
});

export const generateElementId = (): string => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const mmToPx = (mm: number, dpi: number = 203): number => {
  return Math.round((mm * dpi) / 25.4);
};

export const pxToMm = (px: number, dpi: number = 203): number => {
  return (px * 25.4) / dpi;
};
