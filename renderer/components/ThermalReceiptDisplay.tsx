import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import ThermalPreview from './ThermalPreview';
import { ReceiptDesignerService } from 'utils/receiptDesignerService';
import { Template, FormData } from 'utils/receiptDesignerTypes';
import { OrderItem } from '../utils/menuTypes';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { usePOSAuth } from 'utils/usePOSAuth';

// ==================== Types ====================

interface OrderItem {
  id: string;
  name: string;
  basePrice?: number;
  price?: number;
  quantity: number;
  variant?: {
    id: string;
    name: string;
    price_adjustment: number;
  };
  customizations?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  instructions?: string;
}

interface OrderData {
  orderId: string;
  orderNumber?: string;
  orderType: 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY' | 'ONLINE_ORDERS';
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  deliveryFee?: number;
  serviceCharge?: number;
  discount?: number;
  total: number;
  tableNumber?: string;
  queueNumber?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  collectionTime?: string;
  estimatedDeliveryTime?: string;
  specialInstructions?: string;
  timestamp?: string;
  guestCount?: number;
}

interface ThermalReceiptDisplayProps {
  // Option 1: Load by template ID
  templateId?: string;
  
  // Option 2: Load by order mode (auto-fetch assigned template)
  orderMode?: 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY' | 'ONLINE_ORDERS';
  
  // Real order data to inject
  orderData: OrderData;
  
  // Display options
  paperWidth?: 58 | 80;
  showZoomControls?: boolean;
  className?: string;
}

// ==================== Helper Functions ====================

/**
 * Map OrderData to FormData structure expected by ThermalPreview
 */
function mapOrderToFormData(orderData: OrderData, template: Template, receiptFormat: string): FormData {
  // Start with template's design_data (has business info, settings)
  const baseFormData = template.design_data;
  
  // Map order type to template format
  const orderTypeMap: Record<string, 'dine_in' | 'collection' | 'delivery'> = {
    'DINE-IN': 'dine_in',
    'WAITING': 'collection', // Waiting uses collection format
    'COLLECTION': 'collection',
    'DELIVERY': 'delivery',
    'ONLINE_ORDERS': 'delivery' // Online orders use delivery format
  };
  
  // Transform order items to receipt format
  const orderItems = orderData.items.map(item => ({
    id: item.id,
    name: item.name,
    basePrice: item.basePrice || item.price || 0,
    price: item.basePrice || item.price || 0, // Add price field for ThermalPreview calculations
    quantity: item.quantity,
    total: item.total || ((item.basePrice || item.price || 0) * item.quantity), // Ensure total is set
    variant: item.variant,
    customizations: item.customizations || [],
    instructions: item.instructions
  }));
  
  // Build complete FormData with merged data
  const formData: FormData = {
    // Business info from template
    businessName: baseFormData.businessName || 'Cottage Tandoori',
    vatNumber: baseFormData.vatNumber || '',
    address: baseFormData.address || '',
    phone: baseFormData.phone || '',
    email: baseFormData.email || '',
    website: baseFormData.website || '',
    
    // Visibility toggles from template
    showPhone: baseFormData.showPhone ?? true,
    showEmail: baseFormData.showEmail ?? true,
    showWebsite: baseFormData.showWebsite ?? true,
    showVatNumber: baseFormData.showVatNumber ?? true,
    showCategorySubheadings: baseFormData.showCategorySubheadings ?? false,
    
    // Logo from template
    logoImage: baseFormData.logoImage,
    logoPosition: baseFormData.logoPosition || 'center',
    logoWidth: baseFormData.logoWidth,
    logoHeight: baseFormData.logoHeight,
    
    // QR codes from template - MERGE header and footer arrays
    qrCodes: [
      ...(baseFormData.headerQRCodes || []),
      ...(baseFormData.footerQRCodes || [])
    ],
    
    // Order details from orderData
    orderType: orderTypeMap[orderData.orderType] || 'collection',
    orderMode: orderData.orderType,
    orderSource: 'POS',
    receiptNumber: orderData.orderNumber || orderData.orderId,
    tableNumber: orderData.tableNumber,
    queueNumber: orderData.queueNumber,
    guestCount: orderData.guestCount,
    
    // Customer info from orderData
    customerName: orderData.customerName || '',
    customerPhone: orderData.customerPhone || '',
    customerEmail: orderData.customerEmail,
    deliveryAddress: orderData.deliveryAddress,
    
    // Timing
    collectionTime: orderData.collectionTime,
    estimatedDeliveryTime: orderData.estimatedDeliveryTime,
    
    // Special instructions
    specialInstructions: orderData.specialInstructions,
    
    // Order items
    orderItems: orderItems,
    
    // CRITICAL: Map timestamp from order data
    timestamp: orderData.timestamp,
    
    // Pricing from orderData (with defaults)
    vatRate: orderData.tax || 0,
    serviceCharge: orderData.serviceCharge || 0,
    deliveryFee: orderData.deliveryFee || 0,
    discount: orderData.discount || 0,
    
    // Receipt format - always FOH
    receiptFormat: 'front_of_house',
    
    // Footer messages from template
    footerMessage: baseFormData.footerMessage || '',
    terms: baseFormData.terms || '',
    socialMedia: baseFormData.socialMedia || '',
    
    // Font settings from template
    receiptFont: baseFormData.receiptFont || 'JetBrains Mono',
    itemsFont: baseFormData.itemsFont || 'JetBrains Mono',
    useItemsFont: baseFormData.useItemsFont ?? false
  };
  
  return formData;
}

/**
 * Convert order mode to storage key format
 * DINE-IN → DINE_IN, COLLECTION → COLLECTION, etc.
 */
function orderModeToStorageKey(orderMode: string): string {
  return orderMode.replace('-', '_');
}

// ==================== Component ====================

/**
 * ThermalReceiptDisplay - Display-only receipt preview component
 * 
 * Loads saved FOH template and merges with real order data
 * Used in Order History and Confirm Order screens
 * 
 * @example
 * // Load by order mode (auto-fetch assigned template)
 * <ThermalReceiptDisplay
 *   orderMode="COLLECTION"
 *   orderData={order}
 *   paperWidth={80}
 * />
 * 
 * @example
 * // Load by specific template ID
 * <ThermalReceiptDisplay
 *   templateId="template_123"
 *   orderData={order}
 *   paperWidth={80}
 * />
 */
export default function ThermalReceiptDisplay({
  templateId,
  orderMode,
  orderData,
  paperWidth = 80,
  showZoomControls = false,
  className = '',
  receiptFormat = 'front_of_house'
}: ThermalReceiptDisplayProps) {
  const { user } = useSimpleAuth();
  const { userId } = usePOSAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load template on mount or when props change
  useEffect(() => {
    loadTemplate();
  }, [templateId, orderMode]);
  
  // Re-map order data when template or orderData changes
  useEffect(() => {
    if (template) {
      const mappedData = mapOrderToFormData(orderData, template, receiptFormat);
      setFormData(mappedData);
    }
  }, [template, orderData]);
  
  /**
   * Load template by ID or order mode
   * Templates are shared resources - no auth required for display
   */
  const loadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let loadedTemplate: Template | null = null;
      
      // Option 1: Load by template ID
      if (templateId) {
        console.log('📡 Loading template by ID:', templateId);
        const response = await ReceiptDesignerService.fetchTemplate(templateId);
        
        if (response.success && response.data) {
          loadedTemplate = response.data;
          console.log('✅ Template loaded:', loadedTemplate.metadata.name);
        } else {
          throw new Error(response.error || 'Template not found');
        }
      }
      // Option 2: Load by order mode (fetch assigned template)
      else if (orderMode) {
        console.log('📡 Loading template for order mode:', orderMode);
        
        // Get template assignment for this order mode
        const storageKey = orderModeToStorageKey(orderMode);
        const assignmentResponse = await apiClient.get_template_assignment({ orderMode: storageKey });
        const assignmentData = await assignmentResponse.json();
        
        if (assignmentData.customer_template_id) {
          console.log('✅ Found assigned template:', assignmentData.customer_template_id);
          
          // Load the assigned template (no userId needed)
          const templateResponse = await ReceiptDesignerService.fetchTemplate(
            assignmentData.customer_template_id
          );
          
          if (templateResponse.success && templateResponse.data) {
            loadedTemplate = templateResponse.data;
            console.log('✅ Template loaded:', loadedTemplate.metadata.name);
          } else {
            throw new Error('Assigned template not found');
          }
        } else {
          throw new Error('No template assigned for this order mode');
        }
      } else {
        throw new Error('Either templateId or orderMode must be provided');
      }
      
      setTemplate(loadedTemplate);
      setIsLoading(false);
      
    } catch (err) {
      console.error('❌ Error loading template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load template';
      setError(errorMessage);
      setIsLoading(false);
      
      toast.error('Failed to load receipt template', {
        description: errorMessage
      });
    }
  };
  
  // ==================== Render States ====================
  
  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (error || !template || !formData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div>
              <h3 className="font-semibold text-lg">Unable to Load Receipt Template</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {error || 'Template not found'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Success state - render receipt
  return (
    <div className={className}>
      <ThermalPreview
        formData={formData}
        paperWidth={paperWidth}
        mode="form"
        receiptFormat="front_of_house"
      />
    </div>
  );
}
