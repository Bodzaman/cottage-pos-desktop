import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompletedOrder } from '../utils/orderManagementService';
import { apiClient } from 'app';
import { useSimpleAuth } from '../utils/simple-auth-context';
import { useCartStore } from '../utils/cartStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const OrderHistoryTab: React.FC = () => {
  const { user } = useSimpleAuth();
  const { addItem } = useCartStore();
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Fetch order history when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Filter by user email
        const response = await apiClient.get_orders({
          page: 1,
          page_size: 20,
          search: user.email
        });
        const data = await response.json();
        
        if (data && data.orders) {
          // Convert string dates to Date objects
          const ordersWithDateObjects = data.orders.map((order: any) => ({
            ...order,
            created_at: new Date(order.created_at),
            completed_at: new Date(order.completed_at)
          }));
          
          setOrders(ordersWithDateObjects);
        }
      } catch (error) {
        console.error('Error fetching order history:', error);
        toast.error('Failed to load order history');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [user]);

  // Toggle order details expansion
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };
  
  // Add an item to cart for reordering
  const addItemToCart = (item: any) => {
    try {
      addItem(
        {
          id: item.item_id,
          name: item.name,
          image_url: null // We don't have image URL in order items
        },
        {
          id: item.variant_name ? item.item_id + '-' + item.variant_name : item.item_id,
          name: item.variant_name || '',
          price: item.price
        },
        item.quantity,
        item.notes || ''
      );
      
      toast.success(`Added ${item.quantity} ${item.name} to cart`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };
  
  // Reorder an entire order
  const reorderAll = (order: CompletedOrder) => {
    try {
      (order.items || []).forEach(item => {
        addItemToCart(item);
      });
      
      toast.success('All items added to cart');
    } catch (error) {
      console.error('Error reordering items:', error);
      toast.error('Failed to reorder items');
    }
  };
  
  // Format price as currency
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return format(date, 'PPP');
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch(status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-600/20 text-green-500';
      case 'CANCELLED':
        return 'bg-red-600/20 text-red-500';
      case 'REFUNDED':
        return 'bg-amber-600/20 text-amber-500';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };
  
  // Get order type badge color
  const getOrderTypeBadgeColor = (type: string) => {
    switch(type.toUpperCase()) {
      case 'DELIVERY':
        return 'bg-[#7C5DFA]/20 text-[#9277FF]';
      case 'COLLECTION':
        return 'bg-[#7C5DFA]/25 text-[#9277FF]';
      case 'DINE-IN':
        return 'bg-[#7C5DFA]/15 text-[#9277FF]';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-2 text-gray-400">Loading your order history...</p>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <Alert className="bg-gray-800 border-gray-700 text-gray-300 my-4">
        <AlertDescription>
          You don't have any order history yet. Place an order to see it here!
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Your Order History</h2>
      
      {orders.map((order) => (
        <Card key={order.order_id} className="bg-gray-900 border-gray-800 overflow-hidden">
          <CardContent className="p-0">
            {/* Order header */}
            <div className="p-4 bg-gray-800 flex flex-col md:flex-row justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white">
                    Order #{order.order_id.slice(-8)}
                  </h3>
                  <Badge className={getStatusBadgeColor(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge className={getOrderTypeBadgeColor(order.order_type)}>
                    {order.order_type}
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="mt-2 md:mt-0 flex items-center gap-2">
                <span className="text-lg font-medium text-white">{formatPrice(order.total)}</span>
                <Button 
                  size="sm" 
                  onClick={() => reorderAll(order)}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Reorder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleOrderDetails(order.order_id)}
                  className="border-gray-700 text-gray-300"
                >
                  {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                </Button>
              </div>
            </div>
            
            {/* Order details (expanded) */}
            {expandedOrderId === order.order_id && (
              <div className="p-4">
                {/* Items */}
                <h4 className="font-medium text-white mb-2">Order Items</h4>
                <div className="space-y-3">
                  {(order.items || []).map((item, idx) => (
                    <div key={`${order.order_id}-item-${idx}`} className="flex justify-between items-center bg-gray-800 p-3 rounded-md">
                      <div>
                        <div className="font-medium text-white">{item.name}</div>
                        {item.variant_name && (
                          <div className="text-sm text-gray-400">Variant: {item.variant_name}</div>
                        )}
                        <div className="text-sm text-gray-400">Quantity: {item.quantity}</div>
                        {item.notes && (
                          <div className="text-sm text-gray-500 italic mt-1">Note: {item.notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white">{formatPrice(item.price * item.quantity)}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => addItemToCart(item)}
                          className="hover:bg-gray-700 text-amber-500"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4 bg-gray-800" />
                
                {/* Order summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Order Details</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-400">Order ID:</span>
                        <span className="text-white">{order.order_id}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-400">Order Date:</span>
                        <span className="text-white">{formatDate(order.created_at)}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-400">Order Source:</span>
                        <span className="text-white">{order.order_source}</span>
                      </li>
                      {order.table_number && (
                        <li className="flex justify-between">
                          <span className="text-gray-400">Table Number:</span>
                          <span className="text-white">{order.table_number}</span>
                        </li>
                      )}
                      {order.guest_count && (
                        <li className="flex justify-between">
                          <span className="text-gray-400">Guest Count:</span>
                          <span className="text-white">{order.guest_count}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-2">Payment Summary</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="text-white">{formatPrice(order.subtotal)}</span>
                      </li>
                      {order.service_charge > 0 && (
                        <li className="flex justify-between">
                          <span className="text-gray-400">Service Charge:</span>
                          <span className="text-white">{formatPrice(order.service_charge)}</span>
                        </li>
                      )}
                      {order.discount > 0 && (
                        <li className="flex justify-between">
                          <span className="text-gray-400">Discount:</span>
                          <span className="text-green-500">-{formatPrice(order.discount)}</span>
                        </li>
                      )}
                      <li className="flex justify-between">
                        <span className="text-gray-400">Tax:</span>
                        <span className="text-white">{formatPrice(order.tax)}</span>
                      </li>
                      {order.tip > 0 && (
                        <li className="flex justify-between">
                          <span className="text-gray-400">Tip:</span>
                          <span className="text-white">{formatPrice(order.tip)}</span>
                        </li>
                      )}
                      <li className="flex justify-between font-medium">
                        <span className="text-white">Total:</span>
                        <span className="text-amber-500">{formatPrice(order.total)}</span>
                      </li>
                      <li className="flex justify-between mt-2 pt-2 border-t border-gray-800">
                        <span className="text-gray-400">Payment Method:</span>
                        <span className="text-white">{order.payment.method}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {order.notes && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-md">
                    <h4 className="font-medium text-white mb-1">Order Notes</h4>
                    <p className="text-sm text-gray-400">{order.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
