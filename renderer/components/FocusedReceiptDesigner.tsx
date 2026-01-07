import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  ChefHat, Clock, Package, AlertTriangle, MessageSquare, Store, Image, MapPin, 
  Receipt, DollarSign, Info, Building, Plus, ChevronUp, ChevronDown, Settings,
  Copy, Trash2, Eye, EyeOff, Move, RotateCcw, Save, Download, Upload, FileText,
  Grid3X3, Zap, Palette, Type, AlignLeft, AlignCenter, AlignRight, Bold,
  QrCode, Play, GripVertical
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { uploadLogoThermal, testPrintReceipt } from 'utils/receiptUtils';
import { FontSelector } from 'components/FontSelector';
import FontSelectorModal from 'components/FontSelectorModal';
import ThermalLogoUploader from 'components/ThermalLogoUploader';
import { THERMAL_PRESETS, ThermalConfig } from 'utils/thermalFormatting';
import { generateSampleItems, applyThermalFormatting } from 'utils/thermalPreview';
import { colors, cardStyle } from 'utils/designSystem';
import { formatThermalItemLine, ThermalItem } from 'utils/thermalFormatting';
import CalibratedThermalPreview from 'components/CalibratedThermalPreview';
import { getCalibratedConfig } from 'utils/thermalCalibration';
import { THERMAL_FONTS, getOptimalFontSize } from 'utils/thermalFonts';

// @dnd-kit imports for drag & drop functionality
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Receipt Element Component
interface SortableReceiptElementProps {
  element: ReceiptElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  templateType: 'kitchen' | 'foh';
  logoImages: Record<string, string>;
  showDebugMode: boolean;
  paperWidth: 58 | 80;
}

function SortableReceiptElement({ 
  element, 
  isSelected, 
  onSelect, 
  templateType,
  logoImages,
  showDebugMode,
  paperWidth
}: SortableReceiptElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!element.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative cursor-pointer transition-all duration-200 p-1 rounded ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-100'
      }`}
      onClick={() => onSelect(element.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing z-10"
      >
        <div className="bg-gray-600 hover:bg-gray-700 rounded p-1">
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      </div>
      
      {/* Element Content */}
      <div
        style={{
          fontSize: `${(element.style?.fontSize || 12) * 0.8}px`, // Scale for preview
          fontWeight: element.style?.fontWeight || 'normal',
          textAlign: element.style?.textAlign || 'left',
          fontFamily: element.style?.fontFamily || (templateType === 'kitchen' ? 'Courier' : 'Arial')
        }}
      >
        {/* Handle logo elements with actual images */}
        {element.type === 'logo' ? (
          element.logo_url ? (
            <div className="flex justify-center py-2">
              <img 
                src={element.logo_url} 
                alt="Restaurant Logo"
                className="max-w-full h-auto"
                style={{
                  maxHeight: '60px', // Reasonable size for receipt preview
                  imageRendering: 'pixelated' // Show thermal effect
                }}
                onError={(e) => {
                  console.error('Error loading logo image:', e);
                  // Fallback to text if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.style.display = 'block';
                }}
              />
              <span 
                className="text-center hidden"
                style={{ display: 'none' }}
              >
                [LOGO PLACEHOLDER]
              </span>
            </div>
          ) : (
            <div className="text-center py-2 text-gray-400 text-xs border border-dashed border-gray-300 rounded">
              [LOGO: Click to upload]
            </div>
          )
        ) : element.type === 'qr_code' ? (
          <div className={`flex ${
            element.qr_alignment === 'center' ? 'justify-center' : 
            element.qr_alignment === 'right' ? 'justify-end' : 'justify-start'
          } py-2`}>
            <div className="text-center">
              {element.qr_label && element.qr_label_position === 'above' && (
                <div className="text-xs mb-1">{element.qr_label}</div>
              )}
              <QRCodeSVG 
                value={element.qr_url || 'https://cottagetandoori.com'} 
                size={element.qr_size || 80}
                level="M"
                includeMargin={false}
              />
              {element.qr_label && element.qr_label_position === 'below' && (
                <div className="text-xs mt-1">{element.qr_label}</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* Handle different element types with realistic content */}
            {element.type === 'order_items_thermal' ? (
              <CalibratedThermalPreview
                content={element.content || generateSampleItems(3).map(item => 
                  `${item.quantity}x ${item.name}${item.customizations ? ` (${item.customizations.join(', ')})` : ''} £${item.price.toFixed(2)}`
                ).join('\n')}
                paperWidth={paperWidth}
                fillStyle="dots"
                showAlignment={showDebugMode}
                showAccuracy={showDebugMode}
                showDebugInfo={showDebugMode}
                className="font-mono text-xs"
              />
            ) : element.type === 'order_items_kitchen' ? (
              <div className="font-mono text-xs space-y-1">
                {generateSampleItems(3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-red-600">{item.quantity}x</span>
                    <div>
                      <div className="font-semibold">{item.name}</div>
                      {item.customizations && (
                        <div className="text-red-600 font-medium">
                          • {item.customizations.join(' • ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : element.type === 'order_items_kitchen_priced' ? (
              <div className="font-mono text-xs space-y-1">
                {generateSampleItems(3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-red-600">{item.quantity}x</span>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        {item.customizations && (
                          <div className="text-red-600 font-medium">
                            • {item.customizations.join(' • ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold">£{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>{element.content || `[${element.name}]`}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface FocusedReceiptDesignerProps {
  template?: ReceiptTemplate;
  onSave?: (template: ReceiptTemplate) => void;
  onBack?: () => void;
  onTestPrint?: (template: ReceiptTemplate) => void;
  onDeploy?: (template: ReceiptTemplate) => void;
}

// Receipt element types for the focused designer
interface ReceiptElement {
  id: string;
  type: 'header_text' | 'logo' | 'order_items' | 'order_items_thermal' | 'order_items_kitchen' | 'order_items_kitchen_priced' | 'totals' | 'footer_text' | 'custom_info' | 'datetime' | 'modifications' | 'timing_info' | 'payment_info' | 'promotions' | 'qr_code';
  name: string;
  icon: React.ComponentType<any>;
  content?: string;
  logo_id?: string | null; // Add logo_id field
  logo_url?: string | null; // Add logo_url field for cached URLs
  qr_url?: string; // QR code URL field
  qr_size?: number; // QR code size field
  qr_alignment?: 'left' | 'center' | 'right'; // QR alignment field
  qr_label?: string; // Optional label text
  qr_label_position?: 'above' | 'below'; // Label position
  style?: {
    fontSize: number;
    fontWeight: FontWeight;
    textAlign: TextAlign;
    fontFamily: FontFamily;
  };
  // Add thermal formatting configuration
  thermal_config?: {
    column_layout: 'thermal' | 'kitchen' | 'simple';
    paper_width: 58 | 80;
    columns: {
      qty_width: number;
      item_width: number;
      price_width: number;
    };
    alignment: {
      qty: 'left' | 'center' | 'right';
      item: 'left' | 'center' | 'right';
      price: 'left' | 'center' | 'right';
    };
    separator_char: '.' | ' ' | '-';
    fill_style: 'dots' | 'spaces';
    show_customizations: boolean;
  };
  visible: boolean;
  editable: boolean;
  // Industry standard categorization
  category: 'kitchen_only' | 'customer_only' | 'both';
  industry_purpose: string;
}

// Industry-standard elements for kitchen vs customer receipts
const KITCHEN_ELEMENTS: Omit<ReceiptElement, 'id' | 'visible'>[] = [
  {
    type: 'header_text',
    name: 'Kitchen Header',
    icon: ChefHat,
    content: '=== KITCHEN TICKET ===',
    style: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Courier' },
    editable: true,
    category: 'kitchen_only',
    industry_purpose: 'Clear identification for kitchen staff'
  },
  {
    type: 'timing_info',
    name: 'Order Time & Type',
    icon: Clock,
    content: 'DINE-IN - 18:30 - Table 5',
    style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Courier' },
    editable: false,
    category: 'kitchen_only',
    industry_purpose: 'Critical timing and service info for kitchen workflow'
  },
  {
    type: 'order_items_kitchen',
    name: 'Items (Kitchen Format)',
    icon: Package,
    content: '1x   Spicy Chicken Tikka Masala\n     - Extra spicy, no dairy\n1x   Chicken Madras               \n2x   Onion Bhaji                  \n1x   Sag Aloo                    \n2x   Pilau Rice                  \n4x   Naan                        ',
    style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Courier' },
    thermal_config: {
      column_layout: 'kitchen',
      paper_width: 58,
      columns: {
        qty_width: 4,
        item_width: 30,
        price_width: 0
      },
      alignment: {
        qty: 'left',
        item: 'left',
        price: 'left'
      },
      separator_char: ' ',
      show_customizations: true
    },
    editable: false,
    category: 'kitchen_only',
    industry_purpose: 'Kitchen ticket format - quantities and customizations only, no prices'
  },
  {
    type: 'order_items_kitchen_priced',
    name: 'Items (Kitchen Format with Prices)',
    icon: Package,
    content: '1x   Spicy Chicken Tikka Masala     £9.50\n     - Extra spicy, no dairy\n1x   Chicken Madras               £8.25\n2x   Onion Bhaji                  £8.50\n1x   Sag Aloo                    £4.75\n2x   Pilau Rice                  £6.50\n4x   Naan                        £11.00',
    style: { fontSize: 12, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Courier' },
    thermal_config: {
      column_layout: 'kitchen',
      paper_width: 58,
      columns: {
        qty_width: 4,
        item_width: 26,
        price_width: 8
      },
      alignment: {
        qty: 'left',
        item: 'left',
        price: 'right'
      },
      separator_char: ' ',
      fill_style: 'dots',
      show_customizations: true
    },
    editable: false,
    category: 'kitchen_only',
    industry_purpose: 'Kitchen ticket with prices for order verification and cost awareness'
  },
  {
    type: 'modifications',
    name: 'Modifications',
    icon: AlertTriangle,
    content: '*** EXTRA SPICY ***\n*** NO ONIONS ***',
    style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Courier' },
    editable: false,
    category: 'kitchen_only',
    industry_purpose: 'Highlight special requests and allergen info'
  },
  {
    type: 'custom_info',
    name: 'Kitchen Notes',
    icon: MessageSquare,
    content: 'RUSH ORDER - Priority Service',
    style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Courier' },
    editable: true,
    category: 'kitchen_only',
    industry_purpose: 'Special instructions for kitchen staff'
  }
];

const CUSTOMER_ELEMENTS: (Omit<ReceiptElement, 'id' | 'visible'> & { category: ElementCategory })[] = [
  {
    type: 'restaurant_name',
    name: 'Restaurant Name',
    icon: Store,
    content: 'COTTAGE TANDOORI',
    style: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Arial' },
    editable: true,
    category: 'both',
    industry_purpose: 'Legal business identification requirement'
  },
  {
    type: 'logo',
    name: 'Restaurant Logo',
    icon: Image,
    content: '[LOGO]',
    style: { fontSize: 12, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Arial' },
    editable: false,
    category: 'customer_only',
    industry_purpose: 'Brand recognition and professional appearance'
  },
  {
    type: 'contact_info',
    name: 'Contact Details',
    icon: MapPin,
    content: '123 High Street, London\nTel: 020 7123 4567\nwww.cottagetandoori.co.uk',
    style: { fontSize: 9, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Arial' },
    editable: true,
    category: 'both',
    industry_purpose: 'Customer contact and location information'
  },
  {
    type: 'datetime',
    name: 'Date & Time',
    icon: Clock,
    content: '20/12/2024 - 19:30\nOrder #CT-1234',
    style: { fontSize: 10, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Courier' },
    editable: false,
    category: 'both',
    industry_purpose: 'Legal requirement and order tracking'
  },
  {
    type: 'order_items_thermal',
    name: 'Items (Thermal Format)',
    icon: Package,
    content: '1    Spicy Chicken Tikka Masala          £9.50\n1    Chicken Madras                      £8.25\n2    Onion Bhaji                         £8.50\n1    Sag Aloo                           £4.75\n2    Pilau Rice                         £6.50\n4    Naan                               £11.00',
    style: { fontSize: 11, fontWeight: 'normal', textAlign: 'left', fontFamily: 'Courier' },
    thermal_config: {
      column_layout: 'thermal',
      paper_width: 80,
      columns: {
        qty_width: 3,
        item_width: 35,
        price_width: 8
      },
      alignment: {
        qty: 'right',
        item: 'left',
        price: 'right'
      },
      separator_char: ' ',
      show_customizations: true
    },
    editable: false,
    category: 'customer_only',
    industry_purpose: 'Professional thermal receipt formatting with proper column alignment'
  },
  {
    type: 'totals',
    name: 'Pricing Totals',
    icon: DollarSign, // Fix: Change from CreditCard to DollarSign
    content: 'Subtotal:    £36.30\nVAT (20%):   £7.26\nTotal:       £43.56',
    style: { fontSize: 11, fontWeight: 'bold', textAlign: 'right', fontFamily: 'Courier' },
    editable: false,
    category: 'customer_only',
    industry_purpose: 'Legal VAT compliance and payment verification'
  },
  {
    type: 'payment_info',
    name: 'Payment Method',
    icon: Receipt, // Change from CreditCard to Receipt
    content: 'PAID: Card Transaction\nCard: **** **** **** 1234\nAuth: 123456',
    style: { fontSize: 10, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Courier' },
    editable: false,
    category: 'customer_only',
    industry_purpose: 'Payment verification and card security'
  },
  {
    type: 'promotions',
    name: 'Promotions',
    icon: MessageSquare,
    content: '🎉 Next visit: 10% off orders over £30\nShow this receipt',
    style: { fontSize: 10, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Arial' },
    editable: true,
    category: 'customer_only',
    industry_purpose: 'Customer retention and repeat business'
  },
  {
    type: 'footer_text',
    name: 'Thank You Message',
    icon: MessageSquare,
    content: 'Thank you for dining with us!\nPlease visit us again soon.',
    style: { fontSize: 10, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Arial' },
    editable: true,
    category: 'customer_only',
    industry_purpose: 'Customer service and professional closure'
  },
  {
    type: 'qr_code',
    name: 'QR Code',
    icon: QrCode, // Use proper QrCode icon
    content: 'https://www.cottagetandoori.co.uk',
    qr_url: 'https://www.cottagetandoori.co.uk',
    qr_size: 80,
    qr_alignment: 'center',
    qr_label: 'Visit our website',
    qr_label_position: 'below',
    style: { fontSize: 10, fontWeight: 'normal', textAlign: 'center', fontFamily: 'Arial' },
    editable: true,
    category: 'customer_only',
    industry_purpose: 'Digital engagement and quick access to online services'
  }
];

export default function FocusedReceiptDesigner({ 
  template,
  onSave,
  onBack,
  onTestPrint,
  onDeploy 
}: FocusedReceiptDesignerProps) {
  const [receiptElements, setReceiptElements] = useState<ReceiptElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80); // Default to 80mm for all templates
  const [templateName, setTemplateName] = useState(template?.name || 'New Receipt Template');
  const [templateDescription, setTemplateDescription] = useState(template?.description || '');
  const [templateType, setTemplateType] = useState<TemplateType>(template?.template_type || 'foh');
  const [showDebugMode, setShowDebugMode] = useState(false); // New debug mode state
  
  // Logo state management
  const [logoImages, setLogoImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  
  // UI state
  const [showAllElements, setShowAllElements] = useState(false);
  const [showIndustryStandards, setShowIndustryStandards] = useState(false);
  
  // @dnd-kit sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end for element reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setReceiptElements((elements) => {
      const oldIndex = elements.findIndex((element) => element.id === active.id);
      const newIndex = elements.findIndex((element) => element.id === over.id);
      
      return arrayMove(elements, oldIndex, newIndex);
    });
    
    toast.success('Element reordered successfully');
  }, []);
  
  // Load logo image from media assets
  const loadLogoImage = useCallback(async (logoId: string) => {
    if (logoImages[logoId] || loadingImages.has(logoId)) {
      return; // Already loaded or loading
    }

    setLoadingImages(prev => new Set(prev).add(logoId));
    
    try {
      const response = await apiClient.get_media_asset({ assetId: logoId });
      const data = await response.json();
      
      if (data.success && data.asset) {
        setLogoImages(prev => ({
          ...prev,
          [logoId]: data.asset.url
        }));
        
        // Update the element with the logo URL
        setReceiptElements(prev => 
          prev.map(el => 
            el.logo_id === logoId 
              ? { ...el, logo_url: data.asset.url }
              : el
          )
        );
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    } finally {
      setLoadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(logoId);
        return newSet;
      });
    }
  }, [logoImages, loadingImages]);

  // Handle logo uploaded
  const handleLogoUploaded = useCallback((logoId: string, url: string) => {
    // Update the selected logo element
    if (selectedElementId) {
      setReceiptElements(prev =>
        prev.map(el =>
          el.id === selectedElementId && el.type === 'logo'
            ? { ...el, logo_id: logoId, logo_url: url, content: `[LOGO: ${logoId.substring(0, 8)}...]` }
            : el
        )
      );
      
      // Cache the image URL
      setLogoImages(prev => ({
        ...prev,
        [logoId]: url
      }));
      
      toast.success('Logo updated successfully!');
    }
  }, [selectedElementId]);

  // Load existing logo images when component mounts or elements change
  useEffect(() => {
    const logoElementsWithIds = receiptElements.filter(
      el => el.type === 'logo' && el.logo_id && !el.logo_url
    );
    
    logoElementsWithIds.forEach(element => {
      if (element.logo_id) {
        loadLogoImage(element.logo_id);
      }
    });
  }, [receiptElements, loadLogoImage]);

  // Get appropriate elements based on template type
  const getAvailableElements = (): Omit<ReceiptElement, 'id' | 'visible'>[] => {
    if (templateType === 'kitchen') {
      // Kitchen templates get kitchen_only + both elements
      const kitchenElements = [...KITCHEN_ELEMENTS];
      const bothElements = CUSTOMER_ELEMENTS.filter(el => el.category === 'both');
      return [...kitchenElements, ...bothElements];
    } else {
      // Customer templates get customer_only + both elements  
      const customerElements = CUSTOMER_ELEMENTS.filter(el => el.category !== 'both');
      const bothElements = CUSTOMER_ELEMENTS.filter(el => el.category === 'both');
      return [...customerElements, ...bothElements];
    }
  };

  // Get smart suggestions based on template type
  const getSmartSuggestions = (): string[] => {
    if (templateType === 'kitchen') {
      return [
        '🍳 Kitchen tickets focus on speed and clarity',
        '⚡ No prices needed - removes distraction',
        '🔤 Use Courier font for better readability',
        '⚠️ Highlight modifications and allergens',
        '⏰ Include timing and table information'
      ];
    } else {
      return [
        '🧾 Customer receipts need full pricing details',
        '🏢 Include branding and contact information',
        '⚖️ VAT compliance is legally required',
        '💳 Show payment confirmation details',
        '🎯 Add promotions for repeat business'
      ];
    }
  };

  // Initialize with existing template elements or empty list
  useEffect(() => {
    if (template && template.canvas_elements) {
      // Convert existing canvas elements to receipt elements
      // For now, start with empty list - we'll add conversion logic later
      setReceiptElements([]);
    }
    
    // Update template type from props
    if (template?.template_type) {
      setTemplateType(template.template_type);
    }
  }, [template]);

  // Update paper width based on template type (industry standard) - REMOVED AUTO-SWITCHING
  // useEffect(() => {
  //   if (templateType === 'kitchen') {
  //     setPaperWidth(58); // Kitchen tickets typically use 58mm for speed
  //   } else {
  //     setPaperWidth(80); // Customer receipts use 80mm for professional appearance
  //   }
  // }, [templateType]);

  const addElement = (elementType: typeof KITCHEN_ELEMENTS[0] | typeof CUSTOMER_ELEMENTS[0]) => {
    // Validate element is appropriate for template type
    if (elementType.category === 'kitchen_only' && templateType !== 'kitchen') {
      toast.error('This element is only available for kitchen tickets');
      return;
    }
    if (elementType.category === 'customer_only' && templateType === 'kitchen') {
      toast.error('This element is only available for customer receipts');
      return;
    }
    // Elements marked as 'both' are allowed in any template type - no validation needed

    const newElement: ReceiptElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...elementType,
      visible: true
    };
    
    setReceiptElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
    toast.success(`Added ${elementType.name} to ${templateType === 'kitchen' ? 'kitchen ticket' : 'customer receipt'}`);
  };

  const removeElement = (elementId: string) => {
    setReceiptElements(prev => prev.filter(el => el.id !== elementId));
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const updateElement = (elementId: string, updates: Partial<ReceiptElement>) => {
    setReceiptElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  const selectedElement = receiptElements.find(el => el.id === selectedElementId);

  const handleSave = () => {
    if (onSave) {
      // Convert receipt elements back to ReceiptTemplate format
      const updatedTemplate: ReceiptTemplate = {
        id: template?.id || `template_${Date.now()}`,
        name: templateName,
        description: templateDescription,
        order_type: template?.order_type || 'collection',
        template_type: templateType, // Save the selected template type
        is_default: template?.is_default || false,
        is_deployed: template?.is_deployed || false,
        canvas_elements: [], // We'll populate this from receiptElements
        layout_settings: {
          paper_width: paperWidth,
          padding_top: templateType === 'kitchen' ? 3 : 5,
          padding_bottom: templateType === 'kitchen' ? 3 : 5,
          padding_left: templateType === 'kitchen' ? 2 : 5,
          padding_right: templateType === 'kitchen' ? 2 : 5,
          background_color: '#FFFFFF' // Pure white background for all templates  
        },
        print_settings: {
          paper_width_mm: paperWidth,
          dpi: 203,
          margins_mm: {
            top: templateType === 'kitchen' ? 1 : 2,
            bottom: templateType === 'kitchen' ? 2 : 5,
            left: templateType === 'kitchen' ? 1 : 2,
            right: templateType === 'kitchen' ? 1 : 2
          },
          cut_at_end: true,
          feed_lines: templateType === 'kitchen' ? 1 : 3 // Less paper waste for kitchen
        },
        grid_settings: template?.grid_settings || {
          show_grid: false,
          grid_density: 'medium',
          snap_to_grid: true,
          show_safe_area: true,
          show_margins: true,
          grid_color: '#E5E7EB',
          safe_area_color: '#10B981',
          margin_color: '#EF4444'
        },
        created_at: template?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: (template?.version || 0) + 1
      };
      
      onSave(updatedTemplate);
      toast.success(`${templateType === 'kitchen' ? 'Kitchen ticket' : 'Customer receipt'} template saved successfully!`);
    }
  };

  const handleTestPrint = () => {
    if (onTestPrint) {
      // Create a test template for printing with proper template type
      const testTemplate: ReceiptTemplate = {
        id: template?.id || `template_${Date.now()}`,
        name: templateName,
        description: templateDescription,
        order_type: template?.order_type || 'collection',
        template_type: templateType, // Include template type in test
        is_default: false,
        is_deployed: false,
        canvas_elements: [],
        layout_settings: {
          paper_width: paperWidth,
          padding_top: templateType === 'kitchen' ? 3 : 5,
          padding_bottom: templateType === 'kitchen' ? 3 : 5,
          padding_left: templateType === 'kitchen' ? 2 : 5,
          padding_right: templateType === 'kitchen' ? 2 : 5,
          background_color: '#FFFFFF' // Pure white background for all templates  
        },
        print_settings: {
          paper_width_mm: paperWidth,
          dpi: 203,
          margins_mm: {
            top: templateType === 'kitchen' ? 1 : 2,
            bottom: templateType === 'kitchen' ? 2 : 5,
            left: templateType === 'kitchen' ? 1 : 2,
            right: templateType === 'kitchen' ? 1 : 2
          },
          cut_at_end: true,
          feed_lines: templateType === 'kitchen' ? 1 : 3
        },
        grid_settings: {
          show_grid: false,
          grid_density: 'medium',
          snap_to_grid: true,
          show_safe_area: true,
          show_margins: true,
          grid_color: '#E5E7EB',
          safe_area_color: '#10B981',
          margin_color: '#EF4444'
        },
        created_at: template?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: (template?.version || 0) + 1
      };
      
      onTestPrint(testTemplate);
    }
  };

  // Industry-standard starter template creation
  const createStarterTemplate = (type: 'kitchen_basic' | 'kitchen_detailed' | 'kitchen_expedite' | 'customer_classic' | 'customer_modern' | 'customer_promotional') => {
    let starterElements: ReceiptElement[] = [];
    
    switch (type) {
      case 'kitchen_basic':
        starterElements = [
          { ...KITCHEN_ELEMENTS[0], id: 'starter_1', visible: true }, // Kitchen Header
          { ...KITCHEN_ELEMENTS[1], id: 'starter_2', visible: true }, // Timing info
          { ...KITCHEN_ELEMENTS[2], id: 'starter_3', visible: true }, // Items no prices
        ];
        break;
      case 'kitchen_detailed':
        starterElements = [
          { ...KITCHEN_ELEMENTS[0], id: 'starter_1', visible: true }, // Kitchen Header
          { ...KITCHEN_ELEMENTS[1], id: 'starter_2', visible: true }, // Timing info
          { ...KITCHEN_ELEMENTS[2], id: 'starter_3', visible: true }, // Items
          { ...KITCHEN_ELEMENTS[3], id: 'starter_4', visible: true }, // Modifications
          { ...KITCHEN_ELEMENTS[4], id: 'starter_5', visible: true }, // Kitchen notes
        ];
        break;
      case 'customer_classic':
        starterElements = [
          { ...CUSTOMER_ELEMENTS[0], id: 'starter_1', visible: true }, // Restaurant name
          { ...CUSTOMER_ELEMENTS[2], id: 'starter_2', visible: true }, // Contact info
          { ...CUSTOMER_ELEMENTS[3], id: 'starter_3', visible: true }, // Date/time
          { ...CUSTOMER_ELEMENTS[5], id: 'starter_4', visible: true }, // Items (Thermal Format) - was [4]
          { ...CUSTOMER_ELEMENTS[6], id: 'starter_5', visible: true }, // Totals - was [5]
          { ...CUSTOMER_ELEMENTS[9], id: 'starter_6', visible: true }, // Thank you - was [8]
        ];
        break;
      case 'customer_modern':
        starterElements = [
          { ...CUSTOMER_ELEMENTS[1], id: 'starter_1', visible: true }, // Logo
          { ...CUSTOMER_ELEMENTS[0], id: 'starter_2', visible: true }, // Restaurant name
          { ...CUSTOMER_ELEMENTS[3], id: 'starter_3', visible: true }, // Date/time
          { ...CUSTOMER_ELEMENTS[5], id: 'starter_4', visible: true }, // Items (Thermal Format) - was [4]
          { ...CUSTOMER_ELEMENTS[6], id: 'starter_5', visible: true }, // Totals - was [5]
          { ...CUSTOMER_ELEMENTS[7], id: 'starter_6', visible: true }, // Payment info - was [6]
          { ...CUSTOMER_ELEMENTS[9], id: 'starter_7', visible: true }, // Thank you - was [8]
        ];
        break;
      case 'customer_promotional':
        starterElements = [
          { ...CUSTOMER_ELEMENTS[0], id: 'starter_1', visible: true }, // Restaurant name
          { ...CUSTOMER_ELEMENTS[5], id: 'starter_2', visible: true }, // Items (Thermal Format) - was [4]
          { ...CUSTOMER_ELEMENTS[6], id: 'starter_3', visible: true }, // Totals - was [5]
          { ...CUSTOMER_ELEMENTS[8], id: 'starter_4', visible: true }, // Promotions - was [7]
          { ...CUSTOMER_ELEMENTS[2], id: 'starter_5', visible: true }, // Contact info
          { ...CUSTOMER_ELEMENTS[9], id: 'starter_6', visible: true }, // Thank you - was [8]
        ];
        break;
    }
    
    setReceiptElements(starterElements);
    if (starterElements.length > 0) {
      setSelectedElementId(starterElements[0].id);
    }
    toast.success(`Applied ${type.replace('_', ' ')} starter template`);
  };

  const updateElementStyle = (styleUpdates: Partial<ReceiptElement['style']>) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      style: { ...selectedElement.style, ...styleUpdates }
    });
  };

  // Helper function to update element properties (for QR codes and other specific fields)
  const updateElementProperty = (property: keyof ReceiptElement, value: any) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, {
      [property]: value
    });
  };

  return (
    <div className="flex h-full w-full gap-3">
      {/* Left Panel: Template Builder */}
      <div className="w-1/4 min-w-[250px] max-w-[350px] flex-shrink-0">
        <Card className="h-full" style={cardStyle}>
          <div className="p-3 h-full flex flex-col">
            {/* Sticky Header */}
            <div className="mb-4 pb-3 border-b border-gray-600">
              <Label className="text-xs text-gray-400 mb-2 block">Template Type</Label>
              <Select value={templateType} onValueChange={(value: TemplateType) => setTemplateType(value)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kitchen">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4" />
                      Kitchen Ticket
                    </div>
                  </SelectItem>
                  <SelectItem value="foh">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      Customer Receipt
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {/* Quick Start Section */}
              <Card className="p-3" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 bg-indigo-500 rounded flex items-center justify-center">
                    <span className="text-xs text-white font-bold">⚡</span>
                  </div>
                  <Label className="text-xs font-medium text-gray-200">Quick Start</Label>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-1">
                    {templateType === 'kitchen' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start text-gray-300 hover:text-white hover:bg-indigo-700/30"
                          onClick={() => createStarterTemplate('kitchen_basic')}
                        >
                          📋 Basic Kitchen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start text-gray-300 hover:text-white hover:bg-indigo-700/30"
                          onClick={() => createStarterTemplate('kitchen_detailed')}
                        >
                          📝 Detailed Kitchen
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start text-gray-300 hover:text-white hover:bg-indigo-700/30"
                          onClick={() => createStarterTemplate('customer_classic')}
                        >
                          🏪 Classic Receipt
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start text-gray-300 hover:text-white hover:bg-indigo-700/30"
                          onClick={() => createStarterTemplate('customer_modern')}
                        >
                          ✨ Modern Receipt
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs justify-start text-gray-300 hover:text-white hover:bg-indigo-700/30"
                          onClick={() => createStarterTemplate('customer_promotional')}
                        >
                          🎉 Promotional
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Build Custom Section */}
              <Card className="p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-4 h-4 text-green-400" />
                  <Label className="text-xs font-medium text-gray-200">Build Custom</Label>
                </div>
                
                <div className="space-y-2">
                  {/* Progressive Element Disclosure */}
                  {getAvailableElements().slice(0, 4).map((element) => {
                    const IconComponent = element.icon;
                    return (
                      <Button
                        key={element.type}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto p-1 text-gray-300 hover:text-white hover:bg-green-700/30"
                        onClick={() => addElement(element)}
                        title={element.industry_purpose}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <IconComponent className="w-4 h-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{element.name}</div>
                          </div>
                          <Plus className="w-3 h-3 flex-shrink-0 opacity-60" />
                        </div>
                      </Button>
                    );
                  })}
                  
                  {/* Show More Elements Toggle */}
                  {getAvailableElements().length > 4 && (
                    <div className="pt-2 border-t border-green-600/30">
                      {!showAllElements ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs text-green-400 hover:text-green-300"
                          onClick={() => setShowAllElements(true)}
                        >
                          + {getAvailableElements().length - 4} more elements
                        </Button>
                      ) : (
                        <div className="space-y-1">
                          {getAvailableElements().slice(4).map((element) => {
                            const IconComponent = element.icon;
                            return (
                              <Button
                                key={element.type}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-left h-auto p-2 text-gray-300 hover:text-white hover:bg-green-700/30"
                                onClick={() => addElement(element)}
                                title={element.industry_purpose}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium truncate">{element.name}</div>
                                  </div>
                                  <Plus className="w-3 h-3 flex-shrink-0 opacity-60" />
                                </div>
                              </Button>
                            );
                          })}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs text-green-400 hover:text-green-300"
                            onClick={() => setShowAllElements(false)}
                          >
                            ← Show less
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Industry Standards Section - Collapsible */}
              <Card className="p-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowIndustryStandards(!showIndustryStandards)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
                      <span className="text-xs text-black font-bold">📋</span>
                    </div>
                    <Label className="text-xs font-medium text-gray-200">Industry Standards</Label>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <span className="text-xs transform transition-transform duration-200" style={{ 
                      transform: showIndustryStandards ? 'rotate(180deg)' : 'rotate(0deg)' 
                    }}>
                      ▼
                    </span>
                  </Button>
                </div>
                
                {showIndustryStandards && (
                  <div className="mt-3 space-y-1">
                    {getSmartSuggestions().map((suggestion, index) => (
                      <div key={index} className="text-xs text-gray-400 leading-relaxed px-1">
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </Card>
      </div>

      {/* Center Panel: Live Receipt Preview */}
      <div className="flex-1 min-w-[350px] max-w-[500px]">
        <Card className="h-full" style={cardStyle}>
          <div className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                {templateType === 'kitchen' ? <ChefHat className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                {templateType === 'kitchen' ? 'Kitchen Ticket Preview' : 'Customer Receipt Preview'}
              </h3>
              
              <div className="flex items-center gap-2">
                {/* Debug Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs transition-colors ${
                    showDebugMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setShowDebugMode(!showDebugMode)}
                  title="Toggle debug information"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Debug
                </Button>
                
                <span className="text-xs text-gray-400">
                  {templateType === 'kitchen' ? '58mm Kitchen' : '80mm Customer'}
                </span>
                <Select value={paperWidth.toString()} onValueChange={(value) => setPaperWidth(parseInt(value) as 58 | 80)}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">58mm</SelectItem>
                    <SelectItem value="80">80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Receipt Paper Simulation */}
            <div className="flex-1 flex justify-center min-h-0">
              <div 
                className={`border rounded-sm shadow-sm overflow-y-auto ${
                  templateType === 'kitchen' 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-white border-gray-200'
                }`}
                style={{
                  width: paperWidth === 58 ? '232px' : '320px', // Scale down for preview
                  maxHeight: '100%',
                  minHeight: '300px'
                }}
              >
                <div className="p-3 space-y-2 text-black">
                  {receiptElements.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {templateType === 'kitchen' ? <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" /> : <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />}
                      <p className="text-xs">
                        {templateType === 'kitchen' 
                          ? 'Add kitchen elements for ticket design' 
                          : 'Add customer elements for receipt design'
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {templateType === 'kitchen' 
                          ? 'Focus: Speed, clarity, no prices' 
                          : 'Focus: Branding, totals, compliance'
                        }
                      </p>
                    </div>
                  ) : (
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={receiptElements.map(el => el.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {receiptElements.map((element) => (
                            <SortableReceiptElement
                              key={element.id}
                              element={element}
                              isSelected={selectedElementId === element.id}
                              onSelect={setSelectedElementId}
                              templateType={templateType}
                              logoImages={logoImages}
                              showDebugMode={showDebugMode}
                              paperWidth={paperWidth}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={handleTestPrint}
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={receiptElements.length === 0}
              >
                <Play className="w-4 h-4 mr-1" />
                Test Print
              </Button>
              <Button 
                onClick={handleSave}
                size="sm" 
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel: Properties Panel */}
      <div className="w-1/4 min-w-[250px] max-w-[350px] flex-shrink-0">
        <Card className="h-full" style={cardStyle}>
          <div className="p-3 h-full overflow-y-auto">
            {!selectedElement ? (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Template Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template-name" className="text-xs text-gray-300">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template-description" className="text-xs text-gray-300">Description</Label>
                    <Textarea
                      id="template-description"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      className="mt-1 text-sm"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with Actions */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-600">
                  <h3 className="text-sm font-semibold text-white">Element Properties</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeElement(selectedElement.id)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Element Info Section */}
                <Card className="p-3" style={{ backgroundColor: 'rgba(55, 65, 81, 0.3)', border: '1px solid rgba(75, 85, 99, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-blue-400" />
                    <Label className="text-xs font-medium text-gray-200">Element Info</Label>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-400">Type</Label>
                      <p className="text-sm text-white">{selectedElement.name}</p>
                    </div>
                    
                    {selectedElement.editable && (
                      <div>
                        <Label htmlFor="element-content" className="text-xs text-gray-400">Content</Label>
                        <Textarea
                          id="element-content"
                          value={selectedElement.content || ''}
                          onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
                          className="mt-1 text-sm h-20"
                          placeholder="Enter element content..."
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="element-visible" className="text-xs text-gray-400">Visible</Label>
                      <Switch
                        id="element-visible"
                        checked={selectedElement.visible}
                        onCheckedChange={(checked) => updateElement(selectedElement.id, { visible: checked })}
                      />
                    </div>
                  </div>
                </Card>

                {/* Logo Upload Section - Only show for logo elements */}
                {selectedElement.type === 'logo' && (
                  <Card className="p-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Image className="w-4 h-4 text-blue-400" />
                      <Label className="text-xs font-medium text-gray-200">Logo Management</Label>
                    </div>
                    
                    <ThermalLogoUploader
                      onLogoUploaded={handleLogoUploaded}
                      currentLogoId={selectedElement.logo_id}
                      paperWidth={paperWidth}
                      logoSize="medium"
                    />
                    
                    {/* Current Logo Preview */}
                    {selectedElement.logo_url && (
                      <div className="mt-3 pt-3 border-t border-blue-600/30">
                        <Label className="text-xs text-gray-400 mb-2 block">Current Logo</Label>
                        <div className="bg-white p-2 rounded border border-gray-600">
                          <img 
                            src={selectedElement.logo_url} 
                            alt="Current Logo"
                            className="max-w-full h-auto mx-auto"
                            style={{
                              maxHeight: '60px',
                              imageRendering: 'pixelated'
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {selectedElement.logo_id?.substring(0, 8)}...
                        </p>
                      </div>
                    )}
                  </Card>
                )}

                {/* Typography Section - Only for non-logo elements */}
                {selectedElement.type !== 'logo' && (
                  <Card className="p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4 text-green-400" />
                      <Label className="text-xs font-medium text-gray-200">Typography</Label>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Primary Typography Controls */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Text Alignment</Label>
                        <div className="flex gap-1">
                          {(['left', 'center', 'right'] as TextAlign[]).map((align) => {
                            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : AlignRight;
                            return (
                              <Button
                                key={align}
                                variant={selectedElement.style?.textAlign === align ? 'default' : 'ghost'}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => updateElement(selectedElement.id, {
                                  style: { ...selectedElement.style, textAlign: align }
                                })}
                              >
                                <Icon className="w-4 h-4" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="font-size" className="text-xs text-gray-400">Size</Label>
                          <Input
                            id="font-size"
                            type="number"
                            min="8"
                            max="24"
                            value={selectedElement.style?.fontSize || 12}
                            onChange={(e) => updateElementStyle({ fontSize: parseInt(e.target.value) })}
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="font-weight" className="text-xs text-gray-400">Weight</Label>
                          <Select 
                            value={selectedElement.style?.fontWeight || 'normal'} 
                            onValueChange={(value) => updateElementStyle({ fontWeight: value as FontWeight })}
                          >
                            <SelectTrigger className="mt-1 h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Progressive Font Selection */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Font Family</Label>
                        <div className="space-y-2">
                          {/* Current Font Display */}
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-600 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-white font-medium">{selectedElement.style?.fontFamily || 'Courier'}</p>
                              <p className="text-xs text-gray-400">Current selection</p>
                            </div>
                            <FontSelectorModal 
                              selectedFont={selectedElement.style?.fontFamily || 'Courier'}
                              onFontChange={(font) => {
                                console.log('🎯 Font change callback triggered with:', font);
                                console.log('🎯 Selected element:', selectedElement.id);
                                console.log('🎯 Current style:', selectedElement.style);
                                
                                try {
                                  const currentFont = THERMAL_FONTS.find(f => f.family === font);
                                  console.log('🎯 Found current font object:', currentFont);
                                  
                                  // Add fallback if font not found
                                  const optimalSize = currentFont 
                                    ? getOptimalFontSize(currentFont, templateType) 
                                    : (selectedElement.style?.fontSize || 12);
                                  console.log('🎯 Calculated optimal size:', optimalSize);
                                  
                                  const updateData = {
                                    style: { 
                                      ...selectedElement.style, 
                                      fontFamily: font,
                                      fontSize: optimalSize
                                    }
                                  };
                                  console.log('🎯 About to update element with:', updateData);
                                  
                                  // Call updateElement and log result
                                  updateElement(selectedElement.id, updateData);
                                  console.log('✅ Font change completed successfully');
                                  
                                } catch (error) {
                                  console.error('❌ Error in font change callback:', error);
                                  console.error('❌ Error details:', error.message, error.stack);
                                  
                                  // Fallback: just update font family without optimal size
                                  try {
                                    console.log('🔄 Attempting fallback font update...');
                                    updateElement(selectedElement.id, {
                                      style: { 
                                        ...selectedElement.style, 
                                        fontFamily: font
                                      }
                                    });
                                    console.log('✅ Fallback font change completed');
                                  } catch (fallbackError) {
                                    console.error('❌ Fallback also failed:', fallbackError);
                                  }
                                }
                              }}
                              templateType={templateType}
                              elementType={(() => {
                                switch (selectedElement.type) {
                                  case 'header_text': return 'header';
                                  case 'order_items': return 'items';
                                  case 'totals': return 'totals';
                                  case 'footer_text': return 'footer';
                                  default: return 'notes';
                                }
                              })()}
                              paperWidth={paperWidth as 58 | 80}
                            />
                          </div>

                          {/* Quick Font Presets */}
                          <div>
                            <Label className="text-xs text-gray-400 mb-1 block">Quick Presets</Label>
                            <div className="grid grid-cols-2 gap-1">
                              {templateType === 'kitchen' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs justify-start"
                                    onClick={() => updateElement(selectedElement.id, {
                                      style: { ...selectedElement.style, fontFamily: 'JetBrains Mono' }
                                    })}
                                  >
                                    📝 JetBrains
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs justify-start"
                                    onClick={() => updateElement(selectedElement.id, {
                                      style: { ...selectedElement.style, fontFamily: 'Courier' }
                                    })}
                                  >
                                    🖥️ Courier
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs justify-start"
                                    onClick={() => updateElement(selectedElement.id, {
                                      style: { ...selectedElement.style, fontFamily: 'Inter' }
                                    })}
                                  >
                                    ✨ Inter
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs justify-start"
                                    onClick={() => updateElement(selectedElement.id, {
                                      style: { ...selectedElement.style, fontFamily: 'Arial' }
                                    })}
                                  >
                                    📄 Arial
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Thermal Configuration Section - Only for thermal receipt elements */}
                {selectedElement.thermal_config && (selectedElement.type === 'order_items_thermal' || selectedElement.type === 'order_items_kitchen_priced') && (
                  <Card className="p-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-blue-400" />
                      <Label className="text-xs font-medium text-gray-200">Professional Formatting</Label>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Fill Style Toggle */}
                      <div>
                        <Label className="text-xs text-gray-400 mb-2 block">Price Column Fill Style</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={selectedElement.thermal_config?.fill_style === 'dots' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs justify-start"
                            onClick={() => updateElement(selectedElement.id, {
                              thermal_config: {
                                ...selectedElement.thermal_config!,
                                fill_style: 'dots'
                              }
                            })}
                          >
                            ••• Dot Leaders
                          </Button>
                          <Button
                            variant={selectedElement.thermal_config?.fill_style === 'spaces' ? 'default' : 'ghost'}
                            size="sm"
                            className="h-8 text-xs justify-start"
                            onClick={() => updateElement(selectedElement.id, {
                              thermal_config: {
                                ...selectedElement.thermal_config!,
                                fill_style: 'spaces'
                              }
                            })}
                          >
                            ⎯⎯⎯ Space Padding
                          </Button>
                        </div>
                        
                        <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600">
                          <p className="text-xs text-gray-400 mb-1">Preview Example:</p>
                          <div className="font-mono text-xs text-gray-300">
                            {selectedElement.thermal_config?.fill_style === 'dots' 
                              ? '1x Chicken Tikka Masala.........£9.50'
                              : '1x Chicken Tikka Masala       £9.50'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Industry Validation Warnings */}
                {((templateType === 'kitchen' && selectedElement.type === 'totals') || 
                  (templateType === 'foh' && selectedElement.type === 'modifications')) && (
                  <Card className="p-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <div className="text-xs">
                        {templateType === 'kitchen' && selectedElement.type === 'totals' && (
                          <p className="text-yellow-300">Kitchen tickets typically don't show pricing totals</p>
                        )}
                        {templateType === 'foh' && selectedElement.type === 'modifications' && (
                          <p className="text-blue-300">Customer receipts may show modifications differently than kitchen tickets</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {/* QR Code Specific Properties */}
                {selectedElement.type === 'qr_code' && (
                  <>
                    <Separator className="bg-gray-600" />
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-green-400">QR Code Settings</Label>
                      
                      {/* QR URL */}
                      <div>
                        <Label className="text-xs text-gray-400">URL</Label>
                        <Input
                          value={selectedElement.qr_url || ''}
                          onChange={(e) => updateElementProperty('qr_url', e.target.value)}
                          placeholder="https://www.cottagetandoori.co.uk"
                          className="h-8 text-xs bg-gray-800 border-gray-600"
                        />
                      </div>
                      
                      {/* QR Size */}
                      <div>
                        <Label className="text-xs text-gray-400">Size (px)</Label>
                        <Input
                          type="number"
                          value={selectedElement.qr_size || 80}
                          onChange={(e) => updateElementProperty('qr_size', parseInt(e.target.value))}
                          className="h-8 text-xs bg-gray-800 border-gray-600"
                          min="40"
                          max="200"
                        />
                      </div>
                      
                      {/* QR Alignment */}
                      <div>
                        <Label className="text-xs text-gray-400">Alignment</Label>
                        <Select
                          value={selectedElement.qr_alignment || 'center'}
                          onValueChange={(value) => updateElementProperty('qr_alignment', value as 'left' | 'center' | 'right')}
                        >
                          <SelectTrigger className="h-8 text-xs bg-gray-800 border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* QR Label */}
                      <div>
                        <Label className="text-xs text-gray-400">Label Text (Optional)</Label>
                        <Input
                          value={selectedElement.qr_label || ''}
                          onChange={(e) => updateElementProperty('qr_label', e.target.value)}
                          placeholder="Scan for menu"
                          className="h-8 text-xs bg-gray-800 border-gray-600"
                        />
                      </div>
                      
                      {/* Label Position */}
                      {selectedElement.qr_label && (
                        <div>
                          <Label className="text-xs text-gray-400">Label Position</Label>
                          <Select
                            value={selectedElement.qr_label_position || 'below'}
                            onValueChange={(value) => updateElementProperty('qr_label_position', value as 'above' | 'below')}
                          >
                            <SelectTrigger className="h-8 text-xs bg-gray-800 border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="above">Above QR Code</SelectItem>
                              <SelectItem value="below">Below QR Code</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
