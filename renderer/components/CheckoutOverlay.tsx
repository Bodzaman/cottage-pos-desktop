import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, User, CreditCard, CheckCircle, Clock, AlertCircle, CheckIcon, ArrowLeft, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PremiumTheme } from 'utils/premiumTheme';
import { useCartStore } from 'utils/cartStore';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { TimeSlotSelector } from 'components/TimeSlotSelector';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface CheckoutOverlayProps {
  isOpen: boolean;
  orderMode: 'delivery' | 'collection';
  onClose: () => void;
  onBack: () => void;
}

// Add validation state interface
interface PostcodeValidation {
  isValidating: boolean;
  isValid: boolean | null;
  message: string;
  deliveryFee: number | null;
  minimumOrder: number | null;
  errors: string[];
}

// Payment form component
function PaymentForm({ customerDetails, orderMode, totalAmount, selectedTime, selectedDate, onPaymentSuccess }: {
  customerDetails: any;
  orderMode: 'delivery' | 'collection';
  totalAmount: number;
  selectedTime: string;
  selectedDate: string;
  onPaymentSuccess: () => void;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const { items, clearCart } = useCartStore();

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Prepare checkout request
        const checkoutRequest = {
          items: items.map(item => ({
            item_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variant_name: item.variant?.name,
            special_instructions: item.notes || ''
          })),
          customer: {
            name: `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || customerDetails.name,
            phone: customerDetails.phone,
            email: customerDetails.email
          },
          order_type: orderMode.toUpperCase(),
          delivery_address: orderMode === 'delivery' ? {
            line1: customerDetails.address,
            city: customerDetails.city || 'London',
            postal_code: customerDetails.postcode,
            country: 'GB'
          } : null,
          delivery_time: selectedTime !== 'ASAP' ? selectedTime : null,
          delivery_date: selectedTime !== 'ASAP' && selectedDate ? selectedDate : null,
          special_instructions: customerDetails.notes
        };

        const response = await apiClient.createCheckoutPaymentIntent(checkoutRequest);
        const result = await response.json();

        if (result.success) {
          setPaymentIntent(result);
        } else {
          setPaymentError(result.message || 'Failed to initialize payment');
        }
      } catch (error) {
        console.error('Failed to create payment intent:', error);
        setPaymentError('Failed to initialize payment');
      }
    };

    if (items.length > 0 && customerDetails.firstName) {
      createPaymentIntent();
    }
  }, [items, customerDetails, orderMode]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentIntent) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm payment on backend
      const confirmResponse = await apiClient.confirmCheckoutPayment({
        payment_intent_id: paymentIntent.payment_intent_id,
        order_id: paymentIntent.order_id
      });
        
      const confirmResult = await confirmResponse.json();
        
      if (confirmResult.success) {
        toast.success('Payment successful!');
        clearCart();
        onPaymentSuccess();
      } else {
        setPaymentError('Payment processed but order confirmation failed');
        toast.error('Order confirmation failed');
      }
    } catch (err) {
      setPaymentError('An unexpected error occurred');
      toast.error('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while creating payment intent
  if (!paymentIntent && !paymentError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>Initializing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <div className="p-4 rounded-lg border" 
           style={{ 
             background: `${PremiumTheme.colors.dark[800]}40`,
             borderColor: PremiumTheme.colors.border.medium 
           }}>
        <div className="flex items-center justify-center py-4">
          <CreditCard className="w-8 h-8" style={{ color: PremiumTheme.colors.silver[400] }} />
          <span className="text-lg font-semibold ml-2" style={{ color: PremiumTheme.colors.text.primary }}>
            Pay £{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>
      
      {paymentError && (
        <div className="p-3 rounded-lg" 
             style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" style={{ color: PremiumTheme.colors.burgundy[400] }} />
            <p className="text-sm" style={{ color: PremiumTheme.colors.burgundy[400] }}>
              {paymentError}
            </p>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isProcessing || !paymentIntent}
        className="w-full py-3 font-semibold text-lg flex items-center justify-center space-x-2"
        style={{
          background: isProcessing 
            ? PremiumTheme.colors.dark[600]
            : `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]} 0%, ${PremiumTheme.colors.royal[500]} 100%)`,
          boxShadow: PremiumTheme.shadows.glow.royal,
          color: PremiumTheme.colors.text.primary
        }}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay £{totalAmount.toFixed(2)}</span>
          </>
        )}
      </Button>
    </form>
  );
}

export default function CheckoutOverlay({ isOpen, orderMode, onClose, onBack }: CheckoutOverlayProps) {
  // Move conditional return to very beginning before any hooks
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState<'details' | 'payment' | 'success'>('details');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  
  // Add ref for timeout instead of using window object
  const postcodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Customer details state
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    postcode: '',
    notes: ''
  });
  
  // New authentication-aware states
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showGuestSignup, setShowGuestSignup] = useState(false);
  const [guestSignupData, setGuestSignupData] = useState({
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [customerReference, setCustomerReference] = useState<string | null>(null);
  
  // Time slot state
  const [selectedTime, setSelectedTime] = useState<string>('ASAP');
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Postcode validation state
  const [postcodeValidation, setPostcodeValidation] = useState<PostcodeValidation>({
    isValidating: false,
    isValid: null,
    message: '',
    deliveryFee: null,
    minimumOrder: null,
    errors: []
  });

  const { user, profile, addresses, isAuthenticated, signUp, addAddress } = useSimpleAuth();
  const { items, totalAmount, clearCart } = useCartStore();

  // Pre-populate customer details for authenticated users
  useEffect(() => {
    if (isAuthenticated && profile) {
      setCustomerDetails(prev => ({
        ...prev,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        phone: profile.phone || '',
        email: user?.email || '',
      }));
      
      // Set default address if available
      const defaultAddress = addresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setCustomerDetails(prev => ({
          ...prev,
          address: `${defaultAddress.address_line1}${defaultAddress.address_line2 ? ', ' + defaultAddress.address_line2 : ''}, ${defaultAddress.city}`,
          postcode: defaultAddress.postal_code
        }));
      }
    }
  }, [isAuthenticated, profile, user, addresses]);

  // Get customer reference number for authenticated users
  useEffect(() => {
    const getCustomerReference = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await apiClient.getCustomerReference(user.id);
          const data = await response.json();
          if (data.success && data.customer_reference_number) {
            setCustomerReference(data.customer_reference_number);
          }
        } catch (error) {
          console.log('No customer reference found:', error);
        }
      }
    };
    getCustomerReference();
  }, [isAuthenticated, user]);

  // Real-time postcode validation function
  const validatePostcode = async (postcode: string) => {
    if (!postcode.trim() || orderMode !== 'delivery') {
      setPostcodeValidation({
        isValidating: false,
        isValid: null,
        message: '',
        deliveryFee: null,
        minimumOrder: null,
        errors: []
      });
      return;
    }

    // Only validate if postcode looks like UK format
    const ukPostcodePattern = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
    if (!ukPostcodePattern.test(postcode.trim())) {
      setPostcodeValidation({
        isValidating: false,
        isValid: false,
        message: 'Please enter a valid UK postcode',
        deliveryFee: null,
        minimumOrder: null,
        errors: ['Invalid postcode format']
      });
      return;
    }

    setPostcodeValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await apiClient.validateDeliveryPostcode({
        postcode: postcode.trim(),
        order_value: totalAmount
      });

      const result = await response.json();
      
      setPostcodeValidation({
        isValidating: false,
        isValid: result.valid,
        message: result.message,
        deliveryFee: result.data?.delivery_fee || null,
        minimumOrder: result.data?.min_order_value || null,
        errors: result.errors || []
      });
    } catch (error) {
      console.error('Postcode validation error:', error);
      setPostcodeValidation({
        isValidating: false,
        isValid: false,
        message: 'Unable to validate delivery address',
        deliveryFee: null,
        minimumOrder: null,
        errors: ['Validation service unavailable']
      });
    }
  };

  // Debounced postcode validation
  const handlePostcodeChange = (value: string) => {
    setCustomerDetails(prev => ({ ...prev, postcode: value }));
    
    // Clear existing timeout
    if (postcodeTimeoutRef.current) {
      clearTimeout(postcodeTimeoutRef.current);
    }
    
    // Set new timeout for validation
    postcodeTimeoutRef.current = setTimeout(() => {
      validatePostcode(value);
    }, 500); // 500ms delay
  };

  const handleDetailsSubmitWithSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if delivery validation passed
    if (orderMode === 'delivery' && postcodeValidation.isValid === false) {
      toast.error('Please fix delivery address issues before continuing');
      return;
    }
    
    // Check minimum order value for delivery
    if (orderMode === 'delivery' && postcodeValidation.minimumOrder && totalAmount < postcodeValidation.minimumOrder) {
      toast.error(`Minimum order value for delivery is £${postcodeValidation.minimumOrder.toFixed(2)}. Your order is £${totalAmount.toFixed(2)}.`);
      return;
    }
    
    // Handle guest signup if requested
    if (!isAuthenticated && showGuestSignup) {
      handleGuestSignup();
    }
    
    setCurrentStep('payment');
  };

  // Add guest signup handling
  const handleGuestSignup = async () => {
    if (!showGuestSignup) return;
    
    // Validate guest signup data
    if (!guestSignupData.password || guestSignupData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (guestSignupData.password !== guestSignupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!guestSignupData.agreeToTerms) {
      toast.error('Please agree to Terms of Service to create account');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create account using existing auth context
      const { error } = await signUp(
        customerDetails.email,
        guestSignupData.password,
        {
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          phone: customerDetails.phone
        }
      );
      
      if (error) {
        console.error('Signup error:', error);
        toast.error('Account creation failed. You can still complete your order as a guest.');
        return;
      }
      
      toast.success('Account created successfully!');
      
      // Save address if creating new address
      if (orderMode === 'delivery' && selectedAddressId === 'new' && customerDetails.address) {
        await addAddress({
          address_line1: customerDetails.address.split(',')[0] || customerDetails.address,
          address_line2: null,
          city: customerDetails.address.split(',')[1]?.trim() || 'City',
          postal_code: customerDetails.postcode,
          address_type: 'home',
          is_default: true,
          delivery_instructions: customerDetails.notes || null
        });
        toast.success('Address saved to your account!');
      }
      
    } catch (error) {
      console.error('Guest signup error:', error);
      toast.error('Account creation failed. You can still complete your order.');
    } finally {
      setLoading(false);
    }
  };

  const stepIndicators = [
    { step: 'details', label: 'Details', icon: User },
    { step: 'payment', label: 'Payment', icon: CreditCard },
    { step: 'confirmation', label: 'Confirmation', icon: CheckCircle }
  ];

  // ✅ NEW: Voice Order Badge (using existing cart variables)
  const detectedVoiceOrder = false;
  const voiceItemCount = 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
           style={{
             background: `linear-gradient(135deg, ${PremiumTheme.colors.dark[900]} 0%, ${PremiumTheme.colors.charcoal[800]} 100%)`,
             color: PremiumTheme.colors.text.primary
           }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
             style={{ borderColor: PremiumTheme.colors.border.medium }}>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold" style={{ color: PremiumTheme.colors.text.primary }}>
                  Checkout
                </h2>
                {/* ✅ NEW: Voice Order Badge */}
                {detectedVoiceOrder && (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full"
                       style={{
                         background: `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]}40 0%, ${PremiumTheme.colors.royal[500]}40 100%)`,
                         border: `1px solid ${PremiumTheme.colors.royal[500]}60`
                       }}>
                    <Mic className="w-4 h-4" style={{ color: PremiumTheme.colors.royal[400] }} />
                    <span className="text-sm font-medium" style={{ color: PremiumTheme.colors.royal[300] }}>
                      Voice Order {voiceItemCount > 0 && `(${voiceItemCount} items)`}
                    </span>
                  </div>
                )}
              </div>
              {/* Customer reference for logged-in users */}
              {isAuthenticated && customerReference && (
                <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                  Customer: {customerReference}
                </p>
              )}
            </div>
          </div>
          
          {/* Step Progress Indicator */}
          <div className="flex items-center space-x-4">
            {stepIndicators.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.step === currentStep;
              const isCompleted = stepIndicators.findIndex(s => s.step === currentStep) > index;
              
              return (
                <div key={step.step} className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                       style={{
                         borderColor: isActive 
                           ? PremiumTheme.colors.silver[500]
                           : isCompleted 
                           ? PremiumTheme.colors.status.success
                           : PremiumTheme.colors.text.muted,
                         backgroundColor: isActive 
                           ? `${PremiumTheme.colors.silver[500]}20`
                           : isCompleted 
                           ? `${PremiumTheme.colors.status.success}20`
                           : `${PremiumTheme.colors.text.muted}20`
                       }}>
                    <Icon className="w-5 h-5"
                          style={{
                            color: isActive 
                              ? PremiumTheme.colors.silver[400]
                              : isCompleted 
                              ? PremiumTheme.colors.status.success
                              : PremiumTheme.colors.text.muted
                          }} />
                  </div>
                  <span className="text-sm font-medium"
                        style={{
                          color: isActive 
                            ? PremiumTheme.colors.silver[400]
                            : isCompleted 
                            ? PremiumTheme.colors.status.success
                            : PremiumTheme.colors.text.muted
                        }}>
                    {step.label}
                  </span>
                  {index < stepIndicators.length - 1 && (
                    <div className="w-8 h-0.5 mx-2"
                         style={{
                           backgroundColor: isCompleted 
                             ? PremiumTheme.colors.status.success
                             : PremiumTheme.colors.text.muted
                         }} />
                  )}
                </div>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Side - Form Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentStep === 'details' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: PremiumTheme.colors.text.primary }}>
                    {orderMode === 'delivery' ? 'Delivery Details' : 'Collection Details'}
                  </h3>
                  <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                    {orderMode === 'delivery' 
                      ? 'Please provide your delivery address and contact information'
                      : 'Please provide your contact information for order collection'
                    }
                  </p>
                </div>

                <form onSubmit={handleDetailsSubmitWithSignup} className="space-y-4">
                  {/* Customer Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium" 
                             style={{ color: PremiumTheme.colors.text.primary }}>First Name</Label>
                      <Input
                        id="firstName"
                        value={customerDetails.firstName}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                        required
                        className="mt-1"
                        style={{
                          background: `${PremiumTheme.colors.dark[800]}80`,
                          borderColor: PremiumTheme.colors.border.medium,
                          color: PremiumTheme.colors.text.primary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium"
                             style={{ color: PremiumTheme.colors.text.primary }}>Last Name</Label>
                      <Input
                        id="lastName"
                        value={customerDetails.lastName}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                        required
                        className="mt-1"
                        style={{
                          background: `${PremiumTheme.colors.dark[800]}80`,
                          borderColor: PremiumTheme.colors.border.medium,
                          color: PremiumTheme.colors.text.primary
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium"
                             style={{ color: PremiumTheme.colors.text.primary }}>Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerDetails.phone}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        className="mt-1"
                        style={{
                          background: `${PremiumTheme.colors.dark[800]}80`,
                          borderColor: PremiumTheme.colors.border.medium,
                          color: PremiumTheme.colors.text.primary
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium"
                             style={{ color: PremiumTheme.colors.text.primary }}>Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerDetails.email}
                        onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-1"
                        style={{
                          background: `${PremiumTheme.colors.dark[800]}80`,
                          borderColor: PremiumTheme.colors.border.medium,
                          color: PremiumTheme.colors.text.primary
                        }}
                      />
                    </div>
                  </div>

                  {/* Delivery Address (only for delivery) */}
                  {orderMode === 'delivery' && (
                    <>
                      {/* Authentication-aware address section */}
                      {isAuthenticated && addresses.length > 0 ? (
                        /* Saved Addresses Dropdown for Logged-in Users */
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium" 
                                   style={{ color: PremiumTheme.colors.text.primary }}>Delivery to:</Label>
                            <select
                              value={selectedAddressId || ''}
                              onChange={(e) => {
                                const addressId = e.target.value;
                                setSelectedAddressId(addressId);
                                
                                if (addressId === 'new') {
                                  // Reset form for new address
                                  setCustomerDetails(prev => ({
                                    ...prev,
                                    address: '',
                                    postcode: ''
                                  }));
                                } else {
                                  // Pre-fill with selected address
                                  const address = addresses.find(addr => addr.id === addressId);
                                  if (address) {
                                    setCustomerDetails(prev => ({
                                      ...prev,
                                      address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}`,
                                      postcode: address.postal_code
                                    }));
                                  }
                                }
                              }}
                              className="mt-1 w-full p-2 rounded border"
                              style={{
                                background: `${PremiumTheme.colors.dark[800]}80`,
                                borderColor: PremiumTheme.colors.border.medium,
                                color: PremiumTheme.colors.text.primary
                              }}
                            >
                              {addresses.map(address => (
                                <option key={address.id} value={address.id}>
                                  {address.address_type || 'Address'}: {address.address_line1}, {address.city}, {address.postal_code}
                                  {address.is_default && ' (Default)'}
                                </option>
                              ))}
                              <option value="new">+ Add New Address</option>
                            </select>
                          </div>
                          
                          {/* Show address form only if adding new address */}
                          {selectedAddressId === 'new' && (
                            <div className="space-y-4 p-4 rounded-lg border" 
                                 style={{ 
                                   background: `${PremiumTheme.colors.dark[800]}40`,
                                   borderColor: PremiumTheme.colors.border.light 
                                 }}>
                              <div>
                                <Label htmlFor="address" className="text-sm font-medium"
                                       style={{ color: PremiumTheme.colors.text.primary }}>New Delivery Address</Label>
                                <Input
                                  id="address"
                                  value={customerDetails.address}
                                  onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                                  required
                                  placeholder="Street address, apartment, etc."
                                  className="mt-1"
                                  style={{
                                    background: `${PremiumTheme.colors.dark[800]}80`,
                                    borderColor: postcodeValidation.isValid === false 
                                      ? PremiumTheme.colors.burgundy[500]
                                      : postcodeValidation.isValid === true
                                      ? PremiumTheme.colors.silver[500]
                                      : PremiumTheme.colors.border.medium,
                                    color: PremiumTheme.colors.text.primary
                                  }}
                                />
                              </div>
                              <div>
                                <Label htmlFor="postcode" className="text-sm font-medium"
                                       style={{ color: PremiumTheme.colors.text.primary }}>Postcode</Label>
                                <div className="relative">
                                  <Input
                                    id="postcode"
                                    value={customerDetails.postcode}
                                    onChange={(e) => handlePostcodeChange(e.target.value)}
                                    required
                                    className="mt-1 pr-10"
                                    style={{
                                      background: `${PremiumTheme.colors.dark[800]}80`,
                                      borderColor: postcodeValidation.isValid === false 
                                        ? PremiumTheme.colors.burgundy[500]
                                        : postcodeValidation.isValid === true
                                        ? PremiumTheme.colors.silver[500]
                                        : PremiumTheme.colors.border.medium,
                                      color: PremiumTheme.colors.text.primary
                                    }}
                                  />
                                  {/* Validation Status Icons */}
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {postcodeValidation.isValidating && (
                                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" 
                                           style={{ borderColor: PremiumTheme.colors.silver[400] }}></div>
                                    )}
                                    {postcodeValidation.isValid === true && (
                                      <CheckIcon className="w-5 h-5" style={{ color: PremiumTheme.colors.silver[400] }} />
                                    )}
                                    {postcodeValidation.isValid === false && (
                                      <AlertCircle className="w-5 h-5" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Regular Address Form for Guests or Users with No Saved Addresses */
                        <>
                          <div>
                            <Label htmlFor="address" className="text-sm font-medium"
                                   style={{ color: PremiumTheme.colors.text.primary }}>Delivery Address</Label>
                            <Input
                              id="address"
                              value={customerDetails.address}
                              onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                              required
                              placeholder="Street address, apartment, etc."
                              className="mt-1"
                              style={{
                                background: `${PremiumTheme.colors.dark[800]}80`,
                                borderColor: postcodeValidation.isValid === false 
                                  ? PremiumTheme.colors.burgundy[500]
                                  : postcodeValidation.isValid === true
                                  ? PremiumTheme.colors.silver[500]
                                  : PremiumTheme.colors.border.medium,
                                color: PremiumTheme.colors.text.primary
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="postcode" className="text-sm font-medium"
                                     style={{ color: PremiumTheme.colors.text.primary }}>Postcode</Label>
                            <div className="relative">
                              <Input
                                id="postcode"
                                value={customerDetails.postcode}
                                onChange={(e) => handlePostcodeChange(e.target.value)}
                                required
                                className="mt-1 pr-10"
                                style={{
                                  background: `${PremiumTheme.colors.dark[800]}80`,
                                  borderColor: postcodeValidation.isValid === false 
                                    ? PremiumTheme.colors.burgundy[500]
                                    : postcodeValidation.isValid === true
                                    ? PremiumTheme.colors.silver[500]
                                    : PremiumTheme.colors.border.medium,
                                  color: PremiumTheme.colors.text.primary
                                }}
                              />
                              {/* Validation Status Icons */}
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                {postcodeValidation.isValidating && (
                                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" 
                                       style={{ borderColor: PremiumTheme.colors.silver[400] }}></div>
                                )}
                                {postcodeValidation.isValid === true && (
                                  <CheckIcon className="w-5 h-5" style={{ color: PremiumTheme.colors.silver[400] }} />
                                )}
                                {postcodeValidation.isValid === false && (
                                  <AlertCircle className="w-5 h-5" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Additional Notes */}
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium"
                           style={{ color: PremiumTheme.colors.text.primary }}>Special Instructions (Optional)</Label>
                    <textarea
                      id="notes"
                      value={customerDetails.notes}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special delivery instructions..."
                      className="mt-1 w-full p-3 rounded border resize-none"
                      rows={3}
                      style={{
                        background: `${PremiumTheme.colors.dark[800]}80`,
                        borderColor: PremiumTheme.colors.border.medium,
                        color: PremiumTheme.colors.text.primary
                      }}
                    />
                  </div>

                  {/* Validation Messages */}
                  {postcodeValidation.message && (
                    <div className="mt-2 space-y-1">
                      {postcodeValidation.isValid === true ? (
                        <div className="flex items-center space-x-2 p-1 rounded" 
                             style={{ background: `${PremiumTheme.colors.silver[500]}20` }}>
                          <CheckIcon className="w-4 h-4" style={{ color: PremiumTheme.colors.silver[400] }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: PremiumTheme.colors.silver[400] }}>
                              {postcodeValidation.message}
                            </p>
                            {postcodeValidation.deliveryFee && (
                              <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                                Delivery fee: £{postcodeValidation.deliveryFee.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : postcodeValidation.isValid === false ? (
                        <div className="p-2 rounded" 
                             style={{ background: `${PremiumTheme.colors.burgundy[500]}20` }}>
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: PremiumTheme.colors.burgundy[400] }} />
                            <div className="space-y-1">
                              {postcodeValidation.errors?.map((error, index) => (
                                <p key={index} className="text-sm" style={{ color: PremiumTheme.colors.burgundy[400] }}>
                                  {error}
                                </p>
                              ))}
                              {postcodeValidation.minimumOrder && totalAmount < postcodeValidation.minimumOrder && (
                                <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                                  Add £{(postcodeValidation.minimumOrder - totalAmount).toFixed(2)} more to reach minimum order
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Time Slot Selection */}
                  <div className="space-y-4">
                    <TimeSlotSelector
                      orderType={orderMode.toUpperCase() as 'DELIVERY' | 'COLLECTION'}
                      selectedTime={selectedTime}
                      selectedDate={selectedDate}
                      onTimeSelect={(time: string, date?: string) => {
                        setSelectedTime(time);
                        if (date) {
                          setSelectedDate(date);
                        }
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Guest Signup Section - Only for Non-Authenticated Users */}
                  {!isAuthenticated && (
                    <div className="p-4 rounded-lg border" 
                         style={{ 
                           background: `${PremiumTheme.colors.royal[800]}20`,
                           borderColor: PremiumTheme.colors.royal[600] 
                         }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold" style={{ color: PremiumTheme.colors.text.primary }}>
                          Save your information for faster checkout
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowGuestSignup(!showGuestSignup)}
                          className="text-sm font-medium" 
                          style={{ color: PremiumTheme.colors.royal[400] }}
                        >
                          {showGuestSignup ? 'Skip' : 'Create Account'}
                        </button>
                      </div>
                      
                      {showGuestSignup ? (
                        <div className="space-y-4">
                          <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                            Create an account to save your addresses, view order history, and reorder quickly.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="guestPassword" className="text-sm font-medium"
                                     style={{ color: PremiumTheme.colors.text.primary }}>Password</Label>
                              <Input
                                id="guestPassword"
                                type="password"
                                value={guestSignupData.password}
                                onChange={(e) => setGuestSignupData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Create password"
                                className="mt-1"
                                style={{
                                  background: `${PremiumTheme.colors.dark[800]}80`,
                                  borderColor: PremiumTheme.colors.border.medium,
                                  color: PremiumTheme.colors.text.primary
                                }}
                              />
                            </div>
                            <div>
                              <Label htmlFor="guestConfirmPassword" className="text-sm font-medium"
                                     style={{ color: PremiumTheme.colors.text.primary }}>Confirm Password</Label>
                              <Input
                                id="guestConfirmPassword"
                                type="password"
                                value={guestSignupData.confirmPassword}
                                onChange={(e) => setGuestSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                placeholder="Confirm password"
                                className="mt-1"
                                style={{
                                  background: `${PremiumTheme.colors.dark[800]}80`,
                                  borderColor: PremiumTheme.colors.border.medium,
                                  color: PremiumTheme.colors.text.primary
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-2">
                            <input
                              type="checkbox"
                              id="agreeToTerms"
                              checked={guestSignupData.agreeToTerms}
                              onChange={(e) => setGuestSignupData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                              className="mt-1"
                            />
                            <label htmlFor="agreeToTerms" className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                              I agree to the Terms of Service and Privacy Policy. I want to receive order updates and promotional offers.
                            </label>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                          Create an account during checkout to save your information and track orders easily.
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="instructions" className="text-sm font-medium"
                           style={{ color: PremiumTheme.colors.text.primary }}>
                      {orderMode === 'delivery' ? 'Delivery Instructions' : 'Collection Notes'} (Optional)
                    </Label>
                    <Input
                      id="instructions"
                      value={customerDetails.instructions}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder={orderMode === 'delivery' 
                        ? 'e.g., Ring doorbell, leave at door, etc.' 
                        : 'Any special requests or notes'
                      }
                      className="mt-1"
                      style={{
                        background: `${PremiumTheme.colors.dark[800]}80`,
                        borderColor: PremiumTheme.colors.border.medium,
                        color: PremiumTheme.colors.text.primary
                      }}
                    />
                  </div>

                  {/* Collection Time Information */}
                  {orderMode === 'collection' && (
                    <div className="p-4 rounded-lg border" 
                         style={{ 
                           background: `${PremiumTheme.colors.dark[800]}10`,
                           borderColor: PremiumTheme.colors.border.medium 
                         }}>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5" style={{ color: PremiumTheme.colors.silver[400] }} />
                        <h4 className="font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
                          Collection Information
                        </h4>
                      </div>
                      <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                        Your order will be ready for collection in approximately 20-25 minutes.
                        We'll send you a confirmation with the exact pickup time.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-3 font-semibold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]} 0%, ${PremiumTheme.colors.royal[500]} 100%)`,
                      boxShadow: PremiumTheme.shadows.glow.royal,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    Continue to Payment
                  </Button>
                </form>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: PremiumTheme.colors.text.primary }}>
                    Payment
                  </h3>
                  <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>
                    Complete your payment to place your order
                  </p>
                </div>

                {/* Stripe Elements Payment Form */}
                {stripeInstance ? (
                  <Elements stripe={stripeInstance} options={{
                    mode: 'payment',
                    amount: Math.round((totalAmount + (orderMode === 'delivery' ? 3.50 : 0)) * 100), // Convert to pence
                    currency: 'gbp',
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: PremiumTheme.colors.silver[500],
                        colorBackground: PremiumTheme.colors.dark[800],
                        colorText: PremiumTheme.colors.text.primary,
                        colorDanger: PremiumTheme.colors.burgundy[400],
                        fontFamily: 'Inter, system-ui, sans-serif',
                        borderRadius: '8px'
                      }
                    }
                  }}>
                    <PaymentForm 
                      customerDetails={customerDetails}
                      orderMode={orderMode}
                      totalAmount={totalAmount + (orderMode === 'delivery' ? 3.50 : 0)}
                      selectedTime={selectedTime}
                      selectedDate={selectedDate}
                      onPaymentSuccess={() => setCurrentStep('success')}
                    />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>Loading payment system...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'success' && (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold" style={{ color: PremiumTheme.colors.text.primary }}>
                    Order Confirmed!
                  </h3>
                  <p className="text-lg" style={{ color: PremiumTheme.colors.text.muted }}>
                    Thank you for your order. We'll start preparing it right away.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={onClose}
                    className="w-full py-3 font-semibold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${PremiumTheme.colors.royal[600]} 0%, ${PremiumTheme.colors.royal[500]} 100%)`,
                      boxShadow: PremiumTheme.shadows.glow.royal,
                      color: PremiumTheme.colors.text.primary
                    }}
                  >
                    Back to Menu
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Order Summary */}
          <div className="w-96 border-l p-6 overflow-y-auto" 
               style={{ borderColor: PremiumTheme.colors.border.medium }}>
            <div className="sticky top-0">
              <h4 className="text-lg font-semibold mb-4" style={{ color: PremiumTheme.colors.text.primary }}>
                Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
              </h4>
              
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start py-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: PremiumTheme.colors.text.primary }}>
                        {item.name}
                      </p>
                      {item.variant?.name && (
                        <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                          {item.variant.name}
                        </p>
                      )}
                      <p className="text-xs" style={{ color: PremiumTheme.colors.text.muted }}>
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-sm" style={{ color: PremiumTheme.colors.silver[400] }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" style={{ backgroundColor: PremiumTheme.colors.border.medium }} />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>Subtotal:</span>
                  <span className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
                    {formatPrice(totalAmount)}
                  </span>
                </div>
                {orderMode === 'delivery' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: PremiumTheme.colors.text.muted }}>Delivery:</span>
                    <span className="text-sm font-medium" style={{ color: PremiumTheme.colors.text.primary }}>
                      £3.50
                    </span>
                  </div>
                )}
                <Separator className="my-2" style={{ backgroundColor: PremiumTheme.colors.border.medium }} />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold" style={{ color: PremiumTheme.colors.text.primary }}>Total:</span>
                  <span className="text-lg font-bold" style={{ color: PremiumTheme.colors.silver[400] }}>
                    {formatPrice(totalAmount + (orderMode === 'delivery' ? 3.50 : 0))}
                  </span>
                </div>
              </div>
              
              <Badge 
                variant="outline" 
                className="w-full justify-center mt-4 py-2"
                style={{ 
                  borderColor: PremiumTheme.colors.silver[400],
                  color: PremiumTheme.colors.silver[400]
                }}
              >
                {orderMode === 'delivery' ? '🚗 Delivery Order' : '🥡 Collection Order'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component
export { CheckoutOverlay };
