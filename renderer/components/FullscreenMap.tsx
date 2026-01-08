
import React, { useEffect, useState, useRef } from "react";
import { AlertCircle } from "lucide-react";
import { useAbortableEffect, useMountedRef, useSafeTimeout } from 'utils/safeHooks';
import { useGoogleMaps } from 'utils/googleMapsProvider';

// Default restaurant location in case API doesn't return it
const DEFAULT_RESTAURANT_LOCATION = {
  lat: 50.91806074772868,
  lng: -0.4556764022106669
};

const DEFAULT_RESTAURANT_ADDRESS = "25 West St, Storrington, Pulborough, West Sussex, RH20 4DZ";

interface FullscreenMapProps {
  mapsConfig: any;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    latitude?: number;
    longitude?: number;
  };
  etaInfo: {
    etaText: string;
    distanceText: string;
    distanceMiles: number;
    etaMinutes: number;
  } | null;
}

// Component-scoped map state management
interface MapResources {
  map: google.maps.Map | null;
  listeners: google.maps.MapsEventListener[];
  markers: google.maps.Marker[];
  directionsRenderer: google.maps.DirectionsRenderer | null;
}

export function FullscreenMap({ mapsConfig, deliveryAddress, etaInfo }: FullscreenMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useMountedRef();
  const { setSafeTimeout, clearSafeTimeout } = useSafeTimeout();
  const mapResourcesRef = useRef<MapResources>({
    map: null,
    listeners: [],
    markers: [],
    directionsRenderer: null
  });
  
  // Use centralized Google Maps provider
  const {
    isLoaded: googleMapsLoaded,
    isLoading: mapLoading,
    error: mapProviderError,
    createMap,
    createDirectionsService,
    createDirectionsRenderer
  } = useGoogleMaps();
  
  // Clean up function to properly dispose of Google Maps resources
  const cleanupGoogleMaps = () => {
    if (!mountedRef.current) return;
    
    const resources = mapResourcesRef.current;
    
    // Clear all event listeners
    if (resources.listeners.length > 0) {
      resources.listeners.forEach(listener => {
        try {
          if (google?.maps?.event) {
            google.maps.event.removeListener(listener);
          }
        } catch (error) {
          console.warn('Error removing map listener:', error);
        }
      });
      resources.listeners = [];
    }
    
    // Clear all markers
    if (resources.markers.length > 0) {
      resources.markers.forEach(marker => {
        try {
          marker.setMap(null);
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      resources.markers = [];
    }
    
    // Clear directions renderer
    if (resources.directionsRenderer) {
      try {
        resources.directionsRenderer.setMap(null);
      } catch (error) {
        console.warn('Error removing directions renderer:', error);
      }
      resources.directionsRenderer = null;
    }
    
    // Clear map reference
    resources.map = null;
    
    console.log('🗺️ Google Maps resources cleaned up');
  };

  // Setup effect - runs once on mount
  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      clearSafeTimeout();
      cleanupGoogleMaps();
    };
  }, [clearSafeTimeout]);

  // Map initialization effect using safe hooks
  useAbortableEffect(
    async (abortSignal) => {
      // Don't proceed if we're missing required data
      if (!googleMapsLoaded || !deliveryAddress?.latitude || !deliveryAddress?.longitude) {
        if (mountedRef.current) {
          setLoading(false);
        }
        return;
      }
      
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      try {
        // Clean up any existing map resources first
        cleanupGoogleMaps();
        
        // Check abort signal before proceeding
        if (abortSignal.aborted) return;
        
        // Check abort signal and mounting status
        if (abortSignal.aborted || !mountedRef.current || !mapRef.current) {
          return;
        }
        
        // Get restaurant location from config or use default
        const restaurantLocation = mapsConfig?.restaurant?.location || DEFAULT_RESTAURANT_LOCATION;
        const restaurantAddress = mapsConfig?.restaurant?.address || DEFAULT_RESTAURANT_ADDRESS;

        // Create map instance with all controls enabled using centralized provider
        const mapOptions = {
          center: { 
            lat: (restaurantLocation.lat + (deliveryAddress?.latitude || 0)) / 2, 
            lng: (restaurantLocation.lng + (deliveryAddress?.longitude || 0)) / 2 
          },
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          scaleControl: true,
        };

        // Create the map using centralized provider
        const map = createMap(mapRef.current, mapOptions);
        if (!map) {
          if (mountedRef.current) {
            setError('Failed to create map instance');
            setLoading(false);
          }
          return;
        }
        
        mapResourcesRef.current.map = map;
        
        // Check abort signal before continuing
        if (abortSignal.aborted) {
          cleanupGoogleMaps();
          return;
        }
        
        // Create bounds to contain all markers
        const bounds = new google.maps.LatLngBounds();
        
        // Add restaurant marker
        const restaurantMarker = new google.maps.Marker({
          position: restaurantLocation,
          map,
          title: "Cottage Tandoori"
        });
        mapResourcesRef.current.markers.push(restaurantMarker);
        bounds.extend(restaurantLocation);
        
        // Add delivery marker
        const deliveryMarker = new google.maps.Marker({
          position: { 
            lat: deliveryAddress.latitude || 0, 
            lng: deliveryAddress.longitude || 0 
          },
          map,
          title: deliveryAddress.line1
        });
        mapResourcesRef.current.markers.push(deliveryMarker);
        bounds.extend({ lat: deliveryAddress.latitude || 0, lng: deliveryAddress.longitude || 0 });
        
        // Add info windows
        const restaurantInfo = new google.maps.InfoWindow({
          content: `<div style="color: #000; padding: 5px;"><strong>Cottage Tandoori</strong><br/>${restaurantAddress}</div>`,
        });
        
        const deliveryInfo = new google.maps.InfoWindow({
          content: `<div style="color: #000; padding: 5px;"><strong>Delivery Address</strong><br/>${deliveryAddress.line1}${deliveryAddress.line2 ? `, ${deliveryAddress.line2}` : ''}<br/>${deliveryAddress.city}, ${deliveryAddress.postcode}</div>`,
        });
        
        // Add click listeners for markers
        const listener1 = restaurantMarker.addListener("click", () => {
          if (mountedRef.current) {
            restaurantInfo.open(map, restaurantMarker);
          }
        });
        mapResourcesRef.current.listeners.push(listener1);
        
        const listener2 = deliveryMarker.addListener("click", () => {
          if (mountedRef.current) {
            deliveryInfo.open(map, deliveryMarker);
          }
        });
        mapResourcesRef.current.listeners.push(listener2);

        // Setup directions using centralized provider
        const directionsService = createDirectionsService();
        const directionsRenderer = createDirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.7,
          }
        });
        
        if (!directionsService || !directionsRenderer) {
          if (mountedRef.current) {
            setError('Failed to create directions service');
            setLoading(false);
          }
          return;
        }
        
        mapResourcesRef.current.directionsRenderer = directionsRenderer;

        // Check abort signal before making directions request
        if (abortSignal.aborted) {
          cleanupGoogleMaps();
          return;
        }

        // Request directions
        directionsService.route(
          {
            origin: restaurantLocation,
            destination: { lat: deliveryAddress.latitude || 0, lng: deliveryAddress.longitude || 0 },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL, // Use miles instead of km
          },
          (result, status) => {
            // Check if component is still mounted and operation not aborted
            if (!mountedRef.current || abortSignal.aborted) return;
            
            if (status === google.maps.DirectionsStatus.OK && result) {
              directionsRenderer.setDirections(result);
              map.fitBounds(bounds);
            } else {
              setError("Could not calculate route");
            }
          }
        );

        // Trigger resize on idle to ensure proper rendering
        const idleListener = google.maps.event.addListenerOnce(map, 'idle', () => {
          if (mountedRef.current && !abortSignal.aborted) {
            google.maps.event.trigger(map, 'resize');
            map.fitBounds(bounds);
          }
        });
        mapResourcesRef.current.listeners.push(idleListener);

        if (mountedRef.current) {
          setLoading(false);
        }
        
      } catch (err) {
        if (mountedRef.current && !abortSignal.aborted) {
          console.error('Error initializing fullscreen map:', err);
          setError('Failed to initialize interactive map');
          setLoading(false);
        }
      }
    },
    [googleMapsLoaded, mapsConfig, deliveryAddress],
    {
      onAbort: () => {
        console.log('🚫 Map initialization aborted');
        cleanupGoogleMaps();
      },
      onError: (error) => {
        if (mountedRef.current) {
          console.error('Error in map effect:', error);
          setError('Failed to initialize map');
          setLoading(false);
        }
      }
    }
  );

  // Display loading, error, or map
  const displayError = mapProviderError || error;
  const isLoading = mapLoading || loading;

  return (
    <div className="w-full h-full relative min-h-[400px]">
      {displayError ? (
        <div className="flex items-center justify-center h-full w-full bg-black/30">
          <div className="text-center p-4">
            <div className="text-red-500 mb-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
            </div>
            <h4 className="text-red-400 font-medium">Map Error</h4>
            <p className="text-sm text-gray-400 mt-1">{displayError}</p>
          </div>
        </div>
      ) : (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-full" 
            style={{ minHeight: "400px" }}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
