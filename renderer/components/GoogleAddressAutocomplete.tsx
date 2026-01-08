

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from 'app';

interface Address {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  onAddressSelect: (address: Address) => void;
  onValidationResult?: (isValid: boolean, distance?: number) => void;
  placeholder?: string;
  theme?: 'dark' | 'burgundy';
  showValidation?: boolean;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

export const GoogleAddressAutocomplete: React.FC<Props> = ({ 
  onAddressSelect, 
  onValidationResult,
  placeholder = "Start typing your address...",
  theme = 'dark',
  showValidation = true,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'checking' | 'valid' | 'invalid'>('none');
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Load Google Maps API key
  useEffect(() => {
    const loadMapsConfig = async () => {
      try {
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        
        if (data.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
          console.log('GoogleAddressAutocomplete: API key loaded');
        } else {
          console.error('GoogleAddressAutocomplete: No API key found');
          toast.error('Google Maps not configured');
        }
      } catch (error) {
        console.error('GoogleAddressAutocomplete: Failed to load Maps config:', error);
        toast.error('Failed to load Maps configuration');
      }
    };

    loadMapsConfig();
  }, []);

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (!googleMapsApiKey) return;

    const loadGoogleMapsAPI = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeServices();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkInterval);
            initializeServices();
          }
        }, 100);
        return;
      }

      // Load Google Maps API script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&loading=async&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Global callback for when Google Maps loads
      window.initGoogleMaps = () => {
        initializeServices();
      };
      
      script.onerror = () => {
        console.error('GoogleAddressAutocomplete: Failed to load Google Maps API');
        toast.error('Failed to load Google Maps');
      };
      
      document.head.appendChild(script);
    };

    const initializeServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setIsGoogleLoaded(true);
        console.log('GoogleAddressAutocomplete: Google Maps services initialized');
      }
    };

    loadGoogleMapsAPI();
  }, [googleMapsApiKey]);

  // Handle input changes and fetch suggestions
  const handleInputChange = useCallback(async (value: string) => {
    setInputValue(value);
    setValidationStatus('none');

    if (!isGoogleLoaded || !autocompleteServiceRef.current || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const request = {
        input: value,
        componentRestrictions: { country: 'uk' },
        types: ['address']
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions: any[], status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5)); // Limit to 5 suggestions
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    } catch (error) {
      console.error('GoogleAddressAutocomplete: Error fetching suggestions:', error);
    }
  }, [isGoogleLoaded]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (prediction: any) => {
    if (!placesServiceRef.current) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setInputValue(prediction.description);
    setValidationStatus('checking');

    try {
      // Get detailed place information
      placesServiceRef.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        },
        async (place: any, status: any) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            // Parse address components
            const addressComponents = place.address_components || [];
            
            let line1 = '';
            let city = '';
            let county = '';
            let postcode = '';
            
            // Extract address components
            for (const component of addressComponents) {
              const types = component.types;
              
              if (types.includes('street_number')) {
                line1 = component.long_name + ' ';
              } else if (types.includes('route')) {
                line1 += component.long_name;
              } else if (types.includes('locality') || types.includes('postal_town')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                county = component.long_name;
              } else if (types.includes('postal_code')) {
                postcode = component.long_name;
              }
            }

            // If line1 is empty, use place name or first part of formatted address
            if (!line1.trim()) {
              const addressParts = place.formatted_address.split(',');
              line1 = addressParts[0] || '';
            }

            const address: Address = {
              line1: line1.trim(),
              city: city || '',
              county: county || '',
              postcode: postcode || '',
              placeId: place.place_id,
              latitude: place.geometry?.location?.lat(),
              longitude: place.geometry?.location?.lng()
            };

            // Validate delivery area if coordinates are available
            if (showValidation && address.latitude && address.longitude) {
              try {
                const deliveryResponse = await apiClient.calculate_delivery_route({
                  destination_lat: address.latitude,
                  destination_lng: address.longitude,
                  destination_address: place.formatted_address
                });
                
                const deliveryData = await deliveryResponse.json();
                
                if (deliveryData.success && deliveryData.within_delivery_radius) {
                  setValidationStatus('valid');
                  onValidationResult?.(true, deliveryData.distance_miles);
                  toast.success(`Address confirmed - ${deliveryData.distance_miles?.toFixed(1)} miles away`);
                } else {
                  setValidationStatus('invalid');
                  onValidationResult?.(false, deliveryData.distance_miles);
                  toast.error('Sorry, this address is outside our delivery area');
                }
              } catch (validationError) {
                console.error('GoogleAddressAutocomplete: Validation error:', validationError);
                setValidationStatus('valid'); // Default to valid if validation fails
                onValidationResult?.(true);
              }
            } else {
              setValidationStatus('valid');
              onValidationResult?.(true);
            }

            // Call the onAddressSelect callback
            onAddressSelect(address);
          } else {
            console.error('GoogleAddressAutocomplete: Failed to get place details:', status);
            toast.error('Failed to get address details');
            setValidationStatus('invalid');
            onValidationResult?.(false);
          }
          
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('GoogleAddressAutocomplete: Error getting place details:', error);
      toast.error('Failed to process selected address');
      setIsLoading(false);
      setValidationStatus('invalid');
      onValidationResult?.(false);
    }
  }, [onAddressSelect, onValidationResult, showValidation]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme styles
  const getThemeStyles = () => {
    if (theme === 'burgundy') {
      return {
        input: 'bg-gray-900/50 border-gray-700 text-white focus:border-red-800 focus:ring-red-800/20',
        suggestions: 'bg-gray-900 border-gray-700',
        suggestion: 'hover:bg-red-900/20 text-white',
        label: 'text-white'
      };
    }
    return {
      input: 'bg-[rgba(21,25,42,0.5)] border-[rgba(255,255,255,0.07)] text-white focus:border-[#7C5DFA] focus:ring-[#7C5DFA]/20',
      suggestions: 'bg-[rgba(21,25,42,0.9)] border-[rgba(255,255,255,0.07)]',
      suggestion: 'hover:bg-[#7C5DFA]/20 text-white',
      label: 'text-white'
    };
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`relative ${className}`}>
      <Label className={`block text-sm font-medium mb-2 ${themeStyles.label}`}>
        Address Lookup
      </Label>
      
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          className={`${themeStyles.input} ${showValidation ? 'pr-10' : ''}`}
          disabled={!isGoogleLoaded || isLoading}
        />
        
        {/* Status indicator */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validationStatus === 'checking' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            )}
            {validationStatus === 'valid' && (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            {validationStatus === 'invalid' && (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Loading state when Google Maps is not loaded */}
      {!isGoogleLoaded && (
        <div className="mt-2 text-xs text-gray-400 flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Loading Google Maps...
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className={`absolute z-50 w-full mt-1 rounded-md shadow-lg ${themeStyles.suggestions} border backdrop-blur-sm`}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              className={`w-full px-4 py-3 text-left ${themeStyles.suggestion} ${index === 0 ? 'rounded-t-md' : ''} ${index === suggestions.length - 1 ? 'rounded-b-md' : ''} transition-colors duration-150`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mt-0.5 mr-2 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
