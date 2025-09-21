


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalColors } from 'utils/QSAIDesign';
import { EnhancedDeliveryAddressForm } from './EnhancedDeliveryAddressForm';
import { MapPin, X, User, Users } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: CustomerData) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  initialData?: Partial<CustomerData>;
  orderValue?: number; // Order total for delivery validation
  onOrderTypeSwitch?: (newOrderType: 'COLLECTION') => void; // Add callback for order type switching
  onManagerOverride?: () => void; // Add callback for manager override
}

interface CustomerData {
  // Common fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  
  // Dine-in specific
  tableNumber?: string;
  guestCount?: number;
  
  // Delivery specific
  address?: string;
  street?: string;
  city?: string;
  postcode?: string;
  deliveryNotes?: string;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderType,
  initialData = {},
  orderValue,
  onOrderTypeSwitch,
  onManagerOverride
}) => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    notes: '',
    tableNumber: '',
    guestCount: 2,
    address: '',
    street: '',
    city: '',
    postcode: '',
    deliveryNotes: '',
    ...initialData
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setCustomerData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        notes: '',
        tableNumber: '',
        guestCount: 2,
        address: '',
        street: '',
        city: '',
        postcode: '',
        deliveryNotes: '',
        ...initialData
      });
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    // Basic validation
    if (orderType === 'DINE-IN' && !customerData.tableNumber) {
      alert('Please select a table number');
      return;
    }
    
    if ((orderType === 'COLLECTION' || orderType === 'DELIVERY' || orderType === 'WAITING') && !customerData.firstName) {
      alert('Please enter customer name');
      return;
    }
    
    if (orderType === 'DELIVERY' && (!customerData.street || !customerData.postcode)) {
      alert('Please enter delivery address');
      return;
    }
    
    // Delivery validation for DELIVERY orders
    if (orderType === 'DELIVERY' && orderValue !== undefined) {
      try {
        const fullAddress = `${customerData.street}, ${customerData.city || ''}, ${customerData.postcode}`.replace(/, ,/g, ',').trim();
        
        const validationResponse = await brain.validate_delivery_address({
          address: fullAddress,
          postcode: customerData.postcode || '',
          order_total: orderValue
        });
        
        const validationData = await validationResponse.json();
        
        if (!validationData.valid) {
          // Show validation errors to staff
          const errorMessage = validationData.errors?.join('\n') || 'Delivery validation failed';
          alert(`Delivery validation failed:\n\n${errorMessage}\n\nPlease correct the issues before proceeding.`);
          return;
        }
        
        // Success - delivery address is valid
        toast.success(`Delivery validated successfully. Distance: ${validationData.distance_miles?.toFixed(1)} miles`);
        
      } catch (error) {
        console.error('Delivery validation error:', error);
        alert('Unable to validate delivery address. Please check the address and try again.');
        return;
      }
    }
    
    onSave(customerData);
    onClose();
  };

  const handleInputChange = (field: keyof CustomerData, value: string | number) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (orderType) {
      case 'DINE-IN': return 'Table Details';
      case 'DELIVERY': return 'Customer & Delivery Details';
      case 'COLLECTION': return 'Customer Details';
      case 'WAITING': return 'Customer Details';
      default: return 'Customer Details';
    }
  };

  const getModalIcon = () => {
    switch (orderType) {
      case 'DINE-IN': return <Users className="w-6 h-6" />;
      case 'DELIVERY': return <MapPin className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        <div 
          className="px-6 py-5 border-b flex items-center justify-between"
          style={{
            borderBottomColor: 'rgba(255, 255, 255, 0.1)',
            background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, rgba(124, 93, 250, 0.05) 100%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
                boxShadow: `0 4px 12px ${globalColors.purple.primary}30`
              }}
            >
              {getModalIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{getModalTitle()}</h2>
              <p className="text-sm text-gray-400">Complete the details to continue</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            
            {/* Dine-in specific fields */}
            {orderType === 'DINE-IN' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Table Number *</Label>
                    <Select value={customerData.tableNumber} onValueChange={(value) => handleInputChange('tableNumber', value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            Table {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-gray-300 mb-2 block">Number of Guests</Label>
                    <Select 
                      value={customerData.guestCount?.toString() || '2'} 
                      onValueChange={(value) => handleInputChange('guestCount', parseInt(value))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'Guest' : 'Guests'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Customer name fields for non-dine-in orders */}
            {(orderType === 'COLLECTION' || orderType === 'DELIVERY' || orderType === 'WAITING') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">First Name *</Label>
                    <Input
                      value={customerData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-300 mb-2 block">Last Name</Label>
                    <Input
                      value={customerData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Phone Number</Label>
                    <Input
                      value={customerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      placeholder="Enter phone number"
                      type="tel"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-gray-300 mb-2 block">Email (Optional)</Label>
                    <Input
                      value={customerData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                      placeholder="Enter email"
                      type="email"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Delivery address fields */}
            {orderType === 'DELIVERY' && (
              <EnhancedDeliveryAddressForm
                customerData={{
                  street: customerData.street,
                  city: customerData.city,
                  postcode: customerData.postcode,
                  deliveryNotes: customerData.deliveryNotes
                }}
                onCustomerDataChange={handleInputChange}
                orderValue={orderValue}
                onOrderTypeSwitch={onOrderTypeSwitch ? () => onOrderTypeSwitch('COLLECTION') : undefined}
                onManagerOverride={onManagerOverride}
              />
            )}
            
            {/* General notes for all order types */}
            <div>
              <Label className="text-gray-300 mb-2 block">Order Notes (Optional)</Label>
              <Textarea
                value={customerData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
                placeholder="Any special instructions or notes..."
                rows={2}
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div 
          className="px-6 py-4 border-t flex justify-end gap-3"
          style={{
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            background: `linear-gradient(135deg, ${globalColors.background.secondary} 0%, ${globalColors.background.primary} 100%)`
          }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-300 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSave}
            className="text-white font-bold px-8 py-3 text-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`,
              boxShadow: `0 6px 20px ${globalColors.purple.primary}40, 0 2px 4px rgba(0,0,0,0.1)`,
              border: `1px solid ${globalColors.purple.light}20`,
              borderRadius: '12px',
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              minWidth: '160px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${globalColors.purple.light} 0%, ${globalColors.purple.primary} 100%)`;
              e.currentTarget.style.boxShadow = `0 8px 25px ${globalColors.purple.primary}50, 0 4px 8px rgba(0,0,0,0.15)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`;
              e.currentTarget.style.boxShadow = `0 6px 20px ${globalColors.purple.primary}40, 0 2px 4px rgba(0,0,0,0.1)`;
            }}
          >
            <span className="relative z-10">TAKE ORDER</span>
            {/* Animated background overlay */}
            <div 
              className="absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
              style={{
                background: `linear-gradient(45deg, transparent 0%, ${globalColors.purple.glow} 50%, transparent 100%)`,
                transform: 'translateX(-100%)',
                animation: 'shimmer 2s infinite'
              }}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
