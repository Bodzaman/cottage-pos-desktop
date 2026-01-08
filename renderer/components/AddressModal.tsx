import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Home, Briefcase, User, Star, Trash2, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';
import GooglePlacesAutocompleteEnhanced, { type ExtractedAddress } from './GooglePlacesAutocompleteEnhanced';

interface Address {
  id?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  address_type: 'home' | 'work' | 'other';
  is_default: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  onDelete?: (addressId: string) => void;
  address?: Address;
  title?: string;
}

const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'other', label: 'Other', icon: User },
] as const;

export const AddressModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  address,
  title
}) => {
  const [formData, setFormData] = useState<Address>({
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    address_type: 'home',
    is_default: false,
    ...address
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressLookup, setShowAddressLookup] = useState(!address?.id);
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingApiKey, setIsLoadingApiKey] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  
  // Two-step approach state
  const [postcodeCheck, setPostcodeCheck] = useState('');
  const [isCheckingPostcode, setIsCheckingPostcode] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<{
    available: boolean;
    message: string;
    distance?: number;
  } | null>(null);
  const [showStep2, setShowStep2] = useState(false);
  
  // Reset form when modal opens/closes or address changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        address_line1: "",
        address_line2: "",
        city: "",
        postal_code: "",
        address_type: 'home',
        is_default: false,
        ...address
      });
      
      // Show address lookup for new addresses, manual edit for existing ones
      if (address?.id) {
        setShowAddressLookup(false);
        setIsEditingManually(true);
      } else {
        setShowAddressLookup(true);
        setIsEditingManually(false);
      }
    }
  }, [isOpen, address]);
  
  // NEW: Fetch Google Maps API key on component mount
  useEffect(() => {
    const fetchMapsConfig = async () => {
      try {
        setIsLoadingApiKey(true);
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        
        if (data.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
        } else {
          toast.error('Google Maps API key not found');
        }
      } catch (error) {
        console.error('Error fetching Google Maps API key:', error);
        toast.error('Failed to load address lookup service');
      } finally {
        setIsLoadingApiKey(false);
      }
    };
    
    if (isOpen) {
      fetchMapsConfig();
    }
  }, [isOpen]);

  // Handle address selection from Google Places
  const handleAddressSelect = (selectedAddress: any) => {
    console.log('🎯 [AddressModal] handleAddressSelect called with:', selectedAddress);
    
    // GooglePlacesAutocompleteEnhanced sends simplified format, not address_components
    const streetAddress = `${selectedAddress.street_number || ''} ${selectedAddress.route || ''}`.trim();
    const city = selectedAddress.locality || '';
    const county = selectedAddress.administrative_area_level_2 || selectedAddress.administrative_area_level_1 || '';
    const postcode = selectedAddress.postal_code || '';
    
    console.log('🔄 [AddressModal] Setting form data:', {
      address_line1: streetAddress,
      city: city,
      postal_code: postcode,
      county: county
    });
    
    // Update form data with selected address
    setFormData(prev => ({
      ...prev,
      address_line1: streetAddress,
      city: city,
      postal_code: postcode,
      county: county,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longitude,
      place_id: selectedAddress.place_id
    }));
    
    console.log('✅ [AddressModal] Address selected, advancing to address type selection');
    
    // Move from Step 2 (intelligent lookup) to address type selection  
    setShowStep2(false);
    setIsEditingManually(true);
  };

  const handleSave = async () => {
    if (!formData.address_line1.trim() || !formData.postal_code.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsLoading(true);

    try {
      // For addresses with coordinates (from GooglePlacesAutocompleteEnhanced), save directly
      if (formData.latitude && formData.longitude) {
        onSave(formData);
        toast.success(address?.id ? "Address updated successfully!" : "Address added successfully!");
        onClose();
        return;
      }

      // For manual entries, geocode first
      const fullAddress = [
        formData.address_line1,
        formData.address_line2,
        formData.city,
        formData.postal_code
      ].filter(Boolean).join(', ');

      // Geocode the address
      const geocodeResponse = await apiClient.geocode({ locationName: fullAddress });
      const geocodeData = await geocodeResponse.json();

      if (!geocodeData.success) {
        toast.error("Unable to validate address. Please check and try again.");
        setIsLoading(false);
        return;
      }

      // Use correct delivery validation API that reads live Delivery Management settings
      const deliveryResponse = await apiClient.validate_delivery_postcode({
        postcode: formData.postal_code,
        order_value: 0 // Use 0 for address validation
      });
      const deliveryData = await deliveryResponse.json();

      if (!deliveryData.valid) {
        const radiusMiles = deliveryData.data?.delivery_radius_miles || 6;
        const errorMessage = deliveryData.errors?.[0] || `Sorry, we don't currently deliver to this area. Our delivery radius is ${radiusMiles} miles from the restaurant.`;
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Save address with coordinates
      const addressWithCoords = {
        ...formData,
        latitude: geocodeData.coordinates?.lat || geocodeData.data?.latitude,
        longitude: geocodeData.coordinates?.lng || geocodeData.data?.longitude,
        place_id: geocodeData.data?.place_id
      };

      onSave(addressWithCoords);
      toast.success(address?.id ? "Address updated successfully!" : "Address added successfully!");
      onClose();
      
    } catch (error) {
      console.error('Address validation error:', error);
      toast.error("Unable to validate address. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (address?.id && onDelete) {
      onDelete(address.id);
      onClose();
      toast.success("Address deleted successfully!");
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle manual address editing
  const handleManualEdit = () => {
    setShowAddressLookup(false);
    setIsEditingManually(true);
  };

  // Handle postcode validation for delivery area
  const handlePostcodeCheck = async () => {
    if (!postcodeCheck.trim()) return;
    
    setIsCheckingPostcode(true);
    setDeliveryStatus(null);
    
    try {
      // First, geocode the postcode to get coordinates
      const geocodeResponse = await apiClient.geocode({
        postcode: postcodeCheck
      });
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.success || !geocodeData.coordinates?.lat || !geocodeData.coordinates?.lng) {
        throw new Error('Invalid postcode or unable to find location');
      }
      
      // Use the correct delivery validation API that reads live Delivery Management settings
      const response = await apiClient.validate_delivery_postcode({
        postcode: postcodeCheck.trim(),
        latitude: geocodeData.coordinates.lat,
        longitude: geocodeData.coordinates.lng
      });
      
      const result = await response.json();
      
      if (result.valid) {
        const radiusMiles = result.data?.delivery_radius_miles || 6;
        setDeliveryStatus({
          available: true,
          message: `✅ Great! We deliver to your area (within ${radiusMiles} mile radius)`,
          distance: radiusMiles
        });
        setShowStep2(true); // Move to address entry form
      } else {
        const radiusMiles = result.data?.delivery_radius_miles || 6;
        const errorMessage = result.errors?.[0] || result.message || `Sorry, we don't currently deliver to this area. Our delivery radius is ${radiusMiles} miles from the restaurant.`;
        setDeliveryStatus({
          available: false,
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Postcode validation error:', error);
      setDeliveryStatus({
        available: false,
        message: 'Unable to validate postcode. Please check it is correct and try again.'
      });
    } finally {
      setIsCheckingPostcode(false);
    }
  };

  const handleBackToLookup = () => {
    setIsEditingManually(false);
    setShowAddressLookup(true);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = ADDRESS_TYPES.find(t => t.value === type);
    return typeConfig?.icon || User;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1014] border-[#2A2E36] text-[#EAECEF] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#EAECEF] text-xl font-medium flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#8B1538]" />
            {title || (address?.id ? "Edit Address" : "Add New Address")}
          </DialogTitle>
          <DialogDescription className="text-[#B7BDC6]">
            {address?.id 
              ? "Update your saved delivery or collection address" 
              : "Add a new delivery or collection address to your account"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Postcode Validation for New Addresses */}
          {!address?.id && showAddressLookup && (
            <div className="space-y-4">
              <div className="border-b border-[#2A2E36] pb-4">
                <h3 className="text-[#EAECEF] font-medium mb-2">Check Delivery Availability</h3>
                <p className="text-sm text-[#8B92A0]">
                  Enter your postcode to check if we deliver to your area
                </p>
              </div>
              
              {/* Postcode Validation Step */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="postcode_check" className="text-[#B7BDC6] mb-2 block">
                    Postcode *
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="postcode_check"
                      value={postcodeCheck}
                      onChange={(e) => setPostcodeCheck(e.target.value.toUpperCase())}
                      placeholder="e.g. SW1A 1AA"
                      inputMode="text"
                      autoComplete="postal-code"
                      className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538] flex-1"
                      disabled={isCheckingPostcode}
                    />
                    <Button
                      onClick={handlePostcodeCheck}
                      disabled={!postcodeCheck.trim() || isCheckingPostcode}
                      className="bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#6B1028] text-white px-6"
                    >
                      {isCheckingPostcode ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        'Check'
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Delivery Status */}
                {deliveryStatus && (
                  <div className={`p-4 rounded-lg border ${
                    deliveryStatus.available 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    <div className="flex items-center gap-3">
                      {deliveryStatus.available ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium">
                          {deliveryStatus.available ? '✅ Great! We deliver to your area' : '❌ Sorry, outside our delivery area'}
                        </p>
                        <p className="text-sm opacity-80">
                          {deliveryStatus.message}
                        </p>
                      </div>
                    </div>
                    
                    {deliveryStatus.available && (
                      <Button
                        onClick={() => {
                          setShowStep2(true);
                          // Pre-fill the validated postcode
                          setFormData(prev => ({ ...prev, postal_code: postcodeCheck }));
                        }}
                        className="mt-3 bg-gradient-to-r from-[#8B1538] to-[#7A1230] hover:from-[#7A1230] hover:to-[#6B1028] text-white"
                      >
                        Continue to Add Address
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Address Entry Form after successful postcode validation */}
          {!address?.id && showStep2 && (
            <div className="space-y-4">
              <div className="border-b border-[#2A2E36] pb-4">
                <h3 className="text-[#EAECEF] font-medium mb-2">Find Your Address</h3>
                <p className="text-sm text-[#8B92A0]">
                  Type your address for intelligent suggestions, or continue with postcode: <span className="text-[#8B1538] font-medium">{postcodeCheck}</span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowStep2(false);
                    setDeliveryStatus(null);
                    setPostcodeCheck('');
                  }}
                  className="mt-2 text-[#8B92A0] border-[#2A2E36] hover:bg-[#2A2E36] hover:text-[#EAECEF]"
                >
                  ← Back to Postcode Check
                </Button>
              </div>

              {/* Google Places Autocomplete - Main Address Lookup */}
              {googleMapsApiKey && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-[#B7BDC6] mb-2 block">
                      🎯 Intelligent Address Lookup
                    </Label>
                    <GooglePlacesAutocompleteEnhanced
                      onAddressSelect={handleAddressSelect}
                      placeholder={`Start typing your address in ${postcodeCheck}...`}
                      googleMapsApiKey={googleMapsApiKey}
                      className="bg-[#121316] border-[#2A2E36] text-[#EAECEF]"
                      label="Address Lookup"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-[#2A2E36]"></div>
                    <span className="px-3 text-[#8B92A0] text-sm">or enter manually below</span>
                    <div className="flex-1 border-t border-[#2A2E36]"></div>
                  </div>
                  
                  {/* Manual Entry Fallback */}
                  <div className="bg-[#1A1C20]/50 p-4 rounded-lg border border-[#2A2E36]">
                    <p className="text-[#8B92A0] text-sm mb-3">
                      💡 Can't find your address? Enter it manually:
                    </p>
                    <Button
                      onClick={() => {
                        setIsEditingManually(true);
                        setShowStep2(false);
                      }}
                      variant="outline"
                      className="text-[#B7BDC6] border-[#2A2E36] hover:bg-[#2A2E36] hover:text-[#EAECEF]"
                    >
                      📝 Enter Address Manually
                    </Button>
                  </div>
                </div>
              )}
              
              {/* API Key Loading State */}
              {!googleMapsApiKey && isLoadingApiKey && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#8B1538]" />
                  <span className="ml-2 text-[#8B92A0]">Loading address lookup...</span>
                </div>
              )}
            </div>
          )}

          {/* Manual Address Form for New Addresses */}
          {!address?.id && isEditingManually && (
            <div className="space-y-4">
              <div className="border-b border-[#2A2E36] pb-4">
                <h3 className="text-[#EAECEF] font-medium mb-2">Add Your Address</h3>
                <p className="text-sm text-[#8B92A0]">
                  Complete your address details below
                </p>
              </div>

              {/* Manual Address Entry Form - No Duplicate Autocomplete */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address_line1" className="text-[#B7BDC6] mb-2 block">
                    Address Line 1 *
                  </Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="Street address"
                    inputMode="text"
                    autoComplete="address-line1"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address_line2" className="text-[#B7BDC6] mb-2 block">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    inputMode="text"
                    autoComplete="address-line2"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-[#B7BDC6] mb-2 block">
                    City *
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    inputMode="text"
                    autoComplete="address-level2"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="postal_code" className="text-[#B7BDC6] mb-2 block">
                    Postcode *
                  </Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Postcode"
                    inputMode="text"
                    autoComplete="postal-code"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="county" className="text-[#B7BDC6] mb-2 block">
                    County (Optional)
                  </Label>
                  <Input
                    id="county"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    placeholder="County"
                    inputMode="text"
                    autoComplete="address-level1"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                  />
                </div>

                <div>
                  <Label htmlFor="address_type" className="text-[#B7BDC6] mb-2 block">
                    Address Type *
                  </Label>
                  <select
                    id="address_type"
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-[#121316] border border-[#2A2E36] text-[#EAECEF] focus:ring-1 focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  >
                    <option value="home">🏠 Home</option>
                    <option value="work">💼 Work</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>
              </div>

              {/* Back to Postcode Check */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingManually(false);
                    setShowAddressLookup(true);
                    setDeliveryStatus(null);
                    setPostcodeCheck('');
                  }}
                  className="text-[#8B92A0] hover:text-[#EAECEF]"
                >
                  ← Back to Postcode Check
                </Button>
              </div>
            </div>
          )}

          {/* Edit Form for Existing Addresses */}
          {address?.id && (
            <div className="space-y-4">
              <div className="border-b border-[#2A2E36] pb-4">
                <h3 className="text-[#EAECEF] font-medium mb-2">Edit Address Details</h3>
                <p className="text-sm text-[#8B92A0]">
                  Update your address information below
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="address_line1" className="text-[#B7BDC6] mb-2 block">
                    Address Line 1 *
                  </Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleChange}
                    placeholder="Street address"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address_line2" className="text-[#B7BDC6] mb-2 block">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleChange}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-[#B7BDC6] mb-2 block">
                    City *
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="postal_code" className="text-[#B7BDC6] mb-2 block">
                    Postcode *
                  </Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Postcode"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="county" className="text-[#B7BDC6] mb-2 block">
                    County (Optional)
                  </Label>
                  <Input
                    id="county"
                    name="county"
                    value={formData.county}
                    onChange={handleChange}
                    placeholder="County"
                    className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                  />
                </div>

                <div>
                  <Label htmlFor="address_type" className="text-[#B7BDC6] mb-2 block">
                    Address Type *
                  </Label>
                  <select
                    id="address_type"
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-[#121316] border border-[#2A2E36] text-[#EAECEF] focus:ring-1 focus:ring-[#8B153866] focus:border-[#8B1538]"
                    required
                  >
                    <option value="home">🏠 Home</option>
                    <option value="work">💼 Work</option>
                    <option value="other">📍 Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-600 border-gray-300"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-red-800 to-red-700 text-white hover:from-red-900 hover:to-red-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                {address?.id ? 'Update Address' : 'Save Address'}
              </>
            )}
          </Button>
        </div>

        {onDelete && address?.id && (
          <Button
            variant="outline"
            onClick={() => onDelete(address.id!)}
            className="w-full mt-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Address
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
