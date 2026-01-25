import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import GooglePlacesAutocompleteEnhanced from './GooglePlacesAutocompleteEnhanced';
import type { ExtractedAddress } from './GooglePlacesAutocompleteEnhanced';
import RouteVisualization from './RouteVisualization';
import { LookupMethodToggle, LookupMethod } from './LookupMethodToggle';
import UKPostcodeLookup from './UKPostcodeLookup';
import { useMapsConfig } from 'utils/mapsConfigStore';

interface CustomerData {
  street?: string;
  city?: string;
  postcode?: string;
  deliveryNotes?: string;
}

export interface DeliveryAddressData {
  street: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface Props {
  customerData: CustomerData;
  onCustomerDataChange: (field: keyof CustomerData, value: string) => void;
  className?: string;
  orderValue?: number;
  onOrderTypeSwitch?: () => void;
  onManagerOverride?: () => void;
  /** When true, notes are rendered separately (in side-by-side layout) */
  hideNotes?: boolean;
  /** When true, route visualization is rendered externally (in right column) */
  hideRoutePreview?: boolean;
  /** Callback when address data changes (for external route visualization) */
  onDeliveryAddressChange?: (address: DeliveryAddressData | null) => void;
}

/**
 * Enhanced Delivery Address Form
 *
 * Combines Google Places autocomplete with route visualization and delivery validation
 * for intelligent delivery address entry in POS system.
 *
 * Uses cached Google Maps API key from mapsConfigStore to avoid
 * redundant API calls when switching between order types.
 */
export const EnhancedDeliveryAddressForm: React.FC<Props> = ({
  customerData,
  onCustomerDataChange,
  className = "",
  orderValue = 0,
  onOrderTypeSwitch,
  onManagerOverride,
  hideNotes = false,
  hideRoutePreview = false,
  onDeliveryAddressChange
}) => {
  // Use cached API key from global store (fetches once, reused everywhere)
  const { apiKey: googleMapsApiKey, isLoading: isLoadingApiKey, error, fetchApiKey } = useMapsConfig();

  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<ExtractedAddress | null>(null);
  const [lookupMethod, setLookupMethod] = useState<LookupMethod>('postcode');

  // Fetch API key on mount (only fetches if not already cached)
  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);

  // Handle address selection from Google Places or Postcode Lookup
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

    // Notify parent of address change for external route visualization
    onDeliveryAddressChange?.({
      street: streetAddress,
      city: address.locality,
      postcode: address.postal_code,
      latitude: address.latitude,
      longitude: address.longitude
    });

    toast.success('Address auto-filled successfully');
  };

  // Handle route calculation results
  const handleRouteCalculated = (routeData: any) => {
    if (routeData.success) {
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

  // Show error state if API key fetch failed
  if (error && !googleMapsApiKey) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="border-t border-gray-700 pt-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Address
          </h3>
          <div className="text-sm text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  // Show loading state only on first load (before cache is populated)
  if (isLoadingApiKey && !googleMapsApiKey) {
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
          {/* Lookup Method Toggle */}
          <LookupMethodToggle
            currentMethod={lookupMethod}
            onMethodChange={setLookupMethod}
            className="mb-2"
          />

          {/* Address Lookup Components */}
          {googleMapsApiKey ? (
            <>
              {lookupMethod === 'postcode' ? (
                <UKPostcodeLookup
                  onAddressSelect={handleAddressSelect}
                  googleMapsApiKey={googleMapsApiKey}
                  orderValue={orderValue}
                  onOrderTypeSwitch={onOrderTypeSwitch}
                  onManagerOverride={onManagerOverride}
                  onSwitchToManualEntry={(postcode, locality) => {
                    // Pre-fill the postcode and city, then switch to address search
                    onCustomerDataChange('postcode', postcode);
                    if (locality) {
                      onCustomerDataChange('city', locality);
                    }
                    setLookupMethod('address');
                    toast.info('Postcode pre-filled. Enter your street address.');
                  }}
                />
              ) : (
                <GooglePlacesAutocompleteEnhanced
                  onAddressSelect={handleAddressSelect}
                  placeholder="Type postcode or address for suggestions..."
                  label="Address Search"
                  required
                  googleMapsApiKey={googleMapsApiKey}
                  className="mb-2"
                  orderValue={orderValue}
                  onOrderTypeSwitch={onOrderTypeSwitch}
                  onManagerOverride={onManagerOverride}
                />
              )}
            </>
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

          {/* Route Visualization - only render if not hidden (for side-by-side layout) */}
          {!hideRoutePreview && showRoutePreview && hasValidAddressData && googleMapsApiKey && (
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

          {/* Delivery Notes - only render if not hidden (for side-by-side layout) */}
          {!hideNotes && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedDeliveryAddressForm;
