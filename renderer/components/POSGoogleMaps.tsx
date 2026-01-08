
import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, MapPin, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMountedRef } from 'utils/safeHooks';
import { useGoogleMaps } from 'utils/googleMapsProvider';

interface Props {
  restaurantCoordinates: { latitude: number; longitude: number } | null;
  destinationCoordinates: { latitude: number; longitude: number } | null;
  googleMapsApiKey: string | null; // Kept for backwards compatibility but not used
  miles?: number;
  minutes?: number;
  addressDetails?: {
    line1: string;
    line2?: string;
    city: string;
    county?: string;
    postcode: string;
  };
  isMinimumOrderMet?: boolean;
}

const UK_CENTER = { lat: 54.0, lng: -2.0 };
const DEFAULT_ZOOM = 6;

export const POSGoogleMaps: React.FC<Props> = ({
  restaurantCoordinates,
  destinationCoordinates,
  googleMapsApiKey, // Not used anymore but kept for compatibility
  miles,
  minutes,
  addressDetails,
  isMinimumOrderMet,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [googleMap, setGoogleMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mountedRef = useMountedRef();
  
  // Use centralized Google Maps provider
  const {
    isLoaded: googleMapLoaded,
    isLoading: mapLoading,
    error: mapProviderError,
    createMap,
    createDirectionsService,
    createDirectionsRenderer
  } = useGoogleMaps();
  
  // Refs to track resources for cleanup
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Check if restaurant and destination coordinates are valid
  const hasValidCoordinates = () => {
    if (!restaurantCoordinates || !destinationCoordinates) return false;
    
    const validRestaurant = 
      restaurantCoordinates.latitude && 
      restaurantCoordinates.longitude &&
      !isNaN(Number(restaurantCoordinates.latitude)) && 
      !isNaN(Number(restaurantCoordinates.longitude));
    
    const validDestination = 
      destinationCoordinates.latitude && 
      destinationCoordinates.longitude &&
      !isNaN(Number(destinationCoordinates.latitude)) && 
      !isNaN(Number(destinationCoordinates.longitude));
    
    return validRestaurant && validDestination;
  };
  
  // Clean up map resources
  const cleanupMapResources = () => {
    // Clear markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
    
    // Clear directions renderer
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    
    // Clear circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
      circleRef.current = null;
    }
    
    // Clear polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  };

  // Initialize map when Google Maps loads
  useEffect(() => {
    if (!googleMapLoaded || !mapRef.current || !mountedRef.current) return;
    
    initializeMap();
  }, [googleMapLoaded, mountedRef]);

  // Initialize map
  const initializeMap = () => {
    if (!googleMapLoaded || !mapRef.current || !mountedRef.current) return;

    try {
      // Clean up existing resources
      cleanupMapResources();
      
      // Create map using centralized provider
      const map = createMap(mapRef.current, {
        center: UK_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ saturation: -100 }, { lightness: -20 }],
          },
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "on" }, { saturation: -100 }, { lightness: 10 }],
          },
          {
            featureType: "road",
            elementType: "all",
            stylers: [{ visibility: "on" }, { saturation: -100 }, { lightness: 20 }],
          },
        ],
      });

      if (!map || !mountedRef.current) return;
      
      setGoogleMap(map);
      setMapError(null);

      // Draw route if coordinates are valid
      if (hasValidCoordinates()) {
        drawRoute(map);
      } else if (
        restaurantCoordinates?.latitude && 
        restaurantCoordinates?.longitude && 
        !isNaN(Number(restaurantCoordinates.latitude)) && 
        !isNaN(Number(restaurantCoordinates.longitude))
      ) {
        // If only restaurant coordinates are valid, center map on restaurant
        const restaurantPosition = {
          lat: Number(restaurantCoordinates.latitude), 
          lng: Number(restaurantCoordinates.longitude)
        };
        
        map.setCenter(restaurantPosition);
        map.setZoom(15);

        // Add marker for restaurant
        const restaurantMarker = new google.maps.Marker({
          position: restaurantPosition,
          map,
          title: "Restaurant",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });
        markersRef.current.push(restaurantMarker);

        // Draw delivery radius
        if (miles && miles > 0) {
          drawDeliveryRadius(map, restaurantPosition, miles);
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setMapError("Error initializing map");
        console.error("Error initializing map:", err);
      }
    }
  };

  // Draw route between restaurant and destination
  const drawRoute = (map: google.maps.Map) => {
    if (!mountedRef.current) return;
    
    try {
      if (!restaurantCoordinates || !destinationCoordinates) return;
      
      // Parse coordinates as numbers
      const restaurantLatitude = Number(restaurantCoordinates.latitude);
      const restaurantLongitude = Number(restaurantCoordinates.longitude);
      const destinationLatitude = Number(destinationCoordinates.latitude);
      const destinationLongitude = Number(destinationCoordinates.longitude);
      
      // Check for NaN values
      if (
        isNaN(restaurantLatitude) || 
        isNaN(restaurantLongitude) || 
        isNaN(destinationLatitude) || 
        isNaN(destinationLongitude)
      ) {
        console.error("Invalid coordinates for route");
        if (mountedRef.current) {
          setMapError("Invalid coordinates for route");
        }
        return;
      }

      const restaurantPosition = { lat: restaurantLatitude, lng: restaurantLongitude };
      const destinationPosition = { lat: destinationLatitude, lng: destinationLongitude };

      // Create bounds to fit both points
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(restaurantPosition);
      bounds.extend(destinationPosition);
      map.fitBounds(bounds);

      // Add marker for restaurant
      const restaurantMarker = new google.maps.Marker({
        position: restaurantPosition,
        map,
        title: "Restaurant",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        },
      });
      markersRef.current.push(restaurantMarker);

      // Add marker for destination
      const destinationMarker = new google.maps.Marker({
        position: destinationPosition,
        map,
        title: "Delivery Address",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });
      markersRef.current.push(destinationMarker);

      // Draw directions using centralized provider
      const directionsService = createDirectionsService();
      const directionsRenderer = createDirectionsRenderer({
        map,
        suppressMarkers: true, // We'll use our own markers
        polylineOptions: {
          strokeColor: "#3b82f6", // Blue route line
          strokeWeight: 5,
          strokeOpacity: 0.7,
        },
      });
      
      if (!directionsService || !directionsRenderer) {
        console.error("Failed to create directions service or renderer");
        setMapError("Failed to create directions service");
        return;
      }
      
      directionsRendererRef.current = directionsRenderer;

      directionsService.route(
        {
          origin: restaurantPosition,
          destination: destinationPosition,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (!mountedRef.current) return;
          
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            // Draw delivery radius
            if (miles && miles > 0) {
              drawDeliveryRadius(map, restaurantPosition, miles);
            }
          } else {
            console.error("Directions request failed:", status);
            // If directions fail, still show the markers
            if (mountedRef.current) {
              setMapError("Unable to find driving directions between these locations");
            }
            
            // Fall back to a straight line
            const straightLine = new google.maps.Polyline({
              path: [restaurantPosition, destinationPosition],
              geodesic: true,
              strokeColor: "#ff6b6b", // Red line for fallback
              strokeOpacity: 0.5,
              strokeWeight: 2,
            });
            straightLine.setMap(map);
            polylineRef.current = straightLine;
          }
        }
      );
    } catch (err) {
      if (mountedRef.current) {
        console.error("Error drawing route:", err);
        setMapError("Error drawing delivery route");
      }
    }
  };

  // Draw delivery radius
  const drawDeliveryRadius = (map: google.maps.Map, center: google.maps.LatLngLiteral, radiusMiles: number) => {
    if (!mountedRef.current) return;
    
    try {
      // Convert miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = radiusMiles * 1609.34;

      // Create the circle
      const circle = new google.maps.Circle({
        strokeColor: "#10b981", // Green
        strokeOpacity: 0.4,
        strokeWeight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.1,
        map,
        center,
        radius: radiusMeters,
      });
      
      circleRef.current = circle;
    } catch (err) {
      console.error("Error drawing delivery radius:", err);
    }
  };

  // Re-initialize map when coordinates change
  useEffect(() => {
    if (googleMapLoaded && googleMap && mountedRef.current) {
      // Clean up existing resources before reinitializing
      cleanupMapResources();
      
      // Reinitialize the map
      initializeMap();
    }
  }, [restaurantCoordinates, destinationCoordinates, miles, minutes, googleMapLoaded, mountedRef]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapResources();
    };
  }, []);

  // Display loading, error, or map
  const displayError = mapProviderError || mapError;
  const isLoading = mapLoading || (!googleMapLoaded && !displayError);

  return (
    <Card className="bg-gray-950 border-gray-800">
      <CardContent className="p-0 overflow-hidden rounded-md">
        {displayError ? (
          <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Map Error</AlertTitle>
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="h-[200px] w-full bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="relative">
            <div
              ref={mapRef}
              className="h-[200px] w-full bg-gray-900 rounded-md overflow-hidden"
            />
            {/* Distance and time badge */}
            {miles && minutes && (
              <div className="absolute bottom-2 right-2">
                <Badge variant="secondary" className="bg-black/70 backdrop-blur-sm text-white border-gray-700">
                  <MapPin className="h-3 w-3 mr-1 text-blue-400" />
                  {miles.toFixed(1)} miles • {minutes} mins
                </Badge>
              </div>
            )}
            {/* Postcode badge with validation status */}
            {addressDetails && (
              <div className="absolute bottom-2 left-2 max-w-[70%] group">
                <Badge 
                  variant="secondary" 
                  className={`bg-black/70 backdrop-blur-sm text-white border-gray-700 ${isMinimumOrderMet === false ? 'border-red-600/50' : isMinimumOrderMet === true ? 'border-green-600/50' : ''}`}
                >
                  {isMinimumOrderMet === false && (
                    <AlertTriangle className="h-3 w-3 mr-1 text-red-400" />
                  )}
                  {isMinimumOrderMet === true && (
                    <Check className="h-3 w-3 mr-1 text-green-400" />
                  )}
                  {addressDetails.postcode}
                </Badge>
                
                {/* Address details tooltip */}
                <div className="absolute top-full left-0 mt-2 w-full max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-black/80 backdrop-blur-sm p-2 rounded-md text-xs border border-gray-700 text-white">
                    <p className="font-medium">{addressDetails.line1}</p>
                    {addressDetails.line2 && <p className="text-gray-400">{addressDetails.line2}</p>}
                    <p className="text-gray-400">
                      {addressDetails.city}
                      {addressDetails.county ? `, ${addressDetails.county}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
