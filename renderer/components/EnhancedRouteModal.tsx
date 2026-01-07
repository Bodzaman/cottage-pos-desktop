import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Route, Map, Eye, Copy, MapPin, Clock, Thermometer, Car, AlertTriangle, Navigation2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { globalColors, styles, effects } from 'utils/QSAIDesign';
import { useGoogleMaps } from 'utils/googleMapsProvider';
import { apiClient } from 'app';

interface DeliveryAddress {
  street: string;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deliveryAddress: DeliveryAddress;
  className?: string;
}

/**
 * Enhanced Route Modal - QSAI Design System Implementation
 * 
 * Provides comprehensive delivery route intelligence with POSDesktop styling:
 * - Route View: Full delivery route with traffic intelligence
 * - Map View: Destination area focus with location context  
 * - Street View: Interactive street-level visualization
 * 
 * Design Features:
 * - QSAI dark theme with purple accents
 * - Glass-morphism panels and buttons
 * - Premium gradient text and effects
 * - Consistent with POSDesktop design language
 */
export const EnhancedRouteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  deliveryAddress,
  className = ""
}) => {
  const [viewMode, setViewMode] = useState<'route' | 'map' | 'streetview'>('route');
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streetViewAvailable, setStreetViewAvailable] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  
  // Use centralized Google Maps provider like all other working components
  const {
    isLoaded: googleMapsLoaded,
    isLoading: mapLoading,
    error: mapError,
    createMap,
    createDirectionsService,
    createDirectionsRenderer
  } = useGoogleMaps();
  
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const outlineRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const trafficLayer = useRef<google.maps.TrafficLayer | null>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const streetViewPanorama = useRef<google.maps.StreetViewPanorama | null>(null);

  // Initialize enhanced route data when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadEnhancedRouteData();
    }
  }, [isOpen, deliveryAddress]);

  // Initialize map when all required data is available
  useEffect(() => {
    if (!isOpen || !googleMapsLoaded || !routeData) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (viewMode === 'route' || viewMode === 'map') {
        initializeMap();
      } else if (viewMode === 'streetview') {
        initializeStreetView();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [viewMode, routeData, googleMapsLoaded, isOpen]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanupResources();
    }
  }, [isOpen]);

  const cleanupResources = () => {
    // Clean up map resources
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
      directionsRenderer.current = null;
    }
    if (outlineRenderer.current) {
      outlineRenderer.current.setMap(null);
      outlineRenderer.current = null;
    }
    if (trafficLayer.current) {
      trafficLayer.current.setMap(null);
      trafficLayer.current = null;
    }
    map.current = null;
    streetViewPanorama.current = null;
    setRouteData(null);
    setLoading(true);
    setStreetViewAvailable(true);
  };

  const loadEnhancedRouteData = async () => {
    try {
      console.log('Loading enhanced route data for:', deliveryAddress);
      const response = await apiClient.calculate_enhanced_delivery_route({
        destination_lat: deliveryAddress.latitude,
        destination_lng: deliveryAddress.longitude,
        destination_postcode: deliveryAddress.postcode,
        destination_address: `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.postcode}`
      });
      const data = await response.json();
      console.log('Enhanced route data received:', data);
      
      if (data.success) {
        setRouteData(data);
      } else {
        console.error('API returned error:', data.error);
        setRouteData(null);
      }
    } catch (error) {
      console.error('Failed to load enhanced route data:', error);
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map based on view mode using centralized provider
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !routeData || !googleMapsLoaded) {
      console.log('Cannot initialize map - missing required data:', { 
        mapRef: !!mapRef.current, 
        routeData: !!routeData, 
        success: routeData?.success,
        googleMapsLoaded
      });
      return;
    }

    // Enhanced validation for data structure
    if (!routeData.success) {
      console.error('Route data indicates failure:', routeData.error);
      return;
    }

    // Validate required location data
    if (!routeData.destination || !routeData.destination.lat || !routeData.destination.lng) {
      console.error('Missing destination data for map initialization:', routeData.destination);
      return;
    }

    console.log('Initializing map for mode:', viewMode, 'with validated data:', routeData);

    // Determine initial center based on view mode (will be overridden by fitBounds for route view)
    let center: google.maps.LatLngLiteral;
    
    if (viewMode === 'route' && routeData.restaurant && routeData.restaurant.lat && routeData.restaurant.lng) {
      // Route view: initial center (will be adjusted by DirectionsRenderer)
      center = {
        lat: (routeData.restaurant.lat + routeData.destination.lat) / 2,
        lng: (routeData.restaurant.lng + routeData.destination.lng) / 2
      };
      console.log('Route view: initial center (will be fitted to bounds)');
    } else if (routeData.destination) {
      // Map view: focus on destination
      center = {
        lat: routeData.destination.lat,
        lng: routeData.destination.lng
      };
      console.log('Map view: focusing on destination');
    } else {
      console.error('No valid location data available for map initialization');
      return;
    }

    const mapOptions: google.maps.MapOptions = {
      center,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
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

    try {
      // Use centralized provider's createMap method
      const mapInstance = createMap(mapRef.current, mapOptions);
      if (!mapInstance) {
        console.error('Failed to create map instance from provider');
        return;
      }
      
      map.current = mapInstance;
      console.log('✅ Enhanced Route Modal map created successfully with centralized provider');

      // Initialize directions service using provider
      directionsService.current = createDirectionsService();

      // Add traffic layer for traffic intelligence
      trafficLayer.current = new google.maps.TrafficLayer();
      if (showTraffic) {
        trafficLayer.current.setMap(mapInstance);
      }

      // Draw route or add markers based on view mode
      if (viewMode === 'route') {
        drawRouteWithDirectionsRenderer(mapInstance);
      } else {
        // Map view: set proper zoom for destination focus
        mapInstance.setZoom(16);
        addDestinationMarker(mapInstance);
      }

    } catch (error) {
      console.error('Error initializing enhanced route map:', error);
    }
  }, [viewMode, routeData, googleMapsLoaded, showTraffic, createMap, createDirectionsService]);

  // Draw route using official DirectionsRenderer with dual-layer styling
  const drawRouteWithDirectionsRenderer = (mapInstance: google.maps.Map) => {
    if (!routeData.restaurant || !routeData.destination || !directionsService.current) {
      console.warn('Missing route data or directions service for rendering');
      return;
    }

    const request: google.maps.DirectionsRequest = {
      origin: { lat: routeData.restaurant.lat, lng: routeData.restaurant.lng },
      destination: { lat: routeData.destination.lat, lng: routeData.destination.lng },
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        console.log('✅ Directions result received:', result);

        // Layer 1: White outline renderer (behind purple route)
        outlineRenderer.current = new google.maps.DirectionsRenderer({
          map: mapInstance,
          directions: result,
          preserveViewport: true, // Don't auto-fit for outline
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#FFFFFF',
            strokeWeight: 8,
            strokeOpacity: 1.0,
            zIndex: 1
          }
        });

        // Layer 2: Purple inner route renderer (official QSAI theme)
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: mapInstance,
          directions: result,
          preserveViewport: false, // Allow auto-fit for main renderer
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: globalColors.purple.primary,
            strokeWeight: 5,
            strokeOpacity: 1.0,
            zIndex: 2
          }
        });

        // Apply proper bounds fitting with padding (Google Maps 2024 best practice)
        const routeBounds = result.routes[0].bounds;
        mapInstance.fitBounds(routeBounds, {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        });

        // Apply zoom constraints after fitBounds completes (idle event pattern)
        google.maps.event.addListenerOnce(mapInstance, 'idle', () => {
          const currentZoom = mapInstance.getZoom();
          const maxZoom = 15; // Prevent over-zoom
          const minZoom = 11; // Ensure full route visibility
          
          if (currentZoom !== undefined) {
            if (currentZoom > maxZoom) {
              mapInstance.setZoom(maxZoom);
              console.log(`Zoom constrained to max: ${maxZoom}`);
            } else if (currentZoom < minZoom) {
              mapInstance.setZoom(minZoom);
              console.log(`Zoom constrained to min: ${minZoom}`);
            } else {
              console.log(`Zoom within constraints: ${currentZoom}`);
            }
          }
        });

        // Add custom markers (restaurant and destination)
        addCustomMarkers(mapInstance);

        console.log('✅ Route rendered with DirectionsRenderer (dual-layer) and proper bounds fitting');
      } else {
        console.error('Directions request failed:', status);
        // Fallback to simple markers if directions fail
        addCustomMarkers(mapInstance);
      }
    });
  };

  // Add custom markers for restaurant and destination
  const addCustomMarkers = (mapInstance: google.maps.Map) => {
    if (!routeData.restaurant || !routeData.destination) return;

    // Custom restaurant marker with QSAI styling
    new google.maps.Marker({
      position: { lat: routeData.restaurant.lat, lng: routeData.restaurant.lng },
      map: mapInstance,
      title: 'Cottage Tandoori Restaurant',
      icon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: globalColors.purple.primary,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 1.8,
        anchor: new google.maps.Point(12, 24)
      },
      zIndex: 10
    });

    // Custom delivery destination marker with QSAI styling
    new google.maps.Marker({
      position: { lat: routeData.destination.lat, lng: routeData.destination.lng },
      map: mapInstance,
      title: 'Delivery Destination',
      icon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1-1 .45-1 1zm10 0c0 .55-.45 1-1 1s-1-.45-1-1 .45-1 1-1 1 .45 1 1z',
        fillColor: globalColors.purple.light,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3,
        scale: 1.6,
        anchor: new google.maps.Point(12, 24)
      },
      zIndex: 10
    });
  };

  const addDestinationMarker = (mapInstance: google.maps.Map) => {
    if (!routeData.destination) {
      console.warn('No destination data available for adding marker');
      return;
    }

    new google.maps.Marker({
      position: { lat: routeData.destination.lat, lng: routeData.destination.lng },
      map: mapInstance,
      title: 'Delivery Address',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: globalColors.purple.primary,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10
      }
    });
  };

  // Toggle traffic layer visibility (Google Maps 2024 best practice)
  const toggleTraffic = () => {
    if (trafficLayer.current && map.current) {
      const isCurrentlyVisible = trafficLayer.current.getMap();
      trafficLayer.current.setMap(isCurrentlyVisible ? null : map.current);
      setShowTraffic(!isCurrentlyVisible);
      toast.success(isCurrentlyVisible ? 'Traffic layer hidden' : 'Traffic layer shown');
    }
  };

  const initializeStreetView = () => {
    if (!streetViewRef.current || !deliveryAddress) return;

    try {
      const streetViewService = new google.maps.StreetViewService();
      const position = {
        lat: deliveryAddress.latitude,
        lng: deliveryAddress.longitude
      };

      // Check if Street View is available at this location (Google Maps 2024 best practice)
      streetViewService.getPanorama({
        location: position,
        radius: 50,
        source: google.maps.StreetViewSource.OUTDOOR
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          console.log('✅ Street View available at location:', position);
          setStreetViewAvailable(true);
          
          // Calculate heading with null-safe approach (no force unwrap)
          const heading = google.maps.geometry.spherical.computeHeading(
            data.location.latLng,
            position
          );
          
          // Create Street View panorama with proper null-safe POV
          const panorama = new google.maps.StreetViewPanorama(streetViewRef.current!, {
            position: data.location.latLng,
            pov: {
              heading: heading ?? 0, // Nullish coalescing for safe fallback
              pitch: 0
            },
            zoom: 1,
            addressControl: false,
            panControl: true,
            zoomControl: true,
            fullscreenControl: false
          });
          
          streetViewPanorama.current = panorama;
        } else {
          console.warn('⚠️ Street View not available:', { status, position });
          setStreetViewAvailable(false);
        }
      });
    } catch (error) {
      console.error('❌ Error initializing Street View:', error);
      setStreetViewAvailable(false);
    }
  };

  const getViewModeIcon = (mode: string) => {
    switch (mode) {
      case 'route': return Route;
      case 'map': return Map;
      case 'streetview': return Eye;
      default: return Route;
    }
  };

  const getViewModeLabel = (mode: string) => {
    switch (mode) {
      case 'route': return 'Route View';
      case 'map': return 'Map View';
      case 'streetview': return 'Street View';
      default: return 'Route View';
    }
  };

  const copyETA = () => {
    if (routeData?.duration_text) {
      navigator.clipboard.writeText(routeData.duration_text);
      toast.success('ETA copied to clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl h-[90vh] p-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${globalColors.background.primary} 0%, ${globalColors.background.secondary} 100%)`,
          border: `1px solid ${globalColors.border.medium}`,
          boxShadow: `0 25px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px ${globalColors.purple.primary}20`
        }}
      >
        <div className="relative h-full flex flex-col">
          {/* QSAI Header */}
          <div 
            className="flex items-center justify-between p-6 border-b"
            style={{
              background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.primary} 100%)`,
              borderBottomColor: globalColors.border.accent,
              ...styles.frostedGlassStyle
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
                  boxShadow: effects.outerGlow('medium')
                }}
              >
                <Navigation2 className="w-5 h-5 text-white" />
              </div>
              <h2 
                className="text-xl font-bold"
                style={{
                  ...styles.purpleGradientText,
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}
              >
                Enhanced Route Intelligence
              </h2>
            </div>
          </div>

          {loading ? (
            // QSAI Loading State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div 
                  className="w-16 h-16 border-4 border-transparent rounded-full animate-spin mx-auto mb-6"
                  style={{
                    borderTopColor: globalColors.purple.primary,
                    borderRightColor: globalColors.purple.light
                  }}
                ></div>
                <p 
                  className="text-lg font-medium mb-2"
                  style={{ color: globalColors.text.primary }}
                >
                  Loading route intelligence...
                </p>
                <p style={{ color: globalColors.text.muted }}>
                  Analyzing traffic, weather & location data
                </p>
              </div>
            </div>
          ) : routeData ? (
            <div className="flex-1 flex flex-col">
              {/* QSAI View Mode Selector */}
               <div 
                 className="p-6 border-b"
                 style={{
                   background: globalColors.background.panel,
                   borderBottomColor: globalColors.border.light
                 }}
               >
                <div className="flex gap-3">
                  {['route', 'map', 'streetview'].map((mode) => {
                    const Icon = getViewModeIcon(mode);
                    const isActive = viewMode === mode;
                    const isDisabled = mode === 'streetview' && !streetViewAvailable;
                    
                    return (
                      <Button
                        key={mode}
                        onClick={() => !isDisabled && setViewMode(mode as any)}
                        disabled={isDisabled}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        style={{
                          background: isActive 
                            ? `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`
                            : `linear-gradient(135deg, ${globalColors.background.tertiary} 0%, ${globalColors.background.secondary} 100%)`,
                          border: `1px solid ${isActive ? globalColors.purple.primary : globalColors.border.light}`,
                          color: isActive ? '#FFFFFF' : globalColors.text.secondary,
                          boxShadow: isActive ? effects.outerGlow('subtle') : 'none',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {getViewModeLabel(mode)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex">
                {/* QSAI Information Panel */}
                <div 
                  className="w-80 p-6 overflow-y-auto border-r"
                  style={{
                    background: `linear-gradient(135deg, ${globalColors.background.panel} 0%, ${globalColors.background.secondary} 100%)`,
                    borderRight: `1px solid ${globalColors.border.light}`,
                    ...styles.frostedGlassStyle
                  }}
                >
                  <div className="space-y-6">
                    {/* Delivery Intelligence */}
                    <div>
                      <h3 
                        className="text-lg font-semibold mb-4 flex items-center gap-2"
                        style={{ color: globalColors.text.primary }}
                      >
                        <div 
                          className="p-1 rounded"
                          style={{ background: globalColors.purple.primary + '20' }}
                        >
                          <MapPin className="w-4 h-4" style={{ color: globalColors.purple.light }} />
                        </div>
                        Delivery Intelligence
                      </h3>
                      
                      <div className="space-y-4">
                        {/* Delivery Time */}
                        <div 
                          className="p-4 rounded-lg"
                          style={{
                            background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.tertiary} 100%)`,
                            border: `1px solid ${globalColors.border.light}`
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span style={{ color: globalColors.text.muted }}>Delivery Time</span>
                            <Button
                              onClick={copyETA}
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              style={{
                                color: globalColors.purple.light,
                                background: globalColors.purple.primary + '10'
                              }}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy ETA
                            </Button>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span 
                              className="text-2xl font-bold"
                              style={{ color: globalColors.text.primary }}
                            >
                              {routeData.delivery_time_minutes || 'N/A'}
                            </span>
                            <span style={{ color: globalColors.text.muted }}>min</span>
                          </div>
                          <div className="text-sm" style={{ color: globalColors.text.muted }}>
                            {routeData.distance_text}
                          </div>
                        </div>

                        {/* Weather Impact */}
                        {routeData.weather && (
                          <div 
                            className="p-4 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.tertiary} 100%)`,
                              border: `1px solid ${globalColors.border.light}`
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Thermometer className="w-4 h-4" style={{ color: globalColors.purple.light }} />
                              <span style={{ color: globalColors.text.muted }}>Weather Impact</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{routeData.weather.icon}</span>
                              <span style={{ color: globalColors.text.primary }}>
                                {routeData.weather.description}
                              </span>
                            </div>
                            <div className="text-sm mt-1" style={{ color: globalColors.text.muted }}>
                              {routeData.weather.temperature_celsius}°C • +{routeData.weather.impact_minutes}min
                            </div>
                          </div>
                        )}

                        {/* Traffic Conditions */}
                        {routeData.traffic && (
                          <div 
                            className="p-4 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.tertiary} 100%)`,
                              border: `1px solid ${globalColors.border.light}`
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Car className="w-4 h-4" style={{ color: globalColors.purple.light }} />
                              <span style={{ color: globalColors.text.muted }}>Traffic Conditions</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ background: routeData.traffic.color }}
                                ></div>
                                <span 
                                  className="font-medium"
                                  style={{ color: globalColors.text.primary }}
                                >
                                  {routeData.traffic.status}
                                </span>
                              </div>
                              <span style={{ color: globalColors.text.muted }}>
                                +{routeData.traffic.delay_minutes}min
                              </span>
                            </div>
                            <div className="text-sm mt-1" style={{ color: globalColors.text.muted }}>
                              {routeData.traffic.description}
                            </div>
                          </div>
                        )}

                        {/* Location Context */}
                        {routeData.location_intelligence && (
                          <div 
                            className="p-4 rounded-lg"
                            style={{
                              background: `linear-gradient(135deg, ${globalColors.background.dark} 0%, ${globalColors.background.tertiary} 100%)`,
                              border: `1px solid ${globalColors.border.light}`
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <div 
                                className="p-1 rounded"
                                style={{ background: globalColors.purple.primary + '20' }}
                              >
                                <MapPin className="w-3 h-3" style={{ color: globalColors.purple.light }} />
                              </div>
                              <span style={{ color: globalColors.text.muted }}>Location Context</span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {routeData.location_intelligence.area_type && (
                                <div className="flex justify-between">
                                  <span style={{ color: globalColors.text.muted }}>Area Type:</span>
                                  <span style={{ color: globalColors.text.primary }}>
                                    {routeData.location_intelligence.area_type}
                                  </span>
                                </div>
                              )}
                              {routeData.location_intelligence.building_type && (
                                <div className="flex justify-between">
                                  <span style={{ color: globalColors.text.muted }}>Building:</span>
                                  <span style={{ color: globalColors.text.primary }}>
                                    {routeData.location_intelligence.building_type}
                                  </span>
                                </div>
                              )}
                              {routeData.location_intelligence.access_notes && (
                                <div>
                                  <span style={{ color: globalColors.text.muted }}>Access Notes:</span>
                                  <p 
                                    className="mt-1"
                                    style={{ color: globalColors.text.primary }}
                                  >
                                    {routeData.location_intelligence.access_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map Container */}
                <div className="flex-1 relative">
                  {viewMode === 'route' || viewMode === 'map' ? (
                    <div 
                      ref={mapRef}
                      className="w-full h-full"
                      style={{ background: globalColors.background.dark }}
                    />
                  ) : (
                    <div 
                      ref={streetViewRef}
                      className="w-full h-full"
                      style={{ background: globalColors.background.dark }}
                    />
                  )}
                  
                  {/* Map Loading Overlay */}
                  {loading && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: globalColors.background.primary + 'E6',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 border-2 border-transparent rounded-full animate-spin mx-auto mb-2"
                          style={{
                            borderTopColor: globalColors.purple.primary,
                            borderRightColor: globalColors.purple.light
                          }}
                        ></div>
                        <p style={{ color: globalColors.text.muted }}>Loading map...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // QSAI Error State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${globalColors.purple.primary}20 0%, ${globalColors.purple.light}10 100%)`,
                    border: `1px solid ${globalColors.purple.primary}30`
                  }}
                >
                  <AlertTriangle className="w-8 h-8" style={{ color: globalColors.purple.light }} />
                </div>
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: globalColors.text.primary }}
                >
                  Unable to Load Route Data
                </h3>
                <p className="mb-4" style={{ color: globalColors.text.muted }}>
                  There was an issue loading the route information.
                </p>
                <Button
                  onClick={() => loadEnhancedRouteData()}
                  className="px-6 py-2"
                  style={{
                    background: `linear-gradient(135deg, ${globalColors.purple.primary} 0%, ${globalColors.purple.light} 100%)`,
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: '500'
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedRouteModal;
