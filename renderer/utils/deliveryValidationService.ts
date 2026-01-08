import { apiClient } from 'app';
import { toast } from 'sonner';

export interface DeliveryValidationResult {
  isValid: boolean;
  message: string;
  data?: {
    deliveryFee: number;
    minimumOrder: number;
    radius: number;
    postcodeAllowed: boolean;
    distanceFromRestaurant?: number;
  };
  errors?: string[];
}

export interface DeliverySettings {
  delivery_fee: number;
  minimum_order: number;
  radius_km: number;
  radius_miles: number;
  allowed_postcodes: string[];
  restaurant_location: {
    lat: number;
    lng: number;
  };
}

class DeliveryValidationService {
  private deliverySettings: DeliverySettings | null = null;
  private lastFetched: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get delivery settings from the same source as POSDesktop
   */
  private async getDeliverySettings(): Promise<DeliverySettings> {
    const now = Date.now();
    
    // Use cached settings if available and fresh
    if (this.deliverySettings && (now - this.lastFetched) < this.CACHE_DURATION) {
      return this.deliverySettings;
    }

    try {
      console.log('🚚 Fetching delivery settings from Delivery Management...');
      
      // Get delivery settings from the same API that POSDesktop uses
      const response = await apiClient.get_delivery_settings();
      
      if (!response.success || !response.settings) {
        throw new Error('Unable to retrieve delivery settings');
      }

      this.deliverySettings = {
        delivery_fee: response.settings.delivery_fee || 3.0,
        minimum_order: response.settings.minimum_order || 25.0,
        radius_km: response.settings.radius_km || 6.0,
        radius_miles: response.settings.radius_miles || (response.settings.radius_km || 6.0) / 1.60934,
        allowed_postcodes: response.settings.allowed_postcodes || [],
        restaurant_location: response.settings.restaurant_location || {
          lat: 50.918,
          lng: -0.456
        }
      };
      
      this.lastFetched = now;
      
      console.log('✅ Delivery settings loaded:', this.deliverySettings);
      return this.deliverySettings;
      
    } catch (error) {
      console.error('❌ Error fetching delivery settings:', error);
      
      // Fallback to default Cottage Tandoori settings
      const fallbackSettings: DeliverySettings = {
        delivery_fee: 3.0,
        minimum_order: 25.0,
        radius_km: 6.0,
        radius_miles: 3.7,
        allowed_postcodes: [],
        restaurant_location: {
          lat: 50.918,
          lng: -0.456
        }
      };
      
      this.deliverySettings = fallbackSettings;
      this.lastFetched = now;
      
      return fallbackSettings;
    }
  }

  /**
   * Validate delivery postcode and order value
   */
  async validateDelivery(postcode: string, orderTotal: number): Promise<DeliveryValidationResult> {
    try {
      console.log(`🔍 Validating delivery for postcode: ${postcode}, order total: £${orderTotal}`);
      
      // Get current delivery settings
      const settings = await this.getDeliverySettings();
      
      // Use the same validation API that POSDesktop uses
      const response = await apiClient.validate_delivery_postcode({
        postcode: postcode,
        order_total: orderTotal
      });
      
      if (!response.valid) {
        return {
          isValid: false,
          message: response.message || 'Delivery validation failed',
          errors: response.errors || ['Delivery not available to this postcode'],
          data: {
            deliveryFee: settings.delivery_fee,
            minimumOrder: settings.minimum_order,
            radius: settings.radius_miles,
            postcodeAllowed: false
          }
        };
      }

      // Check minimum order value
      if (orderTotal < settings.minimum_order) {
        return {
          isValid: false,
          message: `Minimum order for delivery is £${settings.minimum_order.toFixed(2)}`,
          errors: [`Order total £${orderTotal.toFixed(2)} is below minimum £${settings.minimum_order.toFixed(2)}`],
          data: {
            deliveryFee: settings.delivery_fee,
            minimumOrder: settings.minimum_order,
            radius: settings.radius_miles,
            postcodeAllowed: true
          }
        };
      }

      // Successful validation
      return {
        isValid: true,
        message: `Delivery available to ${postcode}. Fee: £${settings.delivery_fee.toFixed(2)}`,
        data: {
          deliveryFee: settings.delivery_fee,
          minimumOrder: settings.minimum_order,
          radius: settings.radius_miles,
          postcodeAllowed: true,
          distanceFromRestaurant: response.data?.distance_km
        }
      };
      
    } catch (error) {
      console.error('❌ Delivery validation error:', error);
      
      return {
        isValid: false,
        message: 'Unable to validate delivery address',
        errors: ['Delivery validation service unavailable'],
        data: {
          deliveryFee: 3.0,
          minimumOrder: 25.0,
          radius: 3.7,
          postcodeAllowed: false
        }
      };
    }
  }

  /**
   * Get delivery fee for order total calculation
   */
  async getDeliveryFee(): Promise<number> {
    const settings = await this.getDeliverySettings();
    return settings.delivery_fee;
  }

  /**
   * Get minimum order value
   */
  async getMinimumOrder(): Promise<number> {
    const settings = await this.getDeliverySettings();
    return settings.minimum_order;
  }

  /**
   * Check if order meets delivery requirements
   */
  async validateOrderTotal(orderTotal: number): Promise<{ valid: boolean; message: string; shortfall?: number }> {
    const settings = await this.getDeliverySettings();
    
    if (orderTotal < settings.minimum_order) {
      const shortfall = settings.minimum_order - orderTotal;
      return {
        valid: false,
        message: `Add £${shortfall.toFixed(2)} more for delivery (minimum £${settings.minimum_order.toFixed(2)})`,
        shortfall
      };
    }
    
    return {
      valid: true,
      message: `Order meets delivery minimum (£${settings.minimum_order.toFixed(2)})`
    };
  }

  /**
   * Calculate order totals including delivery fee
   */
  async calculateOrderTotals(subtotal: number, isDelivery: boolean): Promise<{
    subtotal: number;
    deliveryFee: number;
    total: number;
  }> {
    const deliveryFee = isDelivery ? await this.getDeliveryFee() : 0;
    
    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee
    };
  }

  /**
   * Clear cached settings (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.deliverySettings = null;
    this.lastFetched = 0;
  }
}

// Export singleton instance
export const deliveryValidationService = new DeliveryValidationService();
export default deliveryValidationService;
