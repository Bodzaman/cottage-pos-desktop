import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import { globalColors } from 'utils/QSAIDesign';
import GooglePlacesAutocompleteEnhanced from './GooglePlacesAutocompleteEnhanced';
import type { ExtractedAddress } from './GooglePlacesAutocompleteEnhanced';
import RouteVisualization from './RouteVisualization';
import { apiClient } from 'app';

interface CustomerData {
  street?: string;
  city?: string;
  postcode?: string;
  deliveryNotes?: string;
}

interface Props {
  customerData: CustomerData;
  onCustomerDataChange: (field: keyof CustomerData, value: string) => void;
  className?: string;
  orderValue?: number; // Add order value for validation
  onOrderTypeSwitch?: () => void; // Add callback for switching to collection
  onManagerOverride?: () => void; // Add callback for manager override
}

/**
 * Enhanced Delivery Address Form
 * 
 * Combines Google Places autocomplete with route visualization and delivery validation
 * for intelligent delivery address entry in POS system.
 */
export const EnhancedDeliveryAddressForm: React.FC<Props> = ({
  customerData,
  onCustomerDataChange,
  className = "",
  orderValue = 0,
  onOrderTypeSwitch,
  onManagerOverride
}) => {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<ExtractedAddress | null>(null);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(true);
  
  console.log('🔍 [EnhancedDeliveryAddressForm] Component mounted/rendered, isLoadingApiKey:', isLoadingApiKey);
  
  // Fetch Google Maps API key on component mount
  useEffect(() => {
    console.log('🔍 [EnhancedDeliveryAddressForm] useEffect triggered - fetching maps config...');
    const fetchMapsConfig = async () => {
      try {
        console.log('🔍 [EnhancedDeliveryAddressForm] Making apiClient.get_maps_config() call...');
        const response = await apiClient.get_maps_config();
        console.log('🔍 [EnhancedDeliveryAddressForm] Response received:', response.status);
        const data = await response.json();
        console.log('🔍 [EnhancedDeliveryAddressForm] Data parsed:', data);
        if (data?.apiKey) {
          console.log('✅ [EnhancedDeliveryAddressForm] API key found, setting state...');
          setGoogleMapsApiKey(data.apiKey);
        } else {
          console.log('❌ [EnhancedDeliveryAddressForm] No API key in response');
          toast.error('Google Maps API key not found');
        }
      } catch (error) {
        console.error('❌ [EnhancedDeliveryAddressForm] Error fetching Google Maps API key:', error);
        toast.error('Failed to load address lookup service');
      } finally {
        console.log('🔍 [EnhancedDeliveryAddressForm] Setting isLoadingApiKey to false...');
        setIsLoadingApiKey(false);
      }
    };
    
    fetchMapsConfig();
  }, []);
  
  // Handle address selection from Google Places
  const handleAddressSelect = (address: ExtractedAddress) => {
    // Auto-fill form fields
    const streetAddress = `${address.street_number} ${address.route}`.trim();
    
    onCustomerDataChange('street', streetAddress);
    onCustomerDataChange('city', address.locality);
    onCustomerDataChange('postcode', address.postal_code);
    
    // Store full address for route visualization
    setDeliveryAddress({
      ...address,
      street_number: address.street_number,
      route: address.route
    });
    
    setShowRoutePreview(true);
    
    toast.success('Address auto-filled successfully');
  };
  
  // Handle route calculation results
  const handleRouteCalculated = (routeData: any) => {
    if (routeData.success) {
      // Could enhance this to show additional delivery validation
      console.log('Route calculated:', routeData);
    } else {
      console.warn('Route calculation failed:', routeData.error);
    }
  };
  
  // Check if we have valid address data for route visualization
  const hasValidAddressData = (
    deliveryAddress &&
    deliveryAddress.latitude &&
    deliveryAddress.longitude &&
    customerData.street &&
    customerData.postcode
  );
  
  if (isLoadingApiKey) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Address
          </h3>
          <div className="text-sm text-gray-400 animate-pulse">
            Loading address lookup service...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Delivery Address
        </h3>
        
        <div className="space-y-4">
          {/* Google Places Autocomplete */}
          {googleMapsApiKey ? (
            <GooglePlacesAutocompleteEnhanced
              onAddressSelect={handleAddressSelect}
              placeholder="Type postcode or address for suggestions..."
              label="Address Lookup"
              required
              googleMapsApiKey={googleMapsApiKey}
              className="mb-4"
              orderValue={orderValue}
              onOrderTypeSwitch={onOrderTypeSwitch}
              onManagerOverride={onManagerOverride}
            />
          ) : (
            <div className="text-sm text-red-400">
              Address lookup service unavailable
            </div>
          )}
          
          {/* Manual Address Fields */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="text-gray-300 mb-2 block">Street Address *</Label>
              <Input
                value={customerData.street || ''}
                onChange={(e) => onCustomerDataChange('street', e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                placeholder="Enter street address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">City</Label>
                <Input
                  value={customerData.city || ''}
                  onChange={(e) => onCustomerDataChange('city', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  placeholder="Enter city"
                />
              </div>
              
              <div>
                <Label className="text-gray-300 mb-2 block">Postcode *</Label>
                <Input
                  value={customerData.postcode || ''}
                  onChange={(e) => onCustomerDataChange('postcode', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  placeholder="Enter postcode"
                />
              </div>
            </div>
          </div>
          
          {/* Route Visualization */}
          {showRoutePreview && hasValidAddressData && googleMapsApiKey && (
            <div className="mt-4">
              <RouteVisualization
                deliveryAddress={{
                  street: customerData.street || '',
                  city: customerData.city || '',
                  postcode: customerData.postcode || '',
                  latitude: deliveryAddress.latitude,
                  longitude: deliveryAddress.longitude
                }}
                googleMapsApiKey={googleMapsApiKey}
                onRouteCalculated={handleRouteCalculated}
              />
            </div>
          )}
          
          {/* Delivery Notes */}
          <div>
            <Label className="text-gray-300 mb-2 block">Delivery Notes (Optional)</Label>
            <Textarea
              value={customerData.deliveryNotes || ''}
              onChange={(e) => onCustomerDataChange('deliveryNotes', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
              placeholder="Special delivery instructions..."
              rows={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDeliveryAddressForm;
