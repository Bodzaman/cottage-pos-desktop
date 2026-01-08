import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { apiClient } from 'app';

interface MiniMapPreviewProps {
  // Address coordinates
  latitude?: number;
  longitude?: number;
  
  // Address details for styling
  address_line1: string;
  city: string;
  postal_code: string;
  
  // Optional delivery info
  deliveryDistance?: number; // in km
  
  // Map styling
  width?: number;
  height?: number;
  zoom?: number;
  className?: string;
}

interface DeliveryBadgeProps {
  distance?: number;
}

const DeliveryBadge: React.FC<DeliveryBadgeProps> = ({ distance }) => {
  if (!distance) return null;
  
  // Convert km to miles (1 km = 0.621371 miles)
  const distanceInMiles = distance * 0.621371;
  
  return (
    <div className="absolute top-2 right-2 bg-[#8B1538]/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-lg">
      <Navigation className="h-3 w-3" />
      <span>{distanceInMiles.toFixed(1)}mi</span>
    </div>
  );
};

const MiniMapPreview: React.FC<MiniMapPreviewProps> = ({
  latitude,
  longitude,
  address_line1,
  city,
  postal_code,
  deliveryDistance,
  width = 150,
  height = 100,
  zoom = 15,
  className = ''
}) => {
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Load Google Maps image when coordinates are available
  useEffect(() => {
    const loadMapImage = async () => {
      if (!latitude || !longitude) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        
        console.log(`🗺️ Loading map for coordinates: ${latitude}, ${longitude}`);
        
        const response = await apiClient.get_map_image_proxy({
          latitude: latitude,
          longitude: longitude,
          zoom: zoom,
          width: width,
          height: height,
          // Strong cache busting with random + timestamp
          _cache_bust: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const imageUrl = URL.createObjectURL(blob);
          setMapImageUrl(imageUrl);
          console.log('✅ Map image loaded successfully');
        } else {
          console.error('❌ Map API failed:', response.status, response.statusText);
          setHasError(true);
        }
      } catch (error) {
        console.error('❌ Map loading error:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadMapImage();

    // Cleanup function to revoke object URL
    return () => {
      if (mapImageUrl) {
        URL.revokeObjectURL(mapImageUrl);
      }
    };
  }, [latitude, longitude, zoom, width, height]);

  // Show placeholder when no coordinates, loading, or error
  const renderMapPlaceholder = () => (
    <div className={`relative bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] border border-[#2A2E36] rounded-lg flex items-center justify-center ${className}`}
         style={{ width, height }}>
      <div className="text-center p-2">
        <MapPin className="h-6 w-6 text-[#8B1538] mx-auto mb-1" />
        <div className="text-[#EAECEF] text-xs font-medium">{city}</div>
        <div className="text-[#8B92A0] text-xs">{postal_code}</div>
        {isLoading && <div className="text-[#8B92A0] text-xs mt-1">Loading...</div>}
      </div>
    </div>
  );

  // Show real map image when available
  const renderRealMap = () => (
    <div className={`relative rounded-lg overflow-hidden border border-[#2A2E36] ${className}`}
         style={{ width, height }}>
      <img 
        src={mapImageUrl!} 
        alt={`Map of ${address_line1}, ${city}`}
        className="w-full h-full object-cover"
        onError={() => {
          console.error('❌ Map image failed to load');
          setHasError(true);
        }}
      />
    </div>
  );

  // Return appropriate component based on state
  if (!latitude || !longitude || isLoading || hasError || !mapImageUrl) {
    return renderMapPlaceholder();
  }

  return renderRealMap();
};

export default MiniMapPreview;
