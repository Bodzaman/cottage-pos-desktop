import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  Save, 
  MapPin, 
  Truck, 
  Tag, 
  Map, 
  Search, 
  PlusCircle, 
  Minus, 
  RefreshCw,
  AlertTriangle,
  X,
  Ban
} from "lucide-react";
import { DeliverySettings as DeliverySettingsType, useRestaurantSettings } from "../utils/useRestaurantSettings";
import { GoogleMap, Circle, Marker } from '@react-google-maps/api';
import { apiClient } from 'app';
import { globalColors, styles } from "../utils/QSAIDesign";

// Constants for delivery calculations
const DEFAULT_DELIVERY_RADIUS_MILES = 6.0;  // Default is 6 miles
const DEFAULT_DELIVERY_RADIUS_KM = 9.65;     // 6 miles converted to km (6 * 1.60934)
const MIN_DELIVERY_RADIUS_MILES = 0.6;      // Minimum allowed radius in miles
const MAX_DELIVERY_RADIUS_MILES = 12.4;     // Maximum allowed radius in miles
const MIN_DELIVERY_RADIUS_KM = 1.0;         // Minimum allowed radius in km
const MAX_DELIVERY_RADIUS_KM = 20.0;        // Maximum allowed radius in km

// Function to convert km to miles
const kmToMiles = (km: number): number => {
  return km / 1.60934;
};

// Function to convert miles to km
const milesToKm = (miles: number): number => {
  return miles * 1.60934;
};

// Extended delivery settings interface to include map features
interface ExtendedDeliverySettings extends DeliverySettingsType {
  restaurant_postcode?: string;
  restaurant_coordinates?: { lat: number; lng: number };
  exclusion_zones?: ExclusionZone[];
}

interface ExclusionZone {
  id: string;
  postcode: string;
  locationName?: string;
  reason: string;
  coordinates?: { lat: number; lng: number };
}

// Google Maps dark theme styling
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }, { lightness: -80 }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  }
];

// Map marker icons
const restaurantMarkerIcon = {
  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='36' height='36' fill='none' stroke='%237C5DFA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E"
};

const exclusionMarkerIcon = {
  url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32' fill='none' stroke='%23FF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='15' y1='9' x2='9' y2='15'%3E%3C/line%3E%3Cline x1='9' y1='9' x2='15' y2='15'%3E%3C/line%3E%3C/svg%3E"
};

const DeliverySettings: React.FC = () => {
  // Use hook directly instead of props
  const { getDeliverySettings, updateDeliverySettings, isLoading: hookLoading } = useRestaurantSettings();
  
  // Get current delivery settings from hook - this is our single source of truth
  const deliverySettings = getDeliverySettings();
  
  // Local editing state to allow immediate input updates before save
  const [localDeliveryData, setLocalDeliveryData] = useState({
    radius_km: deliverySettings?.radius_km || DEFAULT_DELIVERY_RADIUS_KM,
    min_order: deliverySettings?.min_order || DEFAULT_MIN_ORDER,
    delivery_fee: deliverySettings?.delivery_fee || DEFAULT_DELIVERY_FEE,
  });
  
  // Update local state when hook data changes
  useEffect(() => {
    if (deliverySettings) {
      setLocalDeliveryData({
        radius_km: deliverySettings.radius_km || DEFAULT_DELIVERY_RADIUS_KM,
        min_order: deliverySettings.min_order || DEFAULT_MIN_ORDER,
        delivery_fee: deliverySettings.delivery_fee || DEFAULT_DELIVERY_FEE,
      });
      setPostcodesInput(deliverySettings.postcodes?.join(", ") || "");
    }
  }, [deliverySettings]);
  
  // Extended settings with map data (only UI-specific state)
  const [mapSettings, setMapSettings] = useState({
    restaurant_postcode: 'RH20 4DZ',
    restaurant_coordinates: { lat: 50.91806074772868, lng: -0.4556764022106669 },
    exclusion_zones: [] as ExclusionZone[]
  });
  
  // UI-only state
  const [postcodesInput, setPostcodesInput] = useState(
    deliverySettings?.postcodes?.join(", ") || ""
  );
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "map" | "zones" | "validator">("basic");
  
  // Google Maps state
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Exclusion zones state
  const [newExclusion, setNewExclusion] = useState({
    postcode: '',
    locationName: '',
    reason: '',
    coordinates: undefined as { lat: number; lng: number } | undefined
  });
  const [isValidPostcode, setIsValidPostcode] = useState(false);
  const [isValidLocationName, setIsValidLocationName] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Postcode validator state
  const [postcodeCheck, setPostcodeCheck] = useState({
    postcode: '',
    result: null as null | {
      deliverable: boolean;
      distance_miles?: number;
      delivery_charge?: number;
      minimum_order?: number;
      estimated_time_minutes?: number;
      message?: string;
      coordinates?: { lat: number; lng: number };
    }
  });

  // Load Google Maps API key
  useEffect(() => {
    const fetchMapsConfig = async () => {
      try {
        const response = await apiClient.get_maps_config();
        const data = await response.json();
        if (data && data.apiKey) {
          setGoogleMapsApiKey(data.apiKey);
        } else {
          setMapError("Google Maps API key not found");
        }
      } catch (error) {
        console.error("Error fetching Google Maps API key:", error);
        setMapError("Failed to load Google Maps configuration");
      }
    };
    
    fetchMapsConfig();
  }, []);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(() => {
    if (!googleMapsApiKey) return;
    
    // Don't load if already loaded
    if (window.google && window.google.maps) {
      setMapsApiLoaded(true);
      return;
    }
    
    try {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&loading=async`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';
      
      script.onload = () => {
        setMapsApiLoaded(true);
        setMapError(null);
      };
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps API');
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapError('Error initializing Google Maps');
    }
  }, [googleMapsApiKey]);

  // Load Google Maps script when we have the API key
  useEffect(() => {
    if (googleMapsApiKey) {
      loadGoogleMapsScript();
    }
  }, [googleMapsApiKey, loadGoogleMapsScript]);

  // Update a specific field directly in the hook
  const updateSetting = (field: keyof ExtendedDeliverySettings, value: any) => {
    // Get current data and update specific field
    const currentSettings = getDeliverySettings();
    const updatedSettings = {
      ...DEFAULT_DELIVERY_SETTINGS,
      ...currentSettings,
      ...mapSettings,
      [field]: value
    };
    
    // Update both map settings and delivery settings based on field type
    if (field === 'restaurant_postcode' || field === 'restaurant_coordinates' || field === 'exclusion_zones') {
      setMapSettings(prev => ({ ...prev, [field]: value }));
    }
    
    // For immediate display, we'll update via the save mechanism
    // This ensures consistency with the hook's data source
  };

  // Handle postcodes input change
  const handlePostcodesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostcodesInput(e.target.value);
  };

  // Save settings with all current values
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Process postcodes from comma-separated string to array
      const processedPostcodes = postcodesInput
        .split(",")
        .map(code => code.trim().toUpperCase())
        .filter(code => code !== "");
      
      // Use local delivery data that user has edited
      const updatedSettings = {
        radius_km: localDeliveryData.radius_km,
        postcodes: processedPostcodes,
        min_order: localDeliveryData.min_order,
        delivery_fee: localDeliveryData.delivery_fee,
        // Include existing extended settings
        ...mapSettings
      };
      
      console.log('Saving delivery settings:', updatedSettings);
      
      // Save via hook
      const success = await updateDeliverySettings(updatedSettings);
      
      if (success) {
        console.log('Delivery settings saved successfully');
        // Local state will be updated via useEffect when hook data changes
      } else {
        console.error('Failed to save delivery settings');
      }
    } catch (error) {
      console.error('Error saving delivery settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Exclusion zone handlers
  const handlePostcodeBlur = async () => {
    if (!newExclusion.postcode) {
      setIsValidPostcode(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.geocode({ postcode: newExclusion.postcode });
      const data = await response.json();
      
      if (data.success) {
        setIsValidPostcode(true);
        setNewExclusion(prev => ({
          ...prev,
          coordinates: data.coordinates,
          locationName: data.locationName || prev.locationName
        }));
      } else {
        setIsValidPostcode(false);
        toast.error(data.message || 'Invalid postcode');
      }
    } catch (error) {
      console.error('Error validating postcode:', error);
      setIsValidPostcode(false);
      toast.error('Error validating postcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationNameBlur = async () => {
    if (!newExclusion.locationName) {
      setIsValidLocationName(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiClient.geocode({ locationName: newExclusion.locationName });
      const data = await response.json();
      
      if (data.success) {
        setIsValidLocationName(true);
        setNewExclusion(prev => ({
          ...prev,
          coordinates: data.coordinates,
          postcode: data.postcode || prev.postcode
        }));
      } else {
        setIsValidLocationName(false);
        toast.error(data.message || 'Invalid location name');
      }
    } catch (error) {
      console.error('Error validating location name:', error);
      setIsValidLocationName(false);
      toast.error('Error validating location name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExclusion = () => {
    if ((!newExclusion.postcode && !newExclusion.locationName) || !newExclusion.reason) {
      toast.error('Please enter either postcode or location name, and a reason');
      return;
    }
    
    if (!newExclusion.coordinates) {
      toast.error('Please enter a valid postcode or location name');
      return;
    }
    
    const newZone: ExclusionZone = {
      id: Date.now().toString(),
      postcode: newExclusion.postcode,
      reason: newExclusion.reason,
      coordinates: newExclusion.coordinates,
      locationName: newExclusion.locationName
    };
    
    setMapSettings(prev => ({
      ...prev,
      exclusion_zones: [...(prev.exclusion_zones || []), newZone]
    }));
    
    // Reset the form
    setNewExclusion({
      postcode: '',
      locationName: '',
      reason: '',
      coordinates: undefined
    });
    
    setIsValidPostcode(false);
    setIsValidLocationName(false);
    
    toast.success('Exclusion zone added');
  };

  const handleRemoveExclusion = (id: string) => {
    setMapSettings(prev => ({
      ...prev,
      exclusion_zones: (prev.exclusion_zones || []).filter(zone => zone.id !== id)
    }));
    toast.success('Exclusion zone removed');
  };

  const handleResetExclusionForm = () => {
    setNewExclusion({
      postcode: '',
      locationName: '',
      reason: '',
      coordinates: undefined
    });
    setIsValidPostcode(false);
    setIsValidLocationName(false);
  };

  // Postcode validator
  const handleCheckPostcode = async () => {
    if (!postcodeCheck.postcode) {
      toast.error('Please enter a postcode');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get coordinates for the postcode to show on map
      let coordinates = null;
      try {
        const geocodeResponse = await apiClient.geocode({ postcode: postcodeCheck.postcode });
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.success) {
          coordinates = geocodeData.coordinates;
        }
      } catch (error) {
        console.error('Error geocoding postcode:', error);
      }
      
      // Mock delivery calculation for now
      const mockResult = {
        success: true,
        deliverable: postcodeCheck.postcode !== 'CM24 1RY' && postcodeCheck.postcode !== 'CM23 2ET',
        distance_miles: 2.7,
        delivery_charge: deliverySettings?.delivery_fee || DEFAULT_DELIVERY_FEE,
        minimum_order: deliverySettings?.min_order || DEFAULT_MIN_ORDER,
        estimated_time_minutes: 45,
        message: postcodeCheck.postcode === 'CM24 1RY' ? 'Area too far from main roads' : 
                (postcodeCheck.postcode === 'CM23 2ET' ? 'Frequent traffic congestion' : ''),
        coordinates: coordinates
      };
      
      setPostcodeCheck({
        ...postcodeCheck,
        result: {
          deliverable: mockResult.deliverable,
          distance_miles: mockResult.distance_miles,
          delivery_charge: mockResult.delivery_charge,
          minimum_order: mockResult.minimum_order,
          estimated_time_minutes: mockResult.estimated_time_minutes,
          message: mockResult.message,
          coordinates: mockResult.coordinates
        }
      });
      
      // If we have coordinates, center the map on them
      if (mockResult.coordinates && mapRef.current) {
        mapRef.current.panTo(mockResult.coordinates);
        mapRef.current.setZoom(13);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking postcode:', error);
      toast.error('Failed to check postcode');
      setIsLoading(false);
    }
  };

  // Render Google Map component
  const renderMap = () => {
    if (mapError) {
      return (
        <div className="flex items-center justify-center h-[400px] rounded-lg border"
             style={{ 
               backgroundColor: globalColors.background.secondary,
               borderColor: globalColors.accent.secondary 
             }}>
          <div className="text-center p-4">
            <AlertTriangle className="h-12 w-12 mb-2 mx-auto" style={{ color: globalColors.text.muted }} />
            <p style={{ color: globalColors.text.secondary }}>{mapError}</p>
          </div>
        </div>
      );
    }

    if (!googleMapsApiKey) {
      return (
        <div className="flex items-center justify-center h-[400px] rounded-lg border"
             style={{ 
               backgroundColor: globalColors.background.secondary,
               borderColor: globalColors.accent.secondary 
             }}>
          <div className="flex flex-col items-center" style={{ color: globalColors.text.secondary }}>
            <Map className="h-12 w-12 mb-2" />
            <p>Loading Google Maps API...</p>
          </div>
        </div>
      );
    }

    if (!mapsApiLoaded || !window.google || !window.google.maps) {
      return (
        <div className="flex items-center justify-center h-[400px] rounded-lg border"
             style={{ 
               backgroundColor: globalColors.background.secondary,
               borderColor: globalColors.accent.secondary 
             }}>
          <div className="flex flex-col items-center" style={{ color: globalColors.text.secondary }}>
            <Map className="h-12 w-12 mb-2 animate-pulse" />
            <p>Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-[400px] rounded-lg overflow-hidden border"
           style={{ borderColor: globalColors.accent.secondary }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={{ 
            lat: mapSettings.restaurant_coordinates?.lat || 50.91806074772868, 
            lng: mapSettings.restaurant_coordinates?.lng || -0.4556764022106669 
          }}
          zoom={11}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            fullscreenControl: true,
            streetViewControl: false,
          }}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          onClick={async (e) => {
            // Handle map clicks for exclusion zone selection
            if (activeTab !== 'zones') return;
            
            const lat = e.latLng?.lat() || 0;
            const lng = e.latLng?.lng() || 0;
            
            try {
              setIsLoading(true);
              const response = await apiClient.geocode({ lat, lng });
              const data = await response.json();
              
              if (data.success) {
                setIsValidPostcode(true);
                setIsValidLocationName(true);
                setNewExclusion({
                  postcode: data.postcode || '',
                  locationName: data.locationName || '',
                  reason: '',
                  coordinates: { lat, lng }
                });
                toast.success('Location selected. Please enter a reason and add exclusion.');
              } else {
                toast.error(data.message || 'Could not identify location');
              }
            } catch (error) {
              console.error('Error with reverse geocoding:', error);
              toast.error('Error identifying location');
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {/* Restaurant marker */}
          <Marker
            position={{ 
              lat: mapSettings.restaurant_coordinates?.lat || 50.91806074772868, 
              lng: mapSettings.restaurant_coordinates?.lng || -0.4556764022106669 
            }}
            icon={restaurantMarkerIcon}
            title={"Restaurant Location"}
          />
          
          {/* Delivery radius circle */}
          <Circle
            center={{ 
              lat: mapSettings.restaurant_coordinates?.lat || 50.91806074772868, 
              lng: mapSettings.restaurant_coordinates?.lng || -0.4556764022106669 
            }}
            radius={kmToMiles(deliverySettings?.radius_km || DEFAULT_DELIVERY_RADIUS_KM) * 1609.34} // Convert miles to meters
            options={{
              fillColor: 'rgba(124, 93, 250, 0.1)',
              fillOpacity: 0.1,
              strokeColor: '#7C5DFA',
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
          
          {/* Exclusion zone markers */}
          {mapSettings.exclusion_zones?.map((zone) => (
            <Marker
              key={zone.id}
              position={zone.coordinates!}
              icon={{
                url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='32' height='32' fill='none' stroke='%23EF4444' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m18 15-6-6-6 6'/%3E%3C/svg%3E",
                scaledSize: new window.google.maps.Size(32, 32)
              }}
              title={`Excluded: ${zone.reason}`}
            />
          ))}
          
          {/* Postcode check result marker */}
          {postcodeCheck.result?.coordinates && (
            <Marker
              position={postcodeCheck.result.coordinates}
              icon={{
                url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='36' height='36' fill='none' stroke='%23${postcodeCheck.result.deliverable ? '10B981' : 'EF4444'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'%3E%3C/path%3E%3Ccircle cx='12' cy='10' r='3'%3E%3C/circle%3E%3C/svg%3E`,
                scaledSize: new window.google.maps.Size(36, 36)
              }}
              title={postcodeCheck.result.deliverable ? 'Deliverable' : 'Not Deliverable'}
            />
          )}
        </GoogleMap>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center" style={{ color: globalColors.text.primary }}>
            <Truck className="mr-2 h-5 w-5" style={{ color: globalColors.accent.primary }} />
            Delivery Management
          </h3>
          <p className="text-sm" style={{ color: globalColors.text.secondary }}>
            Configure delivery zones, fees, exclusions, and validate postcodes
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="grid w-full grid-cols-4 mb-6"
          style={{ ...styles.glassCard }}>
          <TabsTrigger 
            value="basic"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            Basic Settings
          </TabsTrigger>
          <TabsTrigger 
            value="map"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            Coverage Map
          </TabsTrigger>
          <TabsTrigger 
            value="zones"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            Exclusion Zones
          </TabsTrigger>
          <TabsTrigger 
            value="validator"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
            Postcode Validator
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-6">
          <Card style={{ ...styles.glassCard, borderColor: globalColors.accent.secondary }}>
            <CardHeader>
              <CardTitle style={{ color: globalColors.text.primary }}>Basic Delivery Configuration</CardTitle>
              <CardDescription style={{ color: globalColors.text.secondary }}>
                Set up core delivery parameters and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-radius" className="flex items-center" style={{ color: globalColors.text.primary }}>
                      <MapPin className="mr-2 h-4 w-4" style={{ color: globalColors.accent.primary }} />
                      Delivery Radius
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="delivery-radius"
                        type="number"
                        min={MIN_DELIVERY_RADIUS_MILES}
                        max={MAX_DELIVERY_RADIUS_MILES}
                        step="0.1"
                        value={kmToMiles(localDeliveryData.radius_km).toFixed(1)}
                        onChange={(e) => {
                          const milesValue = parseFloat(e.target.value);
                          if (isNaN(milesValue)) return;
                          
                          const validMiles = Math.max(MIN_DELIVERY_RADIUS_MILES, Math.min(MAX_DELIVERY_RADIUS_MILES, milesValue));
                          const kmValue = milesToKm(validMiles);
                          setLocalDeliveryData(prev => ({ ...prev, radius_km: kmValue }));
                        }}
                        style={{
                          backgroundColor: globalColors.background.tertiary,
                          borderColor: globalColors.accent.secondary,
                          color: globalColors.text.primary
                        }}
                      />
                      <span className="text-sm font-medium" style={{ color: globalColors.text.secondary }}>miles</span>
                    </div>
                    <p className="text-xs" style={{ color: globalColors.text.muted }}>
                      Delivery is available within a {kmToMiles(deliverySettings?.radius_km || DEFAULT_DELIVERY_RADIUS_KM).toFixed(1)} mile radius from the restaurant.
                      Range: {MIN_DELIVERY_RADIUS_MILES.toFixed(1)}-{MAX_DELIVERY_RADIUS_MILES.toFixed(1)} miles
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delivery-postcodes" className="flex items-center" style={{ color: globalColors.text.primary }}>
                      <MapPin className="mr-2 h-4 w-4" style={{ color: globalColors.accent.primary }} />
                      Delivery Postcodes
                    </Label>
                    <Textarea
                      id="delivery-postcodes"
                      placeholder="E.g. RH20 4DZ, BN5 9XP (comma separated)"
                      value={postcodesInput}
                      onChange={handlePostcodesChange}
                      rows={4}
                      style={{
                        backgroundColor: globalColors.background.tertiary,
                        borderColor: globalColors.accent.secondary,
                        color: globalColors.text.primary
                      }}
                    />
                    <p className="text-xs" style={{ color: globalColors.text.muted }}>
                      Add specific postcodes you deliver to, separated by commas. Leave empty to use radius only.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-order" className="flex items-center" style={{ color: globalColors.text.primary }}>
                      <Tag className="mr-2 h-4 w-4" style={{ color: globalColors.accent.primary }} />
                      Minimum Order Value
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm" style={{ color: globalColors.text.secondary }}>£</span>
                      <Input
                        id="min-order"
                        type="number"
                        min="0"
                        step="0.01"
                        value={localDeliveryData.min_order || 0}
                        onChange={(e) => setLocalDeliveryData(prev => ({ ...prev, min_order: parseFloat(e.target.value) || 0 }))}
                        style={{
                          backgroundColor: globalColors.background.tertiary,
                          borderColor: globalColors.accent.secondary,
                          color: globalColors.text.primary
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: globalColors.text.muted }}>
                      Minimum order value required for delivery
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="delivery-fee" className="flex items-center" style={{ color: globalColors.text.primary }}>
                      <Tag className="mr-2 h-4 w-4" style={{ color: globalColors.accent.primary }} />
                      Delivery Fee
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm" style={{ color: globalColors.text.secondary }}>£</span>
                      <Input
                        id="delivery-fee"
                        type="number"
                        min="0"
                        step="0.01"
                        value={localDeliveryData.delivery_fee || 0}
                        onChange={(e) => setLocalDeliveryData(prev => ({ ...prev, delivery_fee: parseFloat(e.target.value) || 0 }))}
                        style={{
                          backgroundColor: globalColors.background.tertiary,
                          borderColor: globalColors.accent.secondary,
                          color: globalColors.text.primary
                        }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: globalColors.text.muted }}>
                      Standard delivery fee applied to all orders
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card style={{ ...styles.glassCard, borderColor: globalColors.accent.secondary }}>
            <CardHeader>
              <CardTitle style={{ color: globalColors.text.primary }}>Delivery Coverage Map</CardTitle>
              <CardDescription style={{ color: globalColors.text.secondary }}>
                Visual representation of your delivery area and exclusion zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderMap()}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7C5DFA' }}></div>
                  <span style={{ color: globalColors.text.secondary }}>Delivery Coverage Area</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7C5DFA' }}></div>
                  <span style={{ color: globalColors.text.secondary }}>Restaurant Location</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF4444' }}></div>
                  <span style={{ color: globalColors.text.secondary }}>Exclusion Zones</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <Card style={{ ...styles.glassCard, borderColor: globalColors.accent.secondary }}>
            <CardHeader>
              <CardTitle style={{ color: globalColors.text.primary }}>Exclusion Zones Management</CardTitle>
              <CardDescription style={{ color: globalColors.text.secondary }}>
                Add areas where delivery is not available. Click on the map or enter details below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderMap()}
              
              <Separator style={{ backgroundColor: globalColors.accent.secondary }} />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label style={{ color: globalColors.text.primary }}>Postcode</Label>
                  <Input 
                    value={newExclusion.postcode} 
                    onChange={(e) => setNewExclusion({...newExclusion, postcode: e.target.value})}
                    onBlur={handlePostcodeBlur}
                    placeholder="Enter postcode"
                    style={{
                      backgroundColor: globalColors.background.tertiary,
                      borderColor: globalColors.accent.secondary,
                      color: globalColors.text.primary
                    }}
                  />
                  {isValidPostcode && (
                    <p className="text-xs" style={{ color: globalColors.accent.primary }}>Valid postcode</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label style={{ color: globalColors.text.primary }}>Location Name</Label>
                  <Input 
                    value={newExclusion.locationName || ''} 
                    onChange={(e) => setNewExclusion({...newExclusion, locationName: e.target.value})}
                    onBlur={handleLocationNameBlur}
                    placeholder="Enter location name"
                    style={{
                      backgroundColor: globalColors.background.tertiary,
                      borderColor: globalColors.accent.secondary,
                      color: globalColors.text.primary
                    }}
                  />
                  {isValidLocationName && (
                    <p className="text-xs" style={{ color: globalColors.accent.primary }}>Valid location</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label style={{ color: globalColors.text.primary }}>Reason</Label>
                  <Input 
                    value={newExclusion.reason} 
                    onChange={(e) => setNewExclusion({...newExclusion, reason: e.target.value})} 
                    placeholder="Reason for exclusion"
                    style={{
                      backgroundColor: globalColors.background.tertiary,
                      borderColor: globalColors.accent.secondary,
                      color: globalColors.text.primary
                    }}
                  />
                </div>
                
                <div className="flex items-end space-x-2">
                  <Button 
                    onClick={handleAddExclusion}
                    disabled={(!isValidPostcode && !isValidLocationName) || !newExclusion.reason || isLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white">
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add
                  </Button>
                  
                  <Button 
                    onClick={handleResetExclusionForm}
                    variant="outline"
                    style={{
                      borderColor: globalColors.accent.secondary,
                      color: globalColors.text.secondary,
                    }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Exclusion Zones List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: globalColors.text.primary }}>Current Exclusion Zones</h3>
                {(deliverySettings?.exclusion_zones || []).length === 0 ? (
                  <div className="text-center py-8 rounded-lg border" style={{
                    backgroundColor: globalColors.background.secondary,
                    borderColor: globalColors.accent.secondary
                  }}>
                    <Ban className="h-12 w-12 mb-4 mx-auto" style={{ color: globalColors.text.muted }} />
                    <p style={{ color: globalColors.text.secondary }}>No exclusion zones configured</p>
                    <p className="text-sm" style={{ color: globalColors.text.muted }}>Add zones to exclude specific areas from delivery</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(deliverySettings?.exclusion_zones || []).map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-4 rounded-lg border" style={{
                        backgroundColor: globalColors.background.secondary,
                        borderColor: globalColors.accent.secondary
                      }}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="font-medium" style={{ color: globalColors.text.primary }}>{zone.postcode}</span>
                          </div>
                          <p className="text-sm" style={{ color: globalColors.text.secondary }}>{zone.locationName || '—'}</p>
                          <p className="text-xs" style={{ color: globalColors.text.muted }}>{zone.reason}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRemoveExclusion(zone.id)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          style={{
                            borderColor: globalColors.accent.secondary,
                          }}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validator" className="space-y-6">
          <Card style={{ ...styles.glassCard, borderColor: globalColors.accent.secondary }}>
            <CardHeader>
              <CardTitle style={{ color: globalColors.text.primary }}>Postcode Validator</CardTitle>
              <CardDescription style={{ color: globalColors.text.secondary }}>
                Check if a postcode is eligible for delivery and view estimated charges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    value={postcodeCheck.postcode} 
                    onChange={(e) => setPostcodeCheck({...postcodeCheck, postcode: e.target.value})} 
                    placeholder="Enter postcode to check"
                    style={{
                      backgroundColor: globalColors.background.tertiary,
                      borderColor: globalColors.accent.secondary,
                      color: globalColors.text.primary
                    }}
                  />
                </div>
                <Button 
                  onClick={handleCheckPostcode} 
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white">
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Check
                </Button>
              </div>
              
              {postcodeCheck.result && (
                <Card style={{ ...styles.glassCard, borderColor: globalColors.accent.secondary }}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {postcodeCheck.result.deliverable ? (
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        )}
                        <span className="font-medium" style={{ color: globalColors.text.primary }}>
                          {postcodeCheck.result.deliverable ? 'Delivery Available' : 'Delivery Not Available'}
                        </span>
                      </div>
                      
                      {postcodeCheck.result.deliverable && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p style={{ color: globalColors.text.secondary }}>Distance</p>
                            <p className="font-medium" style={{ color: globalColors.text.primary }}>
                              {postcodeCheck.result.distance_miles?.toFixed(1)} miles
                            </p>
                          </div>
                          <div>
                            <p style={{ color: globalColors.text.secondary }}>Delivery Fee</p>
                            <p className="font-medium" style={{ color: globalColors.text.primary }}>
                              £{postcodeCheck.result.delivery_charge?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: globalColors.text.secondary }}>Minimum Order</p>
                            <p className="font-medium" style={{ color: globalColors.text.primary }}>
                              £{postcodeCheck.result.minimum_order?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p style={{ color: globalColors.text.secondary }}>Estimated Time</p>
                            <p className="font-medium" style={{ color: globalColors.text.primary }}>
                              {postcodeCheck.result.estimated_time_minutes} mins
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {postcodeCheck.result.message && (
                        <div className="p-3 rounded-lg" style={{ backgroundColor: globalColors.background.tertiary }}>
                          <p className="text-sm" style={{ color: globalColors.text.secondary }}>
                            {postcodeCheck.result.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {renderMap()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Delivery Settings"}
        </Button>
      </div>
    </div>
  );
};

export default DeliverySettings;
