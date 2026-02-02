/**
 * ThermalReceiptDesignerV2 - Type Definitions
 * Core interfaces for receipt designer V2 architecture
 */

// ==================== QR Code Configuration ====================

export interface QRCodeConfig {
  id: string;
  type: 'url' | 'wifi' | 'contact' | 'text';
  content: string;
  size: 'small' | 'medium' | 'large'; // Changed from number to string enum
  position: 'left' | 'center' | 'right'; // Changed from 'header'|'footer' to alignment
  placement?: 'header' | 'footer'; // Optional - for backward compatibility
  enabled?: boolean;
  caption?: string; // Optional text displayed below the QR code
}

// ==================== Order Item Configuration ====================

export interface OrderItemVariant {
  id: string;
  name: string;
  price_adjustment: number;
  protein_type?: string;
}

export interface OrderItemCustomization {
  id: string;
  customization_id?: string;
  name: string;
  price_adjustment: number;
  category?: string;
  group?: string;
  is_free?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  variant?: OrderItemVariant;
  customizations?: OrderItemCustomization[];
  total: number;
  instructions?: string;
  notes?: string;
  // Full variant display name with name_pattern applied (e.g., "CHICKEN Tikka Masala")
  variantName?: string;
  // Optional shortened name for kitchen receipts (from menu_items.kitchen_display_name)
  kitchen_display_name?: string | null;
  // Category tracking for receipt section organization
  category_id?: string;
  menu_item_id?: string;
  category_name?: string;
  // Display order for sorting items within sections on receipts
  display_order?: number;
  // Customer grouping for DINE-IN receipts
  customer_id?: string | null;
  customer_name?: string | null;
  // Protein type at item level (in addition to variant)
  protein_type?: string | null;
}

// ==================== Customer Tab (Dine-In Split Billing) ====================

export interface CustomerTabInfo {
  tabName: string;
  items: OrderItem[];
}

// ==================== Receipt Format Types ====================

export type ReceiptFormat = 'front_of_house' | 'kitchen_customer';
// OrderMode must match database order_type_enum (uppercase underscore format)
export type OrderMode = 'DINE_IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY';
export type OrderSource = 'POS' | 'ONLINE' | 'AI_VOICE';
export type OrderType = 'dine_in' | 'collection' | 'delivery' | 'waiting' | 'online_orders';
export type DineInTemplateType = 'kitchen_copy' | 'final_bill';
export type LogoPosition = 'left' | 'center' | 'right';
export type PaymentMethod = 'cash' | 'card' | 'online';

// ==================== Form Data (Main State) ====================

export interface FormData {
  // Business Information
  businessName: string;
  businessNameFont: string;  // CMS font ID for business name (e.g., 'old-english', 'playfair-display')
  businessNameFontSize: number;  // Font size in pixels for business name (default: 18)
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;

  // Visibility Toggles
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showVatNumber: boolean;
  showCategorySubheadings: boolean;

  // Logo
  logoFile: File | null;
  logoUrl: string;
  logoImage?: string;
  logoPosition: LogoPosition;
  logoWidth: number;
  logoHeight: number;

  // QR Codes
  qrCodes: QRCodeConfig[];
  headerQRCodes?: QRCodeConfig[];  // Separate header QR codes
  footerQRCodes?: QRCodeConfig[];  // Separate footer QR codes

  // Receipt Format
  receiptFormat: ReceiptFormat;

  // Font System
  selectedFont?: string;
  useItemsFont: boolean;
  useItemsThermalFont?: boolean;  // Alias for thermal font on items
  receiptFont: string;
  itemsFont: string;

  // Order Information
  orderType: OrderType;
  receiptNumber: string;
  orderDate: string;
  orderTime: string;
  orderSource: OrderSource;
  orderMode: OrderMode;

  // Dine-In Fields
  tableNumber: string;
  guestCount: number;
  dineInTemplateType: DineInTemplateType;
  linkedTables: number[];           // Linked table numbers (e.g., [1, 2, 3] for merged tables)
  customerTabs: CustomerTabInfo[];  // Customer tabs for split billing

  // Customer Details
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryPostcode: string;         // Separate postcode for emphasis on receipts
  deliveryDistance: string;         // Distance from restaurant (e.g., "2.5 miles")
  deliveryNotes: string;            // Driver instructions (e.g., "Ring doorbell twice")

  // Timing
  collectionTime: string;
  estimatedDeliveryTime: string;
  preparationTime: string;

  // Special Instructions
  specialInstructions: string;

  // Items
  orderItems: OrderItem[];

  // Totals
  vatRate: number;
  serviceCharge: number;
  deliveryFee: number;
  discount: number;
  discountPercentage: number;
  subtotal: number;
  paymentMethod: string;
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';

  // Kitchen Copy Options (for takeaway modes)
  showKitchenTotals?: boolean;          // Show totals on kitchen copy for takeaway
  showContainerQtyField?: boolean;      // Show Container/Item QTY checkbox box
  showCheckedField?: boolean;           // Show Checked verification box

  // Kitchen Section Visibility (true = show on kitchen ticket, undefined = use default)
  kitchenShowHeader?: boolean;          // Default: false - Hide header text on kitchen
  kitchenShowBusinessInfo?: boolean;    // Default: false - Hide business name/address on kitchen
  kitchenShowLogo?: boolean;            // Default: false - Hide logo on kitchen
  kitchenShowQRCodes?: boolean;         // Default: false - Hide QR codes on kitchen
  kitchenShowOrderInfo?: boolean;       // Default: true - Show order #/date/time on kitchen
  kitchenShowTableInfo?: boolean;       // Default: true - Show table #/covers/linked tables
  kitchenShowCustomerDetails?: boolean; // Default: false (true for delivery)
  kitchenShowTiming?: boolean;          // Default: true - Show collection/delivery time
  kitchenShowSpecialInstructions?: boolean; // Default: true - Always show special instructions
  kitchenShowTotals?: boolean;          // Default: depends on order mode (false for dine-in)
  kitchenShowFooter?: boolean;          // Default: false - Hide footer on kitchen

  // Header Text
  headerText?: string;  // Custom header text/welcome message

  // Footer
  footerMessage: string;
  terms: string;
  socialMedia: string;
  customFooterText: string;
  showCustomFooter: boolean;
}

// ==================== Template Metadata ====================

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  template_type: string;
  order_types?: string[];
  tags?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: string;
}

export interface Template {
  id: string;
  metadata: TemplateMetadata;
  design_data: FormData;
  paper_width?: number;
  parent_template_id?: string | null; // Links kitchen variants to parent customer template
}

// ==================== Store State ====================

export type TabValue = 'business' | 'header' | 'order' | 'items' | 'footer' | 'advanced';

export interface ReceiptDesignerState {
  // Form Data
  formData: FormData;
  
  // UI State
  activeTab: TabValue;
  formatToggle: ReceiptFormat;
  paperWidth: number;
  
  // Loading States
  isLoading: boolean;
  isSaving: boolean;
  isLoadingTemplates: boolean;
  
  // Template State
  currentTemplate: Template | null;
  templatesList: Template[];
  
  // Unsaved Changes
  hasUnsavedChanges: boolean;
  
  // Actions
  updateFormData: (updates: Partial<FormData>) => void;
  setActiveTab: (tab: TabValue) => void;
  toggleFormat: () => void;
  setFormatToggle: (format: ReceiptFormat) => void;
  setPaperWidth: (width: number) => void;
  
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsLoadingTemplates: (loading: boolean) => void;
  
  setCurrentTemplate: (template: Template | null) => void;
  setTemplatesList: (templates: Template[]) => void;
  
  loadTemplate: (template: Template) => void;
  resetForm: () => void;
  markAsSaved: () => void;
}

// ==================== Service Layer Types ====================

export interface FetchTemplatesParams {
  userId: string;
  active_only?: boolean;
}

export interface SaveTemplateParams {
  userId: string;
  metadata: Omit<TemplateMetadata, 'id' | 'created_at' | 'updated_at'>;
  design_data: FormData;
  paper_width?: number;
}

export interface UpdateTemplateParams {
  templateId: string;
  userId: string;
  metadata?: Partial<TemplateMetadata>;
  design_data?: Partial<FormData>;
  paper_width?: number;
}

// ==================== Component Props ====================

export interface ReceiptPreviewProps {
  formData: FormData;
  formatToggle: ReceiptFormat;
  paperWidth: number;
  isLoading?: boolean;
}

export interface QuickActionsPanelProps {
  onSave: () => void;
  onDuplicate: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
}

export interface EmptyStateCardProps {
  onCreateBlank: () => void;
  onLoadFromLibrary: () => void;
  hasExistingTemplates?: boolean;  // Controls first-time user vs returning user UX
}

export interface ReceiptDesignerHeaderProps {
  currentTemplate: Template | null;
  templatesList: Template[];
  onTemplateSelect: (templateId: string) => void;
  onSave: () => void;
  onDuplicate: () => void;
  onDelete: () => void; // Add delete handler
  onExport: () => void;
  onShowAssignments: () => void;
  hasUnsavedChanges: boolean;
  onBrowseTemplates: () => void;
}

// ==================== Default Values ====================

export const DEFAULT_FORM_DATA: FormData = {
  // Business Information
  businessName: 'Cottage Tandoori Restaurant',
  businessNameFont: 'old-english',  // Default to Old English matching CMS default
  businessNameFontSize: 18,  // Default 18px for prominent header
  vatNumber: 'GB123456789',
  address: '123 High Street, London, SW1A 1AA',
  phone: '020 7123 4567',
  email: 'orders@cottagetandoori.co.uk',
  website: 'www.cottagetandoori.co.uk',

  // Visibility
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showVatNumber: true,
  showCategorySubheadings: true,

  // Logo
  logoFile: null,
  logoUrl: '',
  logoImage: '',
  logoPosition: 'center',
  logoWidth: 100,
  logoHeight: 100,

  // QR Codes
  qrCodes: [],
  headerQRCodes: [],
  footerQRCodes: [],

  // Header Text
  headerText: 'Welcome to Cottage Tandoori',

  // Receipt Format
  receiptFormat: 'front_of_house',

  // Fonts
  selectedFont: 'Inter',
  useItemsFont: false,
  receiptFont: 'Inter',
  itemsFont: 'JetBrains Mono',

  // Order Info
  orderType: 'dine_in',
  receiptNumber: `CT${Date.now().toString().slice(-6)}`,
  orderDate: new Date().toISOString().split('T')[0],
  orderTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  orderSource: 'POS',
  orderMode: 'DINE_IN',

  // Dine-In
  tableNumber: '',
  guestCount: 0,
  dineInTemplateType: 'kitchen_copy',
  linkedTables: [],
  customerTabs: [],

  // Customer
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deliveryAddress: '',
  deliveryPostcode: '',
  deliveryDistance: '',
  deliveryNotes: '',

  // Timing
  collectionTime: 'ASAP',
  estimatedDeliveryTime: '',
  preparationTime: '15-20 mins',

  // Special Instructions
  specialInstructions: '',

  // Items
  orderItems: [],

  // Totals
  vatRate: 20,
  serviceCharge: 0,
  deliveryFee: 0,
  discount: 0,
  discountPercentage: 0,
  subtotal: 0,
  paymentMethod: 'cash',
  paymentStatus: undefined,

  // Kitchen Copy Options (defaults ON for takeaway)
  showKitchenTotals: true,           // Drivers need bill amount for cash collection
  showContainerQtyField: true,       // Staff writes item count after packing
  showCheckedField: true,            // Second staff confirms items checked

  // Kitchen Section Visibility (sensible defaults for simplified kitchen tickets)
  kitchenShowHeader: false,          // Kitchen doesn't need header text
  kitchenShowBusinessInfo: false,    // Kitchen doesn't need business details
  kitchenShowLogo: false,            // Kitchen doesn't need logo
  kitchenShowQRCodes: false,         // Kitchen doesn't need QR codes
  kitchenShowOrderInfo: true,        // Show order #/date/time for tracking
  kitchenShowTableInfo: true,        // Show table #/covers/linked tables
  kitchenShowCustomerDetails: false, // Default off, but delivery should show address
  kitchenShowTiming: true,           // Show collection/delivery time
  kitchenShowSpecialInstructions: true, // Always show special instructions
  kitchenShowTotals: false,          // Default off for dine-in (FOH handles billing)
  kitchenShowFooter: false,          // Kitchen doesn't need footer

  // Footer
  footerMessage: 'Thank you for your order!',
  terms: 'All prices include VAT. Service charge is optional.',
  socialMedia: 'Follow us @cottagetandoori',
  customFooterText: 'Service Charge not Included',
  showCustomFooter: false
};
