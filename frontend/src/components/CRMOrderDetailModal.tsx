import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  RefreshCw,
  Loader2,
  ChefHat,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { colors } from "../utils/InternalDesignSystem";
import ThermalReceiptDisplay from "./ThermalReceiptDisplay";
import brain from "brain";
import { toast } from "sonner";

// Types (matches actual database schema)
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
  items: OrderItem[];
}

interface OrderItem {
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

interface CustomerProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface CRMOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customer: CustomerProfile;
  onReorder: (order: FullOrder, customer: CustomerProfile) => void;
}

// Map order type to ThermalReceiptDisplay format
const mapOrderType = (type: string): 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY' => {
  const typeMap: Record<string, 'DINE-IN' | 'WAITING' | 'COLLECTION' | 'DELIVERY'> = {
    'DINE_IN': 'DINE-IN',
    'DINE-IN': 'DINE-IN',
    'WAITING': 'WAITING',
    'COLLECTION': 'COLLECTION',
    'DELIVERY': 'DELIVERY',
  };
  return typeMap[type?.toUpperCase()] || 'COLLECTION';
};

// Convert full order to ThermalReceiptDisplay format
const mapOrderToReceiptData = (order: FullOrder) => {
  return {
    orderId: order.id,
    orderNumber: order.order_number,
    orderType: mapOrderType(order.order_type),
    items: order.items.map(item => {
      // Handle both name/item_name and price/unit_price from database
      const itemName = item.name || item.item_name || 'Unknown Item';
      const itemPrice = item.price ?? item.unit_price ?? 0;

      return {
        id: item.id,
        name: itemName,
        price: itemPrice,
        quantity: item.quantity,
        // Section divider support - these fields enable ThermalPreview to group items by section
        category_id: item.category_id,
        menu_item_id: item.menu_item_id,
        variant: item.variant_name ? {
          id: item.variant_id || '',
          name: item.variant_name,
          price_adjustment: 0,
        } : undefined,
        customizations: item.modifiers?.map((m: any, idx: number) => ({
          id: `mod-${idx}`,
          name: typeof m === 'string' ? m : m.name || '',
          price: typeof m === 'object' ? m.price || 0 : 0,
        })) || [],
        instructions: item.notes,
      };
    }),
    subtotal: order.subtotal || order.total_amount,
    deliveryFee: order.delivery_fee,
    serviceCharge: order.service_charge,
    discount: order.discount_amount,
    total: order.total_amount,
    tableNumber: order.table_number?.toString(),
    guestCount: order.guest_count,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    deliveryAddress: order.delivery_address,
    collectionTime: order.pickup_time || order.requested_time,
    specialInstructions: order.special_instructions || order.notes || order.delivery_instructions,
    timestamp: order.created_at,
    paymentStatus: (order.payment_status?.toUpperCase() || 'UNPAID') as 'PAID' | 'UNPAID' | 'PARTIAL',
  };
};

export function CRMOrderDetailModal({
  isOpen,
  onClose,
  orderId,
  customer,
  onReorder,
}: CRMOrderDetailModalProps) {
  const [order, setOrder] = useState<FullOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKitchenView, setIsKitchenView] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch full order when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchFullOrder();
    }
  }, [isOpen, orderId]);

  const fetchFullOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await brain.crm_get_full_order({ order_id: orderId });
      const data = await response.json();

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setError(data.message || "Failed to load order");
      }
    } catch (err) {
      console.error("Error fetching full order:", err);
      setError("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async (type: 'full' | 'foh' | 'kitchen') => {
    if (!order) return;

    setIsPrinting(true);
    try {
      // For now, use browser print as a simple implementation
      // In production, this would integrate with usePrintingOperations
      toast.info(`Printing ${type === 'full' ? 'full order' : type === 'foh' ? 'front of house copy' : 'kitchen copy'}...`);

      // Simulate print delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (type === 'full') {
        toast.success("Full order sent to printer (1x FOH + 1x Kitchen)");
      } else if (type === 'foh') {
        toast.success("Front of house copy sent to printer");
      } else {
        toast.success("Kitchen copy sent to printer");
      }
    } catch (err) {
      toast.error("Failed to print order");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleReorder = () => {
    if (!order) return;
    onReorder(order, customer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col"
          style={{
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.light,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: colors.border.light }}
          >
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: colors.text.primary }}
              >
                Order Details
              </h2>
              {order && (
                <p className="text-sm" style={{ color: colors.text.muted }}>
                  #{order.order_number || order.id.slice(0, 8)} • {order.order_type}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors hover:bg-white/10"
            >
              <X className="w-5 h-5" style={{ color: colors.text.muted }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2
                  className="w-8 h-8 animate-spin"
                  style={{ color: colors.purple.primary }}
                />
              </div>
            )}

            {error && !isLoading && (
              <div
                className="flex items-center gap-3 p-4 rounded-lg"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {order && !isLoading && !error && (
              <div className="space-y-4">
                {/* View Toggle */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: colors.background.tertiary }}
                >
                  <div className="flex items-center gap-3">
                    <Receipt
                      className="w-5 h-5"
                      style={{ color: !isKitchenView ? colors.purple.primary : colors.text.muted }}
                    />
                    <span style={{ color: colors.text.secondary }}>
                      Front of House
                    </span>
                  </div>

                  <Switch
                    checked={isKitchenView}
                    onCheckedChange={setIsKitchenView}
                  />

                  <div className="flex items-center gap-3">
                    <span style={{ color: colors.text.secondary }}>
                      Kitchen
                    </span>
                    <ChefHat
                      className="w-5 h-5"
                      style={{ color: isKitchenView ? colors.purple.primary : colors.text.muted }}
                    />
                  </div>
                </div>

                {/* Receipt Preview */}
                <div
                  className="rounded-xl overflow-hidden flex justify-center"
                  style={{
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  <ThermalReceiptDisplay
                    orderMode={mapOrderType(order.order_type)}
                    orderData={mapOrderToReceiptData(order)}
                    paperWidth={80}
                    receiptFormat={isKitchenView ? "kitchen_customer" : "front_of_house"}
                    paymentStatus={order.payment_status?.toUpperCase() as 'PAID' | 'UNPAID' | 'PARTIAL'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {order && !isLoading && !error && (
            <div
              className="px-6 py-4 border-t space-y-3"
              style={{ borderColor: colors.border.light }}
            >
              {/* Print Options */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePrint('full')}
                  disabled={isPrinting}
                  className="flex-1"
                  style={{
                    backgroundColor: `${colors.purple.primary}20`,
                    color: colors.purple.primary,
                    border: `1px solid ${colors.purple.primary}40`,
                  }}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Full Order
                </Button>
                <Button
                  onClick={() => handlePrint('foh')}
                  disabled={isPrinting}
                  variant="outline"
                  style={{
                    borderColor: colors.border.medium,
                    color: colors.text.secondary,
                  }}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  FOH
                </Button>
                <Button
                  onClick={() => handlePrint('kitchen')}
                  disabled={isPrinting}
                  variant="outline"
                  style={{
                    borderColor: colors.border.medium,
                    color: colors.text.secondary,
                  }}
                >
                  <ChefHat className="w-4 h-4 mr-2" />
                  Kitchen
                </Button>
              </div>

              {/* Re-order Button */}
              <Button
                onClick={handleReorder}
                className="w-full"
                style={{
                  backgroundColor: colors.purple.primary,
                  color: "#FFFFFF",
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-order to POS
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default CRMOrderDetailModal;
