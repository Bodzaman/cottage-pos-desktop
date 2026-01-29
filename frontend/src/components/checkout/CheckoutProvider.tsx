/**
 * CheckoutProvider - State management for checkout flow
 *
 * Manages:
 * - Step navigation and completion state
 * - Customer data (via useCustomerData hook)
 * - Delivery/collection mode
 * - Address validation
 * - Time slot selection
 * - Promo codes and pricing
 * - Integration with cartStore and auth
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from 'utils/cartStore';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { useCustomerData, type CustomerData, type DeliveryAddress } from 'utils/useCustomerData';
import { useRestaurantAvailability } from '../../hooks/useRestaurantAvailability';
import brain from 'brain';
import { toast } from 'sonner';

// Step definitions
export type CheckoutStep = 'contact' | 'delivery' | 'time' | 'payment';

export const CHECKOUT_STEPS: { id: CheckoutStep; label: string; icon: string }[] = [
  { id: 'contact', label: 'Contact', icon: 'User' },
  { id: 'delivery', label: 'Delivery', icon: 'MapPin' },
  { id: 'time', label: 'Time', icon: 'Clock' },
  { id: 'payment', label: 'Payment', icon: 'CreditCard' },
];

// Delivery validation state
interface DeliveryValidation {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  fee?: number;
  distance?: number;
  errors?: string[];
  message?: string;
}

// Promo validation state
interface PromoValidation {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  code: string;
  discountAmount?: number;
  message?: string;
}

// Checkout context state
interface CheckoutState {
  // Navigation
  currentStep: CheckoutStep;
  completedSteps: Set<CheckoutStep>;
  canProceed: boolean;

  // Customer data (from useCustomerData)
  customerData: CustomerData;
  deliveryAddress: DeliveryAddress;
  isLoadingCustomerData: boolean;

  // Order mode
  orderMode: 'delivery' | 'collection';

  // Delivery validation
  deliveryValidation: DeliveryValidation;

  // Time selection
  selectedTime: string; // 'ASAP' or ISO string
  selectedDate: string;

  // Promo
  promoValidation: PromoValidation;

  // Pricing
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  minOrderAmount: number;
  minimumOrderMet: boolean;

  // Restaurant availability
  isRestaurantOpen: boolean;
  restaurantMessage?: string;

  // Auth state
  isAuthenticated: boolean;
  savedAddresses: any[];

  // Collection notes
  collectionNotes: string;
}

// Checkout context actions
interface CheckoutActions {
  // Navigation
  goToStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepComplete: (step: CheckoutStep) => void;

  // Customer data
  updateCustomerData: (data: Partial<CustomerData>) => void;
  updateDeliveryAddress: (address: Partial<DeliveryAddress>) => void;

  // Order mode
  setOrderMode: (mode: 'delivery' | 'collection') => void;

  // Time selection
  setSelectedTime: (time: string, date?: string) => void;

  // Promo
  applyPromoCode: (code: string) => Promise<void>;
  clearPromoCode: () => void;

  // Collection notes
  setCollectionNotes: (notes: string) => void;

  // Validation
  validateCurrentStep: () => boolean;
  validateDeliveryAddress: () => Promise<void>;

  // Checkout submission
  proceedToPayment: () => Promise<void>;
}

type CheckoutContextType = CheckoutState & CheckoutActions;

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}

interface CheckoutProviderProps {
  children: React.ReactNode;
}

export function CheckoutProvider({ children }: CheckoutProviderProps) {
  const navigate = useNavigate();

  // External hooks
  const { user, isAuthenticated, addresses } = useSimpleAuth();
  const {
    customerData,
    deliveryAddress,
    isLoading: isLoadingCustomerData,
    updateCustomerData,
    updateDeliveryAddress,
  } = useCustomerData();

  const {
    items,
    totalAmount,
    currentOrderMode,
    setOrderMode: setCartOrderMode,
    updatePricesForMode,
    clearCart,
  } = useCartStore();

  const { isAcceptingOrders, customMessage } = useRestaurantAvailability();

  // Local state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('contact');
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set());
  const [orderMode, setOrderModeState] = useState<'delivery' | 'collection'>(
    currentOrderMode === 'delivery' ? 'delivery' : 'collection'
  );
  const [selectedTime, setSelectedTimeState] = useState<string>('ASAP');
  const [selectedDate, setSelectedDateState] = useState<string>('');
  const [collectionNotes, setCollectionNotesState] = useState<string>('');

  // Delivery validation
  const [deliveryValidation, setDeliveryValidation] = useState<DeliveryValidation>({
    status: 'idle',
  });

  // Promo validation
  const [promoValidation, setPromoValidation] = useState<PromoValidation>({
    status: 'idle',
    code: '',
  });

  // Pricing state
  const [deliveryFee, setDeliveryFee] = useState<number>(3.0);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(25.0);

  // Load delivery config on mount
  useEffect(() => {
    const loadDeliveryConfig = async () => {
      try {
        const response = await brain.get_delivery_config();
        const data = await response.json();
        if (data.fee) setDeliveryFee(data.fee);
        if (data.min_order) setMinOrderAmount(data.min_order);
      } catch (error) {
        console.error('Failed to load delivery config:', error);
      }
    };
    loadDeliveryConfig();
  }, []);

  // Calculate pricing
  const subtotal = totalAmount;
  const actualDeliveryFee = orderMode === 'delivery' ? (deliveryValidation.fee ?? deliveryFee) : 0;
  const discount = promoValidation.status === 'valid' ? (promoValidation.discountAmount ?? 0) : 0;
  const total = Math.max(0, subtotal + actualDeliveryFee - discount);
  const minimumOrderMet = orderMode === 'delivery' ? subtotal >= minOrderAmount : true;

  // Auto-complete contact step for authenticated users with complete data
  useEffect(() => {
    if (
      isAuthenticated &&
      customerData.firstName &&
      customerData.lastName &&
      customerData.email &&
      customerData.phone
    ) {
      setCompletedSteps((prev) => new Set([...prev, 'contact']));
    }
  }, [isAuthenticated, customerData]);

  // Validate delivery address when postcode changes
  useEffect(() => {
    if (orderMode !== 'delivery' || !deliveryAddress.postcode) {
      setDeliveryValidation({ status: 'idle' });
      return;
    }

    const validateDelivery = async () => {
      if (deliveryAddress.postcode.length < 5) return;

      setDeliveryValidation({ status: 'validating' });

      try {
        const response = await brain.validate_delivery_postcode({
          postcode: deliveryAddress.postcode.trim(),
          order_value: subtotal,
        });
        const result = await response.json();

        setDeliveryValidation({
          status: result.valid ? 'valid' : 'invalid',
          fee: result.data?.delivery_fee,
          distance: result.data?.distance_miles,
          errors: result.errors,
          message: result.message,
        });

        if (result.valid && result.data?.delivery_fee !== undefined) {
          setDeliveryFee(result.data.delivery_fee);
        }
      } catch (error) {
        setDeliveryValidation({
          status: 'invalid',
          errors: ['Unable to validate delivery address. Please try again.'],
        });
      }
    };

    const timeout = setTimeout(validateDelivery, 800);
    return () => clearTimeout(timeout);
  }, [orderMode, deliveryAddress.postcode, subtotal]);

  // Navigation actions
  const goToStep = useCallback((step: CheckoutStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(CHECKOUT_STEPS[currentIndex + 1].id);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(CHECKOUT_STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  const markStepComplete = useCallback((step: CheckoutStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }, []);

  // Order mode
  const setOrderMode = useCallback(
    (mode: 'delivery' | 'collection') => {
      setOrderModeState(mode);
      setCartOrderMode(mode);
      updatePricesForMode(mode);
    },
    [setCartOrderMode, updatePricesForMode]
  );

  // Time selection
  const setSelectedTime = useCallback((time: string, date?: string) => {
    setSelectedTimeState(time);
    if (date) setSelectedDateState(date);
  }, []);

  // Collection notes
  const setCollectionNotes = useCallback((notes: string) => {
    setCollectionNotesState(notes);
  }, []);

  // Promo code
  const applyPromoCode = useCallback(
    async (code: string) => {
      if (code.length < 3) {
        setPromoValidation({ status: 'idle', code: '' });
        return;
      }

      setPromoValidation({ status: 'validating', code });

      try {
        const response = await brain.validate_promo_code({
          code: code.trim(),
          order_total: subtotal,
          order_type: orderMode === 'delivery' ? 'DELIVERY' : 'COLLECTION',
        });
        const result = await response.json();

        setPromoValidation({
          status: result.valid ? 'valid' : 'invalid',
          code,
          discountAmount: result.discount_amount,
          message: result.message,
        });

        if (result.valid) {
          toast.success(`Promo code applied! Saved £${result.discount_amount?.toFixed(2)}`);
        } else {
          toast.error(result.message || 'Invalid promo code');
        }
      } catch (error) {
        setPromoValidation({
          status: 'invalid',
          code,
          message: 'Unable to validate promo code',
        });
      }
    },
    [subtotal, orderMode]
  );

  const clearPromoCode = useCallback(() => {
    setPromoValidation({ status: 'idle', code: '' });
  }, []);

  // Validation
  const validateCurrentStep = useCallback((): boolean => {
    switch (currentStep) {
      case 'contact':
        return !!(
          customerData.firstName &&
          customerData.lastName &&
          customerData.email &&
          customerData.phone &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email) &&
          /^[\d\s+()-]{10,}$/.test(customerData.phone)
        );

      case 'delivery':
        if (orderMode === 'collection') return true;
        return !!(
          deliveryAddress.street &&
          deliveryAddress.postcode &&
          deliveryValidation.status === 'valid'
        );

      case 'time':
        return !!selectedTime;

      case 'payment':
        return minimumOrderMet;

      default:
        return false;
    }
  }, [
    currentStep,
    customerData,
    orderMode,
    deliveryAddress,
    deliveryValidation,
    selectedTime,
    minimumOrderMet,
  ]);

  const validateDeliveryAddress = useCallback(async () => {
    if (orderMode !== 'delivery') return;
    // Trigger validation by updating state (effect will handle API call)
    setDeliveryValidation({ status: 'validating' });
  }, [orderMode]);

  // Proceed to payment
  const proceedToPayment = useCallback(async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!isAcceptingOrders) {
      toast.error(customMessage || 'Restaurant is temporarily unavailable');
      return;
    }

    if (orderMode === 'delivery' && !minimumOrderMet) {
      toast.error(`Minimum order of £${minOrderAmount.toFixed(2)} required for delivery`);
      return;
    }

    if (orderMode === 'delivery' && deliveryValidation.status !== 'valid') {
      toast.error('Please enter a valid delivery address');
      return;
    }

    // Prepare checkout data for payment page
    const checkoutData = {
      items: items.map((item) => ({
        id: item.id,
        menu_item_id: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: item.variant?.name || undefined,
        notes: item.notes || undefined,
        image_url: item.imageUrl || undefined,
      })),
      delivery: {
        method: orderMode,
        address:
          orderMode === 'delivery'
            ? {
                address_line1: deliveryAddress.street,
                address_line2: undefined,
                city: deliveryAddress.city || 'London',
                postal_code: deliveryAddress.postcode,
              }
            : undefined,
        scheduledTime: selectedTime === 'ASAP' ? 'ASAP' : selectedTime || undefined,
        scheduledDate: selectedDate || undefined,
      },
      total,
      subtotal,
      delivery_fee: actualDeliveryFee,
      discount,
      promo_code: promoValidation.status === 'valid' ? promoValidation.code : undefined,
      tip_amount: 0,
      order_notes: orderMode === 'delivery' ? deliveryAddress.notes : collectionNotes,
      customer: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
      },
    };

    // Store checkout data
    sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

    // Navigate to payment
    navigate('/checkout-payment', { state: { checkoutData } });
  }, [
    items,
    isAcceptingOrders,
    customMessage,
    orderMode,
    minimumOrderMet,
    minOrderAmount,
    deliveryValidation,
    deliveryAddress,
    selectedTime,
    selectedDate,
    total,
    subtotal,
    actualDeliveryFee,
    discount,
    promoValidation,
    collectionNotes,
    customerData,
    navigate,
  ]);

  // Can proceed to next step
  const canProceed = useMemo(() => {
    return validateCurrentStep() && (orderMode !== 'delivery' || minimumOrderMet);
  }, [validateCurrentStep, orderMode, minimumOrderMet]);

  // Context value
  const value: CheckoutContextType = {
    // State
    currentStep,
    completedSteps,
    canProceed,
    customerData,
    deliveryAddress,
    isLoadingCustomerData,
    orderMode,
    deliveryValidation,
    selectedTime,
    selectedDate,
    promoValidation,
    subtotal,
    deliveryFee: actualDeliveryFee,
    discount,
    total,
    minOrderAmount,
    minimumOrderMet,
    isRestaurantOpen: isAcceptingOrders,
    restaurantMessage: customMessage,
    isAuthenticated,
    savedAddresses: addresses || [],
    collectionNotes,

    // Actions
    goToStep,
    nextStep,
    prevStep,
    markStepComplete,
    updateCustomerData,
    updateDeliveryAddress,
    setOrderMode,
    setSelectedTime,
    applyPromoCode,
    clearPromoCode,
    setCollectionNotes,
    validateCurrentStep,
    validateDeliveryAddress,
    proceedToPayment,
  };

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}
