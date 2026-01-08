import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import type { OrderType } from './masterTypes';

// Define types for better type safety
export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
  }>;
  specialInstructions?: string;
  discount?: number;
  discountReason?: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  street: string;
  city: string;
  postcode: string;
  addressObject: any | null;
}

export interface DeliveryDetails {
  distance: number | null;
  time: string | null;
  fee: string;
  freeDelivery: boolean;
  minimumOrderMet: boolean;
  minimumOrderAmount: number;
}

export interface UsePOSOrdersReturn {
  // Order state
  orderItems: OrderItem[];
  orderType: OrderType;
  
  // Customer details
  customerDetails: CustomerDetails;
  
  // Delivery details
  deliveryDetails: DeliveryDetails;
  
  // Order operations
  handleAddToOrder: (item: any) => void;
  handleRemoveItem: (itemId: string) => void;
  handleUpdateQuantity: (itemId: string, quantity: number) => void;
  handleClearOrder: () => void;
  
  // Order type management
  setOrderType: (type: OrderType) => void;
  
  // Customer details management
  updateCustomerDetails: (details: Partial<CustomerDetails>) => void;
  
  // Delivery management
  updateDeliveryDetails: (details: Partial<DeliveryDetails>) => void;
  
  // Order calculations
  calculateOrderTotal: () => number;
  calculateSubtotal: () => number;
  calculateTax: () => number;
  calculateServiceCharge: () => number;
  
  // Order validation
  isOrderReady: () => boolean;
  validateField: (field: string, value: string) => boolean;
}

export const usePOSOrders = (): UsePOSOrdersReturn => {
  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('DINE-IN');
  
  // Customer details state
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    street: '',
    city: '',
    postcode: '',
    addressObject: null
  });
  
  // Delivery details state
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    distance: null,
    time: null,
    fee: '0.00',
    freeDelivery: false,
    minimumOrderMet: false,
    minimumOrderAmount: 25.00 // Default to £25, will be updated from API
  });

  // Fetch delivery settings from restaurant settings API
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await apiClient.get_current_business_rules();
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.delivery) {
            const deliverySettings = data.data.delivery;
            setDeliveryDetails(prev => ({
              ...prev,
              minimumOrderAmount: deliverySettings.min_order || 25.00,
              fee: deliverySettings.delivery_fee?.toString() || '2.50'
            }));
          }
        }
      } catch (error) {
        console.log('Error fetching delivery settings:', error);
        // Keep default values on error
      }
    };

    fetchDeliverySettings();
  }, []);

  // Order operations
  const handleAddToOrder = useCallback((item: any) => {
    const newItem: OrderItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: item.name,
      price: item.price,
      quantity: 1,
      modifiers: item.modifiers || [],
      specialInstructions: item.specialInstructions || ''
    };
    
    setOrderItems(prev => [...prev, newItem]);
    toast.success(`${item.name} added to order`);
  }, []);
  
  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems(prev => {
      const itemToRemove = prev.find(item => item.id === itemId);
      if (itemToRemove) {
        toast.success(`${itemToRemove.name} removed from order`);
      }
      return prev.filter(item => item.id !== itemId);
    });
  }, []);
  
  const handleUpdateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    setOrderItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity }
          : item
      )
    );
  }, [handleRemoveItem]);
  
  const handleClearOrder = useCallback(() => {
    setOrderItems([]);
    toast.success('Order cleared');
  }, []);
  
  // Customer details management
  const updateCustomerDetails = useCallback((details: Partial<CustomerDetails>) => {
    setCustomerDetails(prev => ({ ...prev, ...details }));
  }, []);
  
  // Delivery management
  const updateDeliveryDetails = useCallback((details: Partial<DeliveryDetails>) => {
    setDeliveryDetails(prev => ({ ...prev, ...details }));
  }, []);
  
  // Order calculations
  const calculateSubtotal = useCallback(() => {
    return orderItems.reduce((sum, item) => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          mod.options.forEach(option => {
            itemTotal += option.price * item.quantity;
          });
        });
      }
      
      // Apply discount if any
      if (item.discount) {
        itemTotal = itemTotal * (1 - item.discount / 100);
      }
      
      return sum + itemTotal;
    }, 0);
  }, [orderItems]);
  
  const calculateTax = useCallback(() => {
    // VAT is already included in menu prices - return 0 to avoid double charging
    return 0;
  }, []);
  
  const calculateServiceCharge = useCallback(() => {
    if (orderType !== 'DINE-IN') return 0;
    const subtotal = calculateSubtotal();
    
    // Use POS settings if available, otherwise fallback to default
    if (typeof window !== 'undefined' && window.posSettings?.service_charge && window.posSettings.service_charge.enabled) {
      return subtotal * (window.posSettings.service_charge.percentage / 100);
    } else {
      return subtotal * 0.10; // 10% service charge for dine-in (fallback)
    }
  }, [calculateSubtotal, orderType]);
  
  const calculateOrderTotal = useCallback(() => {
    const subtotal = calculateSubtotal();
    // VAT is already included in menu item prices - no need to add it
    const serviceCharge = calculateServiceCharge();
    
    // Calculate delivery fee - prioritize restaurant delivery settings over POS settings
    let deliveryFee = 0;
    if (orderType === 'DELIVERY' && !deliveryDetails.freeDelivery) {
      // Use restaurant delivery settings first
      deliveryFee = parseFloat(deliveryDetails.fee);
    }
    
    // Total = subtotal (VAT already included) + service charge + delivery fee
    return subtotal + serviceCharge + deliveryFee;
  }, [calculateSubtotal, calculateServiceCharge, orderType, deliveryDetails]);
  
  // Field validation
  const validateField = useCallback((field: string, value: string): boolean => {
    if (!value || value.trim() === "") return false;
    
    switch (field) {
      case "firstName":
      case "lastName":
        return value.trim().length >= 2;
      case "phone":
        return /^(\+44|0)[\d\s-]{9,}$/.test(value.trim());
      case "address":
        return value.trim().length >= 8;
      case "postcode":
        return /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(value.trim());
      default:
        return value.trim() !== "";
    }
  }, []);
  
  // Order validation
  const isOrderReady = useCallback(() => {
    if (orderItems.length === 0) return false;
    
    const isFirstNameValid = validateField("firstName", customerDetails.firstName);
    const isLastNameValid = validateField("lastName", customerDetails.lastName);
    const isPhoneValid = validateField("phone", customerDetails.phone);
    const isAddressValid = validateField("address", customerDetails.address);
    const orderTotal = calculateSubtotal(); // Use subtotal for minimum order validation
    
    switch (orderType) {
      case "DINE-IN":
        return true; // Table and guest validation handled by table management
      case "COLLECTION":
        return isFirstNameValid && isLastNameValid && isPhoneValid;
      case "WAITING":
        return isFirstNameValid && isLastNameValid;
      case "DELIVERY":
        return isFirstNameValid && 
               isLastNameValid && 
               isPhoneValid && 
               isAddressValid && 
               customerDetails.addressObject !== null &&
               deliveryDetails.distance !== null && 
               (deliveryDetails.minimumOrderMet || orderTotal >= deliveryDetails.minimumOrderAmount || deliveryDetails.freeDelivery);
      default:
        return false;
    }
  }, [orderItems.length, validateField, customerDetails, orderType, calculateSubtotal, deliveryDetails]);
  
  return {
    // Order state
    orderItems,
    orderType,
    
    // Customer details
    customerDetails,
    
    // Delivery details
    deliveryDetails,
    
    // Order operations
    handleAddToOrder,
    handleRemoveItem,
    handleUpdateQuantity,
    handleClearOrder,
    
    // Order type management
    setOrderType,
    
    // Customer details management
    updateCustomerDetails,
    
    // Delivery management
    updateDeliveryDetails,
    
    // Order calculations
    calculateOrderTotal,
    calculateSubtotal,
    calculateTax,
    calculateServiceCharge,
    
    // Order validation
    isOrderReady,
    validateField
  };
};
