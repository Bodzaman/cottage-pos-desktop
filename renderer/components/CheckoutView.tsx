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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '../utils/cartStore';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useCustomerData } from '../utils/useCustomerData';
import { PremiumTheme } from '../utils/premiumTheme';
import { cn } from '../utils/cn';
import { apiClient } from 'app';

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
  const { items, totalItems, totalAmount, removeItem, updateItemQuantity, clearCart } = useCartStore();
  
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
    warnings?: string[];
    message?: string;
  } | null>(null);
  const [isValidatingDelivery, setIsValidatingDelivery] = useState(false);
  
  // Collection info state
  const [collectionTime, setCollectionTime] = useState('');
  const [collectionNotes, setCollectionNotes] = useState('');
  
  // Delivery timing state
  const [deliveryTime, setDeliveryTime] = useState('asap');
  const [customDeliveryTime, setCustomDeliveryTime] = useState('');
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
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
  
  // Load restaurant settings for delivery fee
  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await apiClient.get_restaurant_settings();
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
    };
    
    loadDeliverySettings();
  }, []);
  
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
        const response = await apiClient.validate_delivery_postcode({
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
          warnings: result.warnings,
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
          
          const response = await apiClient.validate_promo_code({
            code: promoCode.trim(),
            order_total: subtotal
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
  
  // Validation
  const validateOrder = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return false;
    }
    
    // Customer info validation - USING NEW HOOK
    if (!customerData.firstName.trim()) {
      toast.error('First name is required');
      return false;
    }
    if (!customerData.lastName.trim()) {
      toast.error('Last name is required');
      return false;
    }
    if (!customerData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (!customerData.email.trim()) {
      toast.error('Email address is required');
      return false;
    }
    
    // Order type specific validation
    if (orderType === 'delivery') {
      if (!deliveryAddress.street.trim()) {
        toast.error('Delivery address is required');
        return false;
      }
      if (!deliveryAddress.city.trim()) {
        toast.error('City is required');
        return false;
      }
      if (!deliveryAddress.postcode.trim()) {
        toast.error('Postcode is required');
        return false;
      }
      
      // Check postcode validation
      if (deliveryValidation && !deliveryValidation.valid) {
        toast.error(`Delivery not available: ${deliveryValidation.message}`);
        return false;
      }
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
    
    setIsSubmitting(true);
    
    try {
      console.log('🛒 CheckoutView: Preparing checkout data for styled payment...');
      
      // Prepare checkout data for CheckoutPayment page
      const checkoutData = {
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant?.name || undefined,
          notes: item.notes || undefined,
          image_url: item.image_url || undefined
        })),
        delivery: {
          method: orderType as 'delivery' | 'collection',
          address: orderType === 'delivery' ? {
            address_line1: deliveryAddress.street,
            address_line2: undefined,
            city: deliveryAddress.city || 'London',
            postal_code: deliveryAddress.postcode
          } : undefined,
          scheduledTime: undefined // TODO: Add time selection
        },
        total: totalAmount,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        tip_amount: 0,
        order_notes: undefined
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
      updateItemQuantity(itemId, newQuantity);
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
            backgroundImage: `url('/static/cottage-logo-watermark.png')`,
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
      className={cn("flex-1 flex flex-col max-h-[100vh] relative overflow-hidden", className)}
      style={{
        background: '#0B0C0E',
        minHeight: '100vh'
      }}
    >
      {/* Premium cottage watermark background */}
      <div 
        className="absolute inset-0 opacity-[0.02] bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('/static/cottage-logo-watermark.png')`,
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
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details & Customer Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Type Selection */}
              <Card 
                className="border backdrop-blur-xl"
                style={{
                  background: 'rgba(23, 25, 29, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <CardHeader>
                  <CardTitle className="text-[#EAECEF] font-serif">Order Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={orderType} onValueChange={(value: 'delivery' | 'collection') => setOrderType(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="collection" id="collection" className="border-white/20 text-[#8B1538]" />
                      <Label htmlFor="collection" className="text-[#B7BDC6] flex items-center cursor-pointer hover:text-[#EAECEF] transition-colors">
                        <Store className="w-4 h-4 mr-2" />
                        Collection (Free)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="delivery" id="delivery" className="border-white/20 text-[#8B1538]" />
                      <Label htmlFor="delivery" className="text-[#B7BDC6] flex items-center cursor-pointer hover:text-[#EAECEF] transition-colors">
                        <Truck className="w-4 h-4 mr-2" />
                        Delivery (£{realDeliveryFee.toFixed(2)})
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
              
              {/* Customer Information */}
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
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#B7BDC6]">First Name *</Label>
                      <Input
                        value={customerData.firstName}
                        onChange={(e) => updateCustomerData({ firstName: e.target.value })}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                        disabled={isAuthenticated}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[#B7BDC6]">Last Name *</Label>
                      <Input
                        value={customerData.lastName}
                        onChange={(e) => updateCustomerData({ lastName: e.target.value })}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                        disabled={isAuthenticated}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B7BDC6]">Phone Number *</Label>
                    <Input
                      value={customerData.phone}
                      onChange={(e) => updateCustomerData({ phone: e.target.value })}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                      disabled={isAuthenticated}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#B7BDC6]">Email Address *</Label>
                    <Input
                      value={customerData.email}
                      onChange={(e) => updateCustomerData({ email: e.target.value })}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                      disabled={isAuthenticated}
                      placeholder="Enter email address"
                    />
                  </div>
                </CardContent>
              </Card>
              
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
                      <div className="space-y-2">
                        <Label className="text-[#B7BDC6]">Street Address *</Label>
                        <Input
                          value={deliveryAddress.street}
                          onChange={(e) => updateDeliveryAddress({ street: e.target.value })}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                          placeholder="Enter street address"
                        />
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
                        <div className="space-y-2">
                          <Label className="text-[#B7BDC6]">Postcode *</Label>
                          <div className="relative">
                            <Input
                              value={deliveryAddress.postcode}
                              onChange={(e) => updateDeliveryAddress({ postcode: e.target.value })}
                              className={cn(
                                "bg-white/10 backdrop-blur-sm border text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200",
                                deliveryValidation && !deliveryValidation.valid && "border-red-500",
                                deliveryValidation && deliveryValidation.valid && "border-green-500",
                                !deliveryValidation && "border-white/20"
                              )}
                              placeholder="Enter postcode"
                            />
                            {isValidatingDelivery && (
                              <div className="absolute right-3 top-3">
                                <Loader2 className="w-4 h-4 text-[#8B1538] animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
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
                      <div className="space-y-2">
                        <Label className="text-[#B7BDC6]">Collection Time</Label>
                        <Input
                          value={collectionTime}
                          onChange={(e) => setCollectionTime(e.target.value)}
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200"
                          placeholder="When would you like to collect? (e.g., 7:30 PM)"
                        />
                      </div>
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
                              {/* Use variant image first with proper resolution hierarchy */}
                              {(item.variant?.display_image_url || item.variant?.image_url || item.image_url) ? (
                                <img
                                  src={item.variant?.display_image_url || item.variant?.image_url || item.image_url}
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
                                (item.variant?.display_image_url || item.variant?.image_url || item.image_url) && "hidden"
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
                                £{(item.price * item.quantity).toFixed(2)}
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
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="bg-white/10 backdrop-blur-sm border border-white/20 text-[#EAECEF] placeholder:text-[#B7BDC6]/60 focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538] transition-all duration-200 pr-10"
                        />
                        {isValidatingPromo && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[#8B1538] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      
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
                    
                    {/* Checkout Button */}
                    <Button
                      onClick={handleCheckout}
                      disabled={isSubmitting || (orderType === 'delivery' && deliveryValidation && !deliveryValidation.valid)}
                      className="w-full bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#691025] text-white border-0 shadow-lg mt-6 transition-all duration-200"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
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
        
        {/* Bottom padding to ensure checkout button is always accessible */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}
