import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DeliveryMethod, CheckoutData } from '../pages/Checkout';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { AlertCircle, Check, Phone } from 'lucide-react';

interface Props {
  checkoutData: CheckoutData;
  cartItems: any[];
  totalAmount: number;
  contactPhone: string;
  onPhoneChange: (phone: string) => void;
}

export function OrderSummary({ 
  checkoutData, 
  cartItems, 
  totalAmount, 
  contactPhone, 
  onPhoneChange 
}: Props) {
  const { user, addresses } = useSimpleAuth();
  
  // Format price to GBP
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };
  
  // Get the selected address details for display
  const getAddressDetails = () => {
    if (checkoutData.deliveryMethod === 'pickup') {
      return (
        <p className="text-tandoor-platinum">
          Cottage Tandoori, 25 High Street, Tandoori Town
        </p>
      );
    }
    
    if (checkoutData.addressId) {
      const selectedAddress = addresses.find(addr => addr.id === checkoutData.addressId);
      if (selectedAddress) {
        return (
          <div className="text-tandoor-platinum">
            <p>{selectedAddress.address_line1}</p>
            {selectedAddress.address_line2 && <p>{selectedAddress.address_line2}</p>}
            <p>{selectedAddress.city}, {selectedAddress.postal_code}</p>
          </div>
        );
      }
    }
    
    if (checkoutData.customAddress) {
      const addr = checkoutData.customAddress;
      return (
        <div className="text-tandoor-platinum">
          <p>{addr.addressLine1}</p>
          {addr.addressLine2 && <p>{addr.addressLine2}</p>}
          <p>{addr.city}, {addr.postcode}</p>
          {addr.instructions && (
            <p className="mt-2 italic text-sm text-tandoor-offwhite">{addr.instructions}</p>
          )}
        </div>
      );
    }
    
    return <p className="text-red-400">No address selected</p>;
  };
  
  // Get time slot details
  const getTimeDetails = () => {
    if (!checkoutData.timeSlot.date || !checkoutData.timeSlot.time) {
      return <p className="text-red-400">No time selected</p>;
    }
    
    const date = new Date(checkoutData.timeSlot.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    // Format the time from 24h to 12h
    const [hours, minutes] = checkoutData.timeSlot.time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const formattedTime = `${hour12}:${minutes} ${ampm}`;
    
    return (
      <p className="text-tandoor-platinum">
        {formattedDate} at {formattedTime}
      </p>
    );
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif font-medium text-tandoor-platinum">Review Order</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-8">
          {/* Order Details Summary */}
          <div className="space-y-4">
            <h3 className="font-medium text-tandoor-orange">Order Details</h3>
            
            <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 p-4 space-y-4">
              {/* Delivery Method */}
              <div>
                <h4 className="text-sm font-medium text-tandoor-offwhite mb-1">
                  {checkoutData.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup'}
                </h4>
                {getAddressDetails()}
              </div>
              
              {/* Time Slot */}
              <div className="pt-3 border-t border-tandoor-platinum/10">
                <h4 className="text-sm font-medium text-tandoor-offwhite mb-1">
                  {checkoutData.deliveryMethod === 'delivery' ? 'Delivery Time' : 'Pickup Time'}
                </h4>
                {getTimeDetails()}
              </div>
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-tandoor-orange">Contact Information</h3>
            
            <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 p-4 space-y-4">
              {/* Name & Email */}
              <div>
                <h4 className="text-sm font-medium text-tandoor-offwhite mb-1">Name & Email</h4>
                {user ? (
                  <div className="text-tandoor-platinum">
                    <p>{user.profile?.first_name} {user.profile?.last_name}</p>
                    <p className="text-tandoor-offwhite">{user.email}</p>
                  </div>
                ) : (
                  <p className="text-tandoor-offwhite">Guest Order</p>
                )}
              </div>
              
              {/* Phone */}
              <div className="pt-3 border-t border-tandoor-platinum/10">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-tandoor-offwhite flex items-center gap-2">
                    <Phone className="h-4 w-4 text-tandoor-orange" />
                    Contact Phone (for delivery/pickup updates) *
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="Phone number"
                    className="bg-gray-800/50 border-tandoor-platinum/30 text-tandoor-platinum"
                    required
                  />
                  {!contactPhone && (
                    <p className="text-xs text-red-400 mt-1">Please provide a contact phone number</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="space-y-4">
          <h3 className="font-medium text-tandoor-orange">Order Items</h3>
          
          <div className="bg-gray-800/40 rounded-lg border border-tandoor-platinum/20 overflow-hidden">
            <ScrollArea className="max-h-[300px]">
              <div className="p-4 space-y-4">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-800/30 transition-colors">
                      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-tandoor-orange/20 text-tandoor-orange mt-0.5">
                        <span className="text-xs font-medium">{item.quantity}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-tandoor-platinum font-medium">{item.menuItem.name}</h4>
                        <p className="text-sm text-tandoor-offwhite">{item.variant.name}</p>
                        {item.specialInstructions && (
                          <p className="text-xs text-tandoor-offwhite italic mt-1">{item.specialInstructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-tandoor-platinum font-medium">
                          {formatPrice(parseFloat(item.variant.price) * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center">
                    <p className="text-tandoor-offwhite">No items in cart</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-tandoor-platinum/10 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-tandoor-offwhite">Subtotal</span>
                <span className="text-sm font-medium text-tandoor-platinum">{formatPrice(totalAmount)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-tandoor-offwhite">Delivery Fee</span>
                <span className="text-sm font-medium text-tandoor-platinum">
                  {formatPrice(checkoutData.deliveryMethod === 'delivery' ? 2.50 : 0)}
                </span>
              </div>
              
              <div className="pt-2 border-t border-tandoor-platinum/10">
                <div className="flex justify-between font-medium">
                  <span className="text-tandoor-platinum">Total</span>
                  <span className="text-tandoor-orange">
                    {formatPrice(totalAmount + (checkoutData.deliveryMethod === 'delivery' ? 2.50 : 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <Alert className="bg-gray-800/40 border-tandoor-orange/30">
            <AlertCircle className="h-4 w-4 text-tandoor-orange" />
            <AlertDescription className="text-sm text-tandoor-offwhite">
              {checkoutData.deliveryMethod === 'delivery' ? (
                <>Please verify your delivery address and contact information before proceeding to payment.</>  
              ) : (
                <>Please verify your pickup information and contact number before proceeding to payment.</>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
