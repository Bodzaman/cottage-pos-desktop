

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Loader } from "@googlemaps/js-api-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { X, MapPin, Clock, AlertCircle, Maximize2 } from "lucide-react";
import { apiClient } from "app";

interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryMapProps {
  address?: Address;
  className?: string;
}

interface EtaInfo {
  etaText: string;
  distanceText: string;
  distanceMiles: number;
  etaMinutes: number;
}

// Map directions step with instructions
interface DirectionsStep {
  instructions: string;
  distance: string;
  duration: string;
}

export function DeliveryMap({ address, className = "" }: DeliveryMapProps) {
  // Handle case when address is undefined or missing required fields
  if (!address || !address.latitude || !address.longitude) {
    return (
      <div className={`bg-slate-900/50 rounded-lg p-3 text-center h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-500" />
          <p className="text-sm text-gray-400 mt-1">No delivery address selected</p>
          {address && (
            <p className="text-xs text-red-400 mt-1">Missing coordinates for map display</p>
          )}
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapsConfig, setMapsConfig] = useState<any>(null);
  const [etaInfo, setEtaInfo] = useState<EtaInfo | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [directions, setDirections] = useState<DirectionsStep[]>([]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const restaurantMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  // Function to open fullscreen map dialog
  const openFullscreenMap = useCallback(() => {
    if (!loading && !error && mapsConfig && etaInfo) {
      setShowFullscreen(true);
    }
  }, [loading, error, mapsConfig, etaInfo]);
  
  // Function to close fullscreen map dialog
  const closeFullscreenMap = useCallback(() => {
    setShowFullscreen(false);
  }, []);

  // Cleanup event on unmount
  useEffect(() => {
    return () => {
      if (restaurantMarkerRef.current) {
        restaurantMarkerRef.current.setMap(null);
        restaurantMarkerRef.current = null;
      }
      
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }
      
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }
      
      // Close fullscreen map if open
      setShowFullscreen(false);
    };
  }, []);

  // Fetch maps configuration
  useEffect(() => {
    async function fetchMapsConfig() {
      try {
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        setMapsConfig(data);
      } catch (err) {
        console.error("Error fetching maps config:", err);
        setError("Failed to load maps configuration");
        setLoading(false);
      }
    }

    fetchMapsConfig();
  }, []);

  // Calculate delivery route, ETA and distance
  useEffect(() => {
    if (!mapsConfig || !address) {
      return;
    }
    
    // Make sure we have the essentials
    if (!address.postcode || !address.latitude || !address.longitude) {
      setError("Incomplete address data - missing coordinates or postcode");
      setLoading(false);
      return;
    }

    async function calculateDelivery() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.calculate_delivery_route({
          destination_lat: address.latitude || 0,
          destination_lng: address.longitude || 0,
          destination_postcode: address.postcode,
          destination_address: `${address.line1}${address.line2 ? `, ${address.line2}` : ''}, ${address.city}, ${address.postcode}`
        });
        const data = await response.json();
        
        if (!data.success || data.error) {
          setError(data.error || "Failed to calculate delivery route");
        } else if (!data.distance_miles || !data.eta_text) {
          setError("Missing delivery information from calculation");
        } else {
          setEtaInfo({
            etaText: data.eta_text || "Unknown",
            distanceText: data.distance_text || "Unknown",
            distanceMiles: data.distance_miles || 0,
            etaMinutes: data.eta_minutes || 0
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error calculating delivery info:", err);
        setError("Failed to calculate delivery information");
        setLoading(false);
      }
    }

    calculateDelivery();
  }, [mapsConfig, address]);

  // Initialize small map
  useEffect(() => {
    if (!mapsConfig?.apiKey || !mapRef.current || !etaInfo) {
      return;
    }
    
    // Ensure we have valid coordinates
    if (!address?.latitude || !address?.longitude) {
      setError("Missing location coordinates");
      setLoading(false);
      return;
    }

    async function initializeMap() {
      try {
        // Load Google Maps API
        if (!window.google || !window.google.maps) {
          const loader = new Loader({
            apiKey: mapsConfig.apiKey,
            version: "weekly",
          });
          await loader.load();
        }

        // Get restaurant location from config or use default
        const restaurantLocation = mapsConfig?.restaurant?.location || {
          lat: 50.91806074772868,
          lng: -0.4556764022106669
        };

        // Create map instance
        const map = new google.maps.Map(mapRef.current, {
          center: { 
            lat: (restaurantLocation.lat + (address?.latitude || 0)) / 2, 
            lng: (restaurantLocation.lng + (address?.longitude || 0)) / 2 
          },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        // Create bounds to contain all markers
        const bounds = new google.maps.LatLngBounds();

        // Add restaurant marker
        if (restaurantMarkerRef.current) {
          restaurantMarkerRef.current.setMap(null);
        }
        restaurantMarkerRef.current = new google.maps.Marker({
          position: restaurantLocation,
          map,
          title: "Cottage Tandoori",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
          }
        });
        bounds.extend(restaurantLocation);

        // Add destination marker
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.setMap(null);
        }
        destinationMarkerRef.current = new google.maps.Marker({
          position: { 
            lat: address.latitude || 0, 
            lng: address.longitude || 0 
          },
          map,
          title: address.line1,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
          }
        });
        bounds.extend({ lat: address.latitude || 0, lng: address.longitude || 0 });

        // Setup directions
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(null);
        }
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.7,
          }
        });

        // Request directions and get step-by-step instructions
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: restaurantLocation,
            destination: { lat: address.latitude || 0, lng: address.longitude || 0 },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL, // Using miles instead of km
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              if (directionsRendererRef.current) {
                directionsRendererRef.current.setDirections(result);
              }
              
              // Extract step-by-step directions
              const steps: DirectionsStep[] = [];
              if (result.routes[0] && result.routes[0].legs[0]) {
                const leg = result.routes[0].legs[0];
                
                leg.steps.forEach(step => {
                  steps.push({
                    instructions: step.instructions,
                    distance: step.distance.text,
                    duration: step.duration.text
                  });
                });
              }
              
              setDirections(steps);
              map.fitBounds(bounds);
            } else {
              setError("Could not calculate route");
            }
          }
        );

        setLoading(false);
      } catch (err) {
        console.error("Error initializing map:", err);
        setError("Failed to initialize map");
        setLoading(false);
      }
    }

    initializeMap();
  }, [mapsConfig, address, etaInfo]);

  // Initialize fullscreen map when dialog is shown
  useEffect(() => {
    if (!showFullscreen || !mapsConfig?.apiKey || !address) return;
    
    // Reference to the fullscreen map element
    const fullscreenMapElement = document.getElementById('fullscreen-map');
    if (!fullscreenMapElement) return;
    
    let fullscreenMap: google.maps.Map | null = null;
    let fullscreenDirectionsRenderer: google.maps.DirectionsRenderer | null = null;
    let fullscreenMarkers: google.maps.Marker[] = [];
    
    async function initializeFullscreenMap() {
      try {
        // Make sure Google Maps JS API is loaded
        if (!window.google || !window.google.maps) {
          const loader = new Loader({
            apiKey: mapsConfig.apiKey,
            version: "weekly",
          });
          await loader.load();
        }
        
        // Get restaurant location from config or use default
        const restaurantLocation = mapsConfig?.restaurant?.location || {
          lat: 50.91806074772868,
          lng: -0.4556764022106669
        };
        const restaurantAddress = mapsConfig?.restaurant?.address || "25 West St, Storrington, Pulborough, West Sussex, RH20 4DZ";

        // Create map instance with all controls enabled
        const mapOptions = {
          center: { 
            lat: (restaurantLocation.lat + (address?.latitude || 0)) / 2, 
            lng: (restaurantLocation.lng + (address?.longitude || 0)) / 2 
          },
          zoom: 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          scaleControl: true,
        };

        // Create the map
        fullscreenMap = new google.maps.Map(fullscreenMapElement, mapOptions);
        
        // Create bounds to contain all markers
        const bounds = new google.maps.LatLngBounds();
        
        // Add restaurant marker
        const restaurantMarker = new google.maps.Marker({
          position: restaurantLocation,
          map: fullscreenMap,
          title: "Cottage Tandoori"
        });
        fullscreenMarkers.push(restaurantMarker);
        bounds.extend(restaurantLocation);
        
        // Add delivery marker
        const deliveryMarker = new google.maps.Marker({
          position: { 
            lat: address.latitude || 0, 
            lng: address.longitude || 0 
          },
          map: fullscreenMap,
          title: address.line1
        });
        fullscreenMarkers.push(deliveryMarker);
        bounds.extend({ lat: address.latitude || 0, lng: address.longitude || 0 });
        
        // Add info windows
        const restaurantInfo = new google.maps.InfoWindow({
          content: `<div style="color: #000; padding: 5px;"><strong>Cottage Tandoori</strong><br/>${restaurantAddress}</div>`,
        });
        
        const deliveryInfo = new google.maps.InfoWindow({
          content: `<div style="color: #000; padding: 5px;"><strong>Delivery Address</strong><br/>${address.line1}${address.line2 ? `, ${address.line2}` : ''}<br/>${address.city}, ${address.postcode}</div>`,
        });
        
        // Add click listeners for markers
        restaurantMarker.addListener("click", () => {
          restaurantInfo.open(fullscreenMap, restaurantMarker);
        });
        
        deliveryMarker.addListener("click", () => {
          deliveryInfo.open(fullscreenMap, deliveryMarker);
        });

        // Setup directions
        fullscreenDirectionsRenderer = new google.maps.DirectionsRenderer({
          map: fullscreenMap,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3B82F6",
            strokeWeight: 5,
            strokeOpacity: 0.7,
          }
        });

        // Request directions
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
          {
            origin: restaurantLocation,
            destination: { lat: address.latitude || 0, lng: address.longitude || 0 },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.IMPERIAL, // Use miles instead of km
          },
          (result, status) => {            
            if (status === google.maps.DirectionsStatus.OK && result && fullscreenDirectionsRenderer) {
              fullscreenDirectionsRenderer.setDirections(result);
              if (fullscreenMap) {
                fullscreenMap.fitBounds(bounds);
              }
            }
          }
        );

        // Trigger resize on idle to ensure proper rendering
        google.maps.event.addListenerOnce(fullscreenMap, 'idle', () => {
          if (fullscreenMap) {
            google.maps.event.trigger(fullscreenMap, 'resize');
            fullscreenMap.fitBounds(bounds);
          }
        });
      } catch (err) {
        console.error('Error initializing fullscreen map:', err);
      }
    }
    
    initializeFullscreenMap();
    
    // Cleanup when fullscreen closes or component unmounts
    return () => {
      if (fullscreenDirectionsRenderer) {
        fullscreenDirectionsRenderer.setMap(null);
      }
      
      fullscreenMarkers.forEach(marker => marker.setMap(null));
      fullscreenMarkers = [];
      
      fullscreenMap = null;
    };
  }, [showFullscreen, mapsConfig, address]);

  return (
    <>
      <div 
        className={`relative rounded-lg overflow-hidden ${className}`}
        style={{ cursor: !loading && !error ? 'pointer' : 'default' }}
        onClick={openFullscreenMap}
      >
        {loading ? (
          <div className="w-full h-full bg-slate-800 animate-pulse flex items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : error ? (
          <div className="bg-slate-900/50 p-3 text-center h-full flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={mapRef} className="w-full h-full" />
            
      {/* Map click indicator */}
            {!loading && !error && (
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs p-1.5 rounded-md flex items-center">
                <Maximize2 className="w-3 h-3 mr-1" />
                <span>Click for fullscreen</span>
              </div>
            )}
            
            {etaInfo && (
              <div className="bg-slate-900 p-2.5 border-t border-slate-800 flex justify-between items-center">
                <div className="flex items-center text-blue-400">
                  <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{etaInfo.distanceMiles.toFixed(1)} miles</span>
                </div>
                <div className="w-px h-4 bg-slate-700 mx-1.5" />
                <div className="flex items-center text-amber-400">
                  <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{etaInfo.etaText}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Map Dialog */}
      {showFullscreen && googleMapsLoaded && !loading && !error && etaInfo && address && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeFullscreenMap}
        >
          <div 
            className="bg-slate-900 w-[95vw] h-[90vh] max-w-6xl rounded-lg overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Delivery Route</h3>
                <p className="text-sm text-slate-400">
                  {etaInfo.distanceMiles.toFixed(1)} miles - Approximately {etaInfo.etaText}
                </p>
              </div>
              
              <button 
                onClick={closeFullscreenMap}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                aria-label="Close map"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Map and Directions Container */}
            <div className="flex flex-1 overflow-hidden">
              {/* Map */}
              <div className="flex-1 relative">
                <div 
                  id="fullscreen-map" 
                  className="w-full h-full"
                />
              </div>
              
              {/* Directions Panel */}
              <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
                <div className="p-4 border-b border-slate-700">
                  <h4 className="font-medium text-white mb-2">Route Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Distance:</span>
                      <span className="text-white">{etaInfo.distanceMiles.toFixed(1)} miles</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white">{etaInfo.etaText}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 p-4">
                  <h4 className="font-medium text-white mb-3">Addresses</h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <div className="text-green-400 font-medium mb-1">From: Restaurant</div>
                      <div className="text-slate-300">{restaurantAddress}</div>
                    </div>
                    
                    <div>
                      <div className="text-blue-400 font-medium mb-1">To: Delivery Address</div>
                      <div className="text-slate-300">
                        {address.line1}
                        {address.line2 && <><br />{address.line2}</>}
                        <br />{address.city}, {address.postcode}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
