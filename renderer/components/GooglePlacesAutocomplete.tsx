

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { globalColors } from 'utils/QSAIDesign';
import { useGoogleMaps } from 'utils/googleMapsProvider';

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
}

interface Props {
  onAddressSelect: (address: ExtractedAddress) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  initialValue?: string;
  googleMapsApiKey: string;
}

/**
 * Google Places Autocomplete Component
 * 
 * Provides intelligent postcode/address lookup using Google Places API
 * with real-time suggestions and automatic address component extraction.
 */
export const GooglePlacesAutocomplete: React.FC<Props> = ({
  onAddressSelect,
  placeholder = "Enter postcode or address...",
  label = "Address Lookup",
  required = false,
  className = "",
  initialValue = "",
  googleMapsApiKey
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for Google Places services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Use centralized Google Maps provider
  const {
    isLoaded: isApiLoaded,
    isLoading: mapLoading,
    error: mapError,
    createAutocompleteService,
    createPlacesService
  } = useGoogleMaps();
  
  // Initialize Google Places API services when provider is ready
  useEffect(() => {
    if (isApiLoaded && !autocompleteServiceRef.current) {
      initializeServices();
    }
  }, [isApiLoaded]);
  
  const initializeServices = () => {
    try {
      const autocompleteService = createAutocompleteService();
      const placesService = createPlacesService();
      
      if (!autocompleteService || !placesService) {
        throw new Error('Failed to create Google Places services');
      }
      
      autocompleteServiceRef.current = autocompleteService;
      placesServiceRef.current = placesService;
      
      setError(null);
    } catch (err) {
      setError('Failed to initialize address services');
    }
  };
  
  // Handle map errors
  useEffect(() => {
    if (mapError) {
      setError('Failed to load Google Maps API');
    }
  }, [mapError]);
  
  // Debounced search function
  const performSearch = useCallback(
    debounce((query: string) => {
      if (!isApiLoaded || !autocompleteServiceRef.current || query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query.toUpperCase(), // Convert to uppercase for UK postcodes
          componentRestrictions: { country: 'gb' }, // Restrict to UK
          // Remove types restriction to allow postcodes and addresses
        },
        (predictions, status) => {
          setIsLoading(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([]);
            setShowSuggestions(false);
          } else {
            setError('Failed to fetch address suggestions');
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }
      );
    }, 300),
    [isApiLoaded]
  );
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.length >= 3) {
      performSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Handle suggestion selection
  const handleSuggestionClick = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) {
      toast.error('Address service not ready');
      return;
    }
    
    setIsLoading(true);
    setShowSuggestions(false);
    setInputValue(prediction.description);
    
    // Get detailed place information
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['address_components', 'formatted_address', 'geometry']
      },
      (place, status) => {
        setIsLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const extractedAddress = extractAddressComponents(place as PlaceResult);
          onAddressSelect(extractedAddress);
          toast.success('Address selected successfully');
        } else {
          console.error('Place details error:', status);
          setError('Failed to get address details');
          toast.error('Failed to get address details');
        }
      }
    );
  };
  
  // Extract address components from Google Places result
  const extractAddressComponents = (place: PlaceResult): ExtractedAddress => {
    const components = place.address_components;
    let extractedAddress: ExtractedAddress = {
      street_number: '',
      route: '',
      locality: '',
      postal_code: '',
      country: '',
      formatted_address: place.formatted_address,
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng()
    };
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        extractedAddress.street_number = component.long_name;
      } else if (types.includes('route')) {
        extractedAddress.route = component.long_name;
      } else if (types.includes('locality') || types.includes('postal_town')) {
        extractedAddress.locality = component.long_name;
      } else if (types.includes('postal_code')) {
        extractedAddress.postal_code = component.long_name;
      } else if (types.includes('country')) {
        extractedAddress.country = component.long_name;
      }
    });
    
    return extractedAddress;
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
          placeholder={placeholder}
          className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 pr-10"
          disabled={!isApiLoaded}
        />
        
        {/* Loading or Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      
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
          Loading address lookup service...
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
                <MapPin className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
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
        </div>
      )}
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default GooglePlacesAutocomplete;
