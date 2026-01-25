/**
 * UK Postcode Service
 *
 * Uses Postcodes.io API - completely FREE, no API key required
 * https://postcodes.io/
 */

// Types for Postcodes.io API responses
export interface PostcodesIoResult {
  postcode: string;
  quality: number;
  eastings: number;
  northings: number;
  country: string;
  nhs_ha: string;
  longitude: number;
  latitude: number;
  european_electoral_region: string;
  primary_care_trust: string;
  region: string;
  lsoa: string;
  msoa: string;
  incode: string;
  outcode: string;
  parliamentary_constituency: string;
  admin_district: string;
  parish: string;
  admin_county: string | null;
  admin_ward: string;
  ced: string | null;
  ccg: string;
  nuts: string;
  codes: {
    admin_district: string;
    admin_county: string;
    admin_ward: string;
    parish: string;
    parliamentary_constituency: string;
    ccg: string;
    ccg_id: string;
    ced: string;
    nuts: string;
  };
}

export interface PostcodeValidationResult {
  valid: boolean;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  locality?: string;
  ward?: string;
  parish?: string;
  error?: string;
}

export interface PostcodesIoResponse {
  status: number;
  result: PostcodesIoResult | null;
  error?: string;
}

class PostcodeService {
  private readonly BASE_URL = 'https://api.postcodes.io';

  // UK postcode regex - matches formats like: SW1A 1AA, M1 1AE, B33 8TH, CR2 6XH
  private readonly UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

  /**
   * Validate postcode format only (no API call)
   */
  validateFormat(postcode: string): boolean {
    if (!postcode) return false;
    const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
    return this.UK_POSTCODE_REGEX.test(cleaned);
  }

  /**
   * Format postcode with proper spacing
   * "rh204dz" → "RH20 4DZ"
   * "sw1a1aa" → "SW1A 1AA"
   */
  formatPostcode(postcode: string): string {
    if (!postcode) return '';

    // Remove all spaces and convert to uppercase
    const cleaned = postcode.replace(/\s+/g, '').toUpperCase();

    // UK postcodes have the format: outward (2-4 chars) + inward (3 chars)
    // Insert space before the last 3 characters
    if (cleaned.length >= 5) {
      return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
    }

    return cleaned;
  }

  /**
   * Validate and get full postcode info from Postcodes.io
   * This is completely FREE - no API key required
   */
  async validatePostcode(postcode: string): Promise<PostcodeValidationResult> {
    // First, validate format
    if (!this.validateFormat(postcode)) {
      return {
        valid: false,
        error: 'Invalid UK postcode format. Please enter a valid postcode (e.g., RH20 4DZ)'
      };
    }

    const formatted = this.formatPostcode(postcode);

    try {
      const response = await fetch(
        `${this.BASE_URL}/postcodes/${encodeURIComponent(formatted.replace(/\s+/g, ''))}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.status === 404) {
        return {
          valid: false,
          error: 'Postcode not recognized. Please check and try again.'
        };
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: PostcodesIoResponse = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;

        // Determine the best locality name
        // Priority: parish > admin_ward > admin_district > region
        let locality = '';
        if (result.parish && result.parish !== result.admin_district) {
          locality = result.parish;
        } else if (result.admin_ward) {
          // Clean up ward names (often have "Ward" suffix)
          locality = result.admin_ward.replace(/ Ward$/i, '');
        } else if (result.admin_district) {
          locality = result.admin_district;
        }

        return {
          valid: true,
          postcode: formatted,
          latitude: result.latitude,
          longitude: result.longitude,
          region: result.region,
          district: result.admin_district,
          locality: locality,
          ward: result.admin_ward,
          parish: result.parish || undefined
        };
      }

      return {
        valid: false,
        error: 'Unable to validate postcode. Please try again.'
      };

    } catch (error) {
      console.error('[PostcodeService] Validation error:', error);

      // Network or other error - don't block the user
      return {
        valid: false,
        error: 'Connection issue. Please check your internet and try again.'
      };
    }
  }

  /**
   * Batch validate multiple postcodes (useful for delivery zone setup)
   * Postcodes.io supports up to 100 postcodes per request
   */
  async validateMultiple(postcodes: string[]): Promise<Map<string, PostcodeValidationResult>> {
    const results = new Map<string, PostcodeValidationResult>();

    // Format all postcodes
    const formattedPostcodes = postcodes
      .filter(p => this.validateFormat(p))
      .map(p => this.formatPostcode(p).replace(/\s+/g, ''));

    if (formattedPostcodes.length === 0) {
      postcodes.forEach(p => {
        results.set(p, { valid: false, error: 'Invalid format' });
      });
      return results;
    }

    try {
      const response = await fetch(`${this.BASE_URL}/postcodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ postcodes: formattedPostcodes })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.result)) {
        data.result.forEach((item: { query: string; result: PostcodesIoResult | null }) => {
          const original = postcodes.find(
            p => this.formatPostcode(p).replace(/\s+/g, '') === item.query
          ) || item.query;

          if (item.result) {
            results.set(original, {
              valid: true,
              postcode: this.formatPostcode(item.query),
              latitude: item.result.latitude,
              longitude: item.result.longitude,
              region: item.result.region,
              district: item.result.admin_district,
              locality: item.result.parish || item.result.admin_ward || item.result.admin_district
            });
          } else {
            results.set(original, {
              valid: false,
              error: 'Postcode not found'
            });
          }
        });
      }

    } catch (error) {
      console.error('[PostcodeService] Batch validation error:', error);
      postcodes.forEach(p => {
        if (!results.has(p)) {
          results.set(p, { valid: false, error: 'Validation failed' });
        }
      });
    }

    return results;
  }

  /**
   * Get nearest postcodes to a location
   * Useful for suggestions based on GPS
   */
  async getNearestPostcodes(latitude: number, longitude: number, limit: number = 5): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/postcodes?lon=${longitude}&lat=${latitude}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.result)) {
        return data.result.map((item: PostcodesIoResult) => item.postcode);
      }

      return [];
    } catch (error) {
      console.error('[PostcodeService] Nearest postcodes error:', error);
      return [];
    }
  }

  /**
   * Autocomplete partial postcodes
   * Useful for as-you-type suggestions
   */
  async autocomplete(partial: string, limit: number = 10): Promise<string[]> {
    if (!partial || partial.length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.BASE_URL}/postcodes/${encodeURIComponent(partial)}/autocomplete?limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      if (data.status === 200 && Array.isArray(data.result)) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error('[PostcodeService] Autocomplete error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const postcodeService = new PostcodeService();

// Also export the class for testing
export { PostcodeService };
