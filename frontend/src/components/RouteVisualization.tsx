import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, Route, AlertCircle, CheckCircle, XCircle, Navigation, Map } from 'lucide-react';
import { toast } from 'sonner';
import { globalColors, styles, effects } from 'utils/QSAIDesign';
import { useGoogleMaps } from 'utils/googleMapsProvider';
import brain from 'brain';
import { EnhancedRouteModal } from './EnhancedRouteModal';

interface DeliveryAddress {
  street: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface RouteData {
  success: boolean;
  eta_minutes?: number;
  eta_text?: string;
  distance_miles?: number;
  distance_text?: string;
  error?: string;
}

interface Props {
  deliveryAddress: DeliveryAddress;
  googleMapsApiKey: string;
  onRouteCalculated?: (routeData: RouteData) => void;
  className?: string;
}

/**
 * Route Visualization Component
 * 
 * Displays a mini map with route from restaurant to delivery address,
 * showing distance, estimated time, and delivery validation status.
 */
export const RouteVisualization: React.FC<Props> = ({
  deliveryAddress,
  googleMapsApiKey,
  onRouteCalculated,
  className = ""
}) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  // Use centralized Google Maps provider instead of direct loading
  const {
    isLoaded: mapLoaded,
    isLoading: mapLoading, 
    error: mapError,
    createMap,
    createDirectionsService,
    createDirectionsRenderer
  } = useGoogleMaps();
  
  // Restaurant location (from existing config)
  const RESTAURANT_LOCATION = {
    lat: 50.91806074772868,
    lng: -0.4556764022106669
  };
  
  // Calculate route when address changes
  useEffect(() => {
    if (deliveryAddress.latitude && deliveryAddress.longitude) {
      calculateRoute();
    }
  }, [deliveryAddress]);
  
  // Initialize Google Maps when provider is ready
  useEffect(() => {
    if (mapLoaded && mapRef.current && !mapInstanceRef.current) {
      createMapInstance();
    }
  }, [mapLoaded]);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      cleanupMapResources();
    };
  }, []);
  
  const cleanupMapResources = () => {
    try {
      // Clean up directions renderer first
      if (directionsRendererRef.current) {
        try {
          directionsRendererRef.current.setMap(null);
          directionsRendererRef.current.setDirections(null);
        } catch (e) {
          // Silent cleanup
        }
        directionsRendererRef.current = null;
      }
      
      // Clean up map instance
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current = null;
        } catch (e) {
          // Silent cleanup
        }
      }
      
      // Clear map container content safely
      if (mapRef.current) {
        try {
          mapRef.current.innerHTML = '';
        } catch (e) {
          // Silent cleanup
        }
      }
    } catch (err) {
      // Silent cleanup completion
    }
  };
  
  const createMapInstance = () => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    try {
      const mapOptions: google.maps.MapOptions = {
        center: RESTAURANT_LOCATION,
        disableDefaultUI: true,
        styles: [
          // Dark theme map styles
          { elementType: 'geometry', stylers: [{ color: '#1e1e1e' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#1e1e1e' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
          {
            featureType: 'administrative.locality',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{ color: '#263c3f' }]
          },
          {
            featureType: 'poi.park',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#6b9a76' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#38414e' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#212a37' }]
          },
          {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#9ca5b3' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#746855' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#1f2835' }]
          },
          {
            featureType: 'road.highway',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#f3d19c' }]
          },
          {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{ color: '#2f3948' }]
          },
          {
            featureType: 'transit.station',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#d59563' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#515c6d' }]
          },
          {
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#17263c' }]
          }
        ]
      };
      
      const map = createMap(mapRef.current, mapOptions);
      if (!map) {
        throw new Error('Failed to create map with centralized provider');
      }
      
      mapInstanceRef.current = map;
      setError(null);
      
      // Draw route if we have valid coordinates
      if (deliveryAddress.latitude && deliveryAddress.longitude) {
        drawRoute(map);
      }
    } catch (err) {
      console.error('Error creating RouteVisualization map:', err);
      setError('Failed to create map');
    }
  };
  
  const drawRoute = (map: google.maps.Map) => {
    if (!deliveryAddress.latitude || !deliveryAddress.longitude) return;
    
    try {
      // Clean up existing route
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
      
      const directionsService = createDirectionsService();
      const directionsRenderer = createDirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: globalColors.purple.primary,
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
      
      if (!directionsService || !directionsRenderer) {
        console.error('Failed to create directions services');
        return;
      }
      
      directionsRenderer.setMap(map);
      directionsRendererRef.current = directionsRenderer;
      
      // Request directions
      directionsService.route(
        {
          origin: RESTAURANT_LOCATION,
          destination: {
            lat: deliveryAddress.latitude,
            lng: deliveryAddress.longitude
          },
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.IMPERIAL
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            
            // CRITICAL: Fit map bounds to show entire route with proper padding
            // This is per Google Maps API official documentation - DirectionsRenderer
            // does NOT automatically fit bounds, it must be done manually
            if (result.routes[0] && result.routes[0].bounds && map) {
              map.fitBounds(result.routes[0].bounds, 50); // 50px padding for visual clarity
            }
            
            // Extract route information for display
            const route = result.routes[0];
            const leg = route.legs[0];
            
            const calculatedRouteData: RouteData = {
              success: true,
              eta_minutes: Math.round(leg.duration?.value || 0 / 60),
              eta_text: leg.duration?.text || 'Unknown',
              distance_miles: Math.round((leg.distance?.value || 0) * 0.000621371 * 10) / 10, // Convert meters to miles
              distance_text: leg.distance?.text || 'Unknown'
            };
            
            setRouteData(calculatedRouteData);
            onRouteCalculated?.(calculatedRouteData);
          } else {
            console.error('Directions request failed:', status);
            const errorData: RouteData = {
              success: false,
              error: 'Failed to calculate route'
            };
            setRouteData(errorData);
            onRouteCalculated?.(errorData);
          }
        }
      );
    } catch (err) {
      console.error('Error drawing route:', err);
      const errorData: RouteData = {
        success: false,
        error: 'Error drawing route'
      };
      setRouteData(errorData);
      onRouteCalculated?.(errorData);
    }
  };
  
  const calculateRoute = async () => {
    if (!deliveryAddress.latitude || !deliveryAddress.longitude) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await brain.calculate_delivery_route({
        destination_lat: deliveryAddress.latitude,
        destination_lng: deliveryAddress.longitude,
        destination_postcode: deliveryAddress.postcode,
        destination_address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.postcode}`
      });
      
      const data = await response.json();
      setRouteData(data);
      onRouteCalculated?.(data);
      
      // Update map route if map is loaded
      if (mapLoaded && mapInstanceRef.current) {
        drawRoute(mapInstanceRef.current);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      const errorData: RouteData = {
        success: false,
        error: 'Failed to calculate delivery route'
      };
      setRouteData(errorData);
      onRouteCalculated?.(errorData);
      setError('Failed to calculate route');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDeliveryStatus = () => {
    if (!routeData) return null;
    
    if (!routeData.success || routeData.error) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-400" />,
        text: 'Route unavailable',
        color: 'text-red-400'
      };
    }
    
    // Simple delivery validation - could be enhanced with actual business rules
    const distance = routeData.distance_miles || 0;
    if (distance > 10) {
      return {
        icon: <XCircle className="h-4 w-4 text-red-400" />,
        text: 'Outside delivery area',
        color: 'text-red-400'
      };
    }
    
    return {
      icon: <CheckCircle className="h-4 w-4 text-green-400" />,
      text: 'Within delivery area',
      color: 'text-green-400'
    };
  };
  
  const deliveryStatus = getDeliveryStatus();
  
  return (
    <>
      <Card 
        className={`bg-gray-900 border-gray-700 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${globalColors.background.secondary} 0%, ${globalColors.background.primary} 100%)`
        }}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Route className="h-4 w-4" style={{ color: globalColors.purple.primary }} />
              Delivery Route Preview
            </h3>
            {isLoading && (
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1 animate-pulse" />
                Calculating...
              </div>
            )}
          </div>
          
          {/* Mini Map */}
          <div className="mb-3">
            {error ? (
              <div className="h-48 sm:h-64 md:h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              </div>
            ) : (
              <div 
                ref={mapRef}
                className="h-48 sm:h-64 md:h-80 w-full rounded-lg bg-gray-800"
                style={{ minHeight: '192px' }}
              >
                {!mapLoaded && (
                  <div className="h-full flex items-center justify-center">
                    <Skeleton className="h-full w-full rounded-lg" />
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Route Information */}
          {routeData && !error && (
            <div className="space-y-2">
              {/* Distance and Time */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-300">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>Restaurant → Customer</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center">
                  <Route className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-gray-400 mr-1">Distance:</span>
                  <span className="text-white font-medium">
                    {routeData.distance_miles ? `${routeData.distance_miles} miles` : routeData.distance_text || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-gray-400 mr-1">Time:</span>
                  <span className="text-white font-medium">
                    {routeData.eta_text || `${routeData.eta_minutes || 0} mins`}
                  </span>
                </div>
              </div>
              
              {/* Delivery Status */}
              {deliveryStatus && (
                <div className={`flex items-center text-xs ${deliveryStatus.color}`}>
                  {deliveryStatus.icon}
                  <span className="ml-1">{deliveryStatus.text}</span>
                </div>
              )}
              
              {/* Enhanced Map View Button */}
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🚀 Enhanced Map View button clicked!');
                    console.log('Current showEnhancedModal state:', showEnhancedModal);
                    setShowEnhancedModal(true);
                    console.log('Setting showEnhancedModal to true');
                  }}
                  className="
                    w-full relative overflow-hidden group
                    transition-all duration-300 ease-out
                    hover:scale-[1.02] hover:-translate-y-0.5
                    active:scale-[0.98] active:translate-y-0
                    focus:outline-none focus:ring-2 focus:ring-purple-500/30
                  "
                  style={{
                    background: styles.frostedGlassStyle.background,
                    backdropFilter: styles.frostedGlassStyle.backdropFilter,
                    border: `1px solid ${globalColors.border.accent}`,
                    borderRadius: '0.5rem',
                    color: globalColors.text.primary,
                    boxShadow: `
                      0 4px 8px rgba(0, 0, 0, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    // Hover effects using CSS custom properties
                    '--hover-glow': effects.outerGlow('medium'),
                    '--hover-bg': 'rgba(91, 33, 182, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `
                      ${effects.outerGlow('medium')},
                      0 6px 16px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15)
                    `;
                    e.currentTarget.style.background = `
                      linear-gradient(135deg, 
                        rgba(30, 30, 30, 0.95) 0%, 
                        rgba(91, 33, 182, 0.15) 100%
                      )
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `
                      0 4px 8px rgba(0, 0, 0, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `;
                    e.currentTarget.style.background = styles.frostedGlassStyle.background;
                  }}
                >
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded" />
                  
                  {/* Icon with enhanced spacing */}
                  <Map className="h-4 w-4 mr-2 relative z-10" style={{ color: globalColors.purple.light }} />
                  
                  {/* Button text with proper contrast */}
                  <span className="relative z-10 font-medium" style={{ color: globalColors.text.primary }}>
                    🗺️ Enhanced Map View
                  </span>
                  
                  {/* Subtle shine effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && !routeData && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Route Modal */}
      <EnhancedRouteModal
        isOpen={showEnhancedModal}
        onClose={() => setShowEnhancedModal(false)}
        deliveryAddress={deliveryAddress}
      />
    </>
  );
};

export default RouteVisualization;
