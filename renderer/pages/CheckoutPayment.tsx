import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UniversalHeader } from 'components/UniversalHeader';
import { Footer } from 'components/Footer';
import { useSimpleAuth } from 'utils/simple-auth-context';
import { StripeCheckout } from 'components/StripeCheckout';
import { apiClient } from 'app';
import { toast } from 'sonner';
import { supabase } from 'utils/supabaseClient';
import { FaCreditCard, FaLock, FaMapMarkerAlt, FaClock, FaPhone, FaUser, FaReceipt } from 'react-icons/fa';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

// Types
interface RestaurantConfig {
  name: string;
  address: string;
  postcode: string;
  phone: string;
  email?: string;
  delivery_fee: number;
  delivery_free_over: number;
  delivery_min_order: number;
  estimated_delivery_time: string;
  estimated_collection_time: string;
  delivery_enabled: boolean;
}

interface CheckoutData {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
    notes?: string;
    image_url?: string;
  }>;

  delivery: {
    method: 'delivery' | 'collection';
    address?: any;
    scheduledTime?: string;
  };
  total: number;
  subtotal: number;
  delivery_fee: number;
  tip_amount: number;
  order_notes?: string;
}

// ✅ Data validation utility
const validateCheckoutData = (data: any): CheckoutData | null => {
  try {
    if (!data || typeof data !== 'object') {
      console.error('❌ CheckoutPayment: Invalid checkout data - not an object');
      return null;
    }

    // Handle both data formats
    let deliveryMethod: 'delivery' | 'collection';
    let deliveryAddress: any = undefined;

    // Format 1: CheckoutView format - delivery: { method, address }
    if (data.delivery && typeof data.delivery === 'object') {
      if (!data.delivery.method || !['delivery', 'collection'].includes(data.delivery.method)) {
        console.error('❌ CheckoutPayment: Invalid delivery method:', data.delivery.method);
        return null;
      }
      deliveryMethod = data.delivery.method;
      deliveryAddress = data.delivery.address;
    }
    // Format 2: Alternative format - orderType: "COLLECTION" or "DELIVERY"
    else if (data.orderType && typeof data.orderType === 'string') {
      const orderType = data.orderType.toLowerCase();
      if (!['delivery', 'collection'].includes(orderType)) {
        console.error('❌ CheckoutPayment: Invalid orderType:', data.orderType);
        return null;
      }
      deliveryMethod = orderType as 'delivery' | 'collection';
      deliveryAddress = data.delivery_address || data.deliveryAddress || undefined;
    }
    else {
      console.error('❌ CheckoutPayment: Missing delivery data and orderType');
      return null;
    }

    // Validate items array
    if (!Array.isArray(data.items) || data.items.length === 0) {
      console.error('❌ CheckoutPayment: Invalid or empty items array');
      return null;
    }

    // Validate required numeric fields
    if (typeof data.total !== 'number' || typeof data.subtotal !== 'number') {
      console.error('❌ CheckoutPayment: Invalid total or subtotal');
      return null;
    }

    console.log('✅ CheckoutPayment: Successfully parsed delivery method:', deliveryMethod);

    // Return validated data with unified structure
    return {
      items: data.items,
      delivery: {
        method: deliveryMethod,
        address: deliveryAddress || undefined,
        scheduledTime: data.scheduledTime || data.delivery?.scheduledTime || undefined
      },
      total: data.total,
      subtotal: data.subtotal,
      delivery_fee: data.delivery_fee || 0,
      tip_amount: data.tip_amount || 0,
      order_notes: data.order_notes || undefined
    };
  } catch (error) {
    console.error('❌ CheckoutPayment: Error validating checkout data:', error);
    return null;
  }
};

export default function CheckoutPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useSimpleAuth();
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [restaurantConfig, setRestaurantConfig] = useState<RestaurantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  // Prevent duplicate order creation from React StrictMode double-mount
  const isCreatingOrderRef = useRef(false);

  // Load restaurant configuration on mount
  useEffect(() => {
    const loadRestaurantConfig = async () => {
      try {
        const response = await apiClient.get_restaurant_config();
        const data: RestaurantConfig = await response.json();
        setRestaurantConfig(data);
      } catch (error) {
        console.error('Failed to load restaurant config:', error);
      }
    };

    loadRestaurantConfig();
  }, []);

  // Initialize checkout data from Router state OR sessionStorage (fallback)
  useEffect(() => {
    const initializeCheckout = async () => {
      console.log('🔍 CheckoutPayment: Initializing checkout data...');
      
      try {
        // Priority 1: Try React Router state
        if (location.state?.checkoutData) {
          console.log('📦 CheckoutPayment: Loading from Router state');
          const validatedData = validateCheckoutData(location.state.checkoutData);
          if (validatedData) {
            setCheckoutData(validatedData);
            console.log('✅ CheckoutPayment: Validated checkout data from Router state');
            setIsLoading(false);
            return;
          }
        }

        // Priority 2: Fallback to sessionStorage (for backwards compatibility)
        const storedData = sessionStorage.getItem('checkoutData');
        if (storedData) {
          console.log('📦 CheckoutPayment: Loading from sessionStorage (fallback)');
          const rawData = JSON.parse(storedData);
          const validatedData = validateCheckoutData(rawData);
          if (validatedData) {
            setCheckoutData(validatedData);
            console.log('✅ CheckoutPayment: Validated checkout data from sessionStorage');
            setIsLoading(false);
            return;
          }
        }
        
        // No valid data found
        setError('No checkout data found. Please return to checkout.');
        setIsLoading(false);
      } catch (error) {
        console.error('❌ CheckoutPayment: Initialization error:', error);
        setError('Something went wrong. Please try again.');
        setIsLoading(false);
      }
    };

    initializeCheckout();
  }, [location.state]);

  // Create order in Supabase BEFORE Adyen session
  useEffect(() => {
    const createOrder = async () => {
      // ATOMIC GUARD: Check and set ref FIRST to prevent race condition
      // This must happen before ANY other logic to block duplicate calls in React StrictMode
      if (isCreatingOrderRef.current) {
        console.log('⚠️ [CheckoutPayment] Order creation already in progress, skipping duplicate call');
        return;
      }
      isCreatingOrderRef.current = true;
      
      // THEN check other conditions
      if (!checkoutData || orderCreated) {
        console.log('⚠️ [CheckoutPayment] Missing checkout data or order already created, resetting guard');
        isCreatingOrderRef.current = false; // Reset if we're not proceeding
        return;
      }

      try {
        console.log('📝 [CheckoutPayment] Creating order in Supabase');
        
        // Log the exact payload being sent
        const orderPayload = {
          items: checkoutData.items.map(item => ({
            ...item,
            id: String(item.id) // Convert to string to match backend Pydantic model
          })),
          delivery: checkoutData.delivery,
          total: checkoutData.total,
          subtotal: checkoutData.subtotal,
          delivery_fee: checkoutData.delivery_fee,
          tip_amount: checkoutData.tip_amount,
          order_notes: checkoutData.order_notes,
          customer_id: user?.id, // Link order to authenticated user
          customer_email: user?.email,
          customer_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest',
          customer_phone: user?.phone || undefined
        };
        
        console.log('🔍 [CheckoutPayment] Order payload:', JSON.stringify(orderPayload, null, 2));

        const response = await apiClient.create_online_order(orderPayload);
        
        console.log('📡 [CheckoutPayment] Response status:', response.status);
        console.log('📡 [CheckoutPayment] Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Capture raw response text first
        const responseText = await response.text();
        console.log('📦 [CheckoutPayment] Raw response text:', responseText);
        
        // Try to parse as JSON
        let result;
        try {
          result = JSON.parse(responseText);
          console.log('📦 [CheckoutPayment] Parsed response data:', JSON.stringify(result, null, 2));
        } catch (parseError) {
          console.error('❌ [CheckoutPayment] Failed to parse response as JSON:', parseError);
          console.error('❌ [CheckoutPayment] Response was:', responseText);
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
        }

        if (result.success && result.order_id) {
          console.log('✅ [CheckoutPayment] Order created successfully:', result.order_id);
          setCreatedOrderId(result.order_id);
          setOrderCreated(true);
        } else {
          console.error('❌ [CheckoutPayment] Order creation failed:', result.message);
          console.error('❌ [CheckoutPayment] Full error response:', JSON.stringify(result, null, 2));
          setError('Failed to create order. Please try again.');
          toast.error('Order creation failed', {
            description: result.message
          });
          // Reset flag on failure to allow retry
          isCreatingOrderRef.current = false;
        }
      } catch (error) {
        console.error('❌ [CheckoutPayment] Error creating order:', error);
        console.error('❌ [CheckoutPayment] Error name:', (error as Error).name);
        console.error('❌ [CheckoutPayment] Error message:', (error as Error).message);
        console.error('❌ [CheckoutPayment] Error stack:', (error as Error).stack);
        setError('Failed to create order. Please try again.');
        toast.error('Order creation failed', {
          description: 'Something went wrong. Please try again.'
        });
        // Reset flag on error to allow retry
        isCreatingOrderRef.current = false;
      }
    };

    createOrder();
  }, [checkoutData, orderCreated, user]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('🎉 CheckoutPayment: Payment successful! Payment Intent ID:', paymentIntentId);
    
    try {
      // ============================================================================
      // CREATE PRINT JOBS IN SUPABASE PRINT QUEUE
      // ============================================================================
      
      if (checkoutData && createdOrderId) {
        console.log('🖨️ [CheckoutPayment] Creating print jobs for online order:', createdOrderId);
        
        // Determine order type from checkout data
        const orderType = checkoutData.delivery.method === 'delivery' ? 'DELIVERY' : 'COLLECTION';
        
        // Fetch template assignments for this order mode
        let kitchenTemplateId = 'classic_restaurant';
        let customerTemplateId = 'classic_restaurant';
        
        try {
          const apiOrderMode = orderType.replace(/-/g, '_');
          const response = await apiClient.get_template_assignment({ orderMode: apiOrderMode });
          const assignment = await response.json();
          
          kitchenTemplateId = assignment.kitchen_template_id || 'classic_restaurant';
          customerTemplateId = assignment.customer_template_id || 'classic_restaurant';
          
          console.log('✅ [CheckoutPayment] Template assignment:', { kitchenTemplateId, customerTemplateId });
        } catch (error) {
          console.warn('⚠️ [CheckoutPayment] Failed to fetch template assignment, using defaults:', error);
        }
        
        // Generate order number
        const orderNumber = `${orderType.charAt(0)}${Date.now().toString().slice(-6)}`;
        
        // Get customer name
        const customerName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest';
        
        // ============================================================================
        // PRINT JOB 1: KITCHEN TICKET
        // ============================================================================
        
        const kitchenJobData = {
          p_job_type: 'KITCHEN_TICKET',
          p_order_data: {
            orderNumber,
            orderType,
            items: checkoutData.items.map(item => ({
              name: item.name,
              variant_name: item.variant || null,
              quantity: item.quantity,
              modifiers: [], // Online orders don't have complex modifiers yet
              special_instructions: item.notes || null
            })),
            customerName,
            deliveryAddress: orderType === 'DELIVERY' ? checkoutData.delivery.address : null,
            timestamp: new Date().toISOString(),
            template_id: kitchenTemplateId
          },
          p_printer_id: null, // Auto-select based on job type
          p_priority: 10 // High priority for kitchen tickets
        };
        
        console.log('🖨️ [CheckoutPayment] Creating kitchen ticket print job:', kitchenJobData);
        
        const { data: kitchenJobId, error: kitchenError } = await supabase.rpc('create_print_job', kitchenJobData);
        
        if (kitchenError) {
          console.error('❌ [CheckoutPayment] Kitchen ticket print job failed:', kitchenError);
        } else {
          console.log('✅ [CheckoutPayment] Kitchen ticket print job created:', kitchenJobId);
        }
        
        // ============================================================================
        // PRINT JOB 2: CUSTOMER RECEIPT
        // ============================================================================
        
        const receiptJobData = {
          p_job_type: 'CUSTOMER_RECEIPT',
          p_order_data: {
            orderNumber,
            orderType,
            items: checkoutData.items.map(item => ({
              name: item.name,
              variant_name: item.variant || null,
              quantity: item.quantity,
              unitPrice: item.price,
              total: item.price * item.quantity,
              modifiers: []
            })),
            subtotal: checkoutData.subtotal,
            tax: checkoutData.subtotal * 0.20,
            deliveryFee: checkoutData.delivery_fee || 0,
            tipAmount: checkoutData.tip_amount || 0,
            total: checkoutData.total,
            customerName,
            customerPhone: user?.phone || '',
            deliveryAddress: orderType === 'DELIVERY' ? checkoutData.delivery.address : null,
            paymentMethod: 'Card',
            timestamp: new Date().toISOString(),
            template_id: customerTemplateId
          },
          p_printer_id: null, // Auto-select based on job type
          p_priority: 5 // Normal priority
        };
        
        console.log('🖨️ [CheckoutPayment] Creating customer receipt print job:', receiptJobData);
        
        const { data: receiptJobId, error: receiptError } = await supabase.rpc('create_print_job', receiptJobData);
        
        if (receiptError) {
          console.error('❌ [CheckoutPayment] Customer receipt print job failed:', receiptError);
        } else {
          console.log('✅ [CheckoutPayment] Customer receipt print job created:', receiptJobId);
        }
        
        // Show success message even if print jobs fail (payment already succeeded)
        if (kitchenJobId && receiptJobId) {
          console.log('✅ [CheckoutPayment] Both print jobs created successfully');
        }
      }
    } catch (error) {
      console.error('❌ [CheckoutPayment] Error creating print jobs:', error);
      // Don't throw - payment already succeeded, print job failures shouldn't block customer
    }
    
    // Payment already confirmed by StripeCheckout component via brain.confirm_payment()
    // Order status updated to CONFIRMED via Stripe webhook
    // Just redirect to customer portal to view order
    
    toast.success('Order placed successfully!', {
      description: 'Your payment has been processed',
    });
    
    // Redirect to customer portal
    setTimeout(() => {
      navigate('/customer-portal');
    }, 1500);
  };

  const handlePaymentError = useCallback((errorMessage: string) => {
    console.error('❌ CheckoutPayment: Payment failed:', errorMessage);
    toast.error('Payment failed', {
      description: errorMessage
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] text-[#EAECEF] relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
          style={{
            backgroundImage: `url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        
        <div className="relative z-10">
          <UniversalHeader context="AUTH_NAV" />
          <div className="flex min-h-screen items-center justify-center px-4 py-8 pt-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#B7BDC6]">Loading payment...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0C0E] text-[#EAECEF] relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
          style={{
            backgroundImage: `url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        
        <div className="relative z-10">
          <UniversalHeader context="AUTH_NAV" />
          <div className="flex min-h-screen items-center justify-center px-4 py-8 pt-24">
            <div className="w-full max-w-md">
              <Card className="bg-[#17191D]/60 backdrop-blur-xl border border-white/20">
                <CardHeader>
                  <CardTitle className="text-center text-red-400">Payment Error</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-[#B7BDC6]">{error}</p>
                  <Button 
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-[#8B1538] hover:bg-[#7A1230] text-white"
                  >
                    Return to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main payment form
  if (!checkoutData || !restaurantConfig || configLoading) {
    // Show config error with retry option
    if (configError && !configLoading) {
      return (
        <div className="min-h-screen bg-[#0B0C0E] text-[#EAECEF] relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
            style={{
              backgroundImage: `url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center'
            }}
          />
          
          <div className="relative z-10">
            <UniversalHeader context="AUTH_NAV" />
            <div className="flex min-h-screen items-center justify-center px-4 py-8 pt-24">
              <Card className="w-full max-w-md bg-[#17191D]/80 backdrop-blur-xl border-rose-900/30">
                <CardContent className="pt-6 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-900/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-rose-500" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">Configuration Error</h3>
                    <p className="text-sm text-[#B7BDC6]">{configError}</p>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => window.location.reload()}
                      className="flex-1 bg-[#8B1538] hover:bg-[#7A1230] text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/online-orders')}
                      className="flex-1 border-[#8B1538]/30 hover:bg-[#8B1538]/10 text-[#EAECEF]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // Loading state
    return (
      <div className="min-h-screen bg-[#0B0C0E] text-[#EAECEF] relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
          style={{
            backgroundImage: `url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/Sketch_Logo_Cottage_16x9.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center'
          }}
        />
        
        <div className="relative z-10">
          <UniversalHeader context="AUTH_NAV" />
          <div className="flex min-h-screen items-center justify-center px-4 py-8 pt-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#8B1538]/30 border-t-[#8B1538] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#B7BDC6]">
                {configLoading ? 'Loading restaurant configuration...' : orderCreated ? 'Preparing payment...' : 'Creating your order...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only render StripeCheckout AFTER order is created
  if (!createdOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B1538] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Preparing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#EAECEF] relative">
      {/* Full-size background image watermark */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat opacity-20 brightness-110"
        style={{
          backgroundImage: `url('https://static.riff.new/public/88a315b0-faa2-491d-9215-cf1e283cdee2/SIDE 1_TRANSPARENT_BG_BLUE_TINT.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center'
        }}
      />
      
      {/* Content with higher z-index */}
      <div className="relative z-10">
        <UniversalHeader context="AUTH_NAV" />

        {/* Main Content */}
        <div className="flex min-h-screen items-center justify-center px-4 py-8 pt-24">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Page title and description */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-[#EAECEF] mb-3">Complete Your Order</h1>
              <p className="text-[#B7BDC6]">
                Secure payment powered by Stripe. Your order will be sent directly to our kitchen.
              </p>
            </div>
            
            {/* Main Layout with 60/40 Split */}
            <div className="grid gap-8 md:gap-12 lg:grid-cols-[3fr_2fr] xl:gap-16">
              {/* Order Summary Card */}
              <div className="rounded-2xl border bg-[#17191D]/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Border glow effect */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(122, 18, 48, 0.2) 100%)'
                  }}
                />
                
                <div className="relative">
                  <div className="flex items-center gap-2 mb-6">
                    <FaReceipt className="text-[#8B1538]" />
                    <h2 className="text-xl font-semibold text-[#EAECEF]">Order Summary</h2>
                    <Badge variant="secondary" className="ml-auto bg-[#8B1538]/20 text-[#8B1538] border-[#8B1538]/30">
                      {checkoutData.items.length} {checkoutData.items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  
                  {/* Customer Details Section */}
                  <div className="mb-6 p-4 md:p-5 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <FaUser className="text-[#8B1538]" />
                      <span className="font-medium text-[#EAECEF]">
                        {checkoutData.delivery.method === 'collection' ? 'Customer Details' : 'Delivery To'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Customer Name */}
                      <div className="text-[#EAECEF] font-medium">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'}
                      </div>
                      
                      {/* Phone Number */}
                      {user?.phone && (
                        <div className="flex items-center gap-2 text-sm text-[#B7BDC6]">
                          <FaPhone className="text-[#8B1538] text-xs" />
                          <span>{user?.phone}</span>
                        </div>
                      )}
                      
                      {/* Collection/Delivery Address */}
                      {checkoutData.delivery.method === 'collection' ? (
                        <div className="text-sm text-[#B7BDC6] space-y-1">
                          <div className="font-medium text-[#EAECEF]">Collection at {restaurantConfig?.name || 'Cottage Tandoori'}</div>
                          <div>{restaurantConfig?.address || '25 West St, Storrington, Pulborough, West Sussex'}, {restaurantConfig?.postcode || 'RH20 4DZ'}</div>
                          <div className="flex items-center gap-2 text-xs">
                            <FaClock className="text-[#8B1538]" />
                            <span>Estimated pickup: {restaurantConfig?.estimated_collection_time || '15-20 minutes'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <FaPhone className="text-[#8B1538]" />
                            <span>Questions? Call {restaurantConfig?.phone || '01903 743343'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-[#B7BDC6] space-y-1">
                          {checkoutData.delivery.address && (
                            <div>
                              <div>{checkoutData.delivery.address.street || checkoutData.delivery.address.line1}</div>
                              <div>{checkoutData.delivery.address.city}, {checkoutData.delivery.address.postal_code || checkoutData.delivery.address.postcode}</div>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <FaClock className="text-[#8B1538]" />
                            <span>Estimated delivery: {restaurantConfig?.estimated_delivery_time || '25-35 minutes'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Items with Scrollable Container */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <FaReceipt className="text-[#8B1538] text-sm" />
                      <span className="font-medium text-[#EAECEF]">Order Items</span>
                    </div>
                    
                    {/* Scrollable Items Container */}
                    <div 
                      className="space-y-3 max-h-80 overflow-y-auto pr-2 scrollable-items"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#8B1538 rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {/* Custom Scrollbar Styles */}
                      <style>{`
                        .scrollable-items::-webkit-scrollbar {
                          width: 6px;
                        }
                        .scrollable-items::-webkit-scrollbar-track {
                          background: rgba(255, 255, 255, 0.1);
                          border-radius: 3px;
                        }
                        .scrollable-items::-webkit-scrollbar-thumb {
                          background: #8B1538;
                          border-radius: 3px;
                        }
                        .scrollable-items::-webkit-scrollbar-thumb:hover {
                          background: #7A1230;
                        }
                      `}</style>
                      
                      {checkoutData.items.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-lg bg-white/5 backdrop-blur-sm">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg border border-white/10"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjMkEyRDM0Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NEg0NEgyMFYyMFoiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPGNpcmNsZSBjeD0iMjgiIGN5PSIyOCIgcj0iNCIgc3Ryb2tlPSIjNkI3MjgwIiBzdHJva2Utd2lkdGg9IjIiLz4KPGBhdGggZD0iTTIwIDM2TDI4IDI4TDQ0IDQ0IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg border border-white/10 bg-[#2A2D34] flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="18" height="14" x="3" y="5" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="8.5" cy="8.5" r="1.5" stroke="#6B7280" strokeWidth="2"/>
                                  <path d="M3 13l4-4 4 4 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#EAECEF] mb-1 text-sm md:text-base leading-tight">{item.name}</h4>
                            {item.variant && (
                              <p className="text-xs md:text-sm text-[#B7BDC6] mb-1">{item.variant}</p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-[#B7BDC6] italic mb-2 leading-tight">Note: {item.notes}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs md:text-sm text-[#B7BDC6]">Qty: {item.quantity}</span>
                              <span className="font-semibold text-[#EAECEF] text-sm md:text-base">£{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Order Total */}
                  <div className="space-y-3 pt-6 border-t border-white/20">
                    <div className="flex justify-between text-[#B7BDC6] text-base">
                      <span>Subtotal</span>
                      <span>£{checkoutData.subtotal.toFixed(2)}</span>
                    </div>
                    {checkoutData.delivery_fee > 0 && (
                      <div className="flex justify-between text-[#B7BDC6] text-base">
                        <span>Delivery Fee</span>
                        <span>£{checkoutData.delivery_fee.toFixed(2)}</span>
                      </div>
                    )}
                    {checkoutData.tip_amount > 0 && (
                      <div className="flex justify-between text-[#B7BDC6] text-base">
                        <span>Tip</span>
                        <span>£{checkoutData.tip_amount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl md:text-2xl font-bold text-[#EAECEF] pt-3 border-t border-white/20">
                      <span>Total</span>
                      <span>£{checkoutData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Card */}
              <div className="rounded-2xl border bg-[#17191D]/60 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                {/* Border glow effect */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 21, 56, 0.2) 0%, transparent 50%, rgba(122, 18, 48, 0.2) 100%)'
                  }}
                />
                
                <div className="relative">
                  <StripeCheckout
                    orderId={createdOrderId}
                    amount={Math.round(checkoutData.total * 100)} // Convert to pence
                    currency="GBP"
                    orderType={checkoutData.delivery.method === 'delivery' ? 'DELIVERY' : 'COLLECTION'}
                    customerEmail={user?.email || undefined}
                    customerName={
                      user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest'
                    }
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </div>
              </div>
            </div>
            
            {/* Security Notice */}
            <div className="text-center text-sm text-[#B7BDC6] mt-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaLock className="text-[#8B1538]" />
                <span>Secured by Stripe</span>
              </div>
              <p>Your payment information is encrypted and secure. We never store your card details.</p>
            </div>
          </div>
        </div>
        
        <Footer variant="minimal" />
      </div>
    </div>
  );
};
