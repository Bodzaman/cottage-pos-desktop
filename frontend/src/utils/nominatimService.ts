/**
 * Nominatim Reverse Geocoding Service
 *
 * Uses OpenStreetMap Nominatim API - completely FREE
 * https://nominatim.org/release-docs/develop/api/Reverse/
 *
 * Rate limit: 1 request per second (enforced by Nominatim)
 * Required: User-Agent header identifying the application
 */

// Nominatim address components
interface NominatimAddress {
  house_number?: string;
  road?: string;
  hamlet?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

// Nominatim API response
interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: NominatimAddress;
  boundingbox: string[];
  error?: string;
}

// Our simplified result interface
export interface ReverseGeocodeResult {
  street?: string;
  locality?: string; // town/city/village - the most relevant place name
  county?: string;
  postcode?: string;
  fullAddress?: string;
  raw?: NominatimAddress; // Include raw data for debugging
}

/**
 * Reverse geocode coordinates to address using Nominatim
 *
 * @param lat - Latitude
 * @param lng - Longitude (note: Nominatim uses 'lon' parameter)
 * @returns Address components
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        method: 'GET',
        headers: {
          // Required: Nominatim requires a User-Agent identifying the application
          'User-Agent': 'CottageTandooriPOS/1.0 (delivery-address-lookup)',
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[NominatimService] HTTP error:', response.status);
      return {
        street: undefined,
        locality: undefined,
      };
    }

    const data: NominatimResponse = await response.json();

    // Check for Nominatim error response
    if (data.error) {
      console.error('[NominatimService] API error:', data.error);
      return {
        street: undefined,
        locality: undefined,
      };
    }

    const addr = data.address;

    // Determine the best street name
    // Priority: road > hamlet (for rural areas)
    const street = addr.road || addr.hamlet || undefined;

    // Determine the best locality (town/city/village)
    // Priority: village > town > city > suburb
    // This order prioritizes smaller, more specific place names
    const locality =
      addr.village || addr.town || addr.city || addr.suburb || addr.hamlet || undefined;

    // County - UK specific
    const county = addr.county || addr.state_district || undefined;

    return {
      street,
      locality,
      county,
      postcode: addr.postcode,
      fullAddress: data.display_name,
      raw: addr,
    };
  } catch (error) {
    console.error('[NominatimService] Network error:', error);

    // Return empty result on error - let the UI handle the fallback
    return {
      street: undefined,
      locality: undefined,
    };
  }
}

/**
 * Throttled reverse geocode - ensures we don't exceed rate limits
 * Nominatim requires max 1 request per second
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds to be safe

export async function reverseGeocodeThrottled(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // Wait for the remaining time
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  return reverseGeocode(lat, lng);
}

// Export the default function
export default reverseGeocode;
