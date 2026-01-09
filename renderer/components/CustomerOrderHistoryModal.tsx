import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calendar, PoundSterling, Package, X, ShoppingBag, Receipt, Eye } from 'lucide-react';
import { CustomerIntelligenceProfile } from 'utils/usePOSCustomerIntelligence';
import { RecentOrder } from 'types';
import { formatDistanceToNow } from 'date-fns';
import ThermalReceiptDisplay from './ThermalReceiptDisplay';
import { OrderDetailsModal } from './OrderDetailsModal';
import { apiClient } from 'app';
import { toast } from 'sonner';

interface CustomerOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerIntelligenceProfile | null;
  orders: RecentOrder[];
  onReorder: (order: RecentOrder) => void;
}

/**
 * CustomerOrderHistoryModal - Displays customer's order history in a centered modal
 * 
 * Modal Layout (500-600px wide):
 * ╔══════════════════════════════════════╗
 * ║ Bod Zaman's Order History        [✕] ║
 * ╠══════════════════════════════════════╣
 * ║ CT001 • 07342640000                  ║
 * ║ 17 Sopers Cottages, Pulborough       ║
 * ╠══════════════════════════════════════╣
 * ║ 📦 25 days ago • £21.45  [↻ Reorder] ║
 * ║ TIKKA MASALA, SHASHLICK BHUNA       ║
 * ║ PENDING                              ║
 * ║──────────────────────────────────────║
 * ║ ... (scrollable, shows 3 recent)     ║
 * ╚══════════════════════════════════════╝
 * 
 * Features:
 * - QSAI frosted glass theme
 * - Shows 3 most recent orders
 * - Relative dates ("25 days ago")
 * - Status badges
 * - Large purple Reorder buttons
 * - Scrollable list if more than 3 orders
 * - Close on backdrop click or ✕ button
 */
export const CustomerOrderHistoryModal: React.FC<CustomerOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders,
  onReorder,
}) => {
  if (!customer) return null;

  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer';
  const displayOrders = orders.slice(0, 3); // Show only 3 most recent

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="
          max-w-[600px] 
          bg-gradient-to-br from-zinc-900/98 to-zinc-800/98
          backdrop-blur-md
          border border-purple-500/30
          shadow-2xl shadow-purple-500/20
          text-white
          p-0
          overflow-hidden
        "
      >
        {/* Purple gradient accent border */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-600/10 to-purple-500/10 rounded-lg pointer-events-none" />
        
        {/* Header */}
        <DialogHeader className="relative border-b border-zinc-700/50 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-white">
            {fullName}'s Order History
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info Subheader */}
        <div className="relative px-6 py-3 bg-zinc-800/50 border-b border-zinc-700/30 space-y-1">
          <div className="flex items-center gap-3 text-sm">
            {customer.customer_reference_number && (
              <span className="font-mono font-semibold text-purple-300">
                {customer.customer_reference_number}
              </span>
            )}
            {customer.phone && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300 font-mono">{customer.phone}</span>
              </>
            )}
          </div>
          {customer.default_address && (
            <div className="text-xs text-gray-400">
              {customer.default_address.address_line1}
              {customer.default_address.address_line2 && `, ${customer.default_address.address_line2}`}
              {', '}
              {customer.default_address.city}
            </div>
          )}
        </div>

        {/* Order List (Scrollable) */}
        <div className="relative max-h-[400px] overflow-y-auto px-6 py-4 space-y-3">
          {displayOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">No orders yet</p>
              <p className="text-gray-500 text-xs mt-1">Order history will appear here</p>
            </div>
          ) : (
            displayOrders.map((order, index) => (
              <OrderCard 
                key={order.order_id || index} 
                order={order} 
                customer={customer}
                onReorder={() => onReorder(order)}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Individual Order Card Component
interface OrderCardProps {
  order: RecentOrder;
  customer: CustomerIntelligenceProfile;
  onReorder: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, customer, onReorder }) => {
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [fullOrderData, setFullOrderData] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  
  // Format date as relative time ("25 days ago")
  const orderDate = new Date(order.order_date);
  const relativeDate = formatDistanceToNow(orderDate, { addSuffix: true });

  // Parse items summary (truncate if too long)
  const itemsSummary = order.items_summary || 'Order details not available';
  const truncatedItems = itemsSummary.length > 80 
    ? `${itemsSummary.substring(0, 80)}...` 
    : itemsSummary;

  // Format price
  const formattedPrice = order.total_amount 
    ? `£${order.total_amount.toFixed(2)}` 
    : 'N/A';

  // Status badge color
  const getStatusColor = (status: string | null | undefined) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  
  /**
   * Load full order details for receipt preview
   */
  const handleViewOrder = async () => {
    setIsLoadingOrder(true);
    
    try {
      // Fetch full order details from backend
      const response = await apiClient.get_order_by_id({ orderId: order.order_id });
      const orderData = await response.json();
      
      // DEBUG: Log the order data to see structure
      console.log('🔍 [Order Details] Full order data:', orderData);
      console.log('🔍 [Order Details] Order items:', orderData?.items);
      if (orderData?.items && orderData.items.length > 0) {
        console.log('🔍 [Order Details] First item structure:', orderData.items[0]);
      }
      
      if (orderData) {
        setFullOrderData(orderData);
        setShowOrderDetails(true);
      } else {
        toast.error('Order not found', {
          description: 'Unable to load order details for preview'
        });
      }
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order', {
        description: 'Please try again'
      });
    } finally {
      setIsLoadingOrder(false);
    }
  };
  
  /**
   * Handle reorder and close both modals (cascading close)
   */
  const handleReorderAndClose = () => {
    setShowOrderDetails(false); // Close OrderDetailsModal
    onReorder(); // Trigger parent's onReorder (which closes CustomerOrderHistoryModal)
  };
  
  /**
   * Transform backend order data to ThermalReceiptDisplay format
   */
  const transformOrderData = () => {
    if (!fullOrderData) return null;
    
    // Transform items to use variant names and calculate totals properly
    const transformedItems = (fullOrderData.items || []).map((item: any) => {
      // Get the unit price from the item
      const unitPrice = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 1;
      
      return {
        ...item,
        // Use variant name if available, otherwise use base name
        name: item.variant || item.name,
        // Ensure price fields are numbers
        price: unitPrice,
        basePrice: unitPrice,
        quantity: quantity,
        // Calculate total = price × quantity
        total: unitPrice * quantity
      };
    });
    
    // Calculate subtotal from item totals
    const calculatedSubtotal = transformedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Get fees and charges from backend fields
    const taxAmount = Number(fullOrderData.tax_amount) || 0;
    const deliveryFee = Number(fullOrderData.delivery_fee) || 0;
    const serviceCharge = Number(fullOrderData.service_charge) || 0;
    const discountAmount = Number(fullOrderData.discount_amount) || 0;
    
    // CRITICAL FIX: Map backend total_amount to total
    // Fallback: If total_amount is 0 or missing (old orders), calculate from subtotal + fees
    const backendTotal = Number(fullOrderData.total_amount) || 0;
    const backendSubtotal = Number(fullOrderData.subtotal) || calculatedSubtotal;
    
    // Use backend total if > 0, otherwise calculate it
    const finalTotal = backendTotal > 0 
      ? backendTotal 
      : backendSubtotal + taxAmount + deliveryFee + serviceCharge - discountAmount;
    
    // Use backend subtotal if available, otherwise use calculated
    const finalSubtotal = backendSubtotal > 0 ? backendSubtotal : calculatedSubtotal;
    
    return {
      orderId: fullOrderData.id || order.order_id,
      orderNumber: fullOrderData.order_number || order.order_id.substring(0, 8).toUpperCase(),
      orderType: fullOrderData.order_type || order.order_type,
      items: transformedItems,
      subtotal: finalSubtotal,
      tax: taxAmount,
      deliveryFee: deliveryFee,
      serviceCharge: serviceCharge,
      discount: discountAmount,
      total: finalTotal,
      tableNumber: fullOrderData.table_number,
      queueNumber: fullOrderData.queue_number,
      customerName: fullOrderData.customer_name,
      customerPhone: fullOrderData.customer_phone,
      customerEmail: fullOrderData.customer_email,
      deliveryAddress: fullOrderData.delivery_address,
      collectionTime: fullOrderData.collection_time,
      estimatedDeliveryTime: fullOrderData.estimated_delivery_time,
      specialInstructions: fullOrderData.special_instructions,
      // CRITICAL FIX: Use created_at from backend, not current time
      timestamp: fullOrderData.created_at || fullOrderData.timestamp || order.order_date,
      guestCount: fullOrderData.guest_count,
      paymentMethod: fullOrderData.payment_method
    };
  };
  
  // Build customer profile for OrderDetailsModal
  const customerProfile = {
    customerId: customer.customer_reference_number || 'N/A',
    customerName: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Customer',
    customerPhone: customer.phone || 'N/A',
    deliveryAddress: customer.default_address 
      ? [
          customer.default_address.address_line1,
          customer.default_address.address_line2,
          customer.default_address.city,
          customer.default_address.county,
          customer.default_address.postal_code
        ].filter(Boolean).join(', ')
      : undefined,
    customerEmail: customer.email || undefined
  };

  return (
    <>
      <div className="
        relative p-4 rounded-lg
        bg-zinc-800/40
        border border-zinc-700/50
        hover:border-purple-500/30
        transition-all duration-200
        group
      ">
        {/* Order Header: Date + Amount + View Order Button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-300">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              <span>{relativeDate}</span>
            </div>
            <span className="text-gray-600">•</span>
            <div className="flex items-center gap-1 text-sm font-semibold text-white">
              <PoundSterling className="h-3.5 w-3.5 text-green-400" />
              <span>{formattedPrice}</span>
            </div>
          </div>

          {/* View Order CTA Button */}
          <button
            onClick={handleViewOrder}
            disabled={isLoadingOrder}
            className="
              px-4 py-2 rounded-md text-sm font-bold
              transition-all duration-200
              flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              boxShadow: '0 2px 8px rgba(91, 33, 182, 0.2)'
            }}
            onMouseEnter={(e) => {
              if (!isLoadingOrder) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(91, 33, 182, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(91, 33, 182, 0.2)';
            }}
          >
            <Eye className="h-4 w-4" />
            {isLoadingOrder ? 'Loading...' : 'View Order'}
          </button>
        </div>

        {/* Items Summary */}
        <div className="flex items-start gap-2 mb-2">
          <Package className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-300 leading-relaxed">
            {truncatedItems}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs px-2 py-0.5 ${getStatusColor(order.status)}`}
          >
            {order.status?.toUpperCase() || 'UNKNOWN'}
          </Badge>
          {order.order_type && (
            <span className="text-xs text-gray-500 font-mono">
              {order.order_type.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Order Details Modal with Customer Header + Reorder Footer */}
      <OrderDetailsModal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        customer={customerProfile}
        orderData={transformOrderData()}
        orderType={fullOrderData?.order_type || 'COLLECTION'}
        isLoadingOrder={isLoadingOrder}
        onReorder={handleReorderAndClose}
      />
    </>
  );
};
