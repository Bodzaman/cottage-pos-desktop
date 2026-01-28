import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RestaurantStatusBanner } from './RestaurantStatusBanner';
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Store,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  StickyNote,
  ShoppingBag,
  ShoppingCart,
  Minus,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
  Edit2
} from 'lucide-react';
import { TimeSlotSelector } from './TimeSlotSelector';
import { toast } from 'sonner';
import { useCartStore } from '../utils/cartStore';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useCustomerData } from '../utils/useCustomerData';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';
import brain from '../brain';
import { useRestaurantAvailability } from '../hooks/useRestaurantAvailability';

interface CheckoutViewProps {
  onNavigateToMenu: () => void;
  onNavigateToAuth: () => void;
  className?: string;
}

/**
 * CheckoutView - Premium order checkout and payment interface
 * 
 * Uses sophisticated dark theme with glass morphism effects
 * Features thumbnail images in order summary
 * Matches OnlineOrders premium styling aesthetic
 */
export function CheckoutView({ onNavigateToMenu, onNavigateToAuth, className }: CheckoutViewProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSimpleAuth();
  const { items, totalItems, totalAmount, removeItem, updateQuantityDebounced, clearCart } = useCartStore();

  // Check restaurant availability (POS heartbeat system)
  const { isAcceptingOrders, customMessage, isLoading: isCheckingAvailability } = useRestaurantAvailability();
  
  // ✅ NEW: Use proper customer data management
  const {
    customerData,
    deliveryAddress,
    isLoading: isLoadingCustomerData,
    error: customerDataError,
    updateCustomerData,
    updateDeliveryAddress,
    resetToProfile
  } = useCustomerData();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<'delivery' | 'collection'>('collection');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [realDeliveryFee, setRealDeliveryFee] = useState(3.00); // Default to £3
  
  // ✅ UPDATED: Enhanced delivery validation state
  const [deliveryValidation, setDeliveryValidation] = useState<{
    valid: boolean;
    distance_miles?: number;
    delivery_fee?: number;
    errors?: string[];
    message?: string;
  } | null>(null);
  const [isValidatingDelivery, setIsValidatingDelivery] = useState(false);
  
  // Collection notes state
  const [collectionNotes, setCollectionNotes] = useState('');

  // ✅ NEW: Unified time slot selection for both delivery and collection
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);

  // Inline field validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const validateField = (field: string, value: string): boolean => {
    let error = '';
    switch (field) {
      case 'firstName': case 'lastName':
        error = value.trim() ? '' : `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        break;
      case 'phone':
        error = /^[\d\s+()-]{10,}$/.test(value) ? '' : 'Valid phone number required';
        break;
      case 'email':
        error = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Valid email required';
        break;
      case 'postcode':
        error = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(value.trim()) ? '' : 'Valid UK postcode required';
        break;
      case 'street':
        error = value.trim() ? '' : 'Street address is required';
        break;
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  // ✅ NEW: Minimum order state
  const [minOrderAmount, setMinOrderAmount] = useState(25.0); // Default £25

  // ✅ NEW: Allow authenticated users to edit their info
  const [isEditingCustomerInfo, setIsEditingCustomerInfo] = useState(false);
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean;
    message: string;
    discountAmount?: number;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Calculate pricing with real delivery fee and promo discount
  const subtotal = totalAmount;
  const deliveryFee = orderType === 'delivery' ? realDeliveryFee : 0;
  const discount = promoDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  
  // Load restaurant settings for delivery fee and minimum order
  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await brain.get_restaurant_settings();
        const result = await response.json();

        if (result.success && result.settings?.delivery?.fee) {
          const fee = result.settings.delivery.fee;
          console.log('🚚 CheckoutView: Loaded real delivery fee:', fee);
          setRealDeliveryFee(fee);
        } else {
          console.log('🚚 CheckoutView: Using default delivery fee (£3)');
        }
      } catch (error) {
        console.error('❌ CheckoutView: Error loading delivery settings:', error);
        // Keep default £3 fee on error
      }

      // ✅ NEW: Also fetch minimum order from delivery config
      try {
        const configResponse = await brain.get_delivery_config();
        const configData = await configResponse.json();
        if (configData.min_order) {
          setMinOrderAmount(configData.min_order);
          console.log('🚚 CheckoutView: Loaded minimum order:', configData.min_order);
        }
      } catch (error) {
        console.error('❌ CheckoutView: Error loading delivery config:', error);
        // Keep default £25 minimum
      }
    };

    loadDeliverySettings();
  }, []);

  // ✅ NEW: Calculate if minimum order is met (for delivery only)
  const minimumOrderMet = orderType === 'delivery' ? subtotal >= minOrderAmount : true;
  const amountNeededForMinimum = orderType === 'delivery' ? Math.max(0, minOrderAmount - subtotal) : 0;
  
  // ✅ UPDATED: Real-time delivery validation with strict blocking
  useEffect(() => {
    const validateDelivery = async () => {
      // Skip if not delivery or postcode not entered
      if (orderType !== 'delivery') {
        setDeliveryValidation(null);
        return;
      }
      
      if (!deliveryAddress.postcode?.trim() || deliveryAddress.postcode.trim().length < 5) {
        setDeliveryValidation(null);
        return;
      }
      
      setIsValidatingDelivery(true);
      
      try {
        const response = await brain.validate_delivery_postcode({
          postcode: deliveryAddress.postcode.trim(),
          order_value: subtotal
        });
        const result = await response.json();
        
        console.log('📍 CheckoutView: Delivery validation result:', result);
        
        // Store full validation result
        setDeliveryValidation({
          valid: result.valid,
          distance_miles: result.data?.distance_miles,
          delivery_fee: result.data?.delivery_fee,
          errors: result.errors,
          message: result.message
        });
        
        // Update delivery fee from validation if valid
        if (result.valid && result.data?.delivery_fee !== undefined) {
          setRealDeliveryFee(result.data.delivery_fee);
        }
        
      } catch (error) {
        console.error('❌ CheckoutView: Error validating delivery:', error);
        // ✅ CRITICAL: Fail closed - treat API errors as invalid delivery
        setDeliveryValidation({
          valid: false,
          errors: ['Unable to validate delivery address. Please try again or contact us.']
        });
      } finally {
        setIsValidatingDelivery(false);
      }
    };
    
    // Debounce validation
    const timeout = setTimeout(validateDelivery, 800);
    return () => clearTimeout(timeout);
  }, [orderType, deliveryAddress.postcode, subtotal]);
  
  // Promo code validation
  useEffect(() => {
    const validatePromo = async () => {
      if (promoCode.trim().length >= 3) {
        setIsValidatingPromo(true);
        try {
          console.log('🎟️ CheckoutView: Validating promo code:', promoCode);
          
          const response = await brain.validate_promo_code({
            code: promoCode.trim(),
            order_total: subtotal,
            order_type: orderType === 'delivery' ? 'DELIVERY' : 'COLLECTION'
          });
          const result = await response.json();
          
          console.log('🎟️ CheckoutView: Promo validation result:', result);
          
          setPromoValidation({
            valid: result.valid,
            message: result.message || 'Promo code validation complete',
            discountAmount: result.discount_amount
          });
          
          // Update discount amount if valid
          if (result.valid && result.discount_amount) {
            setPromoDiscount(result.discount_amount);
            toast.success(`Promo code applied! Saved £${result.discount_amount.toFixed(2)}`);
          } else {
            setPromoDiscount(0);
            if (!result.valid) {
              toast.error(result.message || 'Invalid promo code');
            }
          }
          
        } catch (error) {
          console.error('❌ CheckoutView: Error validating promo code:', error);
          setPromoValidation({
            valid: false,
            message: 'Unable to validate promo code'
          });
          setPromoDiscount(0);
        } finally {
          setIsValidatingPromo(false);
        }
      } else {
        setPromoValidation(null);
        setPromoDiscount(0);
      }
    };
    
    const timeout = setTimeout(validatePromo, 800); // Debounce validation
    return () => clearTimeout(timeout);
  }, [promoCode, subtotal]);
  
  // ✅ NEW: Handle time slot selection
  const handleTimeSelect = (time: string, date?: string) => {
    setSelectedTime(time);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Validation — inline errors on each field
  const validateOrder = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }

    const fields = ['firstName', 'lastName', 'phone', 'email'];
    if (orderType === 'delivery') fields.push('street', 'postcode');

    let firstErrorField = '';
    let hasErrors = false;

    fields.forEach(f => {
      const val = (f === 'street' || f === 'postcode')
        ? (deliveryAddress as any)[f] || ''
        : (customerData as any)[f] || '';
      if (!validateField(f, val)) {
        hasErrors = true;
        if (!firstErrorField) firstErrorField = f;
      }
    });

    // Delivery-specific checks
    if (orderType === 'delivery' && deliveryValidation && !deliveryValidation.valid) {
      toast.error(`Delivery not available: ${deliveryValidation.message}`);
      return false;
    }

    if (hasErrors) {
      const el = document.getElementById(`field-${firstErrorField}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast.error('Please fix the highlighted fields');
      return false;
    }

    return true;
  };
  
  // Handle checkout submission - USING NEW HOOK
  const handleCheckout = async () => {
    if (!customerData.firstName || !customerData.lastName || !customerData.phone || !customerData.email) {
      toast.error('Please fill in all required customer information');
      return;
    }
    
    if (orderType === 'delivery') {
      if (!deliveryAddress.street || !deliveryAddress.postcode) {
        toast.error('Please provide complete delivery address');
        return;
      }
      
      // ✅ CRITICAL: Block checkout if delivery validation failed or hasn't run
      if (!deliveryValidation) {
        toast.error('Please wait for delivery validation to complete');
        return;
      }
      
      if (!deliveryValidation.valid) {
        const errorMsg = deliveryValidation.errors?.join('\n') || 'Delivery not available to this address';
        toast.error(errorMsg, {
          description: 'Try collection instead or update your address',
          duration: 5000
        });
        return;
      }
    }
    
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check restaurant availability (POS heartbeat system)
    if (!isAcceptingOrders) {
      toast.error(customMessage || 'Restaurant is temporarily unavailable', {
        description: 'Please try again in a few minutes.',
        duration: 5000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🛒 CheckoutView: Preparing checkout data for styled payment...');
      
      // Prepare checkout data for CheckoutPayment page
      const checkoutData = {
        items: items.map(item => ({
          id: item.id,
          menu_item_id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant?.name || undefined,
          notes: item.notes || undefined,
          image_url: item.imageUrl || undefined
        })),
        delivery: {
          method: orderType as 'delivery' | 'collection',
          address: orderType === 'delivery' ? {
            address_line1: deliveryAddress.street,
            address_line2: undefined,
            city: deliveryAddress.city || 'London',
            postal_code: deliveryAddress.postcode
          } : undefined,
          // ✅ NEW: Include selected time slot
          scheduledTime: selectedTime === 'ASAP' ? 'ASAP' : selectedTime || undefined,
          scheduledDate: selectedDate || undefined
        },
        total: total,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        discount: discount,
        promo_code: promoCode.trim() || undefined,
        tip_amount: 0,
        order_notes: orderType === 'delivery'
          ? deliveryAddress.notes || undefined
          : collectionNotes || undefined,
        // Include customer data for guest checkout support
        customer: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          phone: customerData.phone,
        }
      };
      
      console.log('🛒 CheckoutView: Storing checkout data and navigating to styled payment page');
      
      // Store checkout data for CheckoutPayment page
      // Primary: Pass via Router state (survives refresh if user came from checkout)
      // Backup: Also store in sessionStorage for backwards compatibility
      sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));
      
      // Navigate to our styled payment page with state
      navigate('/checkout-payment', {
        state: { checkoutData }
      });
      
      toast.success('Proceeding to secure payment...', {
        description: 'You will be redirected to our secure payment form'
      });
      
    } catch (error) {
      console.error('❌ CheckoutView: Error preparing checkout:', error);
      toast.error('Failed to prepare checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle quantity changes
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantityDebounced(itemId, newQuantity);
    }
  };
  
  // Empty cart check
  if (items.length === 0) {
    return (
      <div 
        className={cn("flex-1 flex items-center justify-center relative overflow-hidden", className)}
        style={{
          background: '#0B0C0E',
          minHeight: '100vh'
        }}
      >
        {/* Premium cottage watermark background */}
        <div 
          className="absolute inset-0 opacity-[0.02] bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url('./static/cottage-logo-watermark.png')`,
            backgroundSize: '400px 400px'
          }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#17191D]/60 backdrop-blur-xl border border-white/10 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[#B7BDC6]" />
          </div>
          <h2 className="text-2xl font-bold text-[#EAECEF] font-serif mb-4">
            Your cart is empty
          </h2>
          <p className="text-[#B7BDC6] mb-6">
            Add some delicious items to get started
          </p>
          <Button
            onClick={onNavigateToMenu}
            className="bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg"
          >
            Browse Menu
          </Button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div 
      className={cn("flex-1 flex flex-col max-h-[100dvh] relative overflow-hidden", className)}
      style={{
        background: '#0B0C0E',
        minHeight: '100vh'
      }}
    >
      {/* Premium cottage watermark background */}
      <div 
        className="absolute inset-0 opacity-[0.02] bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('./static/cottage-logo-watermark.png')`,
          backgroundSize: '400px 400px'
        }}
      />
      
      {/* Header - Fixed with glass morphism */}
      <div 
        className="border-b backdrop-blur-xl px-6 py-6 flex-shrink-0 relative z-10"
        style={{
          background: 'rgba(23, 25, 29, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={onNavigateToMenu}
                variant="ghost"
                size="sm"
                className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              <h1 className="text-2xl font-bold text-[#EAECEF] font-serif">
                Checkout
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-[#8B1538]" />
              <span className="text-[#EAECEF] font-semibold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Restaurant availability banner */}
      {!isCheckingAvailability && !isAcceptingOrders && (
        <RestaurantStatusBanner className="flex-shrink-0 relative z-10" />
      )}

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details & Customer Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Type Toggle - Compact */}
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-4 rounded-xl border backdrop-blur-xl"
                  style={{
                    background: 'rgba(23, 25, 29, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <span className="text-sm font-medium text-[#B7BDC6]">Order Type</span>
                  <div className="flex gap-1 p-1 rounded-lg bg-black/30">
                    <button
                      className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                        orderType === 'collection' ? "bg-[#8B1538] text-white" : "text-[#B7BDC6] hover:text-white")}
                      onClick={() => setOrderType('collection')}
                    >
                      Collection
                    </button>
                    <button
                      className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                        orderType === 'delivery' ? "bg-[#8B1538] text-white" : "text-[#B7BDC6] hover:text-white")}
                      onClick={() => setOrderType('delivery')}
                    >
                      Delivery {realDeliveryFee > 0 ? `(£${realDeliveryFee.toFixed(2)})` : ''}
                    </button>
                  </div>
                </div>

                {/* Minimum order warning for delivery */}
                {orderType === 'delivery' && !minimumOrderMet && (
                  <Alert
                    style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      borderColor: 'rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b'
                    }}
                  >
                    <AlertCircle className="h-4 w-4" style={{ color: '#f59e0b' }} />
                    <AlertTitle style={{ color: '#f59e0b' }}>Minimum Order Required</AlertTitle>
                    <AlertDescription style={{ color: '#fbbf24' }}>
                      Delivery orders require a minimum of £{minOrderAmount.toFixed(2)}.
                      Add £{amountNeededForMinimum.toFixed(2)} more to your order, or switch to Collection.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              {/* Customer Information */}
              {isAuthenticated && !isEditingCustomerInfo ? (
                /* Compact profile summary for authenticated users */
                <Card
                  className="border backdrop-blur-xl"
                  style={{
                    background: 'rgba(23, 25, 29, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#8B1538]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#8B1538]" />
                        </div>
                        <div>
                          <p className="text-[#EAECEF] font-medium">
                            {customerData.firstName} {customerData.lastName}
                          </p>
                          <p className="text-xs text-[#B7BDC6]">
                            {customerData.email} · {customerData.phone}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#B7BDC6] hover:text-white"
                        onClick={() => setIsEditingCustomerInfo(true)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <Card
                className="border backdrop-blur-xl"
                style={{
                  background: 'rgba(23, 25, 29, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#EAECEF] font-serif">Customer Information</CardTitle>
                    <div className="flex items-center gap-2">
                      {isAuthenticated && (
                        <Button
                          onClick={() => setIsEditingCustomerInfo(false)}
                          variant="outline"
                          size="sm"
                          className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-200"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Done
                        </Button>
                      )}
                      {!isAuthenticated && (
                        <Button
                          onClick={onNavigateToAuth}
                          variant="outline"
                          size="sm"
                          className="border-[#8B1538] text-[#8B1538] hover:bg-[#8B1538] hover:text-white transition-all duration-200"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Sign In
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[#B7BDC6]">First Name *</Label>
                      <Input
                        id="field-firstName"
                        value={customerData.firstName}
                        onChange={(e) => { updateCustomerData({ firstName: e.target.value }); if (fieldErrors.firstName) validateField('firstName', e.target.value); }}
                        onBlur={(e) => validateField('firstName', e.target.value)}
                        className={cn("bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200", fieldErrors.firstName ? "border-red-500/60" : "border-white/20")}
                        disabled={isAuthenticated && !isEditingCustomerInfo}
                        placeholder="Enter first name"
                      />
                      {fieldErrors.firstName && <p className="text-xs text-red-400">{fieldErrors.firstName}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[#B7BDC6]">Last Name *</Label>
                      <Input
                        id="field-lastName"
                        value={customerData.lastName}
                        onChange={(e) => { updateCustomerData({ lastName: e.target.value }); if (fieldErrors.lastName) validateField('lastName', e.target.value); }}
                        onBlur={(e) => validateField('lastName', e.target.value)}
                        className={cn("bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200", fieldErrors.lastName ? "border-red-500/60" : "border-white/20")}
                        disabled={isAuthenticated && !isEditingCustomerInfo}
                        placeholder="Enter last name"
                      />
                      {fieldErrors.lastName && <p className="text-xs text-red-400">{fieldErrors.lastName}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#B7BDC6]">Phone Number *</Label>
                    <Input
                      id="field-phone"
                      value={customerData.phone}
                      onChange={(e) => { updateCustomerData({ phone: e.target.value }); if (fieldErrors.phone) validateField('phone', e.target.value); }}
                      onBlur={(e) => validateField('phone', e.target.value)}
                      className={cn("bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200", fieldErrors.phone ? "border-red-500/60" : "border-white/20")}
                      disabled={isAuthenticated && !isEditingCustomerInfo}
                      placeholder="Enter phone number"
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-400">{fieldErrors.phone}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[#B7BDC6]">Email Address *</Label>
                    <Input
                      id="field-email"
                      value={customerData.email}
                      onChange={(e) => { updateCustomerData({ email: e.target.value }); if (fieldErrors.email) validateField('email', e.target.value); }}
                      onBlur={(e) => validateField('email', e.target.value)}
                      className={cn("bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200", fieldErrors.email ? "border-red-500/60" : "border-white/20")}
                      disabled={isAuthenticated && !isEditingCustomerInfo}
                      placeholder="Enter email address"
                    />
                    {fieldErrors.email && <p className="text-xs text-red-400">{fieldErrors.email}</p>}
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Delivery/Collection Details */}
              <Card 
                className="border backdrop-blur-xl"
                style={{
                  background: 'rgba(23, 25, 29, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <CardHeader>
                  <CardTitle className="text-[#EAECEF] font-serif">
                    {orderType === 'delivery' ? 'Delivery' : 'Collection'} Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orderType === 'delivery' ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[#B7BDC6]">Street Address *</Label>
                        <Input
                          id="field-street"
                          value={deliveryAddress.street}
                          onChange={(e) => { updateDeliveryAddress({ street: e.target.value }); if (fieldErrors.street) validateField('street', e.target.value); }}
                          onBlur={(e) => validateField('street', e.target.value)}
                          className={cn("bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200", fieldErrors.street ? "border-red-500/60" : "border-white/20")}
                          placeholder="Enter street address"
                        />
                        {fieldErrors.street && <p className="text-xs text-red-400">{fieldErrors.street}</p>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[#B7BDC6]">City *</Label>
                          <Input
                            value={deliveryAddress.city}
                            onChange={(e) => updateDeliveryAddress({ city: e.target.value })}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                            placeholder="Enter city"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[#B7BDC6]">Postcode *</Label>
                          <div className="relative">
                            <Input
                              id="field-postcode"
                              value={deliveryAddress.postcode}
                              onChange={(e) => { updateDeliveryAddress({ postcode: e.target.value }); if (fieldErrors.postcode) validateField('postcode', e.target.value); }}
                              onBlur={(e) => validateField('postcode', e.target.value)}
                              className={cn(
                                "bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200",
                                fieldErrors.postcode ? "border-red-500/60" : deliveryValidation && !deliveryValidation.valid ? "border-red-500" : deliveryValidation && deliveryValidation.valid ? "border-green-500" : "border-white/20"
                              )}
                              placeholder="Enter postcode"
                            />
                            {isValidatingDelivery && (
                              <div className="absolute right-3 top-3">
                                <Loader2 className="w-4 h-4 text-[#8B1538] animate-spin" />
                              </div>
                            )}
                          </div>
                          {fieldErrors.postcode && <p className="text-xs text-red-400">{fieldErrors.postcode}</p>}
                        </div>
                      </div>

                      {/* ✅ NEW: Time Slot Selector for Delivery */}
                      <div className="mt-4">
                        <TimeSlotSelector
                          orderType="DELIVERY"
                          selectedTime={selectedTime}
                          selectedDate={selectedDate}
                          onTimeSelect={handleTimeSelect}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[#B7BDC6]">Delivery Notes</Label>
                        <Textarea
                          value={deliveryAddress.notes}
                          onChange={(e) => updateDeliveryAddress({ notes: e.target.value })}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200 resize-none"
                          placeholder="Any special delivery instructions..."
                          rows={3}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ✅ NEW: Time Slot Selector for Collection */}
                      <TimeSlotSelector
                        orderType="COLLECTION"
                        selectedTime={selectedTime}
                        selectedDate={selectedDate}
                        onTimeSelect={handleTimeSelect}
                      />

                      <div className="space-y-2">
                        <Label className="text-[#B7BDC6]">Collection Notes</Label>
                        <Textarea
                          value={collectionNotes}
                          onChange={(e) => setCollectionNotes(e.target.value)}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200 resize-none"
                          placeholder="Any special instructions..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column - Order Summary with Thumbnails */}
            <div className="space-y-6">
              <div className="sticky top-8">
                <Card 
                  className="border backdrop-blur-xl"
                  style={{
                    background: 'rgba(23, 25, 29, 0.6)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-[#EAECEF] font-serif">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item) => {
                        // Determine display name: use full variant name if available, otherwise use item name
                        const displayName = item.variant?.name || item.name;
                        
                        return (
                          <div key={item.id} className="flex items-start space-x-3 p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                            {/* Thumbnail Image */}
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-white/10">
                              {/* Use item image */}
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling!.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              {/* Fallback placeholder */}
                              <div className={cn(
                                "w-full h-full bg-gradient-to-br from-[#8B1538]/20 to-[#7A1230]/20 flex items-center justify-center",
                                item.imageUrl && "hidden"
                              )}>
                                <svg className="w-6 h-6 text-[#8B1538]" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                              </div>
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[#EAECEF] font-medium text-sm truncate">
                                {displayName}
                              </h4>
                              {item.variant?.name && (
                                <p className="text-[#B7BDC6] text-xs">
                                  {item.variant.name}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-[#8B9DC3] text-xs truncate">
                                  Note: {item.notes}
                                </p>
                              )}
                              
                              {/* Quantity Controls */}
                              <div className="flex items-center space-x-2 mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                  className="h-6 w-6 p-0 border-white/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 transition-all duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-[#EAECEF] text-sm w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                  className="h-6 w-6 p-0 border-white/20 text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-white/10 transition-all duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Price and Remove */}
                            <div className="text-right flex flex-col items-end space-y-1">
                              <p className="text-[#EAECEF] font-medium text-sm">
                                £{((item.price || 0) * item.quantity).toFixed(2)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs p-1 h-auto transition-all duration-200"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Separator className="bg-white/20" />
                    
                    {/* ✅ NEW: Delivery Validation Feedback */}
                    {orderType === 'delivery' && (
                      <div className="space-y-3">
                        {/* Loading State */}
                        {isValidatingDelivery && (
                          <div className="flex items-center gap-2 text-sm text-blue-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Validating delivery address...</span>
                          </div>
                        )}
                        
                        {/* Success State */}
                        {deliveryValidation?.valid && !isValidatingDelivery && (
                          <div className="flex items-center gap-2 text-sm text-green-400">
                            <Check className="w-4 h-4" />
                            <span>
                              Delivery available
                              {deliveryValidation.distance_miles && (
                                <> • {deliveryValidation.distance_miles.toFixed(1)} miles</>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Error State with Alert */}
                        {deliveryValidation && !deliveryValidation.valid && !isValidatingDelivery && (
                          <Alert 
                            className="border-red-500/50 bg-red-500/10"
                          >
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <AlertTitle className="text-red-400">Delivery Not Available</AlertTitle>
                            <AlertDescription className="text-red-300/90">
                              {deliveryValidation.errors?.map((err, i) => (
                                <div key={i} className="mt-1">• {err}</div>
                              ))}
                              <Button
                                onClick={() => setOrderType('collection')}
                                variant="outline"
                                size="sm"
                                className="mt-3 border-red-400 text-red-400 hover:bg-red-400 hover:text-white transition-all duration-200"
                              >
                                <Store className="w-4 h-4 mr-2" />
                                Switch to Collection
                              </Button>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    
                    <Separator className="bg-white/20" />
                    
                    {/* Promo Code Section */}
                    <div className="space-y-3">
                      <Label className="text-[#B7BDC6] text-sm font-medium">Promo Code</Label>
                      <div className="relative">
                        <Input
                          value={promoCode}
                          onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoValidation(null); }}
                          placeholder="Enter promo code"
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200 pr-10"
                        />
                        {isValidatingPromo && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[#8B1538] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Promo early feedback */}
                      {promoCode.length > 0 && promoCode.length < 3 && !promoValidation && (
                        <p className="text-xs text-[#B7BDC6]">Enter at least 3 characters</p>
                      )}
                      {/* Promo validation feedback */}
                      {promoValidation && (
                        <div className={cn(
                          "text-xs flex items-center space-x-1",
                          promoValidation.valid ? "text-green-400" : "text-red-400"
                        )}>
                          {promoValidation.valid ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Valid! Saving £{promoValidation.discountAmount?.toFixed(2)}</span>
                            </>
                          ) : (
                            <>
                              <X className="w-3 h-3" />
                              <span>{promoValidation.message}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Separator className="bg-white/20" />
                    
                    {/* Pricing Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[#B7BDC6]">
                        <span>Subtotal</span>
                        <span>£{subtotal.toFixed(2)}</span>
                      </div>
                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-[#B7BDC6]">
                          <span>Delivery Fee</span>
                          <span>£{deliveryFee.toFixed(2)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount ({promoCode})</span>
                          <span>-£{discount.toFixed(2)}</span>
                        </div>
                      )}
                      <Separator className="bg-white/20" />
                      <div className="flex justify-between text-[#EAECEF] font-bold text-lg">
                        <span>Total</span>
                        <span>£{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {/* Checkout Button - ✅ UPDATED: Also check minimum order */}
                    <Button
                      onClick={handleCheckout}
                      disabled={
                        isSubmitting ||
                        (orderType === 'delivery' && deliveryValidation && !deliveryValidation.valid) ||
                        (orderType === 'delivery' && !minimumOrderMet)
                      }
                      className="w-full bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg mt-6 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : orderType === 'delivery' && !minimumOrderMet ? (
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span>Minimum £{minOrderAmount.toFixed(2)} Required</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Proceed to Payment</span>
                        </div>
                      )}
                    </Button>
                    
                    <p className="text-xs text-[#8B9DC3] text-center mt-3">
                      You will be redirected to secure payment via Stripe
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom padding for sticky mobile bar */}
        <div className="h-32 lg:h-16"></div>
      </div>

      {/* Sticky mobile checkout bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t backdrop-blur-xl"
        style={{
          background: 'rgba(11, 12, 14, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#B7BDC6]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span className="text-lg font-bold text-[#EAECEF]">£{total.toFixed(2)}</span>
          </div>
          <Button
            onClick={handleCheckout}
            className="w-full h-11 bg-[#8B1538] hover:bg-[#6B1028] text-white font-semibold"
            disabled={isSubmitting || (orderType === 'delivery' && !minimumOrderMet)}
          >
            {isSubmitting ? 'Processing...' : orderType === 'delivery' && !minimumOrderMet ? `Minimum £${minOrderAmount.toFixed(2)} Required` : 'Proceed to Payment'}
          </Button>
        </div>
      </div>
    </div>
  );
}
