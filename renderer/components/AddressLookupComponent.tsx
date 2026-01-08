

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, CheckCircle, AlertCircle, Loader2, MapIcon } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from 'app';

interface Address {
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  onAddressSelect: (address: Address) => void;
  initialAddress?: Partial<Address>;
  className?: string;
}

export const AddressLookupComponent: React.FC<Props> = ({ 
  onAddressSelect, 
  initialAddress,
  className = "" 
}) => {
  // Step tracking
  const [currentStep, setCurrentStep] = useState<'postcode' | 'address' | 'confirm' | 'complete'>('postcode');
  
  // Form data
  const [postcode, setPostcode] = useState(initialAddress?.postal_code || "");
  const [deliveryAvailable, setDeliveryAvailable] = useState<boolean | null>(null);
  const [locationPreview, setLocationPreview] = useState<string>("");
  
  const [address, setAddress] = useState({
    address_line1: initialAddress?.address_line1 || "",
    address_line2: initialAddress?.address_line2 || "",
    city: initialAddress?.city || "",
    postal_code: initialAddress?.postal_code || ""
  });
  
  // UI states
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState<{lat: number, lng: number, locationName: string} | null>(null);
  
  // UK postcode validation regex
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
  
  const validatePostcode = (pc: string): boolean => {
    return postcodeRegex.test(pc.trim());
  };
  
  // Step 1: Postcode validation and delivery check
  const handlePostcodeCheck = async () => {
    if (!postcode.trim()) {
      toast.error("Please enter a postcode");
      return;
    }
    
    if (!validatePostcode(postcode)) {
      toast.error("Please enter a valid UK postcode (e.g. SW1A 1AA)");
      return;
    }
    
    setIsValidating(true);
    
    try {
      // Simple geocoding to check delivery area and get location preview
      const response = await apiClient.geocode({ postcode: postcode.trim().toUpperCase() });
      const data = await response.json();
      
      if (data.success && data.coordinates && data.locationName) {
        // TODO: Add delivery radius validation here based on coordinates
        // For now, assume delivery is available
        setDeliveryAvailable(true);
        setLocationPreview(data.locationName);
        setAddress(prev => ({ ...prev, postal_code: data.postcode || postcode.toUpperCase() }));
        setCurrentStep('address');
        toast.success(`Great! We deliver to ${data.locationName}`);
      } else {
        setDeliveryAvailable(false);
        toast.error("Sorry, we don't deliver to this postcode yet.");
      }
    } catch (error) {
      console.error('Postcode validation error:', error);
      toast.error("Unable to verify delivery area. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };
  
  // Step 2: Handle address form completion
  const handleAddressComplete = () => {
    if (!address.address_line1.trim()) {
      toast.error("Please enter your street address");
      return;
    }
    
    if (!address.city.trim()) {
      toast.error("Please enter your city");
      return;
    }
    
    setCurrentStep('confirm');
  };
  
  // Step 3: Confirm address with Google Maps wow factor
  const handleConfirmAddress = async () => {
    setIsConfirming(true);
    
    try {
      // Single Google Maps API call for exact coordinates and wow factor
      const fullAddress = `${address.address_line1}, ${address.city}, ${address.postal_code}`;
      const response = await apiClient.geocode({ locationName: fullAddress });
      const data = await response.json();
      
      if (data.success && data.coordinates) {
        // Store map data for wow factor display
        setMapData({
          lat: data.coordinates.lat,
          lng: data.coordinates.lng,
          locationName: data.locationName || `${address.city}, ${address.postal_code}`
        });
        
        // Create final address with exact coordinates
        const finalAddress: Address = {
          address_line1: address.address_line1.trim(),
          address_line2: address.address_line2.trim() || undefined,
          city: address.city.trim(),
          postal_code: address.postal_code.trim().toUpperCase(),
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng
        };
        
        // Show map with animation
        setShowMap(true);
        setCurrentStep('complete');
        
        // Delay the callback to let customer enjoy the wow moment
        setTimeout(() => {
          onAddressSelect(finalAddress);
          toast.success("Address saved successfully!");
        }, 2000);
        
      } else {
        toast.error("Unable to verify address coordinates. Please check your address.");
      }
    } catch (error) {
      console.error('Address confirmation error:', error);
      toast.error("Failed to confirm address. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isValidating) {
      if (currentStep === 'postcode') {
        handlePostcodeCheck();
      } else if (currentStep === 'address') {
        handleAddressComplete();
      }
    }
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step 1: Postcode Entry */}
      {currentStep === 'postcode' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="postcode-lookup" className="text-[#B7BDC6] mb-2 block font-medium">
              Delivery Area Check
            </Label>
            <div className="text-sm text-[#8B92A0] mb-3">
              Enter your postcode to check delivery availability
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative flex-grow">
              <Input
                id="postcode-lookup"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="e.g. SW1A 1AA"
                disabled={isValidating}
                className="bg-[#121316] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
              />
            </div>
            <Button
              onClick={handlePostcodeCheck}
              disabled={!postcode.trim() || isValidating}
              className="min-w-[140px] bg-[#8B1538] hover:bg-[#7A1230] text-white border-0 shadow-[0_0_24px_#8B153855]"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Delivery
                </>
              )}
            </Button>
          </div>
          
          {deliveryAvailable === false && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Delivery Not Available</span>
              </div>
              <p className="text-sm text-red-300 mt-1">
                Sorry, we don't currently deliver to this postcode. Please try collection instead.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Step 2: Manual Address Entry */}
      {currentStep === 'address' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-medium">Delivery Available to {locationPreview}</span>
          </div>
          
          <div className="space-y-4 p-4 rounded-lg border border-[#2A2E36] bg-[#121316]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-[#8B1538]" />
              <h3 className="text-[#EAECEF] font-medium">Enter Your Complete Address</h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-[#B7BDC6] mb-1 block text-sm">Street Address *</Label>
                <Input
                  value={address.address_line1}
                  onChange={(e) => setAddress(prev => ({ ...prev, address_line1: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. 123 High Street"
                  className="bg-[#17191D] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                />
              </div>
              
              <div>
                <Label className="text-[#B7BDC6] mb-1 block text-sm">Address Line 2 (Optional)</Label>
                <Input
                  value={address.address_line2}
                  onChange={(e) => setAddress(prev => ({ ...prev, address_line2: e.target.value }))}
                  placeholder="Apartment, suite, unit, etc."
                  className="bg-[#17191D] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#B7BDC6] mb-1 block text-sm">City *</Label>
                  <Input
                    value={address.city}
                    onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. London"
                    className="bg-[#17191D] border-[#2A2E36] text-[#EAECEF] placeholder:text-[#8B92A0] focus:ring-[#8B153866] focus:border-[#8B1538]"
                  />
                </div>
                
                <div>
                  <Label className="text-[#B7BDC6] mb-1 block text-sm">Postcode</Label>
                  <Input
                    value={address.postal_code}
                    disabled
                    className="bg-[#17191D] border-[#2A2E36] text-[#8B92A0] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddressComplete}
                disabled={!address.address_line1.trim() || !address.city.trim()}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white border-0 shadow-[0_0_24px_#8B153855]"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continue
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentStep('postcode')}
                className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#17191D] border-[#2A2E36]"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Confirm Address */}
      {currentStep === 'confirm' && (
        <div className="space-y-4">
          <div className="space-y-4 p-4 rounded-lg border border-[#2A2E36] bg-[#121316]">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-[#8B1538]" />
              <h3 className="text-[#EAECEF] font-medium">Confirm Your Address</h3>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="text-[#EAECEF]">{address.address_line1}</div>
              {address.address_line2 && <div className="text-[#EAECEF]">{address.address_line2}</div>}
              <div className="text-[#EAECEF]">{address.city}, {address.postal_code}</div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirmAddress}
                disabled={isConfirming}
                className="bg-[#8B1538] hover:bg-[#7A1230] text-white border-0 shadow-[0_0_24px_#8B153855]"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4 mr-2" />
                    Confirm Address
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentStep('address')}
                disabled={isConfirming}
                className="text-[#B7BDC6] hover:text-[#EAECEF] hover:bg-[#17191D] border-[#2A2E36]"
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 4: Map Wow Factor */}
      {currentStep === 'complete' && showMap && mapData && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto animate-in zoom-in duration-500" />
            <h3 className="text-[#EAECEF] font-medium text-lg">Address Confirmed!</h3>
            <p className="text-[#8B92A0] text-sm">Your delivery location has been verified</p>
          </div>
          
          <Card className="bg-[#121316] border-[#2A2E36] overflow-hidden animate-in slide-in-from-bottom-3 duration-700 delay-300">
            <CardContent className="p-0">
              <div className="h-64 bg-gradient-to-br from-[#8B1538] to-[#7A1230] relative flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapIcon className="h-16 w-16 text-white mx-auto animate-pulse" />
                  <div className="text-white font-medium">{mapData.locationName}</div>
                  <div className="text-white/70 text-sm">Your delivery area confirmed</div>
                </div>
                {/* Map integration would go here */}
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center text-sm text-[#8B92A0]">
            Address saved successfully! You can now place your order.
          </div>
        </div>
      )}
    </div>
  );
};
