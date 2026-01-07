import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Loader2, Search, CheckCircle, AlertCircle, Navigation, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { globalColors } from 'utils/QSAIDesign';
import { useGoogleMaps } from 'utils/googleMapsProvider';
import { apiClient } from 'app';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PlaceResult {
  address_components: google.maps.GeocoderAddressComponent[];
  formatted_address: string;
  geometry: {
    location: google.maps.LatLng;
  };
  place_id: string;
}

interface ExtractedAddress {
  street_number: string;
  route: string;
  locality: string;
  postal_code: string;
  country: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  source: 'autocomplete' | 'geocoding' | 'manual';
}

interface Props {
  onAddressSelect: (address: ExtractedAddress) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  initialValue?: string;
  googleMapsApiKey: string;
  orderValue?: number; // Add order value for validation
  onOrderTypeSwitch?: () => void; // Add callback for switching to collection
  onManagerOverride?: () => void; // Add callback for manager override
}

/**
 * Enhanced Google Places Autocomplete Component
 * 
 * Features:
 * - Session-based pricing optimization ($17/1,000 vs $2.83/query)
 * - Automatic fallback geocoding for manual input
 * - Guaranteed coordinate output for all addresses
 * - Smart input detection (suggestion vs manual)
 * - Cost-effective API usage patterns
 */
export const GooglePlacesAutocompleteEnhanced: React.FC<Props> = ({
  onAddressSelect,
  placeholder = "Enter postcode or address...",
  label = "Address Lookup",
  required = false,
  className = "",
  initialValue = "",
  googleMapsApiKey,
  orderValue = 0,
  onOrderTypeSwitch,
  onManagerOverride
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken | null>(null);
  const [suggestionSelected, setSuggestionSelected] = useState(false);
  
  // NEW: Validation dialog state
  const [validationDialog, setValidationDialog] = useState({
    isOpen: false,
    address: null as ExtractedAddress | null,
    validationResult: null as any,
    distance: 0,
    reason: ''
  });
  
  // Refs for Google Places services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderServiceRef = useRef<google.maps.Geocoder | null>(null);

  // NEW: Delivery validation function
  const validateDeliveryAddress = async (address: ExtractedAddress): Promise<{valid: boolean, message: string, distance?: number, reason?: string}> => {
    try {
      const response = await apiClient.validate_delivery_postcode({
        postcode: address.postal_code,
        order_value: orderValue
      });
      
      const result = await response.json();
      
      if (!result.valid) {
        // Extract distance and reason from the validation message
        const distanceMatch = result.message?.match(/(\d+\.\d+)\s*miles?/);
        const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
        
        let reason = 'Outside delivery zone';
        if (result.message?.includes('radius')) {
          reason = `Outside delivery zone (${distance} miles from restaurant, 6 mile limit)`;
        } else if (result.message?.includes('postcode')) {
          reason = 'Postcode not in delivery area';
        } else if (result.message?.includes('minimum')) {
          reason = 'Below minimum order value';
        }
        
        return {
          valid: false,
          message: result.message,
          distance,
          reason
        };
      }
      
      return { valid: true, message: 'Delivery available' };
    } catch (error) {
      console.error('Validation error:', error);
      return {
        valid: false,
        message: 'Unable to validate delivery address',
        reason: 'Validation service unavailable'
      };
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use centralized Google Maps provider
  const {
    isLoaded: isApiLoaded,
    isLoading: mapLoading,
    error: mapError,
    createAutocompleteService,
    createPlacesService
  } = useGoogleMaps();
  
  // Initialize Google Places API services and session token
  useEffect(() => {
    if (isApiLoaded && !autocompleteServiceRef.current) {
      console.log('🔧 Initializing Enhanced Google Places services...');
      initializeServices();
    }
  }, [isApiLoaded]);
  
  const initializeServices = () => {
    try {
      console.log('🔧 Creating Enhanced Google Places services with session tokens...');
      
      const autocompleteService = createAutocompleteService();
      const placesService = createPlacesService();
      
      if (!autocompleteService || !placesService) {
        throw new Error('Failed to create Google Places services');
      }
      
      autocompleteServiceRef.current = autocompleteService;
      placesServiceRef.current = placesService;
      
      // Create new session token for cost optimization
      if (window.google?.maps?.places?.AutocompleteSessionToken) {
        const token = new google.maps.places.AutocompleteSessionToken();
        setSessionToken(token);
        console.log('💰 Session token created for cost optimization');
      }
      
      setError(null);
      console.log('🎉 Enhanced Google Places services initialized successfully');
    } catch (err) {
      console.error('❌ Error creating Enhanced Google Places services:', err);
      setError('Failed to initialize address services');
    }
  };
  
  // Handle map errors
  useEffect(() => {
    if (mapError) {
      setError('Failed to load Google Maps API');
    }
  }, [mapError]);
  
  // Create new session token after successful selection
  const renewSessionToken = () => {
    if (window.google?.maps?.places?.AutocompleteSessionToken) {
      const token = new google.maps.places.AutocompleteSessionToken();
      setSessionToken(token);
      console.log('🔄 Session token renewed for next search');
    }
  };
  
  // Debounced search function with session token
  const performSearch = useCallback(
    (query: string) => {
      if (!isApiLoaded || !autocompleteServiceRef.current || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      const request: google.maps.places.AutocompletionRequest = {
        input: query.toUpperCase(),
        componentRestrictions: { country: 'gb' },
        sessionToken: sessionToken || undefined // Use session token if available
      };
      
      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
            setSuggestionSelected(false); // Reset selection state
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([]);
            setShowSuggestions(false);
            setSuggestionSelected(false);
          } else {
            setError('Failed to fetch address suggestions');
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    },
    [isApiLoaded, sessionToken]
  );
  
  // Debounced input handler
  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSuggestionSelected(false); // Reset on manual typing
    
    if (value.length >= 3) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion click with validation
  const handleSuggestionClick = async (suggestion: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    
    setIsGeocoding(true);
    setShowSuggestions(false);
    setInputValue(suggestion.description);
    setSuggestionSelected(true);
    
    try {
      // Get detailed place information including coordinates
      const address = await geocodeAndValidateAddress(suggestion.place_id, suggestion.description);
      
      if (address) {
        // NEW: Validate delivery address before proceeding
        const validation = await validateDeliveryAddress(address);
        
        if (!validation.valid) {
          // Show soft prevention dialog
          setValidationDialog({
            isOpen: true,
            address,
            validationResult: validation,
            distance: validation.distance || 0,
            reason: validation.reason || 'Outside delivery zone'
          });
        } else {
          // Address is valid, proceed normally
          onAddressSelect(address);
          toast.success('✅ Delivery address confirmed');
        }
      }
    } catch (error) {
      console.error('Error processing address:', error);
      toast.error('Failed to process selected address');
    } finally {
      setIsGeocoding(false);
    }
  };
  
  // Enhanced geocoding function with validation integration
  const geocodeAndValidateAddress = async (placeId: string, description: string): Promise<ExtractedAddress | null> => {
    try {
      // Use Google Places API for detailed geocoding with placeId
      if (placesServiceRef.current) {
        return new Promise((resolve) => {
          placesServiceRef.current!.getDetails(
            {
              placeId: placeId,
              fields: ['address_components', 'formatted_address', 'geometry']
            },
            (place, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                const extractedAddress = extractAddressFromPlace(place, description);
                resolve(extractedAddress);
              } else {
                console.warn('Places API failed, falling back to basic geocoding');
                // Fallback to basic geocoding
                basicGeocode(description).then(resolve);
              }
            }
          );
        });
      }
      
      // Fallback to basic geocoding if Places API is not available
      return await basicGeocode(description);
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };
  
  // Basic geocoding fallback
  const basicGeocode = async (address: string): Promise<ExtractedAddress | null> => {
    if (!geocoderServiceRef.current) return null;
    
    return new Promise((resolve) => {
      geocoderServiceRef.current!.geocode(
        { address: address },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const extractedAddress = extractAddressFromGeocoderResult(results[0], address);
            resolve(extractedAddress);
          } else {
            resolve(null);
          }
        }
      );
    });
  };
  
  // Extract address from Google Places result
  const extractAddressFromPlace = (place: PlaceResult, description: string): ExtractedAddress => {
    const components = place.address_components || [];
    
    const getComponent = (type: string) => {
      const component = components.find(c => c.types.includes(type));
      return component ? component.long_name : '';
    };
    
    return {
      street_number: getComponent('street_number'),
      route: getComponent('route'),
      locality: getComponent('locality') || getComponent('postal_town'),
      postal_code: getComponent('postal_code'),
      country: getComponent('country'),
      formatted_address: place.formatted_address || description,
      latitude: place.geometry?.location?.lat() || 0,
      longitude: place.geometry?.location?.lng() || 0,
      source: 'autocomplete'
    };
  };
  
  // Extract address from Geocoder result
  const extractAddressFromGeocoderResult = (result: google.maps.GeocoderResult, description: string): ExtractedAddress => {
    const components = result.address_components || [];
    
    const getComponent = (type: string) => {
      const component = components.find(c => c.types.includes(type));
      return component ? component.long_name : '';
    };
    
    return {
      street_number: getComponent('street_number'),
      route: getComponent('route'),
      locality: getComponent('locality') || getComponent('postal_town'),
      postal_code: getComponent('postal_code'),
      country: getComponent('country'),
      formatted_address: result.formatted_address || description,
      latitude: result.geometry?.location?.lat() || 0,
      longitude: result.geometry?.location?.lng() || 0,
      source: 'geocoding'
    };
  };
  
  // NEW: Handle validation dialog actions
  const handleSwitchToCollection = () => {
    setValidationDialog({ isOpen: false, address: null, validationResult: null, distance: 0, reason: '' });
    if (onOrderTypeSwitch) {
      onOrderTypeSwitch();
      toast.success('🔄 Order type switched to Collection');
    }
  };
  
  const handleManagerOverride = () => {
    setValidationDialog({ isOpen: false, address: null, validationResult: null, distance: 0, reason: '' });
    if (onManagerOverride) {
      onManagerOverride();
      toast.info('🔐 Manager override requested');
    }
  };
  
  const handleCancelAndTryAgain = () => {
    setValidationDialog({ isOpen: false, address: null, validationResult: null, distance: 0, reason: '' });
    setInputValue('');
    setSuggestionSelected(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.info('❌ Address selection cancelled');
  };
  
  // Handle Enter key or blur for manual input fallback
  const handleInputCommit = async () => {
    if (!inputValue.trim() || suggestionSelected || isLoading || isGeocoding) {
      return;
    }
    
    // Check if we have visible suggestions - if so, user should select one
    if (showSuggestions && suggestions.length > 0) {
      return;
    }
    
    await performFallbackGeocoding(inputValue);
  };
  
  // Fallback geocoding for manual input
  const performFallbackGeocoding = async (address: string) => {
    try {
      setIsGeocoding(true);
      setError(null);
      
      // Use our existing geocoding API
      const response = await apiClient.geocode({
        locationName: address.trim()
      });
      
      const result = await response.json();
      
      if (result.success && result.coordinates) {
        const extractedAddress: ExtractedAddress = {
          street_number: '',
          route: address.trim(),
          locality: result.locationName || '',
          postal_code: result.postcode || '',
          country: 'United Kingdom',
          formatted_address: address.trim(),
          latitude: result.coordinates.lat,
          longitude: result.coordinates.lng,
          source: 'geocoding'
        };
        
        onAddressSelect(extractedAddress);
        toast.success('🎯 Address geocoded successfully');
      } else {
        setError('Unable to locate this address. Please try selecting from suggestions.');
        toast.error('Address not found. Try selecting from suggestions.');
      }
    } catch (err) {
      setError('Failed to process address. Please try again.');
      toast.error('Failed to process address');
    } finally {
      setIsGeocoding(false);
    }
  };
  
  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputCommit();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };
  
  // Handle input blur
  const handleInputBlur = () => {
    // Delay to allow suggestion clicks to register
    setTimeout(() => {
      if (!suggestionSelected) {
        handleInputCommit();
      }
    }, 200);
  };
  
  // Extract address components from Google Places result
  const extractAddressComponents = (place: PlaceResult, source: 'autocomplete' | 'geocoding'): ExtractedAddress => {
    const components = place.address_components;
    let extractedAddress: ExtractedAddress = {
      street_number: '',
      route: '',
      locality: '',
      postal_code: '',
      country: '',
      formatted_address: place.formatted_address,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
      source
    };
    
    // 🎯 ENHANCED VILLAGE-LEVEL PARSING - Solution A: Priority-based extraction
    console.log('🔧 Enhanced Address Parser: Processing Google Places result');
    console.log('📍 Formatted Address:', place.formatted_address);
    console.log('🏷️ Address Components:', components.map(c => ({ types: c.types, long_name: c.long_name, short_name: c.short_name })));
    
    // Priority order for locality (village over postal town)
    const localityPriority = [
      'sublocality_level_1',     // Villages/neighborhoods  
      'sublocality',             // More specific areas
      'locality',                // Towns/cities
      'postal_town',             // Postal towns (fallback)
      'administrative_area_level_2' // Counties (last resort)
    ];
    
    // Extract basic components first
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        extractedAddress.street_number = component.long_name;
      } else if (types.includes('route')) {
        extractedAddress.route = component.long_name;
      } else if (types.includes('postal_code')) {
        extractedAddress.postal_code = component.long_name;
      } else if (types.includes('country')) {
        extractedAddress.country = component.long_name;
      }
    });
    
    // 🎯 Priority-based locality extraction (Solution A)
    let localityFound = false;
    for (const priority of localityPriority) {
      const component = components.find(comp => comp.types.includes(priority));
      if (component && !localityFound) {
        extractedAddress.locality = component.long_name;
        localityFound = true;
        console.log(`✅ Priority Match: Found '${component.long_name}' using '${priority}'`);
        break;
      }
    }
    
    // 🎯 Smart Village Extraction (Solution B) - Fallback from formatted address
    if (!localityFound || ['Pulborough', 'Horsham', 'West Sussex'].includes(extractedAddress.locality)) {
      console.log('🔍 Applying Smart Village Extraction from formatted address...');
      const extractedVillage = extractVillageFromFormattedAddress(place.formatted_address);
      
      if (extractedVillage && extractedVillage !== extractedAddress.locality) {
        console.log(`🏘️ Village Override: '${extractedAddress.locality}' → '${extractedVillage}'`);
        extractedAddress.locality = extractedVillage;
      }
    }
    
    console.log('🎉 Final Extracted Address:', {
      street: `${extractedAddress.street_number} ${extractedAddress.route}`.trim(),
      locality: extractedAddress.locality,
      postal_code: extractedAddress.postal_code,
      source: extractedAddress.source
    });
    
    return extractedAddress;
  };
  
  // 🎯 Smart Village Extraction Helper (Solution B)
  const extractVillageFromFormattedAddress = (formattedAddress: string): string => {
    console.log('🔎 Smart Village Extraction from:', formattedAddress);
    
    const parts = formattedAddress.split(',').map(p => p.trim());
    console.log('📝 Address Parts:', parts);
    
    // Known postal towns to skip in favor of villages
    const postalTownsToSkip = ['Pulborough', 'Horsham', 'Billingshurst', 'Worthing'];
    
    // Look for the part after street address but before postcode
    // UK address format: [Street], [Village], [Postal Town], [County], [Postcode]
    for (let i = 1; i < parts.length - 2; i++) {
      const part = parts[i];
      
      // Skip obvious postal towns and counties
      if (!postalTownsToSkip.includes(part) && 
          !part.includes('Sussex') && 
          !part.includes('Surrey') && 
          part.length > 2) {
        console.log(`🏘️ Smart Village Found: '${part}' at position ${i}`);
        return part;
      }
    }
    
    // Fallback to second part if no village found
    const fallback = parts[1] || '';
    console.log(`🔄 Fallback to: '${fallback}'`);
    return fallback;
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  // Determine current loading state
  const isProcessing = isLoading || isGeocoding;
  const showProcessingIcon = isProcessing;
  
  return (
    <div className={`relative ${className}`}>
      <Label className="text-gray-300 mb-2 block">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10"
          disabled={!isApiLoaded}
        />
        
        {/* Loading, Success, or Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {showProcessingIcon ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          ) : suggestionSelected ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Processing indicator */}
      {isGeocoding && (
        <div className="mt-2 flex items-center text-sm text-blue-400">
          <Navigation className="h-4 w-4 mr-1 animate-pulse" />
          Locating address...
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      
      {/* API Not Loaded */}
      {!isApiLoaded && !error && (
        <div className="mt-2 text-sm text-gray-400">
          Loading enhanced address lookup service...
        </div>
      )}
      
      {/* Help text for manual input */}
      {inputValue.length >= 3 && !showSuggestions && !isProcessing && !suggestionSelected && (
        <div className="mt-2 text-xs text-gray-500">
          Type your full address or press Enter to locate
        </div>
      )}
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg"
          style={{
            backgroundColor: globalColors.background.secondary,
            borderColor: globalColors.background.tertiary
          }}
        >
          {suggestions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSuggestionClick(prediction)}
              className="w-full p-3 text-left hover:bg-gray-700 focus:bg-gray-700 focus:outline-none transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {prediction.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {prediction.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          {/* Manual entry hint */}
          <div className="p-2 border-t border-gray-700 bg-gray-800">
            <div className="text-xs text-gray-500 text-center">
              💡 Not seeing your address? Type it fully and press Enter
            </div>
          </div>
        </div>
      )}
      
      {/* NEW: Soft Prevention Validation Dialog */}
      <Dialog open={validationDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setValidationDialog({ isOpen: false, address: null, validationResult: null, distance: 0, reason: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md" style={{
          backgroundColor: globalColors.background.secondary,
          border: `1px solid ${globalColors.accent.secondary}`,
          color: globalColors.text.primary
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-5 w-5" />
              Delivery Not Available
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Address and Validation Info */}
            <div className="p-4 rounded-lg" style={{
              backgroundColor: globalColors.background.tertiary,
              border: `1px solid ${globalColors.accent.secondary}`
            }}>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-400 mt-1" />
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    {validationDialog.address?.locality || 'Selected Area'}
                  </p>
                  <p className="text-sm text-gray-300">
                    {validationDialog.address?.formatted_address}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-700">
                {validationDialog.distance > 0 && (
                  <p className="text-sm text-amber-300 flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    {validationDialog.distance.toFixed(1)} miles from restaurant (6 mile limit)
                  </p>
                )}
                <p className="text-sm text-red-300 mt-1">
                  🚫 Reason: {validationDialog.reason}
                </p>
              </div>
            </div>
            
            {/* Professional Action Options */}
            <div className="space-y-3">
              <p className="text-sm text-gray-300 font-medium">Available Options:</p>
              
              <div className="grid gap-2">
                {onOrderTypeSwitch && (
                  <Button
                    onClick={handleSwitchToCollection}
                    className="w-full justify-start h-auto p-3"
                    style={{
                      background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">🔄 Switch to Collection</div>
                      <div className="text-xs opacity-90">Change order type and preserve all items</div>
                    </div>
                  </Button>
                )}
                
                {onManagerOverride && (
                  <Button
                    onClick={handleManagerOverride}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    style={{
                      borderColor: globalColors.accent.secondary,
                      backgroundColor: 'transparent',
                      color: globalColors.text.primary
                    }}
                  >
                    <div className="text-left">
                      <div className="font-medium">🔐 Manager Override</div>
                      <div className="text-xs opacity-70">Approve delivery with management password</div>
                    </div>
                  </Button>
                )}
                
                <Button
                  onClick={handleCancelAndTryAgain}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  style={{
                    borderColor: globalColors.accent.secondary,
                    backgroundColor: 'transparent',
                    color: globalColors.text.secondary
                  }}
                >
                  <div className="text-left">
                    <div className="font-medium">❌ Cancel & Try Again</div>
                    <div className="text-xs opacity-70">Enter a different delivery address</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { type ExtractedAddress };
export default GooglePlacesAutocompleteEnhanced;
