/**
 * useCRMReorder.ts
 *
 * Hook for re-ordering from CRM customer profile.
 * Loads a historical order into the POS system with all details pre-filled.
 */

import { useNavigate } from "react-router-dom";
import { usePOSOrderStore } from "../utils/posOrderStore";
import { usePOSCustomerStore } from "../utils/posCustomerStore";
import { OrderItem, ModifierSelection, CustomizationSelection } from "../utils/menuTypes";

// Types for the full order from CRM API (matches actual database schema)
interface FullOrderItem {
  id: string;
  menu_item_id?: string;
  variant_id?: string;
  name?: string;
  item_name?: string;
  variant_name?: string;
  protein_type?: string;
  price?: number;
  unit_price?: number;
  quantity: number;
  modifiers?: any[];
  notes?: string;
  image_url?: string;
  category?: string;
  category_id?: string;
}

interface FullOrder {
  id: string;
  order_number?: string;
  order_type: string;
  order_source?: string;
  status: string;
  payment_status?: string;
  total_amount: number;
  subtotal?: number;
  delivery_fee?: number;
  service_charge?: number;
  discount_amount?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  delivery_address?: string;
  delivery_instructions?: string;
  special_instructions?: string;
  notes?: string;
  pickup_time?: string;
  requested_time?: string;
  table_number?: string;
  guest_count?: number;
  created_at: string;
  items: FullOrderItem[];
}

interface CustomerProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  default_address?: {
    address_line1?: string;
    city?: string;
    postal_code?: string;
  };
}

/**
 * Map order type from database format to POS store format
 */
const mapOrderType = (type: string): 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING' => {
  const typeMap: Record<string, 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING'> = {
    'DINE_IN': 'DINE-IN',
    'DINE-IN': 'DINE-IN',
    'WAITING': 'WAITING',
    'COLLECTION': 'COLLECTION',
    'DELIVERY': 'DELIVERY',
  };
  return typeMap[type?.toUpperCase()] || 'COLLECTION';
};

/**
 * Convert full order items to POS OrderItem format
 */
const mapOrderItems = (items: FullOrderItem[]): OrderItem[] => {
  return items.map((item): OrderItem => {
    // Handle both name/item_name and price/unit_price from database
    const itemName = item.name || item.item_name || 'Unknown Item';
    const itemPrice = item.price ?? item.unit_price ?? 0;

    // Map modifiers to ModifierSelection format
    const modifiers: ModifierSelection[] = (item.modifiers || []).map((mod: any, idx: number) => ({
      id: `mod-${idx}`,
      modifier_id: typeof mod === 'object' ? mod.modifier_id || `mod-${idx}` : `mod-${idx}`,
      name: typeof mod === 'string' ? mod : mod.name || '',
      price_adjustment: typeof mod === 'object' ? mod.price || mod.price_adjustment || 0 : 0,
      price: typeof mod === 'object' ? mod.price || mod.price_adjustment || 0 : 0,
    }));

    return {
      id: crypto.randomUUID(), // Generate new ID for the re-order
      menu_item_id: item.menu_item_id || '',
      variant_id: item.variant_id || null,
      name: itemName,
      quantity: item.quantity,
      price: itemPrice,
      variantName: item.variant_name,
      notes: item.notes,
      protein_type: item.protein_type,
      image_url: item.image_url,
      modifiers,
      customizations: [],
      category_id: item.category_id,
      category_name: item.category,
    };
  });
};

export function useCRMReorder() {
  const navigate = useNavigate();
  const { clearOrder, setOrderItems, setOrderType } = usePOSOrderStore();
  const { updateCustomer, clearCustomer } = usePOSCustomerStore();

  /**
   * Re-order a historical order to POS
   * Clears current cart and loads the full order with customer details
   */
  const handleReorder = (order: FullOrder, customer: CustomerProfile) => {
    // 1. Clear current order (REPLACE behavior)
    clearOrder();
    clearCustomer();

    // 2. Set order type based on original order
    const orderType = mapOrderType(order.order_type);
    setOrderType(orderType);

    // 3. Load order items
    const items = mapOrderItems(order.items);
    setOrderItems(items);

    // 4. Pre-fill customer details from CRM
    // Parse delivery address if available (format: "Street, City, Postcode")
    let street = '';
    let city = '';
    let postcode = '';

    if (order.delivery_address) {
      // Try to extract components from address
      const addressParts = order.delivery_address.split(',').map(p => p.trim());
      if (addressParts.length >= 3) {
        street = addressParts[0];
        city = addressParts[addressParts.length - 2];
        postcode = addressParts[addressParts.length - 1];
      } else if (addressParts.length === 2) {
        street = addressParts[0];
        // Check if last part looks like a postcode
        const lastPart = addressParts[1];
        if (/^[A-Z]{1,2}\d/.test(lastPart.toUpperCase())) {
          postcode = lastPart;
        } else {
          city = lastPart;
        }
      } else {
        street = order.delivery_address;
      }
    }

    // Use customer default address if order doesn't have delivery details
    if (!street && customer.default_address?.address_line1) {
      street = customer.default_address.address_line1;
      city = customer.default_address.city || '';
      postcode = postcode || customer.default_address.postal_code || '';
    }

    updateCustomer({
      firstName: customer.first_name || order.customer_name?.split(' ')[0] || '',
      lastName: customer.last_name || order.customer_name?.split(' ').slice(1).join(' ') || '',
      phone: customer.phone || order.customer_phone || '',
      email: customer.email || order.customer_email || '',
      address: order.delivery_address || '',
      street,
      city,
      postcode,
      deliveryNotes: order.delivery_instructions || order.special_instructions || order.notes || '',
      customerId: customer.id,
      notes: '',
      tableNumber: order.table_number || '',
      guestCount: order.guest_count || 2,
    });

    // 5. Navigate to POS in takeaway mode
    // Use the appropriate mode based on order type
    const modeParam = orderType === 'DINE-IN' ? 'DINE_IN' : 'TAKE_AWAY';
    navigate(`/pos?mode=${modeParam}`);
  };

  return { handleReorder };
}

export default useCRMReorder;
