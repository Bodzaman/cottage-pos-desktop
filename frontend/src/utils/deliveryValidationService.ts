import brain from 'brain';
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
      // Get delivery settings from the same API that POSDesktop uses
      const response = await (brain as any).get_delivery_settings();

      if (!response.ok) {
        throw new Error('Unable to retrieve delivery settings');
      }

      const data = await response.json();

      if (!data.success || !data.settings) {
        throw new Error('Unable to retrieve delivery settings');
      }

      this.deliverySettings = {
        delivery_fee: data.settings.delivery_fee || 3.0,
        minimum_order: data.settings.minimum_order || 25.0,
        radius_km: data.settings.radius_km || 6.0,
        radius_miles: data.settings.radius_miles || (data.settings.radius_km || 6.0) / 1.60934,
        allowed_postcodes: data.settings.allowed_postcodes || [],
        restaurant_location: data.settings.restaurant_location || {
          lat: 50.918,
          lng: -0.456
        }
      };

      this.lastFetched = now;

      return this.deliverySettings;

    } catch (error) {
      console.error('Failed to get delivery settings:', error);

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
      // Get current delivery settings
      const settings = await this.getDeliverySettings();

      // Use the same validation API that POSDesktop uses
      const response = await (brain as any).validate_delivery_postcode({
        postcode: postcode,
        order_total: orderTotal
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      const result = await response.json();

      if (!result.valid) {
        return {
          isValid: false,
          message: result.message || 'Delivery validation failed',
          errors: result.errors || ['Delivery not available to this postcode'],
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
          distanceFromRestaurant: result.data?.distance_km
        }
      };

    } catch (error) {
      console.error('Delivery validation error:', error);

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
