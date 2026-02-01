import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { globalColors } from 'utils/QSAIDesign';
import { EnhancedDeliveryAddressForm, DeliveryAddressData } from './EnhancedDeliveryAddressForm';
import RouteVisualization from './RouteVisualization';
import { useMapsConfig } from 'utils/mapsConfigStore';
import { POSButton } from './POSButton';
import { TakeawayModeToggle, TakeawaySubMode } from './TakeawayModeToggle';
import { MapPin, User, Users, ArrowRight } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customerData: CustomerData) => void;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  initialData?: Partial<CustomerData>;
  orderValue?: number;
  onOrderTypeSwitch?: (newOrderType: 'WAITING' | 'COLLECTION' | 'DELIVERY') => void;
  onManagerOverride?: () => void;
  requestManagerApproval?: () => Promise<boolean>;
  managerOverrideGranted?: boolean;
  /** Called when user explicitly cancels the modal (not when saved). Used to dismiss caller ID events. */
  onCancel?: () => void;
}

interface CustomerData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  tableNumber?: string;
  guestCount?: number;
  address?: string;
  street?: string;
  city?: string;
  postcode?: string;
  deliveryNotes?: string;
  deliveryFee?: number;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderType,
  initialData = {},
  orderValue,
  onOrderTypeSwitch,
  onManagerOverride,
  requestManagerApproval,
  managerOverrideGranted,
  onCancel
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

  // State for delivery address data (for external route visualization)
  const [deliveryAddressForMap, setDeliveryAddressForMap] = useState<DeliveryAddressData | null>(null);

  // Get cached Google Maps API key
  const { apiKey: googleMapsApiKey } = useMapsConfig();

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
      // Reset delivery address for map when modal opens
      setDeliveryAddressForMap(null);
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
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

    if (orderType === 'DELIVERY' && orderValue !== undefined) {
      try {
        const validationResponse = await brain.validate_delivery_postcode({
          postcode: customerData.postcode || '',
          order_value: orderValue
        });

        const validationData = await validationResponse.json();

        if (!validationData.valid) {
          if (managerOverrideGranted) {
            toast.info('Manager override applied');
          } else if (requestManagerApproval) {
            const approved = await requestManagerApproval();
            if (!approved) {
              const errorMessage = validationData.errors?.join('\n') || 'Delivery validation failed';
              alert(`Delivery validation failed:\n\n${errorMessage}\n\nManager approval required to proceed.`);
              return;
            }
            toast.success('Manager override granted. Proceeding with delivery.');
          } else {
            const errorMessage = validationData.errors?.join('\n') || 'Delivery validation failed';
            alert(`Delivery validation failed:\n\n${errorMessage}\n\nPlease correct the issues before proceeding.`);
            return;
          }
        } else {
          toast.success(`Delivery validated successfully${validationData.distance_miles ? ` • ${validationData.distance_miles.toFixed(1)} miles` : ''}`);
        }

        if (validationData.data?.delivery_fee !== undefined) {
          customerData.deliveryFee = validationData.data.delivery_fee;
        }
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

  const isDelivery = orderType === 'DELIVERY';

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

  // Inline JSX for customer info fields (defined as JSX variable to avoid re-creating on each render)
  const customerInfoFieldsJSX = (
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
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal - wider for delivery */}
      <div
        className={`relative w-full mx-4 rounded-2xl shadow-2xl overflow-hidden ${
          isDelivery ? 'max-w-5xl' : 'max-w-2xl'
        }`}
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

        {/* Mode Switcher - only for takeaway modes */}
        {orderType !== 'DINE-IN' && onOrderTypeSwitch && (
          <div className="px-6 pt-4 pb-2">
            <TakeawayModeToggle
              currentMode={orderType as TakeawaySubMode}
              onModeChange={(mode) => onOrderTypeSwitch(mode)}
            />
          </div>
        )}

        {/* Content */}
        <div className={`px-6 py-6 ${isDelivery ? 'max-h-[65dvh]' : 'max-h-[70dvh]'} overflow-y-auto`}>
          {/* DELIVERY MODE: Two-column layout */}
          {isDelivery ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
              {/* Left Column - Customer Info + Address */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    Customer Information
                  </h3>
                  {customerInfoFieldsJSX}
                </div>

                {/* Delivery Address */}
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
                  hideNotes
                  hideRoutePreview
                  onDeliveryAddressChange={setDeliveryAddressForMap}
                />
              </div>

              {/* Right Column - Map + Notes (flex to align with left column) */}
              <div className="flex flex-col">
                {/* Route Preview Section */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex-shrink-0">
                    Delivery Route
                  </h3>

                  {deliveryAddressForMap && googleMapsApiKey ? (
                    <RouteVisualization
                      deliveryAddress={{
                        street: deliveryAddressForMap.street,
                        city: deliveryAddressForMap.city,
                        postcode: deliveryAddressForMap.postcode,
                        latitude: deliveryAddressForMap.latitude,
                        longitude: deliveryAddressForMap.longitude
                      }}
                      googleMapsApiKey={googleMapsApiKey}
                      onRouteCalculated={() => {}}
                    />
                  ) : (
                    <div
                      className="rounded-xl flex-1 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.8) 0%, rgba(20, 20, 30, 0.9) 100%)',
                        border: '1px solid rgba(124, 93, 250, 0.15)'
                      }}
                    >
                      {/* Decorative grid background */}
                      <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                          backgroundImage: `
                            linear-gradient(rgba(124, 93, 250, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(124, 93, 250, 0.5) 1px, transparent 1px)
                          `,
                          backgroundSize: '24px 24px'
                        }}
                      />

                      {/* Decorative circles */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div
                          className="absolute w-64 h-64 rounded-full opacity-[0.03]"
                          style={{
                            background: 'radial-gradient(circle, rgba(124, 93, 250, 0.8) 0%, transparent 70%)',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="relative z-10 text-center px-6">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, rgba(124, 93, 250, 0.15) 0%, rgba(124, 93, 250, 0.05) 100%)',
                            border: '1px solid rgba(124, 93, 250, 0.2)'
                          }}
                        >
                          <MapPin className="w-8 h-8 text-purple-400/60" />
                        </div>
                        <p className="text-gray-400 font-medium mb-1">Route Preview</p>
                        <p className="text-sm text-gray-500">
                          Enter a delivery address to view the route map
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section - Aligned with left column bottom fields */}
                <div className="space-y-4 mt-6">
                  {/* Delivery Notes */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">Delivery Notes (Optional)</Label>
                    <Textarea
                      value={customerData.deliveryNotes || ''}
                      onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
                      placeholder="Special delivery instructions (e.g., ring doorbell, leave at door)..."
                      rows={2}
                    />
                  </div>

                  {/* Order Notes */}
                  <div>
                    <Label className="text-gray-300 mb-2 block">Order Notes (Optional)</Label>
                    <Textarea
                      value={customerData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
                      placeholder="Any special instructions for the kitchen..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* NON-DELIVERY MODES: Single column layout */
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
              {(orderType === 'COLLECTION' || orderType === 'WAITING') && (
                customerInfoFieldsJSX
              )}

              {/* General notes for all non-delivery order types */}
              <div>
                <Label className="text-gray-300 mb-2 block">Order Notes (Optional)</Label>
                <Textarea
                  value={customerData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
                  placeholder="Any special instructions or notes..."
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{
            borderTopColor: 'rgba(255, 255, 255, 0.06)',
            background: `linear-gradient(135deg, ${globalColors.background.secondary} 0%, ${globalColors.background.primary} 100%)`
          }}
        >
          <POSButton variant="tertiary" onClick={() => {
            onCancel?.();
            onClose();
          }}>
            Cancel
          </POSButton>

          <POSButton
            variant="primary"
            onClick={handleSave}
            icon={<ArrowRight className="w-5 h-5 text-white" />}
            showChevron={false}
          >
            Continue
          </POSButton>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
