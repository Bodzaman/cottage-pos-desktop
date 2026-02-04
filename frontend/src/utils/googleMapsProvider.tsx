
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  apiKey?: string;
  google?: typeof google | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  
  const { isLoaded, isLoading, error } = context;
  
  // Create map instance
  const createMap = (container: HTMLElement, options: google.maps.MapOptions): google.maps.Map | null => {
    if (!isLoaded || !window.google?.maps) {
      console.error('Google Maps not loaded when trying to create map');
      return null;
    }
    
    try {
      return new google.maps.Map(container, options);
    } catch (err) {
      console.error('Error creating Google Maps instance:', err);
      return null;
    }
  };
  
  // Create directions service
  const createDirectionsService = (): google.maps.DirectionsService | null => {
    if (!isLoaded || !window.google?.maps) {
      console.error('Google Maps not loaded when trying to create DirectionsService');
      return null;
    }
    
    try {
      return new google.maps.DirectionsService();
    } catch (err) {
      console.error('Error creating DirectionsService:', err);
      return null;
    }
  };
  
  // Create directions renderer
  const createDirectionsRenderer = (options?: google.maps.DirectionsRendererOptions): google.maps.DirectionsRenderer | null => {
    if (!isLoaded || !window.google?.maps) {
      console.error('Google Maps not loaded when trying to create DirectionsRenderer');
      return null;
    }
    
    try {
      return new google.maps.DirectionsRenderer(options);
    } catch (err) {
      console.error('Error creating DirectionsRenderer:', err);
      return null;
    }
  };
  
  // Create autocomplete service for Places API
  const createAutocompleteService = (): google.maps.places.AutocompleteService | null => {
    if (!isLoaded || !window.google?.maps?.places) {
      console.error('Google Maps Places API not loaded when trying to create AutocompleteService');
      return null;
    }
    
    try {
      return new google.maps.places.AutocompleteService();
    } catch (err) {
      console.error('Error creating AutocompleteService:', err);
      return null;
    }
  };
  
  // Create places service for Places API
  const createPlacesService = (): google.maps.places.PlacesService | null => {
    if (!isLoaded || !window.google?.maps?.places) {
      console.error('Google Maps Places API not loaded when trying to create PlacesService');
      return null;
    }
    
    try {
      // Create a hidden div for PlacesService (required by Google Maps API)
      let hiddenDiv = document.getElementById('google-places-service-div');
      if (!hiddenDiv) {
        hiddenDiv = document.createElement('div');
        hiddenDiv.id = 'google-places-service-div';
        hiddenDiv.style.display = 'none';
        document.body.appendChild(hiddenDiv);
      }
      
      const map = new google.maps.Map(hiddenDiv);
      return new google.maps.places.PlacesService(map);
    } catch (err) {
      console.error('Error creating PlacesService:', err);
      return null;
    }
  };
  
  return {
    isLoaded,
    isLoading,
    error,
    apiKey: context.apiKey,
    google: context.google,
    createMap,
    createDirectionsService,
    createDirectionsRenderer,
    createAutocompleteService,
    createPlacesService
  };
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  apiKey: string | null;
}

// Global flag to prevent multiple script loads
let isScriptLoading = false;
let isScriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children, apiKey }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadAttemptRef = useRef(false);

  useEffect(() => {
    if (!apiKey) {
      setError('Google Maps API key not provided');
      return;
    }

    if (loadAttemptRef.current) {
      return; // Prevent multiple load attempts
    }
    loadAttemptRef.current = true;

    const loadGoogleMaps = async () => {
      try {
        // Check if Google Maps is already available
        if (window.google && window.google.maps && window.google.maps.places) {
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
          isScriptLoaded = true;
          return;
        }

        // Check if script is already loading
        if (isScriptLoading && scriptLoadPromise) {
          setIsLoading(true);
          await scriptLoadPromise;
          return;
        }

        // Check if script already exists in DOM
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        if (existingScript) {
          setIsLoading(true);
          
          // Poll for Google Maps availability
          let attempts = 0;
          const maxAttempts = 100; // 10 seconds
          
          const checkGoogle = () => {
            attempts++;
            
            if (window.google && window.google.maps && window.google.maps.places) {
              setIsLoaded(true);
              setIsLoading(false);
              setError(null);
              isScriptLoaded = true;
              return;
            }
            
            if (attempts < maxAttempts) {
              setTimeout(checkGoogle, 100);
            } else {
              setError('Google Maps failed to load');
              setIsLoading(false);
              isScriptLoading = false;
            }
          };
          
          checkGoogle();
          return;
        }

        // Load the script ourselves
        setIsLoading(true);
        isScriptLoading = true;
        
        scriptLoadPromise = new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
          script.async = true;
          script.defer = true;
          script.id = 'google-maps-script';
          
          script.onload = () => {
            
            // Give it a moment to fully initialize
            setTimeout(() => {
              if (window.google && window.google.maps && window.google.maps.places) {
                setIsLoaded(true);
                setIsLoading(false);
                setError(null);
                isScriptLoaded = true;
                isScriptLoading = false;
                resolve();
              } else {
                setError('Google Maps not fully available');
                setIsLoading(false);
                isScriptLoading = false;
                reject(new Error('Google Maps not fully available'));
              }
            }, 500);
          };
          
          script.onerror = () => {
            console.error(' Failed to load Google Maps script');
            setError('Failed to load Google Maps script');
            setIsLoading(false);
            isScriptLoading = false;
            reject(new Error('Failed to load Google Maps script'));
          };
          
          document.head.appendChild(script);
        });
        
        await scriptLoadPromise;
        
      } catch (err) {
        setError('Failed to load Google Maps');
        setIsLoading(false);
        isScriptLoading = false;
      }
    };

    loadGoogleMaps();
  }, [apiKey]);

  const value: GoogleMapsContextType = {
    isLoaded,
    isLoading,
    error,
    apiKey,
    google: window.google || null
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsProvider;
