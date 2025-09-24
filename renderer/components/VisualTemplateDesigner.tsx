import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ThermalPreview from 'components/ThermalPreview';
import CalibratedThermalPreview from 'components/CalibratedThermalPreview';
import {
  Type, Image, Square, Plus, Grid3X3, Save, Play, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Trash2, Eye, Layers, Copy, Users, ChefHat, Truck, Bot, Utensils,
  Package, Building, Menu, X, Settings, Calculator, CreditCard,
  DollarSign, MessageSquare, Minus, Clock
} from 'lucide-react';
import {
  ReceiptTemplate, CanvasElement, ElementStyle, GridSettings,
  OrderType, PAPER_WIDTH_PX, ORDER_TYPE_NAMES, TEMPLATE_TYPE_NAMES,
  GRID_DENSITY_SETTINGS, DEFAULT_GRID_SETTINGS, GridDensity,
  FontFamily, FontWeight, TextAlign
} from 'utils/visualTemplateTypes';
import {
  getCalibratedConfig,
  getSampleFormattedContent
} from 'utils/thermalCalibration';
import { parseAndFormatEnhanced } from 'utils/enhancedThermalFormatting';

interface VisualTemplateDesignerProps {
  template?: ReceiptTemplate;
  onSave?: (template: ReceiptTemplate) => void;
  onBack?: () => void; // Optional for backward compatibility
  onTestPrint?: (template: ReceiptTemplate) => void;
  onDeploy?: (template: ReceiptTemplate) => void;
}

// Add missing interface definitions
interface PaletteElement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  default_data: {
    text?: string;
    placeholder?: string;
    dynamic_field?: string;
  };
  default_style: {
    font_family: string;
    font_size: number;
    font_weight: string;
    text_align: string;
    color: string;
    padding_top?: number;
    padding_bottom?: number;
    padding_left?: number;
    padding_right?: number;
    margin_top?: number;
    margin_bottom?: number;
    background_color?: string;
    border_width?: number;
    border_color?: string;
  };
  category: 'header' | 'content' | 'footer' | 'decoration';
}

// Fabric.js Text type alias
type Text = fabric.Text;

// Add QR Code and Media elements to the palette
const PALETTE_ELEMENTS: PaletteElement[] = [
  {
    id: 'header_logo',
    type: 'logo',
    name: 'Restaurant Logo',
    description: 'Main restaurant logo/branding (image upload)',
    icon: 'Image',
    default_data: {
      text: '🏪 RESTAURANT LOGO',
      placeholder: 'Click to upload logo image'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 16,
      font_weight: 'bold',
      text_align: 'center',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 0,
      background_color: 'transparent',
      border_width: 0,
      border_color: '#000000'
    },
    category: 'header'
  },
  {
    id: 'header_business_info',
    type: 'business_info',
    name: 'Business Information',
    description: 'Restaurant name, address, phone, VAT',
    icon: 'Building',
    default_data: {
      text: 'Cottage Tandoori Restaurant\n25 West St, Storrington\nPhone: 01903 741 777\nVAT: GB123456789',
      placeholder: 'Edit restaurant details'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 8
    },
    category: 'header'
  },
  {
    id: 'order_type_banner',
    type: 'order_info',
    name: 'Order Type Banner',
    description: 'Shows order type (COLLECTION, DELIVERY, etc.)',
    icon: 'Package',
    default_data: {
      text: '*** {order.type} ORDER ***',
      dynamic_field: 'order.type'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 14,
      font_weight: 'bold',
      text_align: 'center',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    },
    category: 'header'
  },
  {
    id: 'order_datetime',
    type: 'order_info',
    name: 'Order Date & Time',
    description: 'Order timestamp information',
    icon: 'Clock',
    default_data: {
      text: 'Order: {order.date} at {order.time}\nOrder ID: {order.id}',
      dynamic_field: 'order.datetime'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 5
    },
    category: 'header'
  },
  {
    id: 'customer_info',
    type: 'customer_info',
    name: 'Customer Information',
    description: 'Customer name and contact details',
    icon: 'Users',
    default_data: {
      text: 'Customer: {customer.name}\nPhone: {customer.phone}\nAddress: {customer.address}',
      dynamic_field: 'customer.info'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 8
    },
    category: 'header'
  },
  {
    id: 'items_list_thermal',
    type: 'items_thermal',
    name: 'Items (Thermal Format)',
    description: 'Optimized thermal receipt item list with prices',
    icon: 'Menu',
    default_data: {
      text: '{items.thermal}',
      dynamic_field: 'items.thermal'
    },
    default_style: {
      font_family: 'Courier',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    },
    category: 'content'
  },
  {
    id: 'items_list_detailed',
    type: 'items_detailed',
    name: 'Items (Detailed List)',
    description: 'Detailed item list with modifiers and notes',
    icon: 'List',
    default_data: {
      text: '{items.detailed}',
      dynamic_field: 'items.detailed'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    },
    category: 'content'
  },
  {
    id: 'pricing_breakdown',
    type: 'pricing',
    name: 'Pricing Totals',
    description: 'Subtotal, tax, discount, and total breakdown',
    icon: 'Calculator',
    default_data: {
      text: 'Subtotal:        £{pricing.subtotal}\nTax (20%):       £{pricing.tax}\nDelivery:        £{pricing.delivery}\nDiscount:       -£{pricing.discount}\n--------------------------------\nTOTAL:           £{pricing.total}',
      dynamic_field: 'pricing.breakdown'
    },
    default_style: {
      font_family: 'Courier',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 8,
      margin_bottom: 5
    },
    category: 'footer'
  },
  {
    id: 'payment_method',
    type: 'payment',
    name: 'Payment Method',
    description: 'Payment type and transaction details',
    icon: 'CreditCard',
    default_data: {
      text: 'Payment: {payment.method}\nCard: **** **** **** {payment.last4}\nAuth: {payment.auth_code}\nStatus: {payment.status}',
      dynamic_field: 'payment.details'
    },
    default_style: {
      font_family: 'Courier',
      font_size: 8,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 3,
      padding_bottom: 3,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    },
    category: 'footer'
  },
  {
    id: 'order_total_large',
    type: 'total',
    name: 'Order Total (Large)',
    description: 'Prominent total amount display',
    icon: 'DollarSign',
    default_data: {
      text: 'TOTAL: £{order.total}',
      dynamic_field: 'order.total'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 16,
      font_weight: 'bold',
      text_align: 'center',
      color: '#000000',
      padding_top: 8,
      padding_bottom: 8,
      padding_left: 0,
      padding_right: 0,
      margin_top: 10,
      margin_bottom: 5
    },
    category: 'footer'
  },
  {
    id: 'custom_text',
    type: 'text',
    name: 'Custom Text',
    description: 'Add any custom text or message',
    icon: 'Type',
    default_data: {
      text: 'Your custom text here',
      placeholder: 'Enter your text'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'left',
      color: '#000000',
      padding_top: 2,
      padding_bottom: 2,
      padding_left: 0,
      padding_right: 0,
      margin_top: 0,
      margin_bottom: 5
    },
    category: 'content'
  },
  {
    id: 'separator_line',
    type: 'decoration',
    name: 'Separator Line',
    description: 'Dashed or solid separator line',
    icon: 'Minus',
    default_data: {
      text: '--------------------------------',
      placeholder: 'Separator line'
    },
    default_style: {
      font_family: 'Courier',
      font_size: 10,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      padding_top: 1,
      padding_bottom: 1,
      padding_left: 0,
      padding_right: 0,
      margin_top: 2,
      margin_bottom: 2
    },
    category: 'decoration'
  },
  {
    id: 'footer_message',
    type: 'footer_text',
    name: 'Footer Message',
    description: 'Thank you message or promotional text',
    icon: 'MessageSquare',
    default_data: {
      text: 'Thank you for your order!\nEnjoy your meal.\nVisit us again soon!',
      placeholder: 'Add footer message'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 9,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 10,
      margin_bottom: 0
    },
    category: 'footer'
  },
  {
    id: 'qr_code',
    type: 'qr_code',
    name: 'QR Code',
    description: 'QR code for feedback, menu, or tracking',
    icon: 'Square',
    default_data: {
      text: '[QR CODE]\nScan for feedback',
      placeholder: 'QR code placeholder'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 8,
      font_weight: 'normal',
      text_align: 'center',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 5,
      margin_bottom: 5
    },
    category: 'footer'
  },
  {
    id: 'kitchen_instructions',
    type: 'kitchen_info',
    name: 'Kitchen Instructions',
    description: 'Special cooking instructions for kitchen staff',
    icon: 'ChefHat',
    default_data: {
      text: 'KITCHEN NOTES:\n{order.special_instructions}\nAllergy Info: {order.allergies}',
      dynamic_field: 'kitchen.instructions'
    },
    default_style: {
      font_family: 'Arial',
      font_size: 9,
      font_weight: 'bold',
      text_align: 'left',
      color: '#000000',
      padding_top: 5,
      padding_bottom: 5,
      padding_left: 0,
      padding_right: 0,
      margin_top: 8,
      margin_bottom: 5
    },
    category: 'content'
  }
];

// Design system colors
const colors = {
  brand: {
    purple: '#7C5DF4',
    gold: '#F4C430',
    turquoise: '#40E0D0'
  },
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444'
  }
};

// Generate thermal content from canvas elements
const generateThermalContent = (elements: CanvasElement[], orderData?: any): string => {
  // Sample order data for preview
  const sampleData = {
    order: {
      id: 'CT-2024-001',
      type: 'COLLECTION',
      date: new Date().toLocaleDateString('en-GB'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      total: '28.45'
    },
    customer: {
      name: 'John Smith',
      phone: '07890 123456',
      address: '123 High Street, Storrington'
    },
    items: {
      thermal: '1x Chicken Tikka Masala      £12.95\n1x Pilau Rice                 £4.50\n2x Garlic Naan @ £3.95        £7.90\n1x Mango Lassi                £3.10',
      detailed: 'Chicken Tikka Masala (Medium Heat)\n  - Special instructions: Extra spicy\n  - Allergy info: Contains dairy\n  £12.95\n\nPilau Rice\n  £4.50\n\nGarlic Naan (x2)\n  - Fresh garlic topping\n  £7.90\n\nMango Lassi\n  - Sweet, traditional style\n  £3.10'
    },
    pricing: {
      subtotal: '24.37',
      tax: '4.87',
      delivery: '0.00',
      discount: '0.79',
      total: '28.45'
    },
    payment: {
      method: 'CARD',
      last4: '4532',
      auth_code: 'AUTH123',
      status: 'APPROVED'
    },
    kitchen: {
      instructions: 'Extra spicy, no onions in rice'
    }
  };
  
  const data = orderData || sampleData;
  
  // Sort elements by Y position
  const sortedElements = [...elements].sort((a, b) => a.y - b.y);
  
  // Process each element and replace dynamic fields
  const contentLines: string[] = [];
  
  sortedElements.forEach(element => {
    let content = element.content || '';
    
    // Replace dynamic field placeholders with actual data
    content = content
      .replace(/\{order\.id\}/g, data.order.id)
      .replace(/\{order\.type\}/g, data.order.type)
      .replace(/\{order\.date\}/g, data.order.date)
      .replace(/\{order\.time\}/g, data.order.time)
      .replace(/\{order\.total\}/g, data.order.total)
      .replace(/\{customer\.name\}/g, data.customer.name)
      .replace(/\{customer\.phone\}/g, data.customer.phone)
      .replace(/\{customer\.address\}/g, data.customer.address)
      .replace(/\{items\.thermal\}/g, data.items.thermal)
      .replace(/\{items\.detailed\}/g, data.items.detailed)
      .replace(/\{pricing\.subtotal\}/g, data.pricing.subtotal)
      .replace(/\{pricing\.tax\}/g, data.pricing.tax)
      .replace(/\{pricing\.delivery\}/g, data.pricing.delivery)
      .replace(/\{pricing\.discount\}/g, data.pricing.discount)
      .replace(/\{pricing\.total\}/g, data.pricing.total)
      .replace(/\{payment\.method\}/g, data.payment.method)
      .replace(/\{payment\.last4\}/g, data.payment.last4)
      .replace(/\{payment\.auth_code\}/g, data.payment.auth_code)
      .replace(/\{payment\.status\}/g, data.payment.status)
      .replace(/\{kitchen\.instructions\}/g, data.kitchen.instructions);
    
    if (content.trim()) {
      contentLines.push(content);
    }
  });
  
  return contentLines.join('\n\n');
};

export default function VisualTemplateDesigner({ 
  template,
  onSave,
  onBack, // Optional
  onTestPrint,
  onDeploy 
}: VisualTemplateDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // State management
  const [currentTemplate, setCurrentTemplate] = useState<ReceiptTemplate | null>(template || null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [designMode, setDesignMode] = useState({
    showGrid: true,
    showSafeArea: true,
    snapToGrid: true,
    gridDensity: 'medium' as GridDensity
  });
  const [copiedStyle, setCopiedStyle] = useState<ElementStyle | null>(null);
  const [gridSettings, setGridSettings] = useState<GridSettings>(DEFAULT_GRID_SETTINGS);
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  
  // Initialize Fabric.js canvas
  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: PAPER_WIDTH_PX[80], // Default to 80mm width
        height: 800, // Auto-expandable height
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true
      });
      
      fabricCanvasRef.current = canvas;
      
      // Canvas event handlers
      canvas.on('selection:created', (e) => {
        const activeObject = e.selected?.[0];
        if (activeObject && activeObject.data) {
          setSelectedElementId(activeObject.data.id);
        }
      });
      
      canvas.on('selection:cleared', () => {
        setSelectedElementId(null);
      });
      
      canvas.on('object:moving', (e) => {
        if (designMode.snapToGrid) {
          snapObjectToGrid(e.target);
        }
      });
      
      // Initialize grid
      updateGrid();
    }
    
    return () => {
      if (fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current.dispose();
        } catch (error) {
          // Fallback for v6 - clear and destroy
          try {
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.destroy?.();
          } catch (fallbackError) {
            console.warn('Canvas cleanup failed:', fallbackError);
          }
        }
        fabricCanvasRef.current = null;
      }
    };
  }, []);
  
  // Update grid when settings change
  useEffect(() => {
    updateGrid();
  }, [designMode.showGrid, designMode.gridDensity, gridSettings]);
  
  // Helper function to safely send objects to back
  const sendObjectToBack = (canvas: fabric.Canvas, object: any) => {
    try {
      // Use correct Fabric.js v6 API methods
      if (typeof canvas.sendObjectToBack === 'function') {
        canvas.sendObjectToBack(object);
      } else if (typeof canvas.sendObjectBackwards === 'function') {
        // Fallback to sendObjectBackwards multiple times to get to bottom
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(object);
        if (currentIndex > 0) {
          // Move to bottom by calling sendObjectBackwards repeatedly
          for (let i = 0; i < currentIndex; i++) {
            canvas.sendObjectBackwards(object);
          }
        }
      } else {
        // Manual approach: remove and re-add at beginning
        canvas.remove(object);
        canvas.insertAt(object, 0);
      }
    } catch (error) {
      console.warn('Error moving object to back:', error);
      // Fallback: try manual approach
      try {
        canvas.remove(object);
        canvas.insertAt(object, 0);
      } catch (fallbackError) {
        console.error('Fallback layering method also failed:', fallbackError);
      }
    }
  };

  const updateGrid = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    // Remove existing grid
    const existingGrid = canvas.getObjects().filter(obj => obj.data?.isGrid);
    existingGrid.forEach(obj => canvas.remove(obj));
    
    // Remove existing safe area guides
    const existingSafeArea = canvas.getObjects().filter(obj => obj.data?.isSafeArea);
    existingSafeArea.forEach(obj => canvas.remove(obj));
    
    if (designMode.showGrid) {
      const gridSpacing = GRID_DENSITY_SETTINGS[designMode.gridDensity].spacing;
      const gridOpacity = GRID_DENSITY_SETTINGS[designMode.gridDensity].opacity;
      
      // Create vertical grid lines
      for (let x = 0; x <= canvas.width!; x += gridSpacing) {
        const line = new fabric.Line([x, 0, x, canvas.height!], {
          stroke: gridSettings.grid_color,
          strokeWidth: 1,
          opacity: gridOpacity,
          selectable: false,
          evented: false,
          data: { isGrid: true }
        });
        canvas.add(line);
        sendObjectToBack(canvas, line);
      }
      
      // Create horizontal grid lines
      for (let y = 0; y <= canvas.height!; y += gridSpacing) {
        const line = new fabric.Line([0, y, canvas.width!, y], {
          stroke: gridSettings.grid_color,
          strokeWidth: 1,
          opacity: gridOpacity,
          selectable: false,
          evented: false,
          data: { isGrid: true }
        });
        canvas.add(line);
        sendObjectToBack(canvas, line);
      }
    }
    
    // Add safe area guides
    if (designMode.showSafeArea) {
      const marginPx = 20; // 5mm margins at 203 DPI
      const safeAreaRect = new fabric.Rect({
        left: marginPx,
        top: marginPx,
        width: canvas.width! - (marginPx * 2),
        height: canvas.height! - (marginPx * 2),
        fill: 'transparent',
        stroke: gridSettings.safe_area_color,
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        opacity: 0.7,
        selectable: false,
        evented: false,
        data: { isSafeArea: true }
      });
      canvas.add(safeAreaRect);
      sendObjectToBack(canvas, safeAreaRect);
    }
    
    canvas.renderAll();
  };
  
  const snapObjectToGrid = (obj: any) => {
    if (!designMode.snapToGrid) return;
    
    const gridSpacing = GRID_DENSITY_SETTINGS[designMode.gridDensity].spacing;
    const snappedLeft = Math.round(obj.left! / gridSpacing) * gridSpacing;
    const snappedTop = Math.round(obj.top! / gridSpacing) * gridSpacing;
    obj.set({
      left: snappedLeft,
      top: snappedTop
    });
  };
  
  const addElementToCanvas = (paletteElement: PaletteElement) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const elementId = generateElementId();
    
    // Create fabric text object
    const textObj = new fabric.Text(paletteElement.default_data.text || '', {
      left: 50,
      top: 50,
      fontFamily: paletteElement.default_style.font_family,
      fontSize: paletteElement.default_style.font_size,
      fontWeight: paletteElement.default_style.font_weight,
      textAlign: paletteElement.default_style.text_align,
      fill: paletteElement.default_style.color,
      data: {
        id: elementId,
        type: paletteElement.type,
        originalData: paletteElement.default_data,
        originalStyle: paletteElement.default_style
      }
    });
    
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    canvas.renderAll();
    
    setSelectedElementId(elementId);
    
    // Update template with new element
    if (currentTemplate) {
      const newElement: CanvasElement = {
        id: elementId,
        type: paletteElement.type,
        content: paletteElement.default_data.text || '',
        x: 50,
        y: 50,
        width: textObj.width || 100,
        height: textObj.height || 20,
        style: paletteElement.default_style,
        data: paletteElement.default_data
      };
      
      setCurrentTemplate({
        ...currentTemplate,
        canvas_elements: [...currentTemplate.canvas_elements, newElement]
      });
    }
  };
  
  // Update selected element properties
  const updateElementProperty = (property: string, value: any) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    
    if (!activeObject || !canvas) return;
    
    // Update fabric object
    switch (property) {
      case 'fontFamily':
        (activeObject as fabric.Text).set('fontFamily', value);
        break;
      case 'fontSize':
        (activeObject as fabric.Text).set('fontSize', value);
        break;
      case 'fontWeight':
        (activeObject as fabric.Text).set('fontWeight', value);
        break;
      case 'textAlign':
        (activeObject as fabric.Text).set('textAlign', value);
        break;
      case 'fill':
        (activeObject as fabric.Text).set('fill', value);
        break;
      case 'text':
        (activeObject as fabric.Text).set('text', value);
        break;
    }
    
    canvas.renderAll();
    
    // Update template data
    if (currentTemplate && selectedElementId) {
      const elementIndex = currentTemplate.canvas_elements.findIndex(el => el.id === selectedElementId);
      if (elementIndex !== -1) {
        const updatedElements = [...currentTemplate.canvas_elements];
        const element = updatedElements[elementIndex];
        
        if (property === 'text') {
          element.content = value;
        } else {
          element.style = {
            ...element.style,
            [property]: value
          };
        }
        
        setCurrentTemplate({
          ...currentTemplate,
          canvas_elements: updatedElements
        });
      }
    }
  };
  
  // Delete selected element
  const deleteSelectedElement = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    
    if (!activeObject || !canvas) return;
    
    canvas.remove(activeObject);
    canvas.renderAll();
    
    // Remove from template data
    if (currentTemplate && selectedElementId) {
      const updatedElements = currentTemplate.canvas_elements.filter(el => el.id !== selectedElementId);
      setCurrentTemplate({
        ...currentTemplate,
        canvas_elements: updatedElements
      });
    }
    
    setSelectedElementId(null);
  }
  
  // Get data for currently selected element
  const getSelectedElementData = (): CanvasElement | null => {
    if (!selectedElementId || !currentTemplate) return null;
    return currentTemplate.canvas_elements.find(el => el.id === selectedElementId) || null;
  }
  
  // Update conditional visibility for selected element
  const updateConditionalVisibility = (
    category: 'template_types' | 'order_types', 
    value: TemplateType | OrderType, 
    checked: boolean
  ) => {
    if (!selectedElementId || !currentTemplate) return;
    
    const updatedElements = currentTemplate.canvas_elements.map(element => {
      if (element.id === selectedElementId) {
        const currentVisibility = element.data?.conditional_visibility || {
          show_on_template_types: [],
          show_on_order_types: []
        };
        
        let updatedVisibility: ConditionalVisibility;
        
        if (category === 'template_types') {
          const templateTypes = currentVisibility.show_on_template_types || [];
          updatedVisibility = {
            ...currentVisibility,
            show_on_template_types: checked 
              ? [...templateTypes.filter(t => t !== value), value as TemplateType]
              : templateTypes.filter(t => t !== value)
          };
        } else {
          const orderTypes = currentVisibility.show_on_order_types || [];
          updatedVisibility = {
            ...currentVisibility,
            show_on_order_types: checked 
              ? [...orderTypes.filter(t => t !== value), value as OrderType]
              : orderTypes.filter(t => t !== value)
          };
        }
        
        return {
          ...element,
          data: {
            ...element.data,
            conditional_visibility: updatedVisibility
          }
        };
      }
      return element;
    });
    
    setCurrentTemplate({
      ...currentTemplate,
      canvas_elements: updatedElements
    });
    
    // Update fabric object custom data
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      const updatedElement = updatedElements.find(el => el.id === selectedElementId);
      if (updatedElement) {
        activeObject.set('customData', updatedElement.data);
        canvas.renderAll();
      }
    }
  };
  
  // Apply conditional visibility presets
  const applyConditionalPreset = (preset: 'customer_only' | 'kitchen_only' | 'delivery_only' | 'clear_all') => {
    if (!selectedElementId || !currentTemplate) return;
    
    let visibility: ConditionalVisibility;
    
    switch (preset) {
      case 'customer_only':
        visibility = {
          show_on_template_types: ['foh'],
          show_on_order_types: []
        };
        break;
      case 'kitchen_only':
        visibility = {
          show_on_template_types: ['kitchen'],
          show_on_order_types: []
        };
        break;
      case 'delivery_only':
        visibility = {
          show_on_template_types: [],
          show_on_order_types: ['delivery']
        };
        break;
      case 'clear_all':
      default:
        visibility = {
          show_on_template_types: [],
          show_on_order_types: []
        };
        break;
    }
    
    const updatedElements = currentTemplate.canvas_elements.map(element => {
      if (element.id === selectedElementId) {
        return {
          ...element,
          data: {
            ...element.data,
            conditional_visibility: visibility
          }
        };
      }
      return element;
    });
    
    setCurrentTemplate({
      ...currentTemplate,
      canvas_elements: updatedElements
    });
    
    // Update fabric object custom data
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      const updatedElement = updatedElements.find(el => el.id === selectedElementId);
      if (updatedElement) {
        activeObject.set('customData', updatedElement.data);
        canvas.renderAll();
      }
    }
    
    toast.success(`Applied ${preset.replace('_', ' ')} preset`);
  };
  
  const selectedElement = getSelectedElementData();
  
  // Save canvas state to template
  const saveCanvasToTemplate = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !currentTemplate) return currentTemplate;
    
    const canvasElements: CanvasElement[] = [];
    
    canvas.getObjects().forEach(obj => {
      // Skip grid and guide objects
      if (obj.data?.isGrid || obj.data?.isSafeArea) return;
      
      if (obj.type === 'text' && obj.data?.id) {
        const textObj = obj as Text;
        
        const element: CanvasElement = {
          id: obj.data.id,
          type: obj.data.type || 'text',
          content: textObj.text || '',
          x: textObj.left || 0,
          y: textObj.top || 0,
          width: textObj.width || 100,
          height: textObj.height || 20,
          style: {
            font_family: textObj.fontFamily || 'Arial',
            font_size: textObj.fontSize || 16,
            font_weight: textObj.fontWeight || 'normal',
            text_align: textObj.textAlign || 'left',
            color: textObj.fill || '#000000'
          },
          data: obj.data.originalData || {}
        };
        
        canvasElements.push(element);
      }
    });
    
    const updatedTemplate = {
      ...currentTemplate,
      canvas_elements: canvasElements,
      updated_at: new Date().toISOString()
    };
    
    setCurrentTemplate(updatedTemplate);
    return updatedTemplate;
  };
  
  // Load template elements to canvas
  const loadCanvasFromTemplate = (template: ReceiptTemplate) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    // Clear existing objects (except grid/guides)
    const objectsToRemove = canvas.getObjects().filter(obj => 
      !obj.data?.isGrid && !obj.data?.isSafeArea
    );
    objectsToRemove.forEach(obj => canvas.remove(obj));
    
    // Add template elements to canvas
    template.canvas_elements.forEach(element => {
      const textObj = new Text(element.content, {
        left: element.x,
        top: element.y,
        fontFamily: element.style.font_family,
        fontSize: element.style.font_size,
        fontWeight: element.style.font_weight,
        textAlign: element.style.text_align,
        fill: element.style.color,
        data: {
          id: element.id,
          type: element.type,
          originalData: element.data
        }
      });
      
      canvas.add(textObj);
    });
    
    canvas.renderAll();
  };
  
  // Load template when template prop changes
  useEffect(() => {
    if (template && template !== currentTemplate) {
      setCurrentTemplate(template);
      loadCanvasFromTemplate(template);
    }
  }, [template]);
  
  const toggleGrid = () => {
    setDesignMode(prev => ({ ...prev, showGrid: !prev.showGrid }));
  };
  
  const toggleSnapToGrid = () => {
    setDesignMode(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }));
  };
  
  // Style Preset System Functions
  const applyStylePreset = (presetStyle: ElementStyle) => {
    if (!selectedElementId || !currentTemplate) return;
    
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    
    if (!activeObject || !canvas) return;
    
    // Apply style to fabric object
    if (activeObject.type === 'text') {
      const textObject = activeObject as fabric.Text;
      textObject.set({
        fontFamily: presetStyle.font_family,
        fontSize: presetStyle.font_size,
        fontWeight: presetStyle.font_weight,
        textAlign: presetStyle.text_align,
        fill: presetStyle.color,
        backgroundColor: presetStyle.background_color !== 'transparent' ? presetStyle.background_color : undefined
      });
      canvas.renderAll();
    }
    
    // Update template data
    const updatedElements = currentTemplate.canvas_elements.map(element => {
      if (element.id === selectedElementId) {
        return {
          ...element,
          style: presetStyle
        };
      }
      return element;
    });
    
    setCurrentTemplate({
      ...currentTemplate,
      canvas_elements: updatedElements
    });
    
    toast.success('Style preset applied successfully');
  };
  
  const copyCurrentStyle = () => {
    if (!selectedElement?.style) {
      toast.error('No element selected to copy style from');
      return;
    }
    
    setCopiedStyle(selectedElement.style);
    toast.success('Style copied to clipboard');
  };
  
  const pasteStyle = () => {
    if (!copiedStyle) {
      toast.error('No style copied to paste');
      return;
    }
    
    if (!selectedElementId || !currentTemplate) {
      toast.error('No element selected to paste style to');
      return;
    }
    
    applyStylePreset(copiedStyle);
    toast.success('Style pasted successfully');
  };
  
  const saveCurrentStyleAsPreset = () => {
    if (!selectedElement?.style) {
      toast.error('No element selected to save style from');
      return;
    }
    
    // For now, just show success message
    // In future, this would save to a custom presets collection
    toast.success('Custom style preset saved (feature coming soon)');
  };
  
  const alignElement = (alignment: 'left' | 'center' | 'right') => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    
    if (!activeObject || !canvas) return;
    
    switch (alignment) {
      case 'left':
        activeObject.set('textAlign', 'left');
        break;
      case 'center':
        activeObject.set('textAlign', 'center');
        break;
      case 'right':
        activeObject.set('textAlign', 'right');
        break;
    }
    
    canvas.renderAll();
  };
  
  const updateElementPosition = (axis: 'x' | 'y', value: number) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    
    if (!activeObject || !canvas) return;
    
    switch (axis) {
      case 'x':
        activeObject.set('left', value);
        break;
      case 'y':
        activeObject.set('top', value);
        break;
    }
    
    canvas.renderAll();
  };
  
  const updateGridSettings = (newSettings: Partial<GridSettings>) => {
    setGridSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // QR Code generation function
  const generateQRCode = async (url: string, size: number = 60): Promise<string> => {
    try {
      // Using a QR code API service for generation
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&bgcolor=ffffff&color=000000&margin=1`;
      return qrUrl;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw error;
    }
  };
  
  // Media upload and thermal optimization
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Create a canvas for thermal optimization
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Optimize for thermal printing (high contrast, dithering)
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            
            // Convert to high contrast black and white
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
              const value = brightness > 128 ? 255 : 0;
              data[i] = value;     // Red
              data[i + 1] = value; // Green
              data[i + 2] = value; // Blue
            }
            
            ctx.putImageData(imageData, 0, 0);
            const optimizedDataUrl = canvas.toDataURL('image/png');
            resolve(optimizedDataUrl);
          } else {
            reject(new Error('Could not get canvas context'));
          }
        };
        
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  };
  
  // Update QR code URL for selected element
  const updateQRCode = async (url: string) => {
    if (!selectedElementId || !currentTemplate) return;
    
    try {
      const qrImageUrl = await generateQRCode(url, 60);
      
      const updatedElements = currentTemplate.canvas_elements.map(element => {
        if (element.id === selectedElementId) {
          return {
            ...element,
            data: {
              ...element.data,
              qr_url: url,
              qr_image_url: qrImageUrl
            }
          };
        }
        return element;
      });
      
      setCurrentTemplate({
        ...currentTemplate,
        canvas_elements: updatedElements
      });
      
      toast.success('QR code updated successfully');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };
  
  // Handle image upload for selected element
  const handleElementImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedElementId || !currentTemplate) return;
    
    try {
      const optimizedImageUrl = await handleImageUpload(file);
      
      const updatedElements = currentTemplate.canvas_elements.map(element => {
        if (element.id === selectedElementId) {
          return {
            ...element,
            data: {
              ...element.data,
              image_url: optimizedImageUrl,
              original_filename: file.name
            }
          };
        }
        return element;
      });
      
      setCurrentTemplate({
        ...currentTemplate,
        canvas_elements: updatedElements
      });
      
      toast.success('Image uploaded and optimized for thermal printing');
    } catch (error) {
      toast.error('Failed to upload and optimize image');
    }
  };

  // Render thermal preview section
  const renderThermalPreview = () => {
    if (!template) return null;
    
    // Generate content using canvas elements
    const generateThermalContent = (paperWidth: 58 | 80): string => {
      // Sort elements by Y position
      const sortedElements = [...template.canvas_elements].sort((a, b) => a.y - b.y);
      
      const lines: string[] = [];
      
      sortedElements.forEach(element => {
        if (!element.visible) return;
        
        let text = element.data.text || '';
        
        // Replace dynamic fields with sample data
        text = text
          .replace(/\{order\.type\}/g, 'COLLECTION')
          .replace(/\{order\.id\}/g, 'ORD-2024-001')
          .replace(/\{order\.date\}/g, new Date().toLocaleDateString())
          .replace(/\{order\.time\}/g, new Date().toLocaleTimeString())
          .replace(/\{customer\.name\}/g, 'John Smith')
          .replace(/\{customer\.phone\}/g, '07123 456789')
          .replace(/\{order\.total\}/g, '24.50')
          .replace(/\{items\.thermal\}/g, 
            'Chicken Tikka Masala.....£12.95\n' +
            'Pilau Rice...............£3.50\n' +
            'Garlic Naan..............£3.50\n' +
            'Mango Lassi..............£3.95'
          )
          .replace(/\{pricing\.subtotal\}/g, '20.42')
          .replace(/\{pricing\.tax\}/g, '4.08')
          .replace(/\{pricing\.delivery\}/g, '0.00')
          .replace(/\{pricing\.discount\}/g, '0.00')
          .replace(/\{pricing\.total\}/g, '24.50')
          .replace(/\{payment\.method\}/g, 'CARD')
          .replace(/\{payment\.last4\}/g, '1234')
          .replace(/\{payment\.auth_code\}/g, 'AUTH123')
          .replace(/\{payment\.status\}/g, 'APPROVED');
        
        // Apply text alignment
        const alignText = (text: string, align: string, width: number): string => {
          const maxChars = paperWidth === 58 ? 32 : 42;
          return text.split('\n').map(line => {
            if (line.length <= maxChars) {
              if (align === 'center') {
                const padding = Math.max(0, (maxChars - line.length) / 2);
                return ' '.repeat(Math.floor(padding)) + line;
              } else if (align === 'right') {
                const padding = Math.max(0, maxChars - line.length);
                return ' '.repeat(padding) + line;
              }
            }
            return line;
          }).join('\n');
        };
        
        const alignedText = alignText(text, element.style.text_align, paperWidth);
        lines.push(alignedText);
        
        // Add spacing based on margins
        if (element.style.margin_bottom > 0) {
          lines.push('');
        }
      });
      
      return lines.join('\n');
    };
    
    const content58mm = generateThermalContent(58);
    const content80mm = generateThermalContent(80);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-300">Thermal Preview</h3>
          <div className="flex space-x-2">
            <Badge variant="outline" className="text-xs">58mm</Badge>
            <Badge variant="outline" className="text-xs">80mm</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 58mm Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">58mm Thermal Paper</Label>
            <CalibratedThermalPreview
              content={content58mm}
              paperWidth={58}
              fillStyle="dots"
              showAlignment={false}
              showAccuracy={false}
              className="border border-gray-600 rounded"
            />
          </div>
          
          {/* 80mm Preview */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400">80mm Thermal Paper</Label>
            <CalibratedThermalPreview
              content={content80mm}
              paperWidth={80}
              fillStyle="dots"
              showAlignment={false}
              showAccuracy={false}
              className="border border-gray-600 rounded"
            />
          </div>
        </div>
        
        {/* Print Settings */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Print Settings</span>
            <span>Thermal • Auto-cut • Fast Print</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-full" style={{ backgroundColor: 'transparent' }}>
      {/* Left Sidebar - Element Palette */}
      <div className="w-64 flex flex-col" style={cardStyle}>
        <div className="p-4 border-b border-gray-700/30">
          <h2 className="text-lg font-bold text-white mb-3">Receipt Elements</h2>
          <p className="text-sm text-gray-400">Click to add elements to your receipt</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header Elements */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">📄 Header Elements</h3>
            <div className="space-y-2">
              {PALETTE_ELEMENTS.filter(el => el.category === 'header').map(element => (
                <Card 
                  key={element.id}
                  className="p-3 cursor-pointer transition-all duration-200 border border-gray-700/30 hover:border-purple-500/50 hover:bg-purple-600/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(8px)'
                  }}
                  onClick={() => addElementToCanvas(element)}
                >
                  <div className="flex items-center space-x-2">
                    {element.icon === 'Type' && <Type className="w-4 h-4 text-gray-400" />}
                    {element.icon === 'Image' && <Image className="w-4 h-4 text-gray-400" />}
                    {element.icon === 'Square' && <Square className="w-4 h-4 text-gray-400" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{element.name}</div>
                      <div className="text-xs text-gray-400">{element.description}</div>
                    </div>
                    <Plus className="w-4 h-4" style={{ color: colors.brand.purple }} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Content Elements */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">📝 Content Elements</h3>
            <div className="space-y-2">
              {PALETTE_ELEMENTS.filter(el => el.category === 'content').map(element => (
                <Card 
                  key={element.id}
                  className="p-3 cursor-pointer transition-all duration-200 border border-gray-700/30 hover:border-blue-500/50 hover:bg-blue-600/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(8px)'
                  }}
                  onClick={() => addElementToCanvas(element)}
                >
                  <div className="flex items-center space-x-2">
                    {element.icon === 'Type' && <Type className="w-4 h-4 text-blue-400" />}
                    {element.icon === 'Image' && <Image className="w-4 h-4 text-blue-400" />}
                    {element.icon === 'Square' && <Square className="w-4 h-4 text-blue-400" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{element.name}</div>
                      <div className="text-xs text-gray-400">{element.description}</div>
                    </div>
                    <Plus className="w-4 h-4 text-blue-500" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* Footer Elements */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              📋 Footer Elements
            </h3>
            <div className="space-y-2">
              {PALETTE_ELEMENTS.filter(el => el.category === 'footer').map(element => (
                <Card 
                  key={element.id}
                  className="p-3 cursor-pointer transition-all duration-200 border border-gray-700/30 hover:border-green-500/50 hover:bg-green-600/10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(8px)'
                  }}
                  onClick={() => addElementToCanvas(element)}
                >
                  <div className="flex items-center space-x-2">
                    {element.icon === 'Type' && <Type className="w-4 h-4 text-green-400" />}
                    {element.icon === 'Image' && <Image className="w-4 h-4 text-green-400" />}
                    {element.icon === 'Square' && <Square className="w-4 h-4 text-green-400" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{element.name}</div>
                      <div className="text-xs text-gray-400">{element.description}</div>
                    </div>
                    <Plus className="w-4 h-4 text-green-500" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Center Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-gray-700/30 p-4" style={{
          backgroundColor: 'rgba(26, 26, 26, 0.4)',
          backdropFilter: 'blur(12px)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Badge 
                  className="border-purple-500/30 text-purple-300 px-3 py-1.5 text-sm"
                  style={{ backgroundColor: 'rgba(124, 93, 250, 0.1)' }}
                >
                  {currentTemplate ? ORDER_TYPE_NAMES[currentTemplate.order_type] : 'New Template'}
                </Badge>
                <Badge 
                  className="border-blue-500/30 text-blue-300 px-3 py-1.5 text-sm"
                  style={{ backgroundColor: 'rgba(66, 133, 244, 0.1)' }}
                >
                  {currentTemplate ? TEMPLATE_TYPE_NAMES[currentTemplate.template_type] : 'FOH'}
                </Badge>
              </div>
              
              <Separator orientation="vertical" className="h-8 bg-gray-600" />
              
              {/* Paper Width Selector */}
              <div className="flex items-center space-x-3">
                <Label className="text-sm text-gray-300">Paper:</Label>
                <Select 
                  value={paperWidth.toString()} 
                  onValueChange={(value) => {
                    const newWidth = parseInt(value) as 58 | 80;
                    setPaperWidth(newWidth);
                    // Update canvas width immediately
                    const canvas = fabricCanvasRef.current;
                    if (canvas) {
                      canvas.setWidth(PAPER_WIDTH_PX[newWidth]);
                      updateGrid();
                      canvas.renderAll();
                    }
                  }}
                >
                  <SelectTrigger className="w-20 h-10 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="58" className="text-white hover:bg-gray-700">58mm</SelectItem>
                    <SelectItem value="80" className="text-white hover:bg-gray-700">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleGrid}
                  className={`border-gray-600 text-gray-300 hover:text-white transition-colors px-4 py-2 ${
                    designMode.showGrid 
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' 
                      : 'hover:border-purple-500/50'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid {designMode.showGrid ? 'ON' : 'OFF'}
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Label htmlFor="snap-grid" className="text-base text-gray-300">Snap:</Label>
                  <Switch 
                    id="snap-grid"
                    checked={designMode.snapToGrid}
                    onCheckedChange={toggleSnapToGrid}
                  />
                </div>
                
                <Select 
                  value={designMode.gridDensity} 
                  onValueChange={(value: 'fine' | 'medium' | 'coarse') => 
                    setDesignMode(prev => ({ ...prev, gridDensity: value }))
                  }
                >
                  <SelectTrigger className="w-28 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fine">Fine</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="coarse">Coarse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="px-4 py-2">
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="px-4 py-2">
                <Redo className="w-4 h-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-8" />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onTestPrint?.(saveCanvasToTemplate()!)}
                className="px-4 py-2 text-base"
              >
                <Play className="w-4 h-4 mr-2" />
                Test Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onSave?.(currentTemplate!)}
                className="px-4 py-2 text-base bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
        
        {/* Canvas Container with Thermal Preview */}
        <div className="flex-1 p-6 overflow-auto" style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div className="flex justify-center space-x-6">
            {/* Main Canvas */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Design Canvas</span>
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  {paperWidth}mm × Auto
                </Badge>
              </div>
              <div className="bg-white shadow-2xl rounded-lg p-4" style={{ 
                width: 'fit-content',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
              }}>
                <canvas 
                  ref={canvasRef}
                  className="border border-gray-300 rounded"
                />
              </div>
            </div>
            
            {/* Live Thermal Preview */}
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Thermal Preview</span>
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                  {paperWidth}mm Receipt
                </Badge>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700" style={{
                width: 'fit-content',
                minHeight: '400px'
              }}>
                <div 
                  className="bg-white border border-gray-400 overflow-hidden"
                  style={{
                    width: `${paperWidth === 58 ? '200px' : '280px'}`,
                    minHeight: '400px',
                    fontFamily: 'monospace',
                    fontSize: paperWidth === 58 ? '10px' : '12px',
                    lineHeight: '1.2'
                  }}
                >
                  <ThermalPreview 
                    elements={currentTemplate?.canvas_elements || []}
                    paperWidth={paperWidth}
                    orderData={{
                      order_id: 'PREV-001',
                      order_type: currentTemplate?.order_type || 'dine_in',
                      customer_name: 'Preview Customer',
                      date: new Date().toLocaleDateString(),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      total: '25.50',
                      items: [
                        { name: 'Chicken Tikka Masala', price: '12.95', quantity: 1 },
                        { name: 'Pilau Rice', price: '4.50', quantity: 1 },
                        { name: 'Garlic Naan', price: '3.95', quantity: 2 }
                      ]
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Properties Panel */}
      <div className="w-64 flex flex-col ml-4" style={cardStyle}>
        <div className="p-4 border-b border-gray-700/30">
          <h2 className="text-xl font-bold text-white mb-1">Design Controls</h2>
          <p className="text-sm text-gray-400">
            {selectedElementId ? 'Editing selected element' : 'Select an element to customize'}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedElementId ? (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-300">Element Type</Label>
                <div className="mt-1">
                  <Badge 
                    className="border-gray-600 text-gray-300"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    Text Element
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300">Text Content</Label>
                <Textarea
                  value={selectedElement?.content || ''}
                  onChange={(e) => updateElementProperty('text', e.target.value)}
                  className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
                  rows={4}
                  placeholder="Enter text content... Use \n for line breaks"
                />
                <div className="text-xs text-gray-400 mt-1">
                  💡 Tip: Use dynamic fields like {'{order.total}'} or {'{customer.name}'}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300">Font Family</Label>
                <Select 
                  value={selectedElement?.style?.font_family || 'Arial'}
                  onValueChange={(value) => updateElementProperty('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="Arial" className="text-white hover:bg-gray-700">Arial</SelectItem>
                    <SelectItem value="Times" className="text-white hover:bg-gray-700">Times</SelectItem>
                    <SelectItem value="Courier" className="text-white hover:bg-gray-700">Courier (Monospace)</SelectItem>
                    <SelectItem value="Impact" className="text-white hover:bg-gray-700">Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300">Font Size</Label>
                <Slider
                  value={[selectedElement?.style?.font_size || 16]}
                  onValueChange={([value]) => updateElementProperty('fontSize', value)}
                  max={72}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-400 mt-1">{selectedElement?.style?.font_size || 16}px</div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300">Text Alignment</Label>
                <div className="flex space-x-1 mt-2">
                  <Button 
                    variant={selectedElement?.style?.text_align === 'left' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateElementProperty('textAlign', 'left')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={selectedElement?.style?.text_align === 'center' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateElementProperty('textAlign', 'center')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={selectedElement?.style?.text_align === 'right' ? 'default' : 'outline'} 
                    size="sm" 
                    className="flex-1"
                    onClick={() => updateElementProperty('textAlign', 'right')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-300">Text Style</Label>
                <div className="flex space-x-1 mt-2">
                  <Button 
                    variant={selectedElement?.style?.font_weight === 'bold' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => updateElementProperty('fontWeight', 
                      selectedElement?.style?.font_weight === 'bold' ? 'normal' : 'bold'
                    )}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Company Details Section */}
              {(selectedElement?.type === 'header' && selectedElement?.id === 'header_business_info') && (
                <div className="pt-6 border-t border-gray-700/30">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <Building className="w-4 h-4 mr-2" style={{ color: colors.brand.gold }} />
                    Company Details
                  </h3>
                  
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-left justify-start"
                      onClick={() => {
                        updateElementProperty('text', 
                          'Cottage Tandoori Restaurant\n123 High Street, Your City\nPhone: 01234 567890\nEmail: info@cottagetandoori.com\nVAT: GB123456789'
                        );
                      }}
                    >
                      📝 Use Default Details
                    </Button>
                    
                    <div className="text-xs text-gray-400">
                      💡 Edit the text above to customize your restaurant details
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Item Layout Controls */}
              {selectedElement?.type === 'item_section' && (
                <div className="pt-6 border-t border-gray-700/30">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                    <Menu className="w-4 h-4 mr-2" style={{ color: colors.brand.turquoise }} />
                    Menu Layout
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-300">Item Format</Label>
                      <Select 
                        value="detailed"
                        onValueChange={(value) => {
                          if (value === 'simple') {
                            updateElementProperty('text', '{items.simple}');
                          } else if (value === 'detailed') {
                            updateElementProperty('text', '{items.list}');
                          } else if (value === 'compact') {
                            updateElementProperty('text', '{items.compact}');
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-gray-800/50 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="simple" className="text-white hover:bg-gray-700">Simple List</SelectItem>
                          <SelectItem value="detailed" className="text-white hover:bg-gray-700">Detailed with Prices</SelectItem>
                          <SelectItem value="compact" className="text-white hover:bg-gray-700">Compact Format</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      📋 Controls how menu items appear on receipts
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-6 border-t border-gray-700/30">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/30 hover:text-red-200"
                  onClick={deleteSelectedElement}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Element
                </Button>
              </div>
              
              {/* Conditional Element System */}
              <div className="pt-6 border-t border-gray-700/30">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <Eye className="w-4 h-4 mr-2" style={{ color: colors.brand.purple }} />
                  Conditional Display
                </h3>
                
                <div className="space-y-4">
                  {/* Template Type Visibility */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-2 block">Show On Receipt Type</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-foh"
                          checked={selectedElement?.data?.conditional_visibility?.show_on_template_types?.includes('foh') || false}
                          onCheckedChange={(checked) => updateConditionalVisibility('template_types', 'foh', checked)}
                          className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label htmlFor="show-foh" className="text-sm text-gray-300 flex items-center">
                          <Users className="w-4 h-4 mr-1 text-blue-400" />
                          Customer Receipt
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-kitchen"
                          checked={selectedElement?.data?.conditional_visibility?.show_on_template_types?.includes('kitchen') || false}
                          onCheckedChange={(checked) => updateConditionalVisibility('template_types', 'kitchen', checked)}
                          className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label htmlFor="show-kitchen" className="text-sm text-gray-300 flex items-center">
                          <ChefHat className="w-4 h-4 mr-1 text-orange-400" />
                          Kitchen Ticket
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Type Visibility */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-2 block">Show For Order Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries({
                        dine_in: { icon: Utensils, label: 'Dine-In', color: colors.status.warning },
                        collection: { icon: Package, label: 'Collection', color: colors.status.success },
                        delivery: { icon: Truck, label: 'Delivery', color: colors.brand.purple },
                        ai: { icon: Bot, label: 'AI Orders', color: colors.brand.purple }
                      }).map(([orderType, config]) => {
                        const Iconcomponent = config.icon;
                        return (
                          <div key={orderType} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`show-${orderType}`}
                              checked={selectedElement?.data?.conditional_visibility?.show_on_order_types?.includes(orderType as OrderType) || false}
                              onCheckedChange={(checked) => updateConditionalVisibility('order_types', orderType as OrderType, checked)}
                              className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                            <Label htmlFor={`show-${orderType}`} className="text-xs text-gray-300 flex items-center">
                              <Iconcomponent className="w-3 h-3 mr-1" style={{ color: config.color }} />
                              {config.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Visual Indicator for Current Element */}
                  {(selectedElement?.data?.conditional_visibility?.show_on_template_types?.length || 
                    selectedElement?.data?.conditional_visibility?.show_on_order_types?.length) && (
                    <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Eye className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-sm font-medium text-purple-300">Conditional Element</span>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        {selectedElement?.data?.conditional_visibility?.show_on_template_types?.length && (
                          <div>
                            Shows on: {selectedElement.data.conditional_visibility.show_on_template_types.map(type => 
                              type === 'foh' ? 'Customer' : 'Kitchen'
                            ).join(', ')} receipts
                          </div>
                        )}
                        {selectedElement?.data?.conditional_visibility?.show_on_order_types?.length && (
                          <div>
                            Order types: {selectedElement.data.conditional_visibility.show_on_order_types.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Quick Presets */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-2 block">Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyConditionalPreset('customer_only')}
                        className="text-xs border-gray-600 text-gray-300 hover:text-white hover:border-blue-500"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Customer Only
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyConditionalPreset('kitchen_only')}
                        className="text-xs border-gray-600 text-gray-300 hover:text-white hover:border-orange-500"
                      >
                        <ChefHat className="w-3 h-3 mr-1" />
                        Kitchen Only
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyConditionalPreset('delivery_only')}
                        className="text-xs border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
                      >
                        <Truck className="w-3 h-3 mr-1" />
                        Delivery Only
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyConditionalPreset('clear_all')}
                        className="text-xs border-gray-600 text-gray-300 hover:text-white hover:border-red-500"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Show All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Style Preset System */}
              <div className="pt-6 border-t border-gray-700/30">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                  <Layers className="w-4 h-4 mr-2" style={{ color: colors.brand.purple }} />
                  Style Presets
                </h3>
                
                <div className="space-y-4">
                  {/* Pre-built Style Presets */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-3 block">Pre-built Presets</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        {
                          id: 'restaurant_header',
                          name: 'Restaurant Header',
                          description: 'Bold, centered header style',
                          icon: '🏪',
                          style: {
                            font_family: 'Arial',
                            font_size: 16,
                            font_weight: 'bold' as FontWeight,
                            text_align: 'center' as TextAlign,
                            color: '#000000',
                            background_color: 'transparent',
                            padding: 8,
                            margin_top: 0,
                            margin_bottom: 10
                          }
                        },
                        {
                          id: 'order_summary',
                          name: 'Order Summary',
                          description: 'Clean list formatting',
                          icon: '📝',
                          style: {
                            font_family: 'Courier',
                            font_size: 10,
                            font_weight: 'normal' as FontWeight,
                            text_align: 'left' as TextAlign,
                            color: '#000000',
                            background_color: 'transparent',
                            padding: 4,
                            margin_top: 5,
                            margin_bottom: 5
                          }
                        },
                        {
                          id: 'total_section',
                          name: 'Total Section',
                          description: 'Emphasized totals',
                          icon: '💰',
                          style: {
                            font_family: 'Arial',
                            font_size: 12,
                            font_weight: 'bold' as FontWeight,
                            text_align: 'right' as TextAlign,
                            color: '#000000',
                            background_color: 'transparent',
                            padding: 6,
                            margin_top: 8,
                            margin_bottom: 5
                          }
                        },
                        {
                          id: 'special_instructions',
                          name: 'Special Instructions',
                          description: 'Highlighted notes',
                          icon: '⚠️',
                          style: {
                            font_family: 'Arial',
                            font_size: 11,
                            font_weight: 'bold' as FontWeight,
                            text_align: 'center' as TextAlign,
                            color: '#000000',
                            background_color: '#FFFF99',
                            padding: 8,
                            margin_top: 5,
                            margin_bottom: 5
                          }
                        },
                        {
                          id: 'kitchen_alert',
                          name: 'Kitchen Alert',
                          description: 'Bold kitchen notices',
                          icon: '🚨',
                          style: {
                            font_family: 'Arial',
                            font_size: 14,
                            font_weight: 'bold' as FontWeight,
                            text_align: 'center' as TextAlign,
                            color: '#FFFFFF',
                            background_color: '#FF0000',
                            padding: 10,
                            margin_top: 5,
                            margin_bottom: 5
                          }
                        }
                      ].map((preset) => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          onClick={() => applyStylePreset(preset.style)}
                          className="w-full p-3 h-auto border-gray-600 text-gray-300 hover:text-white hover:border-purple-500 hover:bg-purple-600/10"
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className="text-lg">{preset.icon}</div>
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">{preset.name}</div>
                              <div className="text-xs text-gray-400">{preset.description}</div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Preset Management */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-3 block">Custom Presets</Label>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={saveCurrentStyleAsPreset}
                        className="w-full border-gray-600 text-gray-300 hover:text-white hover:border-green-500"
                        disabled={!selectedElement}
                      >
                        <Plus className="w-3 h-3 mr-2" />
                        Save Current Style as Preset
                      </Button>
                      
                      {/* Saved custom presets would be listed here */}
                      <div className="text-xs text-gray-500 text-center py-2">
                        Custom presets will appear here
                      </div>
                    </div>
                  </div>
                  
                  {/* Style Copy/Paste */}
                  <div>
                    <Label className="text-sm text-gray-300 mb-3 block">Quick Actions</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyCurrentStyle}
                        className="border-gray-600 text-gray-300 hover:text-white hover:border-blue-500"
                        disabled={!selectedElement}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Style
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={pasteStyle}
                        className="border-gray-600 text-gray-300 hover:text-white hover:border-green-500"
                        disabled={!selectedElement || !copiedStyle}
                      >
                        <Clipboard className="w-3 h-3 mr-1" />
                        Paste Style
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* QR Code & Media Controls */}
              {(selectedElement?.type === 'qr_code' || selectedElement?.type === 'image') && (
                <div className="pt-6 border-t border-gray-700/30">
                  <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center">
                    {selectedElement?.type === 'qr_code' ? (
                      <QrCode className="w-4 h-4 mr-2" style={{ color: colors.brand.purple }} />
                    ) : (
                      <Image className="w-4 h-4 mr-2" style={{ color: colors.brand.purple }} />
                    )}
                    {selectedElement?.type === 'qr_code' ? 'QR Code Settings' : 'Image Settings'}
                  </h3>
                  
                  {selectedElement?.type === 'qr_code' && (
                    <div className="space-y-4">
                      {/* QR Code URL Input */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">QR Code URL</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            value={selectedElement?.data?.qr_url || ''}
                            onChange={(e) => {
                              if (selectedElement) {
                                const updatedElements = currentTemplate?.canvas_elements.map(element => {
                                  if (element.id === selectedElementId) {
                                    return {
                                      ...element,
                                      data: {
                                        ...element.data,
                                        qr_url: e.target.value
                                      }
                                    };
                                  }
                                  return element;
                                });
                                
                                if (currentTemplate) {
                                  setCurrentTemplate({
                                    ...currentTemplate,
                                    canvas_elements: updatedElements || []
                                  });
                                }
                              }
                            }}
                            className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                          />
                          <Button
                            size="sm"
                            onClick={() => updateQRCode(selectedElement?.data?.qr_url || '')}
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!selectedElement?.data?.qr_url}
                          >
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      {/* QR Code Size */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">QR Code Size (px)</Label>
                        <Slider
                          value={[selectedElement?.data?.qr_size || 60]}
                          onValueChange={([value]) => {
                            if (selectedElement) {
                              const updatedElements = currentTemplate?.canvas_elements.map(element => {
                                if (element.id === selectedElementId) {
                                  return {
                                    ...element,
                                    width: value,
                                    height: value,
                                    data: {
                                      ...element.data,
                                      qr_size: value
                                    }
                                  };
                                }
                                return element;
                              });
                              
                              if (currentTemplate) {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  canvas_elements: updatedElements || []
                                });
                              }
                            }
                          }}
                          max={120}
                          min={30}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>30px</span>
                          <span className="font-medium">{selectedElement?.data?.qr_size || 60}px</span>
                          <span>120px</span>
                        </div>
                      </div>
                      
                      {/* Error Correction Level */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Error Correction</Label>
                        <Select
                          value={selectedElement?.data?.error_correction || 'M'}
                          onValueChange={(value) => {
                            if (selectedElement) {
                              const updatedElements = currentTemplate?.canvas_elements.map(element => {
                                if (element.id === selectedElementId) {
                                  return {
                                    ...element,
                                    data: {
                                      ...element.data,
                                      error_correction: value
                                    }
                                  };
                                }
                                return element;
                              });
                              
                              if (currentTemplate) {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  canvas_elements: updatedElements || []
                                });
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Low (7%)</SelectItem>
                            <SelectItem value="M">Medium (15%)</SelectItem>
                            <SelectItem value="Q">Quartile (25%)</SelectItem>
                            <SelectItem value="H">High (30%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Quick QR Presets */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Quick Presets</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { name: 'Feedback Form', url: 'https://feedback.cottagetandoori.com', icon: '📝' },
                            { name: 'Online Menu', url: 'https://menu.cottagetandoori.com', icon: '📱' },
                            { name: 'Instagram', url: 'https://instagram.com/cottagetandoori', icon: '📸' },
                            { name: 'Google Reviews', url: 'https://g.page/r/cottagetandoori/review', icon: '⭐' }
                          ].map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => updateQRCode(preset.url)}
                              className="w-full justify-start border-gray-600 text-gray-300 hover:text-white hover:border-purple-500"
                            >
                              <span className="mr-2">{preset.icon}</span>
                              {preset.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedElement?.type === 'image' && (
                    <div className="space-y-4">
                      {/* Image Upload */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Upload Image</Label>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleElementImageUpload}
                            className="bg-gray-800/50 border-gray-600 text-white file:bg-purple-600 file:text-white file:border-0 file:rounded"
                          />
                          <div className="text-xs text-gray-400">
                            Images will be automatically optimized for thermal printing (high contrast B&W)
                          </div>
                        </div>
                      </div>
                      
                      {/* Current Image Preview */}
                      {selectedElement?.data?.image_url && (
                        <div>
                          <Label className="text-sm text-gray-300 mb-2 block">Current Image</Label>
                          <div className="bg-white p-2 rounded border">
                            <img 
                              src={selectedElement.data.image_url} 
                              alt={selectedElement.data.alt_text || 'Uploaded image'}
                              className="max-w-full h-auto max-h-32 mx-auto"
                            />
                          </div>
                          {selectedElement.data.original_filename && (
                            <div className="text-xs text-gray-400 mt-1">
                              File: {selectedElement.data.original_filename}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Alt Text */}
                      <div>
                        <Label className="text-sm text-gray-300 mb-2 block">Alt Text</Label>
                        <Input
                          type="text"
                          placeholder="Describe the image"
                          value={selectedElement?.data?.alt_text || ''}
                          onChange={(e) => {
                            if (selectedElement) {
                              const updatedElements = currentTemplate?.canvas_elements.map(element => {
                                if (element.id === selectedElementId) {
                                  return {
                                    ...element,
                                    data: {
                                      ...element.data,
                                      alt_text: e.target.value
                                    }
                                  };
                                }
                                return element;
                              });
                              
                              if (currentTemplate) {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  canvas_elements: updatedElements || []
                                });
                              }
                            }
                          }}
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      
                      {/* Thermal Optimization Toggle */}
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="thermal-optimized"
                          checked={selectedElement?.data?.thermal_optimized || false}
                          onCheckedChange={(checked) => {
                            if (selectedElement) {
                              const updatedElements = currentTemplate?.canvas_elements.map(element => {
                                if (element.id === selectedElementId) {
                                  return {
                                    ...element,
                                    data: {
                                      ...element.data,
                                      thermal_optimized: checked
                                    }
                                  };
                                }
                                return element;
                              });
                              
                              if (currentTemplate) {
                                setCurrentTemplate({
                                  ...currentTemplate,
                                  canvas_elements: updatedElements || []
                                });
                              }
                            }
                          }}
                          className="border-gray-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <Label htmlFor="thermal-optimized" className="text-sm text-gray-300">
                          Apply thermal optimization (B&W conversion)
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // No Selection State - Guide users on how to use the interface
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
              <div className="text-gray-400">
                <Type className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Element Selected</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">
                  Click on elements from the palette or select existing elements on the canvas to customize them.
                </p>
              </div>
              
              {/* Quick Add Buttons */}
              <div className="space-y-3 w-full">
                <h4 className="text-sm font-medium text-gray-300 flex items-center">
                  <Plus className="w-4 h-4 mr-2" style={{ color: colors.brand.purple }} />
                  Quick Add
                </h4>
                
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const businessInfoElement = PALETTE_ELEMENTS.find(el => el.id === 'header_business_info');
                      if (businessInfoElement) addElementToCanvas(businessInfoElement);
                    }}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Company Details
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const customTextElement = PALETTE_ELEMENTS.find(el => el.id === 'custom_text');
                      if (customTextElement) addElementToCanvas(customTextElement);
                    }}
                  >
                    <Type className="w-4 h-4 mr-2" />
                    Custom Text
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      const menuItemsElement = PALETTE_ELEMENTS.find(el => el.id === 'items_list');
                      if (menuItemsElement) addElementToCanvas(menuItemsElement);
                    }}
                  >
                    <Menu className="w-4 h-4 mr-2" />
                    Menu Items
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 mt-4">
                💡 <strong>Pro tip:</strong> Use the Element Palette on the left to add more elements
              </div>
            </div>
          )}
          
          {/* Thermal Preview Section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            {renderThermalPreview()}
          </div>
        </div>
      </div>
      
      {/* Render thermal preview section */}
      {renderThermalPreview()}
    </div>
  );
}
