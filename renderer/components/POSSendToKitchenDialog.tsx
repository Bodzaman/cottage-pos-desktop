import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, CreditCard, Receipt, Clock, Package, Truck, User, Phone, MapPin, Utensils, ImageIcon, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { QSAITheme, styles } from '../utils/QSAIDesign';
import { OrderItem } from '../utils/menuTypes';
import POSTipSelector, { TipSelection } from './POSTipSelector';
import POSUnifiedPaymentModal from './POSUnifiedPaymentModal';
import { PaymentResult } from '../utils/menuTypes';
import { safeCurrency, safeTotalWithTip } from '../utils/numberUtils';
import OptimizedImage from './OptimizedImage';

interface POSSendToKitchenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  orderType: "WAITING" | "COLLECTION" | "DELIVERY";
  orderTotal: number;
  tableNumber?: number;
  // Enhanced customer data props
  customerFirstName?: string;
  customerLastName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerStreet?: string;
  customerPostcode?: string;
  guestCount?: number;
  onPlaceOrder: () => void; // Print receipts, manual payment later
  onTakePayment: (tipSelection: TipSelection) => void; // Open payment processing flow
  onPaymentComplete?: () => void; // Complete the payment and clear cart
}

type DialogStep = 'main' | 'tip-selection' | 'payment-processing';

/**
 * Enhanced Send to Kitchen Dialog
 * Provides comprehensive order recap with customer details, item thumbnails, and customizations
 * Staff can confidently read order back to customers or review for accuracy
 */
export function POSSendToKitchenDialog({
  isOpen,
  onClose,
  orderItems,
  orderType,
  orderTotal,
  tableNumber,
  customerFirstName,
  customerLastName,
  customerPhone,
  customerAddress,
  customerStreet,
  customerPostcode,
  guestCount,
  onPlaceOrder,
  onTakePayment,
  onPaymentComplete
}: POSSendToKitchenDialogProps) {
  const [currentStep, setCurrentStep] = useState<'tip-selection' | 'payment-processing'>('tip-selection');
  const [showUnifiedPayment, setShowUnifiedPayment] = useState(false);
  const [selectedTip, setSelectedTip] = useState<TipSelection>({ type: 'none', amount: 0 });
  
  // Get order type display info
  const getOrderTypeInfo = () => {
    switch (orderType) {
      case 'WAITING':
        return {
          icon: Clock,
          label: "Customer Waiting"
        };
      case 'COLLECTION':
        return {
          icon: ShoppingBag,
          label: "Collection Order"
        };
      case 'DELIVERY':
        return {
          icon: Truck,
          label: "Delivery Order"
        };
      case 'DINE-IN':
      default:
        return {
          icon: Utensils,
          label: "Dine-In Order"
        };
    }
  };
  
  const orderInfo = getOrderTypeInfo();
  const IconComponent = orderInfo.icon;
  
  // Enhanced customer info display with complete details
  const getCustomerDisplayInfo = () => {
    const fullName = [customerFirstName, customerLastName].filter(Boolean).join(' ');
    
    switch (orderType) {
      case 'WAITING':
        return {
          primary: fullName || 'Walk-in Customer',
          secondary: customerPhone || null,
          icon: User
        };
      case 'COLLECTION':
        return {
          primary: fullName || 'Collection Customer',
          secondary: customerPhone || 'Phone number needed',
          icon: User
        };
      case 'DELIVERY':
        const address = [customerStreet, customerPostcode].filter(Boolean).join(', ') || customerAddress;
        return {
          primary: fullName || 'Delivery Customer',
          secondary: address || 'Address needed',
          tertiary: customerPhone || 'Phone number needed',
          icon: MapPin
        };
      default:
        return {
          primary: fullName || 'Customer',
          secondary: null,
          icon: User
        };
    }
  };
  
  // Generate item thumbnail with fallback
  const getItemThumbnail = (item: OrderItem) => {
    if (item.image_url) {
      return (
        <OptimizedImage
          fallbackUrl={item.image_url}
          variant="thumbnail"
          alt={item.name}
          className="w-12 h-12 rounded-lg object-cover border border-white/20"
        />
      );
    }
    
    return (
      <div className="w-12 h-12 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-purple-400" />
      </div>
    );
  };
  
  // Format customizations and modifiers
  const getItemCustomizations = (item: OrderItem) => {
    const customizations = [];
    
    // Add protein type if different from default
    if (item.protein_type) {
      customizations.push(`${item.protein_type}`);
    }
    
    // Add modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach(modifier => {
        if (modifier.selected) {
          const modText = modifier.price > 0 ? 
            `${modifier.name} (+£${modifier.price.toFixed(2)})` : 
            modifier.name;
          customizations.push(modText);
        }
      });
    }
    
    // Add customizations
    if (item.customizations && item.customizations.length > 0) {
      item.customizations.forEach(customization => {
        if (customization.selected) {
          const custText = customization.additional_cost > 0 ? 
            `${customization.name} (+£${customization.additional_cost.toFixed(2)})` : 
            customization.name;
          customizations.push(custText);
        }
      });
    }
    
    // Add notes if present
    if (item.notes && item.notes.trim()) {
      customizations.push(`Note: ${item.notes}`);
    }
    
    return customizations;
  };
  
  const customerInfo = getCustomerDisplayInfo();
  
  // Handle place order (receipts only)
  const handlePlaceOrder = () => {
    onPlaceOrder();
    onClose();
    setCurrentStep('main');
  };
  
  // Handle take payment button (go to tip selection)
  const handleTakePaymentClick = () => {
    setCurrentStep('tip-selection');
  };
  
  // Handle tip selection completion
  const handleTipSelected = (tip: TipSelection) => {
    setSelectedTip(tip);
  };
  
  // Handle proceed to payment
  const handleProceedToPayment = () => {
    setCurrentStep('payment-processing');
    setShowUnifiedPayment(true);
  };
  
  // Handle payment completion
  const handlePaymentComplete = (tipSelection: TipSelection, paymentResult?: PaymentResult) => {
    setShowUnifiedPayment(false);
    onTakePayment(tipSelection);
    onClose();
    setCurrentStep('tip-selection');
  };
  
  // Calculate total with tip
  const totalWithTip = safeTotalWithTip(orderTotal, selectedTip.amount);
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" style={styles.glassCard}>
          {/* Header - Fixed at top */}
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <ChefHat className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
              {currentStep === 'main' && 'Send to Kitchen'}
              {currentStep === 'tip-selection' && 'Select Tip Amount'}
              {currentStep === 'payment-processing' && 'Process Payment'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Content - Scrollable middle section */}
          <div className="flex-1 overflow-y-auto">
            {/* Enhanced Order Recap - At a Glance */}
            <Card style={styles.frostedGlassStyle} className="mb-6">
              <CardContent className="p-4">
                {/* Order Type Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5" style={{ color: QSAITheme.purple.primary }} />
                    <span className="font-semibold text-white">{orderInfo.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-600 text-white">
                    {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                {/* Enhanced Customer Information */}
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-start gap-3">
                    <customerInfo.icon className="h-5 w-5 mt-0.5" style={{ color: QSAITheme.purple.primary }} />
                    <div className="flex-1">
                      <div className="font-medium text-white">{customerInfo.primary}</div>
                      {customerInfo.secondary && (
                        <div className="text-sm text-white/70 flex items-center gap-1 mt-1">
                          {orderType === 'DELIVERY' ? <MapPin className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                          {customerInfo.secondary}
                        </div>
                      )}
                      {customerInfo.tertiary && (
                        <div className="text-sm text-white/70 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {customerInfo.tertiary}
                        </div>
                      )}
                      {tableNumber && (
                        <div className="text-sm text-white/70 flex items-center gap-1 mt-1">
                          <Utensils className="h-3 w-3" />
                          Table {tableNumber}{guestCount && guestCount > 1 ? ` • ${guestCount} guests` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Items List - Natural flow without nested scroll */}
                <div className="mb-4 space-y-3">
                  {orderItems.map((item, index) => {
                    const customizations = getItemCustomizations(item);
                    return (
                      <div key={index} className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-start gap-3">
                          {/* Item Thumbnail */}
                          <div className="flex-shrink-0">
                            {getItemThumbnail(item)}
                            <div className="w-12 h-12 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center" style={{ display: 'none' }}>
                              <ImageIcon className="h-6 w-6 text-purple-400" />
                            </div>
                          </div>
                          
                          {/* Item Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white text-sm">
                                    {item.quantity}x {item.name}
                                  </span>
                                  {item.variantName && 
                                   item.variantName !== item.name && 
                                   item.variantName.toLowerCase() !== 'standard' && (
                                    <Badge variant="outline" className="text-xs bg-white/10 text-white/80 border-white/20">
                                      {item.variantName}
                                    </Badge>
                                  )}
                                </div>
                                
                                {/* Customizations Display */}
                                {customizations.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {customizations.map((customization, custIndex) => (
                                      <div key={custIndex} className="text-xs text-green-400 flex items-center gap-1">
                                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                        {customization}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Item Price */}
                              <div className="text-sm font-medium text-white ml-3">
                                £{(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Order Total - Fixed at bottom */}
                <div className="flex justify-between items-center text-lg border-t border-white/10 pt-3">
                  <span className="text-white/80">Order Total:</span>
                  <span className="font-bold text-white">
                    {currentStep === 'main' ? safeCurrency(orderTotal) : safeCurrency(totalWithTip)}
                  </span>
                </div>
                
                {currentStep !== 'main' && selectedTip.amount > 0 && (
                  <div className="text-sm text-green-400 mt-1">
                    Includes {safeCurrency(selectedTip.amount)} tip
                    {selectedTip.type === 'percentage' && selectedTip.percentage && (
                      <span> ({selectedTip.percentage}%)</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Actions - Fixed at bottom */}
          <div className="flex-shrink-0 pt-4 border-t border-white/10">
            {/* Main Options */}
            {currentStep === 'main' && (
              <div className="space-y-4">
                {/* Visual separator line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <p className="text-center text-white/80 font-medium">
                  Choose how to proceed with this order:
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Place Order Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:border-white/30 border border-white/10 group"
                      style={styles.frostedGlassStyle}
                      onClick={handlePlaceOrder}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                            <Receipt className="h-6 w-6 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 text-shadow-sm">PLACE ORDER</h3>
                            <p className="text-sm text-white/60">
                              Print kitchen and customer receipts • Payment collected manually later
                            </p>
                          </div>
                          {/* Directional indicator */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  {/* Take Payment Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className="cursor-pointer transition-all duration-200 hover:border-white/30 border border-white/10 group"
                      style={styles.frostedGlassStyle}
                      onClick={handleTakePaymentClick}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white mb-1 text-shadow-sm">TAKE PAYMENT</h3>
                            <p className="text-sm text-white/60">
                              Process payment with tip options • Complete transaction now
                            </p>
                          </div>
                          {/* Directional indicator */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            )}
            
            {/* Tip Selection Step */}
            {currentStep === 'tip-selection' && (
              <div className="space-y-6">
                <POSTipSelector
                  subtotal={orderTotal}
                  onTipSelected={handleTipSelected}
                  initialTip={selectedTip}
                />
                
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Proceed to Payment
                    <span className="ml-2 font-bold">{safeCurrency(totalWithTip)}</span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Payment Processing Step */}
            {currentStep === 'payment-processing' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 border border-green-500/30 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Processing Payment</h3>
                <p className="text-white/60">Payment flow will open...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Unified Payment Modal - Replaces POSPaymentSelector + POSStripePayment */}
      <POSUnifiedPaymentModal
        isOpen={showUnifiedPayment}
        onClose={() => {
          setShowUnifiedPayment(false);
          setCurrentStep('tip-selection');
        }}
        orderItems={orderItems}
        orderTotal={orderTotal}
        orderType={orderType}
        tableNumber={tableNumber}
        customerFirstName={customerFirstName}
        customerLastName={customerLastName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        customerStreet={customerStreet}
        customerPostcode={customerPostcode}
        guestCount={guestCount}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
}

export default POSSendToKitchenDialog;
