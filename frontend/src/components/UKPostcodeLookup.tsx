import React, { useState, useRef } from 'react';
import { Mail, Search, Loader2, AlertCircle, CheckCircle, ArrowLeft, Home, Edit3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { globalColors } from 'utils/QSAIDesign';
import { postcodeService, PostcodeValidationResult } from 'utils/postcodeService';
import { reverseGeocode, ReverseGeocodeResult } from 'utils/nominatimService';
import brain from 'brain';

// Reuse the ExtractedAddress type from GooglePlacesAutocompleteEnhanced
export interface ExtractedAddress {
  street_number: string;
  route: string;
  locality: string;
  postal_code: string;
  country: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  source: 'autocomplete' | 'geocoding' | 'manual' | 'postcode-lookup';
}

interface UKPostcodeLookupProps {
  onAddressSelect: (address: ExtractedAddress) => void;
  orderValue?: number;
  onOrderTypeSwitch?: () => void;
  onManagerOverride?: () => void;
  onSwitchToManualEntry?: (postcode: string, locality: string) => void;
  googleMapsApiKey: string;
  className?: string;
}

type LookupState = 'IDLE' | 'VALIDATING' | 'GEOCODING' | 'READY_FOR_HOUSE_NUMBER' | 'CONFIRMING' | 'ERROR';

interface AutoFilledData {
  street: string;
  city: string;
  postcode: string;
}

export function UKPostcodeLookup({
  onAddressSelect,
  orderValue = 0,
  onSwitchToManualEntry,
  className = '',
}: UKPostcodeLookupProps) {
  // State
  const [postcode, setPostcode] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('IDLE');
  const [postcodeInfo, setPostcodeInfo] = useState<PostcodeValidationResult | null>(null);
  const [autoFilledData, setAutoFilledData] = useState<AutoFilledData | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEditingStreet, setIsEditingStreet] = useState(false);
  const [editedStreet, setEditedStreet] = useState('');

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const houseNumberRef = useRef<HTMLInputElement>(null);

  // Handle postcode input change
  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setPostcode(value);
    setError(null);

    // Clear previous results when typing
    if (lookupState !== 'IDLE') {
      setLookupState('IDLE');
      setPostcodeInfo(null);
      setAutoFilledData(null);
      setHouseNumber('');
    }
  };

  // Handle find addresses button click
  const handleFindAddresses = async () => {
    if (!postcode.trim()) {
      setError('Please enter a postcode');
      return;
    }

    setError(null);
    setLookupState('VALIDATING');

    try {
      // Step 1: Validate postcode with Postcodes.io (FREE)
      const validation = await postcodeService.validatePostcode(postcode);

      if (!validation.valid) {
        setError(validation.error || 'Invalid postcode');
        setLookupState('ERROR');
        return;
      }

      setPostcodeInfo(validation);
      setLookupState('GEOCODING');

      // Step 2: Reverse geocode with Nominatim (FREE)
      let geocodeResult: ReverseGeocodeResult = { street: undefined, locality: undefined };

      if (validation.latitude && validation.longitude) {
        geocodeResult = await reverseGeocode(validation.latitude, validation.longitude);
      }

      // Step 3: Auto-fill data - use Postcodes.io locality as fallback
      const street = geocodeResult.street || '';
      const city = geocodeResult.locality || validation.locality || validation.district || '';

      setAutoFilledData({
        street,
        city,
        postcode: validation.postcode!,
      });

      setEditedStreet(street);
      setLookupState('READY_FOR_HOUSE_NUMBER');

      // Focus the house number input
      setTimeout(() => {
        houseNumberRef.current?.focus();
      }, 100);

      if (!street) {
        toast.info('Street not found. You can enter it manually below.');
      }
    } catch (err) {
      console.error('[UKPostcodeLookup] Error:', err);
      setError('Failed to find address. Please try again.');
      setLookupState('ERROR');
    }
  };

  // Handle confirm address
  const handleConfirmAddress = async () => {
    if (!autoFilledData || !houseNumber.trim()) {
      toast.error('Please enter your house number or name');
      return;
    }

    setLookupState('CONFIRMING');

    const streetToUse = isEditingStreet ? editedStreet : autoFilledData.street;

    const extractedAddress: ExtractedAddress = {
      street_number: houseNumber.trim(),
      route: streetToUse,
      locality: autoFilledData.city,
      postal_code: autoFilledData.postcode,
      country: 'United Kingdom',
      formatted_address: `${houseNumber.trim()} ${streetToUse}, ${autoFilledData.city}, ${autoFilledData.postcode}`.replace(/\s+/g, ' ').trim(),
      latitude: postcodeInfo?.latitude || 0,
      longitude: postcodeInfo?.longitude || 0,
      source: 'postcode-lookup',
    };

    try {
      // Validate delivery if order value provided
      if (orderValue > 0) {
        const validationResult = await validateDeliveryAddress(extractedAddress);

        if (!validationResult.valid) {
          toast.error(validationResult.message || 'Delivery not available for this address');
          setLookupState('READY_FOR_HOUSE_NUMBER');
          return;
        }
      }

      // Success - call callback
      onAddressSelect(extractedAddress);
      toast.success('Address confirmed');
    } catch (err) {
      console.error('[UKPostcodeLookup] Error confirming address:', err);
      toast.error('Failed to confirm address');
      setLookupState('READY_FOR_HOUSE_NUMBER');
    }
  };

  // Validate delivery address
  const validateDeliveryAddress = async (
    address: ExtractedAddress
  ): Promise<{ valid: boolean; message?: string }> => {
    try {
      const response = await brain.validate_delivery_postcode({
        postcode: address.postal_code,
        order_value: orderValue,
      });

      const result = await response.json();
      return { valid: result.valid, message: result.message };
    } catch (error) {
      console.error('[UKPostcodeLookup] Validation error:', error);
      return { valid: false, message: 'Unable to validate delivery address' };
    }
  };

  // Handle manual entry - switch to address search mode
  const handleManualEntry = () => {
    const validatedPostcode = postcodeInfo?.postcode || postcode;
    const locality = postcodeInfo?.locality || postcodeInfo?.district || '';

    if (onSwitchToManualEntry) {
      onSwitchToManualEntry(validatedPostcode, locality);
    } else {
      toast.info('Please enter your address manually below');
    }

    // Reset lookup state but keep postcode
    setLookupState('IDLE');
    setAutoFilledData(null);
    setHouseNumber('');
  };

  // Handle go back to postcode entry
  const handleGoBack = () => {
    setLookupState('IDLE');
    setAutoFilledData(null);
    setHouseNumber('');
    setIsEditingStreet(false);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (lookupState === 'IDLE' && postcode.trim()) {
        handleFindAddresses();
      } else if (lookupState === 'READY_FOR_HOUSE_NUMBER' && houseNumber.trim()) {
        handleConfirmAddress();
      }
    }
  };

  // Check if postcode format is valid for button state
  const isPostcodeFormatValid = postcodeService.validateFormat(postcode);

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence mode="wait">
        {/* Postcode Entry State */}
        {(lookupState === 'IDLE' || lookupState === 'VALIDATING' || lookupState === 'ERROR') && (
          <motion.div
            key="postcode-entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Label className="text-gray-300 mb-2 block">
              <Mail className="w-4 h-4 inline mr-2" style={{ color: globalColors.purple.light }} />
              Find Address by Postcode
            </Label>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={postcode}
                  onChange={handlePostcodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g. RH20 4DZ"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 uppercase"
                  disabled={lookupState === 'VALIDATING'}
                />
                {/* Format validation indicator */}
                {postcode.length >= 5 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isPostcodeFormatValid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={handleFindAddresses}
                disabled={!isPostcodeFormatValid || lookupState === 'VALIDATING'}
                style={{
                  background: isPostcodeFormatValid
                    ? `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`
                    : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                }}
              >
                {lookupState === 'VALIDATING' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-1" />
                    Find
                  </>
                )}
              </Button>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-2">
              Enter your UK postcode to find your address quickly
            </p>
          </motion.div>
        )}

        {/* Geocoding State */}
        {lookupState === 'GEOCODING' && (
          <motion.div
            key="geocoding"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 py-4"
          >
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: globalColors.purple.light }} />
            <span className="text-gray-300">Finding address for {postcodeInfo?.postcode}...</span>
          </motion.div>
        )}

        {/* Ready for House Number State */}
        {(lookupState === 'READY_FOR_HOUSE_NUMBER' || lookupState === 'CONFIRMING') && autoFilledData && (
          <motion.div
            key="house-number-entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Back button */}
            <button
              onClick={handleGoBack}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
              disabled={lookupState === 'CONFIRMING'}
            >
              <ArrowLeft className="w-4 h-4" />
              Change postcode
            </button>

            {/* Auto-filled address preview */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Address found for {autoFilledData.postcode}:</p>

                  {isEditingStreet ? (
                    <Input
                      value={editedStreet}
                      onChange={(e) => setEditedStreet(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white mb-1"
                      placeholder="Enter street name"
                      autoFocus
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {autoFilledData.street || <span className="text-gray-500 italic">Street not found</span>}
                    </p>
                  )}

                  <p className="text-gray-300 text-sm">{autoFilledData.city}</p>
                </div>

                {/* Edit street button */}
                <button
                  onClick={() => {
                    if (isEditingStreet) {
                      setAutoFilledData(prev => prev ? { ...prev, street: editedStreet } : null);
                    }
                    setIsEditingStreet(!isEditingStreet);
                  }}
                  className="text-gray-400 hover:text-white p-1 transition-colors"
                  title={isEditingStreet ? 'Save street' : 'Edit street'}
                >
                  {isEditingStreet ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Edit3 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* House number/name input */}
            <div>
              <Label className="text-gray-300 mb-2 block">
                <Home className="w-4 h-4 inline mr-2" style={{ color: globalColors.purple.light }} />
                House Number or Name *
              </Label>
              <Input
                ref={houseNumberRef}
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 42 or Rose Cottage"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                disabled={lookupState === 'CONFIRMING'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your house number, flat number, or building name
              </p>
            </div>

            {/* Confirm button */}
            <Button
              onClick={handleConfirmAddress}
              disabled={!houseNumber.trim() || lookupState === 'CONFIRMING'}
              className="w-full"
              style={{
                background: houseNumber.trim()
                  ? `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.dark} 100%)`
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                opacity: !houseNumber.trim() ? 0.5 : 1,
              }}
            >
              {lookupState === 'CONFIRMING' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Use This Address
                </>
              )}
            </Button>

            {/* Address preview */}
            {houseNumber.trim() && (
              <div className="text-xs text-gray-400 text-center">
                Full address: {houseNumber.trim()} {isEditingStreet ? editedStreet : autoFilledData.street}, {autoFilledData.city}, {autoFilledData.postcode}
              </div>
            )}

            {/* Manual entry link */}
            <button
              onClick={handleManualEntry}
              className="w-full text-center py-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
              disabled={lookupState === 'CONFIRMING'}
            >
              <Home className="w-3 h-3 inline mr-1" />
              Wrong address? Enter manually instead
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UKPostcodeLookup;
