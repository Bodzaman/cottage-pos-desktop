import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download, Eye, EyeOff, FileText, Settings, Zap, Hash, Star, Clock, Coffee, Utensils, Phone, MapPin, DollarSign, User, Upload, Save, RefreshCw, Trash2, CheckCircle, X, ChevronDown, ShoppingCart, Plus, Minus, Undo2, Redo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ThermalPreview from 'components/ThermalPreview';
import ThermalReceiptMenuModal from 'components/ThermalReceiptMenuModal';
import ImageUploadDithering from 'components/ImageUploadDithering';
import QRCodeFormBuilder from 'components/QRCodeFormBuilder';
import ElementLibrary from 'components/ElementLibrary';
import TemplateManagementModal from 'components/TemplateManagementModal';
import { QSAITheme, styles } from 'utils/QSAIDesign';
import { useThermalReceiptStore } from 'utils/thermalReceiptStore';
import { THERMAL_FONTS, injectGoogleFonts } from 'utils/thermalFonts';
import brain from 'brain';
import { SaveTemplateDialog } from 'components/SaveTemplateDialog';

interface QRCodeConfig {
  id: string;
  title: string;
  content: string;
  size: number;
  position: 'header' | 'footer';
  placement: 'left' | 'center' | 'right';
}

// Enhanced OrderItem interface with detailed variant and customization support
interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  quantity: number;
  
  // Enhanced variant support with detailed pricing
  variant?: {
    id: string;
    name: string;
    price_adjustment: number; // e.g., +2.50 for large size, 0 for regular
    protein_type?: string; // For dishes with protein variants
  };
  
  // Enhanced customizations with individual pricing
  customizations?: Array<{
    id: string;
    name: string;
    price: number; // Individual add-on price
    category: string; // e.g., "spice", "extras", "sauces", "sides"
    is_free?: boolean; // Mark free customizations like spice level
  }>;
  
  // Modifiers for backwards compatibility (deprecated)
  modifiers?: Array<{
    name: string;
    price: number;
  }>;
  
  total: number;
  instructions?: string;
  notes?: string; // Alternative field name for special instructions
}

interface FormData {
  // Business Information
  businessName: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  
  // Business Details Visibility Toggles
  showPhone: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showVatNumber: boolean;
  
  // Logo
  logoFile: File | null;
  logoUrl: string;
  logoImage?: string; // Add this field for the thermal optimized image
  logoPosition: 'left' | 'center' | 'right';
  logoWidth: number;
  logoHeight: number;
  
  // Unified QR Codes with placement controls
  qrCodes: QRCodeConfig[];
  
  // Receipt Format System
  receiptFormat: 'front_of_house' | 'kitchen_customer';
  
  // Font System - Enhanced with section-specific control
  selectedFont?: string; // Legacy support - receipt font when not using separate fonts
  useItemsFont: boolean; // Toggle for separate fonts
  receiptFont: string; // Font for header, footer, general content
  itemsFont: string; // Font for order items section only
  
  // Order Information
  orderType: 'dine_in' | 'collection' | 'delivery' | 'waiting' | 'ai_orders' | 'online_orders';
  receiptNumber: string;
  orderDate: string;
  orderTime: string;
  
  // Enhanced Order Source Tracking for POS Integration
  orderSource: 'POS' | 'ONLINE' | 'AI_VOICE';
  
  // Enhanced Order Mode Support (matching thermal printer engine)
  orderMode: 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY';
  
  // Dine-In Specific Fields
  tableNumber: string;
  guestCount: number;
  dineInTemplateType: 'kitchen_copy' | 'final_bill';
  
  // Enhanced Customer Details for Supabase Integration
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;

  // Collection and Delivery Times
  collectionTime: string;
  estimatedDeliveryTime: string;
  preparationTime: string;

  // Special Instructions
  specialInstructions: string;

  // Items (will be handled by MenuItemPicker)
  orderItems: OrderItem[];
  
  // Totals
  vatRate: number;
  serviceCharge: number;
  deliveryFee: number;
  discount: number;
  paymentMethod: string;
  
  // Footer
  footerMessage: string;
  terms: string;
  socialMedia: string;
  customFooterText: string;
  showCustomFooter: boolean;
}

// Create smart defaults from restaurant settings
const createSmartDefaults = async (): Promise<Partial<FormData>> => {
  try {
    console.log('📊 Fetching restaurant settings for smart defaults...');
    const response = await brain.get_restaurant_settings();
    const data = await response.json();
    
    if (data.success && data.settings?.business_profile) {
      const profile = data.settings.business_profile;
      console.log('✅ Restaurant profile loaded:', profile);
      
      return {
        businessName: profile.name || 'Cottage Tandoori Restaurant',
        address: profile.address && profile.postcode 
          ? `${profile.address}, ${profile.postcode}` 
          : '123 High Street, London, SW1A 1AA',
        phone: profile.phone || '020 7123 4567',
        email: profile.email || 'orders@cottagetandoori.co.uk',
        website: profile.website || 'www.cottagetandoori.co.uk',
        vatNumber: profile.taxId || 'GB123456789'
      };
    }
  } catch (error) {
    console.warn('⚠️ Failed to load restaurant settings for smart defaults:', error);
  }
  
  // Return fallback defaults if API fails
  return {
    businessName: 'Cottage Tandoori Restaurant',
    address: '123 High Street, London, SW1A 1AA',
    phone: '020 7123 4567',
    email: 'orders@cottagetandoori.co.uk',
    website: 'www.cottagetandoori.co.uk',
    vatNumber: 'GB123456789'
  };
};

const initialFormData: FormData = {
  businessName: 'Cottage Tandoori Restaurant',
  address: '123 High Street, London, SW1A 1AA',
  phone: '+44 20 1234 5678',
  email: 'info@cottagetandoori.co.uk',
  website: 'www.cottagetandoori.co.uk',
  vatNumber: 'GB123456789',
  showPhone: true,
  showEmail: true,
  showWebsite: true,
  showVatNumber: true,
  logoFile: null,
  logoUrl: '',
  logoImage: '',
  logoPosition: 'center',
  logoWidth: 100,
  logoHeight: 100,
  qrCodes: [],
  orderType: 'dine_in',
  receiptNumber: 'CT418734',
  orderDate: new Date().toISOString().split('T')[0],
  orderTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  orderSource: 'POS',
  
  // Enhanced Order Mode Support (matching thermal printer engine)
  orderMode: 'DINE-IN',

  // Dine-In Specific Fields
  tableNumber: '',
  guestCount: 0,
  dineInTemplateType: 'kitchen_copy',

  // Enhanced Customer Details for Supabase Integration
  customerName: '',
  customerPhone: "",
  customerEmail: "",
  deliveryAddress: "",
  
  // Collection and Delivery Times
  collectionTime: 'ASAP',
  estimatedDeliveryTime: '30-45 mins',
  preparationTime: '15-20 mins',
  
  specialInstructions: '',
  orderItems: [],
  vatRate: 20,
  serviceCharge: 0,
  deliveryFee: 0,
  discount: 0,
  discountPercentage: 0, // Add missing property
  subtotal: 0, // Add missing property
  paymentMethod: 'cash',
  footerMessage: 'Thank you for your order!',
  terms: 'All prices include VAT. Service charge is optional.',
  socialMedia: 'Follow us @cottagetandoori',
  customFooterText: 'Service Charge not Included',
  showCustomFooter: false,
  receiptFormat: 'front_of_house' as ReceiptFormat,
  selectedFont: 'Inter',
  useItemsFont: false,
  receiptFont: 'Inter',
  itemsFont: 'JetBrains Mono'
};

// Add debounce utility and performance optimizations
const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Performance-optimized auto-save hook
const useAutoSave = (data: any, key: string, delay: number = 2000) => {
  const debouncedData = useDebounce(data, delay);
  
  useEffect(() => {
    if (debouncedData && Object.keys(debouncedData).length > 0) {
      try {
        localStorage.setItem(`autosave_${key}`, JSON.stringify({
          data: debouncedData,
          timestamp: Date.now()
        }));
        console.log('✅ Auto-saved to localStorage');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [debouncedData, key]);
};

// Add history management interface
interface HistoryState {
  formData: FormData;
  timestamp: number;
  action: string;
}

// Add useHistory hook for undo/redo functionality
const useHistory = (initialState: FormData) => {
  const [history, setHistory] = useState<HistoryState[]>([{
    formData: initialState,
    timestamp: Date.now(),
    action: 'Initial state'
  }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxHistorySize = 30;

  const addToHistory = useCallback((formData: FormData, action: string) => {
    setHistory(prev => {
      const newState = {
        formData: JSON.parse(JSON.stringify(formData)), // Deep clone
        timestamp: Date.now(),
        action
      };
      
      // Remove any future history if we're not at the end
      const truncatedHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      const newHistory = [...truncatedHistory, newState];
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });
    
    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistorySize - 1);
      return newIndex;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1].formData;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1].formData;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState: history[currentIndex]?.formData,
    historyLength: history.length
  };
};

export default function ThermalReceiptDesigner() {
  // State management
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true); // Loading state for smart defaults
  const [activeTab, setActiveTab] = useState('business');
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showQRBuilder, setShowQRBuilder] = useState(false);
  const [showElementLibrary, setShowElementLibrary] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState<'header' | 'footer'>('header');
  const [paperWidth, setPaperWidth] = useState(80); // 80mm thermal paper width
  const [receiptMode, setReceiptMode] = useState<'front_of_house' | 'kitchen_customer'>('front_of_house');
  
  // Initialize history management
  const {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    currentState,
    historyLength
  } = useHistory(initialFormData);
  
  // Validation and saving state
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Format toggle for live preview
  const [formatToggle, setFormatToggle] = useState<'front_of_house' | 'kitchen_customer'>('front_of_house');

  // Enhanced form data updater with history tracking
  const updateFormDataWithHistory = useCallback((newFormData: FormData | ((prev: FormData) => FormData), action?: string) => {
    setFormData(prev => {
      const updated = typeof newFormData === 'function' ? newFormData(prev) : newFormData;
      
      // Add to history with a small delay to avoid too many history entries
      setTimeout(() => {
        addToHistory(updated, action || 'Form update');
      }, 100);
      
      return updated;
    });
  }, [addToHistory]);

  // Handle undo/redo
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setFormData(previousState);
      toast.success('Undo successful');
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setFormData(nextState);
      toast.success('Redo successful');
    }
  }, [redo]);

  // Load smart defaults on component mount
  useEffect(() => {
    const loadSmartDefaults = async () => {
      setIsLoadingDefaults(true);
      try {
        const smartDefaults = await createSmartDefaults();
        setFormData(prev => ({
          ...prev,
          ...smartDefaults
        }));
        console.log('✅ Smart defaults applied successfully');
      } catch (error) {
        console.error('❌ Error loading smart defaults:', error);
        // formData already has fallback values from initialFormData
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadSmartDefaults();
  }, []);

  // Modal state for ThermalReceiptMenuModal
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  
  // Template Management States
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState('custom');
  const [templateType, setTemplateType] = useState('customer_receipt');
  
  // Collapsible section states
  const [isBusinessDetailsOpen, setIsBusinessDetailsOpen] = useState(true);
  const [isQRCodesOpen, setIsQRCodesOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // Load templates on component mount
  useEffect(() => {
    loadSavedTemplates();
  }, []);
  
  // Template API Functions
  const loadSavedTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      // TODO: Update when brain client is regenerated with thermal template endpoints
      // For now, use local storage as fallback
      const localTemplates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('thermal_template_')) {
          try {
            const template = JSON.parse(localStorage.getItem(key) || '{}');
            localTemplates.push({
              id: key.replace('thermal_template_', ''),
              metadata: {
                name: template.name || 'Unnamed Template',
                description: template.description || '',
                category: 'custom',
                template_type: 'customer_receipt'
              },
              data: template.formData || {},
              created_at: template.createdAt || new Date().toISOString()
            });
          } catch (e) {
            console.log('Error parsing template:', e);
          }
        }
      }
      setSavedTemplates(localTemplates);
      
      // Eventually will be:
      // const response = await brain.list_thermal_templates({ active_only: true });
      // const data = await response.json();
      // setSavedTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading templates');
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      setIsSaving(true);
      
      // For now, save to localStorage until brain client is updated
      const templateData = {
        name: templateName,
        description: templateDescription,
        formData: formData,
        category: templateCategory,
        templateType: templateType,
        createdAt: new Date().toISOString(),
        paperWidth: paperWidth
      };
      
      const templateKey = `thermal_template_${Date.now()}`;
      localStorage.setItem(templateKey, JSON.stringify(templateData));
      
      toast.success(`Template '${templateName}' saved successfully!`);
      setTemplateName('');
      setTemplateDescription('');
      setIsTemplateModalOpen(false);
      await loadSavedTemplates(); // Refresh template list
      
      // Eventually will be:
      // const requestData = {
      //   metadata: {
      //     name: templateName,
      //     description: templateDescription || '',
      //     category: templateCategory,
      //     template_type: templateType,
      //     order_types: [formData.orderType],
      //     tags: []
      //   },
      //   data: convertFormDataToBackendFormat(formData, paperWidth),
      //   created_by: 'thermal_designer'
      // };
      // const response = await brain.create_thermal_template(requestData);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error saving template');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLoadTemplate = (templateData: any) => {
    try {
      // Merge template data with current form data
      setFormData(prev => ({
        ...prev,
        ...templateData
      }));
      toast.success('Template loaded successfully!');
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    }
  };
  
  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      // For now, duplicate in localStorage
      const originalKey = `thermal_template_${templateId}`;
      const originalData = JSON.parse(localStorage.getItem(originalKey) || '{}');
      
      if (originalData.name) {
        const duplicateData = {
          ...originalData,
          name: `${originalData.name} (Copy)`,
          createdAt: new Date().toISOString()
        };
        
        const newKey = `thermal_template_${Date.now()}`;
        localStorage.setItem(newKey, JSON.stringify(duplicateData));
        
        toast.success('Template duplicated successfully!');
        await loadSavedTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Error duplicating template');
    }
  };
  
  const handleExportReceipt = () => {
    const receiptData = {
      ...formData,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(receiptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${formData.receiptNumber || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt exported successfully!');
  };

  const loadSampleData = () => {
    setFormData(prev => ({
      ...prev,
      businessName: 'Cottage Tandoori Restaurant',
      vatNumber: 'GB123456789',
      address: '25 West St, Storrington\nPulborough, West Sussex\nRH20 4DZ',
      phone: '01903 742 478',
      email: 'orders@cottagetandoori.co.uk',
      website: 'www.cottagetandoori.co.uk',
      receiptNumber: 'CT001234',
      orderDate: new Date().toISOString().split('T')[0],
      orderTime: new Date().toTimeString().slice(0, 5),
      customerName: 'John Smith',
      customerPhone: '07123 456789',
      orderItems: [
        {
          id: '1',
          name: 'Chicken Tikka Masala',
          basePrice: 12.95,
          quantity: 1,
          customizations: ['Medium Spice'],
          addOns: [],
          instructions: '',
          total: 12.95
        },
        {
          id: '2',
          name: 'Pilau Rice',
          basePrice: 3.50,
          quantity: 1,
          customizations: [],
          addOns: [],
          instructions: '',
          total: 3.50
        },
        {
          id: '3',
          name: 'Naan Bread',
          basePrice: 2.95,
          quantity: 2,
          customizations: ['Garlic'],
          addOns: [],
          instructions: '',
          total: 5.90
        }
      ],
      subtotal: 22.35,
      deliveryFee: 2.50,
      serviceFee: 0.50,
      discount: 0,
      total: 25.35
    }));
    toast.success('Sample data loaded!');
  };

  const handleClearAll = () => {
    setFormData(initialFormData);
    toast.success('All data cleared!');
  };
  
  // Auto-generate receipt number
  useEffect(() => {
    if (!formData.receiptNumber) {
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({
        ...prev,
        receiptNumber: `CT${timestamp}`
      }));
    }
  }, []);
  
  // Calculate totals based on items
  useEffect(() => {
    const subtotal = formData.orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const discountAmount = (subtotal * formData.discountPercentage) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const vatAmount = (discountedSubtotal * formData.vatRate) / 100;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal
    }));
  }, [formData.orderItems, formData.discountPercentage, formData.vatRate]);
  
  // UK Legal Compliance Validation
  const validateUKCompliance = () => {
    const errors = [];
    
    // HMRC 2024 Requirements
    if (!formData.businessName.trim()) errors.push('Business name is required');
    if (!formData.address.trim()) errors.push('Business address is required');
    if (!formData.vatNumber.trim()) errors.push('VAT number is required');
    if (!formData.receiptNumber.trim()) errors.push('Receipt number is required');
    if (!formData.orderDate) errors.push('Order date is required');
    if (formData.orderItems.length === 0) errors.push('At least one item is required');
    if (formData.vatRate < 0 || formData.vatRate > 25) errors.push('VAT rate must be between 0% and 25%');
    
    // Item validation
    formData.orderItems.forEach((item, index) => {
      if (!item.name?.trim()) errors.push(`Item ${index + 1}: Name is required`);
      if (!item.price || item.price <= 0) errors.push(`Item ${index + 1}: Valid price is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: Valid quantity is required`);
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleValidate = () => {
    setIsValidating(true);
    const isValid = validateUKCompliance();
    
    if (isValid) {
      toast.success('Receipt is UK HMRC compliant!');
    } else {
      toast.error(`Found ${validationErrors.length} compliance issues`);
    }
    
    setIsValidating(false);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate first
      if (!validateUKCompliance()) {
        toast.error('Please fix validation errors before saving');
        return;
      }
      
      // TODO: Save to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      
      toast.success('Receipt template saved successfully!');
    } catch (error) {
      toast.error('Failed to save receipt template');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Auto-save functionality
  const saveFormData = useCallback(() => {
    try {
      localStorage.setItem('thermalReceiptDesigner_formData', JSON.stringify(formData));
      localStorage.setItem('thermalReceiptDesigner_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [formData]);

  // Save on blur and periodic saves
  useEffect(() => {
    const timeoutId = setTimeout(saveFormData, 2000); // Auto-save after 2 seconds of inactivity
    return () => clearTimeout(timeoutId);
  }, [formData, saveFormData]);

  // Form validation hints
  const getValidationHint = (field: string) => {
    switch (field) {
      case 'businessName':
        return formData.businessName.length < 3 ? 'Business name should be at least 3 characters' : '';
      case 'phone':
        return formData.phone && !/^[0-9\s\-\+\(\)]+$/.test(formData.phone) ? 'Please enter a valid phone number' : '';
      case 'email':
        return formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Please enter a valid email address' : '';
      case 'vatNumber':
        return formData.vatNumber && !/^GB[0-9]{9}$/.test(formData.vatNumber) ? 'VAT number should be in format GB123456789' : '';
      default:
        return '';
    }
  };

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveFormData();
            toast.success('Receipt template saved!');
            break;
          case 'z':
            if (!e.shiftKey) {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case '1':
            e.preventDefault();
            setActiveTab('business');
            break;
          case '2':
            e.preventDefault();
            setActiveTab('order');
            break;
          case '3':
            e.preventDefault();
            setActiveTab('items');
            break;
          case '4':
            e.preventDefault();
            setActiveTab('totals');
            break;
        }
      }
      
      // Handle Ctrl+Shift+Z for redo (alternative shortcut)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveFormData, handleUndo, handleRedo]);

  // Performance hint for users
  const getPerformanceHint = () => {
    const itemCount = formData.orderItems.length;
    if (itemCount > 20) {
      return '💡 Tip: For receipts with many items, consider using compact format for faster printing';
    }
    if (formData.logoImage && formData.logoWidth > 150) {
      return '💡 Tip: Smaller logos (under 150px) print faster on thermal printers';
    }
    return '';
  };

  const updateFormData = (section: string, field: string, value: any) => {
    updateFormDataWithHistory(prev => ({ ...prev, [field]: value }), `Updated ${field}`);
  };
  
  // Template insertion handler
  const handleInsertTemplate = (template: ElementTemplate, currentSection: string) => {
    if (template.content.text) {
      // Insert text elements based on current section
      if (currentSection === 'header') {
        // Add to business name or create custom header field
        const existingText = formData.businessName || '';
        const newText = existingText ? `${existingText}\n${template.content.text}` : template.content.text;
        updateFormData('header', 'businessName', newText);
      } else if (currentSection === 'footer') {
        // Add to footer message
        const existingText = formData.footerMessage || '';
        const newText = existingText ? `${existingText}\n${template.content.text}` : template.content.text;
        updateFormData('footer', 'footerMessage', newText);
      }
    }
    
    if (template.content.qrCode) {
      // Insert QR code elements
      const qrCode: QRCodeConfig = {
        id: `template_${Date.now()}`,
        ...template.content.qrCode
      };
      
      if (currentSection === 'header') {
        updateFormData('header', 'qrCodes', [...formData.qrCodes, qrCode]);
      } else if (currentSection === 'footer') {
        updateFormData('footer', 'qrCodes', [...formData.qrCodes, qrCode]);
      }
    }
    
    toast.success(`${template.name} template inserted successfully!`);
  };
  
  const selectedFont = THERMAL_FONTS.find(f => f.family === formData.selectedFont) || THERMAL_FONTS[0];
  
  // Handle opening Take Order modal
  const handleOpenTakeOrder = () => {
    setIsMenuModalOpen(true);
  };
  
  // Handle completing order from modal
  const handleOrderComplete = (orderItems: OrderItem[]) => {
    // Add items to formData.orderItems
    setFormData(prev => ({
      ...prev,
      orderItems: [...prev.orderItems, ...orderItems]
    }));
    
    setIsMenuModalOpen(false);
    toast.success(`Added ${orderItems.length} items to thermal receipt`);
  };
  
  // Handle closing modal
  const handleCloseModal = () => {
    setIsMenuModalOpen(false);
  };
  
  // Handle removing item from receipt
  const handleRemoveReceiptItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      orderItems: prev.orderItems.filter((_, i) => i !== index)
    }));
  };
  
  // Handle updating receipt item quantity
  const handleUpdateReceiptItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveReceiptItem(index);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      orderItems: prev.orderItems.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }));
  };
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: QSAITheme.background.primary }}>
      {/* Loading overlay while fetching smart defaults */}
      {isLoadingDefaults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-black/90 rounded-lg p-6 flex items-center space-x-3 border border-purple-500/20">
            <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
            <span className="text-white font-medium">Loading restaurant profile...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{
                ...styles.gradientText('strong'),
                color: QSAITheme.text.primary
              }}
            >
              Thermal Receipt Designer
            </h1>
            <p style={{ color: QSAITheme.text.muted }}>
              Create professional thermal receipts for Epson T-20III (UK Legal Compliant)
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: QSAITheme.purple.primary,
                color: QSAITheme.text.primary,
                border: 'none'
              }}
              className="hover:opacity-90 transition-opacity"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Template
            </Button>
          </div>
        </div>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card 
              className="border-red-600 bg-red-900/20"
              style={{
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                borderColor: QSAITheme.purple.primary,
                ...styles.frostedGlassStyle
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle 
                  className="flex items-center text-lg"
                  style={{ color: QSAITheme.text.primary }}
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  UK Legal Compliance Issues ({validationErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} style={{ color: QSAITheme.text.secondary }} className="text-sm">
                      • {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
        
        {/* Main Content - Professional Three-Column Layout */}
        <div className="grid gap-6 min-h-0 max-w-full" style={{
          gridTemplateColumns: 'minmax(500px, 1.2fr) clamp(350px, 22vw, 380px) minmax(260px, 300px)',
          gridTemplateAreas: '"form preview actions"'
        }}>
          
          {/* Form Panel - Scrollable */}
          <div className="flex-1 min-w-0 overflow-y-auto space-y-6 pr-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList 
                className="grid w-full grid-cols-5"
                style={{
                  backgroundColor: QSAITheme.background.panel,
                  border: `1px solid ${QSAITheme.border.light}`
                }}
              >
                <TabsTrigger 
                  value="header" 
                  className="data-[state=active]:text-white"
                  style={{
                    backgroundColor: activeTab === 'header' ? QSAITheme.purple.primary : 'transparent',
                    color: activeTab === 'header' ? QSAITheme.text.primary : QSAITheme.text.muted
                  }}
                >
                  Header
                </TabsTrigger>
                <TabsTrigger 
                  value="order" 
                  className="data-[state=active]:text-white"
                  style={{
                    backgroundColor: activeTab === 'order' ? QSAITheme.purple.primary : 'transparent',
                    color: activeTab === 'order' ? QSAITheme.text.primary : QSAITheme.text.muted
                  }}
                >
                  Order
                </TabsTrigger>
                <TabsTrigger 
                  value="items" 
                  className="data-[state=active]:text-white"
                  style={{
                    backgroundColor: activeTab === 'items' ? QSAITheme.purple.primary : 'transparent',
                    color: activeTab === 'items' ? QSAITheme.text.primary : QSAITheme.text.muted
                  }}
                >
                  Items
                </TabsTrigger>
                <TabsTrigger 
                  value="totals" 
                  className="data-[state=active]:text-white"
                  style={{
                    backgroundColor: activeTab === 'totals' ? QSAITheme.purple.primary : 'transparent',
                    color: activeTab === 'totals' ? QSAITheme.text.primary : QSAITheme.text.muted
                  }}
                >
                  Totals
                </TabsTrigger>
                <TabsTrigger 
                  value="footer" 
                  className="data-[state=active]:text-white"
                  style={{
                    backgroundColor: activeTab === 'footer' ? QSAITheme.purple.primary : 'transparent',
                    color: activeTab === 'footer' ? QSAITheme.text.primary : QSAITheme.text.muted
                  }}
                >
                  Footer
                </TabsTrigger>
              </TabsList>
              
              {/* Header Tab */}
              <TabsContent value="header" className="space-y-4">
                {/* Business Information */}
                <Card
                  style={{
                    backgroundColor: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.light}`,
                    ...styles.frostedGlassStyle
                  }}
                >
                  <CardHeader 
                    className="cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setIsBusinessDetailsOpen(!isBusinessDetailsOpen)}
                  >
                    <CardTitle 
                      className="flex items-center justify-between"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Business Details
                        {/* Badge Counter */}
                        {(formData.businessName || formData.address || formData.vatNumber) && (
                          <span 
                            className="ml-2 px-2 py-1 text-xs rounded-full"
                            style={{
                              backgroundColor: QSAITheme.purple.primary,
                              color: QSAITheme.text.primary
                            }}
                          >
                            {[formData.businessName, formData.address, formData.vatNumber, formData.phone, formData.email, formData.website].filter(Boolean).length}
                          </span>
                        )}
                      </div>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform ${
                          isBusinessDetailsOpen ? 'rotate-180' : ''
                        }`}
                        style={{ color: QSAITheme.text.secondary }}
                      />
                    </CardTitle>
                  </CardHeader>
                  {isBusinessDetailsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Business Name *</Label>
                            <Input
                              value={formData.businessName}
                              onChange={(e) => updateFormData('header', 'businessName', e.target.value)}
                              style={{
                                backgroundColor: QSAITheme.background.secondary,
                                border: `1px solid ${QSAITheme.border.light}`,
                                color: QSAITheme.text.primary
                              }}
                              placeholder="Enter business name"
                            />
                          </div>
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>VAT Number *</Label>
                            <div className="flex space-x-2">
                              <Input
                                value={formData.vatNumber}
                                onChange={(e) => updateFormData('header', 'vatNumber', e.target.value)}
                                style={{
                                  backgroundColor: QSAITheme.background.secondary,
                                  border: `1px solid ${QSAITheme.border.light}`,
                                  color: QSAITheme.text.primary
                                }}
                                placeholder="GB123456789"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateFormData('header', 'showVatNumber', !formData.showVatNumber)}
                                className="px-2 hover:bg-purple-600/20"
                                title={formData.showVatNumber ? "Hide VAT number on receipt" : "Show VAT number on receipt"}
                              >
                                {formData.showVatNumber ? (
                                  <Eye className="h-4 w-4 text-purple-400" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label style={{ color: QSAITheme.text.secondary }}>
                            Address *
                            <span className="text-xs text-purple-400 ml-2">
                              (Use commas or new lines for multi-line display)
                            </span>
                          </Label>
                          <Textarea
                            value={formData.address}
                            onChange={(e) => updateFormData('header', 'address', e.target.value)}
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`,
                              color: QSAITheme.text.primary
                            }}
                            placeholder="25 West St\nStorrington\nPulborough\nWest Sussex\nRH20 4DZ"
                            rows={4}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Phone</Label>
                            <div className="flex space-x-2">
                              <Input
                                value={formData.phone}
                                onChange={(e) => updateFormData('header', 'phone', e.target.value)}
                                style={{
                                  backgroundColor: QSAITheme.background.secondary,
                                  border: `1px solid ${QSAITheme.border.light}`,
                                  color: QSAITheme.text.primary
                                }}
                                placeholder="020 7123 4567"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateFormData('header', 'showPhone', !formData.showPhone)}
                                className="px-2 hover:bg-purple-600/20"
                                title={formData.showPhone ? "Hide phone on receipt" : "Show phone on receipt"}
                              >
                                {formData.showPhone ? (
                                  <Eye className="h-4 w-4 text-purple-400" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Email</Label>
                            <div className="flex space-x-2">
                              <Input
                                value={formData.email}
                                onChange={(e) => updateFormData('header', 'email', e.target.value)}
                                style={{
                                  backgroundColor: QSAITheme.background.secondary,
                                  border: `1px solid ${QSAITheme.border.light}`,
                                  color: QSAITheme.text.primary
                                }}
                                placeholder="orders@restaurant.co.uk"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateFormData('header', 'showEmail', !formData.showEmail)}
                                className="px-2 hover:bg-purple-600/20"
                                title={formData.showEmail ? "Hide email on receipt" : "Show email on receipt"}
                              >
                                {formData.showEmail ? (
                                  <Eye className="h-4 w-4 text-purple-400" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <Label style={{ color: QSAITheme.text.secondary }}>Website</Label>
                          <div className="flex space-x-2">
                            <Input
                              value={formData.website}
                              onChange={(e) => updateFormData('header', 'website', e.target.value)}
                              style={{
                                backgroundColor: QSAITheme.background.secondary,
                                border: `1px solid ${QSAITheme.border.light}`,
                                color: QSAITheme.text.primary
                              }}
                              placeholder="www.restaurant.co.uk"
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateFormData('header', 'showWebsite', !formData.showWebsite)}
                              className="px-2 hover:bg-purple-600/20"
                              title={formData.showWebsite ? "Hide website on receipt" : "Show website on receipt"}
                            >
                              {formData.showWebsite ? (
                                <Eye className="h-4 w-4 text-purple-400" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Font Selection - Enhanced with Section-Specific Control */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label style={{ color: QSAITheme.text.secondary }}>Font System</Label>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={formData.useItemsFont}
                                onCheckedChange={(checked) => updateFormData('header', 'useItemsFont', checked)}
                              />
                              <Label 
                                className="text-sm" 
                                style={{ color: QSAITheme.text.muted }}
                              >
                                Use different font for order items
                              </Label>
                            </div>
                          </div>
                          
                          {!formData.useItemsFont ? (
                            /* Single Font Mode */
                            <div>
                              <Label style={{ color: QSAITheme.text.secondary }}>Receipt Font</Label>
                              <Select
                                value={formData.receiptFont}
                                onValueChange={(value) => {
                                  updateFormData('header', 'receiptFont', value);
                                  updateFormData('header', 'selectedFont', value); // Legacy support
                                }}
                              >
                                <SelectTrigger 
                                  style={{
                                    backgroundColor: QSAITheme.background.secondary,
                                    border: `1px solid ${QSAITheme.border.light}`,
                                    color: QSAITheme.text.primary
                                  }}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent 
                                  style={{
                                    backgroundColor: QSAITheme.background.secondary,
                                    border: `1px solid ${QSAITheme.border.light}`
                                  }}
                                >
                                  {THERMAL_FONTS.map(font => (
                                    <SelectItem key={font.family} value={font.family}>
                                      <div className="flex items-center justify-between w-full">
                                        <span>{font.name}</span>
                                        <span 
                                          className="text-xs ml-3" 
                                          style={{ 
                                            fontFamily: font.cssFamily,
                                            color: QSAITheme.text.muted
                                          }}
                                        >
                                          £12.95
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            /* Dual Font Mode */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label style={{ color: QSAITheme.text.secondary }}>Receipt Font</Label>
                                <p className="text-xs mb-2" style={{ color: QSAITheme.text.muted }}>Header, footer, general content</p>
                                <Select
                                  value={formData.receiptFont}
                                  onValueChange={(value) => updateFormData('header', 'receiptFont', value)}
                                >
                                  <SelectTrigger 
                                    style={{
                                      backgroundColor: QSAITheme.background.secondary,
                                      border: `1px solid ${QSAITheme.border.light}`,
                                      color: QSAITheme.text.primary
                                    }}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent 
                                    style={{
                                      backgroundColor: QSAITheme.background.secondary,
                                      border: `1px solid ${QSAITheme.border.light}`
                                    }}
                                  >
                                    {THERMAL_FONTS.map(font => (
                                      <SelectItem key={font.family} value={font.family}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{font.name}</span>
                                          <span 
                                            className="text-xs ml-3" 
                                            style={{ 
                                              fontFamily: font.cssFamily,
                                              color: QSAITheme.text.muted
                                            }}
                                          >
                                            Cottage Tandoori
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label style={{ color: QSAITheme.text.secondary }}>Items Font</Label>
                                <p className="text-xs mb-2" style={{ color: QSAITheme.text.muted }}>Order items section only</p>
                                <Select
                                  value={formData.itemsFont}
                                  onValueChange={(value) => updateFormData('header', 'itemsFont', value)}
                                >
                                  <SelectTrigger 
                                    style={{
                                      backgroundColor: QSAITheme.background.secondary,
                                      border: `1px solid ${QSAITheme.border.light}`,
                                      color: QSAITheme.text.primary
                                    }}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent 
                                    style={{
                                      backgroundColor: QSAITheme.background.secondary,
                                      border: `1px solid ${QSAITheme.border.light}`
                                    }}
                                  >
                                    {THERMAL_FONTS.map(font => (
                                      <SelectItem key={font.family} value={font.family}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{font.name}</span>
                                          <span 
                                            className="text-xs ml-3" 
                                            style={{ 
                                              fontFamily: font.cssFamily,
                                              color: QSAITheme.text.muted
                                            }}
                                          >
                                            £12.95
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Logo Upload */}
                        <div>
                          <Label style={{ color: QSAITheme.text.secondary }}>Logo Image</Label>
                          <ImageUploadDithering
                            onImageProcessed={(imageData) => 
                              updateFormData('header', 'logoImage', imageData)
                            }
                            className="mt-7"
                          />
                          
                          {/* Logo Position Controls */}
                          {formData.logoImage && (
                            <div className="mt-3">
                              <Label style={{ color: QSAITheme.text.secondary }}>Logo Position</Label>
                              <div className="flex space-x-4 mt-1">
                                {['left', 'center', 'right'].map(position => (
                                  <button
                                    key={position}
                                    type="button"
                                    onClick={() => updateFormData('header', 'logoPosition', position)}
                                    className={`px-3 py-2 rounded text-xs border ${
                                      formData.logoPosition === position 
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                                    }`}
                                  >
                                    {position.charAt(0).toUpperCase() + position.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                        
                        {/* QR Codes Section */}
                        <QRCodeFormBuilder
                          qrCodes={formData.qrCodes}
                          onQRCodesChange={(qrCodes) => updateFormData('header', 'qrCodes', qrCodes)}
                          currentSection="header"
                        />
                        
                        <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                        
                        {/* Element Library */}
                        <ElementLibrary
                          onInsertElement={(template) => handleInsertTemplate(template, 'header')}
                          currentSection="header"
                        />
                      </CardContent>
                    </motion.div>
                  )}
                </Card>
              </TabsContent>
              
              {/* Order Tab */}
              <TabsContent value="order" className="space-y-4">
                <Card 
                  style={{
                    backgroundColor: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.light}`,
                    ...styles.frostedGlassStyle
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: QSAITheme.text.primary }}>Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Order Type</Label>
                        <Select
                          value={formData.orderType}
                          onValueChange={(value) => updateFormData('order', 'orderType', value)}
                        >
                          <SelectTrigger 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`,
                              color: QSAITheme.text.primary
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`
                            }}
                          >
                            <SelectItem value="dine_in">Dine-In</SelectItem>
                            <SelectItem value="collection">Collection</SelectItem>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="waiting">Waiting</SelectItem>
                            <SelectItem value="ai_orders">AI Orders</SelectItem>
                            <SelectItem value="online_orders">Online Orders</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Receipt Number *</Label>
                        <Input
                          value={formData.receiptNumber}
                          onChange={(e) => updateFormData('order', 'receiptNumber', e.target.value)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="CT123456"
                        />
                      </div>
                    </div>
                    
                    {/* Enhanced Order Source Tracking & Order Mode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Order Source</Label>
                        <Select
                          value={formData.orderSource}
                          onValueChange={(value) => updateFormData('order', 'orderSource', value)}
                        >
                          <SelectTrigger 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`,
                              color: QSAITheme.text.primary
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`
                            }}
                          >
                            <SelectItem value="POS">POS (Manual Entry)</SelectItem>
                            <SelectItem value="ONLINE">Online Website</SelectItem>
                            <SelectItem value="AI_VOICE">AI Voice Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Order Mode</Label>
                        <Select
                          value={formData.orderMode}
                          onValueChange={(value) => updateFormData('order', 'orderMode', value)}
                        >
                          <SelectTrigger 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`,
                              color: QSAITheme.text.primary
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent 
                            style={{
                              backgroundColor: QSAITheme.background.secondary,
                              border: `1px solid ${QSAITheme.border.light}`
                            }}
                          >
                            <SelectItem value="DINE-IN">Dine-In</SelectItem>
                            <SelectItem value="WAITING">Waiting</SelectItem>
                            <SelectItem value="COLLECTION">Collection</SelectItem>
                            <SelectItem value="DELIVERY">Delivery</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Dine-In Specific Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Table Number</Label>
                        <Input
                          value={formData.tableNumber}
                          onChange={(e) => updateFormData('order', 'tableNumber', e.target.value)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="Table 12"
                        />
                      </div>
                      
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Number of Guests</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={formData.guestCount || ''}
                          onChange={(e) => updateFormData('order', 'guestCount', parseInt(e.target.value) || 0)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="4"
                        />
                      </div>
                    </div>
                    
                    <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                    
                    <h3 
                      className="text-lg font-semibold"
                      style={{ color: QSAITheme.text.primary }}
                    >
                      Customer Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Customer Name</Label>
                        <Input
                          value={formData.customerName}
                          onChange={(e) => updateFormData('order', 'customerName', e.target.value)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="John Smith"
                        />
                      </div>
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Customer Phone</Label>
                        <Input
                          value={formData.customerPhone}
                          onChange={(e) => updateFormData('order', 'customerPhone', e.target.value)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="06123 456789"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label style={{ color: QSAITheme.text.secondary }}>Customer Email</Label>
                      <Input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => updateFormData('order', 'customerEmail', e.target.value)}
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                        placeholder="customer@email.com"
                      />
                    </div>
                    
                    {formData.orderType === 'delivery' && (
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Delivery Address</Label>
                        <Textarea
                          value={formData.deliveryAddress}
                          onChange={(e) => updateFormData('order', 'deliveryAddress', e.target.value)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="Customer delivery address"
                          rows={3}
                        />
                      </div>
                    )}
                    
                    {/* Conditional Dine-In Fields */}
                    {formData.orderType === 'dine_in' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 p-4 rounded-lg border"
                        style={{
                          backgroundColor: QSAITheme.background.tertiary,
                          borderColor: QSAITheme.purple.primary + '40'
                        }}
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <Utensils className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
                          <h4 className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                            Dine-In Details
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Table Number</Label>
                            <Input
                              value={formData.tableNumber}
                              onChange={(e) => updateFormData('order', 'tableNumber', e.target.value)}
                              style={{
                                backgroundColor: QSAITheme.background.secondary,
                                border: `1px solid ${QSAITheme.border.light}`,
                                color: QSAITheme.text.primary
                              }}
                              placeholder="Table 12"
                            />
                          </div>
                          
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Number of Guests</Label>
                            <Input
                              type="number"
                              min="1"
                              max="20"
                              value={formData.guestCount || ''}
                              onChange={(e) => updateFormData('order', 'guestCount', parseInt(e.target.value) || 0)}
                              style={{
                                backgroundColor: QSAITheme.background.secondary,
                                border: `1px solid ${QSAITheme.border.light}`,
                                color: QSAITheme.text.primary
                              }}
                              placeholder="4"
                            />
                          </div>
                          
                          <div>
                            <Label style={{ color: QSAITheme.text.secondary }}>Template Type</Label>
                            <Select
                              value={formData.dineInTemplateType}
                              onValueChange={(value) => updateFormData('order', 'dineInTemplateType', value)}
                            >
                              <SelectTrigger 
                                style={{
                                  backgroundColor: QSAITheme.background.secondary,
                                  border: `1px solid ${QSAITheme.border.light}`,
                                  color: QSAITheme.text.primary
                                }}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent 
                                style={{
                                  backgroundColor: QSAITheme.background.secondary,
                                  border: `1px solid ${QSAITheme.border.light}`
                                }}
                              >
                                <SelectItem value="kitchen_copy">
                                  <div className="flex items-center space-x-2">
                                    <Coffee className="h-4 w-4" />
                                    <span>Kitchen Copy</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="final_bill">
                                  <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Final Bill</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Template Type Description */}
                        <div className="mt-3 p-3 rounded" style={{ backgroundColor: QSAITheme.background.secondary + '80' }}>
                          {formData.dineInTemplateType === 'kitchen_copy' ? (
                            <div className="flex items-start space-x-3">
                              <Coffee className="h-5 w-5 mt-0.5" style={{ color: QSAITheme.purple.primary }} />
                              <div>
                                <h5 className="font-medium mb-1" style={{ color: QSAITheme.text.primary }}>
                                  Kitchen Copy Template
                                </h5>
                                <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                                  Optimized for kitchen staff with clear item details, modifications, and table information. 
                                  Used when sending orders to kitchen ("Send to Kitchen" button in POSII).
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start space-x-3">
                              <FileText className="h-5 w-5 mt-0.5" style={{ color: QSAITheme.purple.primary }} />
                              <div>
                                <h5 className="font-medium mb-1" style={{ color: QSAITheme.text.primary }}>
                                  Final Bill Template
                                </h5>
                                <p className="text-sm" style={{ color: QSAITheme.text.secondary }}>
                                  Customer-facing receipt with complete itemized bill, totals, and payment details. 
                                  Used when printing final bills ("Print Final Bill" button in POSII).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Items Tab */}
              <TabsContent value="items" className="space-y-6">
                <Card style={{ backgroundColor: QSAITheme.background.panel, border: `1px solid ${QSAITheme.border.light}` }}>
                  <CardHeader>
                    <CardTitle style={{ color: QSAITheme.text.primary }}>Order Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Take Order Button */}
                    <div className="text-center py-8">
                      <div className="max-w-md mx-auto space-y-4">
                        <ShoppingCart className="w-16 h-16 mx-auto" style={{ color: QSAITheme.purple.primary }} />
                        <div>
                          <h3 className="text-lg font-semibold mb-2" style={{ color: QSAITheme.text.primary }}>
                            Build Sample Order
                          </h3>
                          <p className="text-sm mb-4" style={{ color: QSAITheme.text.secondary }}>
                            Select menu items to populate your thermal receipt preview with realistic order data.
                          </p>
                        </div>
                        <Button
                          onClick={handleOpenTakeOrder}
                          size="lg"
                          className="w-full"
                          style={{
                            backgroundColor: QSAITheme.purple.primary,
                            color: 'white'
                          }}
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Take Order
                        </Button>
                      </div>
                    </div>
                    
                    {/* Show Selected Items */}
                    {formData.orderItems.length > 0 && (
                      <div>
                        <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                        <div className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold" style={{ color: QSAITheme.text.primary }}>
                              Selected Items ({formData.orderItems.length})
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData(prev => ({ ...prev, orderItems: [] }))}
                              style={{
                                borderColor: QSAITheme.border.medium,
                                color: QSAITheme.text.secondary
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Clear All
                            </Button>
                          </div>
                          
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {formData.orderItems.map((item, index) => (
                              <div 
                                key={`${item.id}-${index}`}
                                className="flex items-center justify-between p-3 rounded border"
                                style={{
                                  backgroundColor: QSAITheme.background.tertiary,
                                  borderColor: QSAITheme.border.light
                                }}
                              >
                                <div className="flex-1">
                                  <span className="font-medium" style={{ color: QSAITheme.text.primary }}>
                                    {item.name}
                                  </span>
                                  {item.notes && (
                                    <p className="text-xs mt-1" style={{ color: QSAITheme.text.secondary }}>
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateReceiptItemQuantity(index, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center text-sm" style={{ color: QSAITheme.text.primary }}>
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateReceiptItemQuantity(index, item.quantity + 1)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  
                                  <span className="text-sm font-medium w-16 text-right" style={{ color: QSAITheme.text.primary }}>
                                    £{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveReceiptItem(index)}
                                    className="h-6 w-6 p-0 hover:bg-red-500/20"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Totals Tab */}
              <TabsContent value="totals" className="space-y-4">
                <Card 
                  style={{
                    backgroundColor: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.light}`,
                    ...styles.frostedGlassStyle
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: QSAITheme.text.primary }}>Order Totals & Charges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>VAT Rate %</Label>
                        <Input
                          type="number"
                          value={formData.vatRate}
                          onChange={(e) => updateFormData('totals', 'vatRate', parseFloat(e.target.value) || 0)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="20.00"
                        />
                      </div>
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Service Charge %</Label>
                        <Input
                          type="number"
                          value={formData.serviceCharge}
                          onChange={(e) => updateFormData('totals', 'serviceCharge', parseFloat(e.target.value) || 0)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="10.00"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Delivery Fee £</Label>
                        <Input
                          type="number"
                          value={formData.deliveryFee}
                          onChange={(e) => updateFormData('totals', 'deliveryFee', parseFloat(e.target.value) || 0)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="3.50"
                        />
                      </div>
                      <div>
                        <Label style={{ color: QSAITheme.text.secondary }}>Discount £</Label>
                        <Input
                          type="number"
                          value={formData.discount}
                          onChange={(e) => updateFormData('totals', 'discount', parseFloat(e.target.value) || 0)}
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                    
                    <div>
                      <Label style={{ color: QSAITheme.text.secondary }}>Payment Method</Label>
                      <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => updateFormData('totals', 'paymentMethod', value)}
                      >
                        <SelectTrigger 
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`,
                            color: QSAITheme.text.primary
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent 
                          style={{
                            backgroundColor: QSAITheme.background.secondary,
                            border: `1px solid ${QSAITheme.border.light}`
                          }}
                        >
                          <SelectItem key="cash" value="cash">Cash</SelectItem>
                          <SelectItem key="card" value="card">Card</SelectItem>
                          <SelectItem key="contactless" value="contactless">Contactless</SelectItem>
                          <SelectItem key="online" value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Footer Tab */}
              <TabsContent value="footer" className="space-y-4">
                <Card 
                  style={{
                    backgroundColor: QSAITheme.background.panel,
                    border: `1px solid ${QSAITheme.border.light}`,
                    ...styles.frostedGlassStyle
                  }}
                >
                  <CardHeader>
                    <CardTitle style={{ color: QSAITheme.text.primary }}>Receipt Footer</CardTitle>
                  </CardHeader>
                  <CardContent 
                    style={{
                      minHeight: 'auto', // Natural content-driven height
                      maxHeight: 'none', // Remove all artificial height constraints
                      overflowY: 'visible', // Allow natural content flow
                      overflowX: 'hidden', // Prevent horizontal scroll
                      paddingRight: '8px', // Account for potential scrollbar
                      paddingBottom: '20px' // Natural padding for content spacing
                    }}
                    className=""
                  >
                    <div>
                      <Label style={{ color: QSAITheme.text.secondary }}>Footer Message</Label>
                      <Textarea
                        value={formData.footerMessage}
                        onChange={(e) => updateFormData('footer', 'footerMessage', e.target.value)}
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                        placeholder="Thank you for dining with us!"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label style={{ color: QSAITheme.text.secondary }}>Terms & Conditions</Label>
                      <Textarea
                        value={formData.terms}
                        onChange={(e) => updateFormData('footer', 'terms', e.target.value)}
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                        placeholder="All prices include VAT. Service charge is optional."
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label style={{ color: QSAITheme.text.secondary }}>Social Media / Website</Label>
                      <Input
                        value={formData.socialMedia}
                        onChange={(e) => updateFormData('footer', 'socialMedia', e.target.value)}
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                        placeholder="Follow us @restaurant"
                      />
                    </div>
                    
                    {/* Custom Footer Text */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label style={{ color: QSAITheme.text.secondary }}>Custom Footer Text</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateFormData('footer', 'showCustomFooter', !formData.showCustomFooter)}
                          className="px-2 hover:bg-purple-600/20"
                          title={formData.showCustomFooter ? "Hide custom footer on receipt" : "Show custom footer on receipt"}
                        >
                          {formData.showCustomFooter ? (
                            <Eye className="h-4 w-4 text-purple-400" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      <Input
                        value={formData.customFooterText}
                        onChange={(e) => updateFormData('footer', 'customFooterText', e.target.value)}
                        style={{
                          backgroundColor: QSAITheme.background.secondary,
                          border: `1px solid ${QSAITheme.border.light}`,
                          color: QSAITheme.text.primary
                        }}
                        placeholder="Service Charge not Included, Special notices, etc."
                        disabled={!formData.showCustomFooter}
                      />
                      {formData.showCustomFooter && (
                        <p className="text-xs" style={{ color: QSAITheme.text.muted }}>
                          This custom footer will appear at the bottom of receipts when enabled.
                        </p>
                      )}
                    </div>
                    
                    <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                    
                    {/* QR Codes Section */}
                    <QRCodeFormBuilder
                      qrCodes={formData.qrCodes}
                      onQRCodesChange={(qrCodes) => updateFormData('footer', 'qrCodes', qrCodes)}
                      currentSection="footer"
                    />
                    
                    <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                    
                    {/* Element Library */}
                    <ElementLibrary
                      onInsertElement={(template) => handleInsertTemplate(template, 'footer')}
                      currentSection="footer"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Live Preview Panel - Sticky */}
          <div className="sticky top-6 h-fit" style={{ gridArea: 'preview' }}>
            <div className="space-y-4">
              {/* Quick Actions - Moved to sticky right column */}
              <Card 
                style={{
                  backgroundColor: QSAITheme.background.panel,
                  border: `1px solid ${QSAITheme.border.light}`,
                  ...styles.frostedGlassStyle
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: QSAITheme.text.primary }}>Live Preview</CardTitle>
                    
                    {/* Format Toggle Switch */}
                    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setFormatToggle('front_of_house')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          formatToggle === 'front_of_house'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🎯 Front of House
                      </button>
                      <button
                        onClick={() => setFormatToggle('kitchen_customer')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                          formatToggle === 'kitchen_customer'
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Kitchen 👨‍🍳
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent 
                  style={{
                    maxHeight: 'calc(100vh - 120px)', // Increased available height (was 200px offset)
                    overflowY: 'auto', // Enable vertical scrolling
                    overflowX: 'hidden', // Prevent horizontal scroll
                    paddingRight: '8px', // Account for scrollbar
                    paddingBottom: '120px' // INCREASED: Generous buffer to ensure QR codes and footer content are fully visible (was 20px)
                  }}
                  className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
                >
                  <ThermalPreview
                    mode="form"
                    formData={{
                      ...formData,
                      subtotal: formData.subtotal
                    }}
                    paperWidth={paperWidth}
                    receiptFormat={formatToggle}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick Actions Sidebar - Sticky Right Column */}
          <div className="sticky top-6 h-fit space-y-4" style={{ gridArea: 'actions' }}>
            <Card 
              style={{
                backgroundColor: QSAITheme.background.panel,
                border: `1px solid ${QSAITheme.border.light}`,
                ...styles.frostedGlassStyle
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle 
                  className="text-lg flex items-center"
                  style={{ color: QSAITheme.text.primary }}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Undo/Redo Actions */}
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="flex-1 justify-start"
                    variant="outline"
                    style={{
                      borderColor: canUndo ? QSAITheme.purple.primary : QSAITheme.border.light,
                      color: canUndo ? QSAITheme.text.primary : QSAITheme.text.muted,
                      backgroundColor: 'transparent'
                    }}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo
                  </Button>
                  
                  <Button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="flex-1 justify-start"
                    variant="outline"
                    style={{
                      borderColor: canRedo ? QSAITheme.purple.primary : QSAITheme.border.light,
                      color: canRedo ? QSAITheme.text.primary : QSAITheme.text.muted,
                      backgroundColor: 'transparent'
                    }}
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="h-4 w-4 mr-2" />
                    Redo
                  </Button>
                </div>
                
                <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                
                {/* Load Template */}
                <Button
                  onClick={() => setShowTemplateModal(true)}
                  className="w-full justify-start"
                  style={{
                    backgroundColor: QSAITheme.purple.primary,
                    color: QSAITheme.text.primary,
                    border: 'none'
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Template Management
                </Button>
                
                {/* Save Template */}
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full justify-start"
                  style={{
                    backgroundColor: 'transparent',
                    color: QSAITheme.text.primary,
                    border: `1px solid ${QSAITheme.border.primary}`
                  }}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </Button>
                
                {/* Export Receipt */}
                <Button
                  onClick={handleExportReceipt}
                  disabled={!formData.businessName || !formData.receiptNumber}
                  variant="outline"
                  className="w-full justify-start"
                  style={{
                    borderColor: QSAITheme.border.light,
                    color: QSAITheme.text.primary,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Receipt
                </Button>
                
                <Separator style={{ backgroundColor: QSAITheme.border.light }} />
                
                {/* Sample Data */}
                <Button
                  onClick={loadSampleData}
                  variant="outline"
                  className="w-full justify-start"
                  style={{
                    borderColor: QSAITheme.border.light,
                    color: QSAITheme.text.secondary,
                    backgroundColor: 'transparent'
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Sample Data
                </Button>
                
                {/* Clear All */}
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  className="w-full justify-start text-red-400 border-red-500/50 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </CardContent>
            </Card>
            
            {/* Validation Status */}
            <Card 
              style={{
                backgroundColor: QSAITheme.background.panel,
                border: `1px solid ${QSAITheme.border.light}`,
                ...styles.frostedGlassStyle
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle 
                  className="text-sm flex items-center"
                  style={{ color: QSAITheme.text.primary }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span style={{ color: QSAITheme.text.secondary }}>Business Name</span>
                    {formData.businessName ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: QSAITheme.text.secondary }}>Receipt Number</span>
                    {formData.receiptNumber ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: QSAITheme.text.secondary }}>Order Items</span>
                    {formData.orderItems.length > 0 ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* ThermalReceiptMenuModal */}
      <ThermalReceiptMenuModal
        isOpen={isMenuModalOpen}
        onClose={handleCloseModal}
        onOrderComplete={handleOrderComplete}
      />
      
      {/* Template Management Modal */}
      <TemplateManagementModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        currentFormData={formData}
        onLoadTemplate={handleLoadTemplate}
      />
      
      {/* QR Code Builder Modal */}
      {showQRBuilder && (
        <QRCodeFormBuilder
          qrCodes={formData.qrCodes}
          onQRCodesChange={(qrCodes) => setFormData(prev => ({ ...prev, qrCodes }))}
          currentSection={currentSection}
          onClose={() => setShowQRBuilder(false)}
        />
      )}

      {/* Element Library Modal */}
      {showElementLibrary && (
        <ElementLibrary
          onInsertElement={(element) => {
            if (currentSection === 'header') {
              setFormData(prev => ({
                ...prev,
                headerElements: [...prev.headerElements, element]
              }));
            } else {
              setFormData(prev => ({
                ...prev,
                footerElements: [...prev.footerElements, element]
              }));
            }
          }}
          currentSection={currentSection}
          onClose={() => setShowElementLibrary(false)}
        />
      )}
      
      {/* Menu Modal for Sample Data */}
      <ThermalReceiptMenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onOrderComplete={(orderItems) => {
          setFormData(prev => ({ ...prev, orderItems }));
          setShowMenuModal(false);
        }}
      />
      
      {/* Save Template Dialog */}
      <SaveTemplateDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        currentDesign={{
          businessName: formData.businessName,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          vatNumber: formData.vatNumber,
          showPhone: formData.showPhone,
          showEmail: formData.showEmail,
          showWebsite: formData.showWebsite,
          showVatNumber: formData.showVatNumber,
          logoFile: formData.logoFile,
          logoUrl: formData.logoUrl,
          logoImage: formData.logoImage,
          logoPosition: formData.logoPosition,
          logoWidth: formData.logoWidth,
          logoHeight: formData.logoHeight,
          qrCodes: formData.qrCodes,
          orderType: formData.orderType,
          receiptNumber: formData.receiptNumber,
          orderDate: formData.orderDate,
          orderTime: formData.orderTime,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          deliveryAddress: formData.deliveryAddress,
          orderItems: formData.orderItems,
          vatRate: formData.vatRate,
          serviceCharge: formData.serviceCharge,
          deliveryFee: formData.deliveryFee,
          discount: formData.discount,
          discountPercentage: formData.discountPercentage,
          subtotal: formData.subtotal,
          paymentMethod: formData.paymentMethod,
          footerMessage: formData.footerMessage,
          terms: formData.terms,
          socialMedia: formData.socialMedia,
          receiptFormat: formData.receiptFormat,
          selectedFont: formData.selectedFont,
          useItemsFont: formData.useItemsFont,
          receiptFont: formData.receiptFont,
          itemsFont: formData.itemsFont,
          paperWidth
        }}
        onTemplateSaved={() => {
          // Optionally refresh template list if needed
          console.log('Template saved successfully');
        }}
      />
    </div>
  );
}
