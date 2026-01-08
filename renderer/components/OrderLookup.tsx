import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Phone, MapPin, Clock } from 'lucide-react';
import { OrderTrackingCard } from './OrderTrackingCard';
import { apiClient } from 'app';
import { OrderTrackingDetails } from 'types';

export interface OrderLookupProps {
  className?: string;
  onOrderFound?: (orderDetails: OrderTrackingDetails) => void;
}

/**
 * Component for customers to look up their orders by order ID or phone number
 */
export function OrderLookup({ className = '', onOrderFound }: OrderLookupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'orderId' | 'phone'>('orderId');
  const [foundOrders, setFoundOrders] = useState<OrderTrackingDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for orders
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter an order ID or phone number');
      return;
    }

    setLoading(true);
    setError(null);
    setFoundOrders([]);

    try {
      if (searchType === 'orderId') {
        // Search by order ID
        const response = await apiClient.get_order_tracking_details({ order_id: searchQuery.trim() });
        const orderDetails = await response.json();
        setFoundOrders([orderDetails]);
        if (onOrderFound) {
          onOrderFound(orderDetails);
        }
      } else {
        // For phone number search, we'd need a different endpoint
        // For now, show a message that this feature is coming soon
        setError('Phone number search is coming soon. Please use your order ID.');
      }
    } catch (err) {
      console.error('Error searching for order:', err);
      setError('Order not found. Please check your order ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setFoundOrders([]);
    setError(null);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Track Your Order
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Enter your order ID to see real-time status updates
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex space-x-2">
            <Button
              variant={searchType === 'orderId' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('orderId')}
              className="flex-1"
            >
              Order ID
            </Button>
            <Button
              variant={searchType === 'phone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSearchType('phone')}
              className="flex-1"
              disabled // Temporarily disabled
            >
              <Phone className="h-4 w-4 mr-1" />
              Phone Number
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={
                  searchType === 'orderId' 
                    ? 'Enter your order ID (e.g., ABC123)' 
                    : 'Enter your phone number'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={loading}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Clear Button */}
          {(foundOrders.length > 0 || error) && (
            <Button 
              variant="outline" 
              onClick={clearSearch}
              className="w-full"
            >
              Search Again
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {foundOrders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center text-gray-800">
            Your Order Status
          </h3>
          
          {foundOrders.map((order) => (
            <OrderTrackingCard
              key={order.order_id}
              orderId={order.order_id}
              customerView={true}
              className="shadow-lg"
            />
          ))}
        </div>
      )}

      {/* Help Section */}
      {foundOrders.length === 0 && !loading && (
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <h4 className="font-medium text-gray-800 mb-3">Need Help?</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Search className="h-4 w-4 mt-0.5 text-gray-400" />
                <p>
                  Your order ID can be found in your confirmation email or receipt
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 mt-0.5 text-gray-400" />
                <p>
                  Order status updates automatically every 30 seconds
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 mt-0.5 text-gray-400" />
                <p>
                  For immediate assistance, call us at 01234 567890
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default OrderLookup;
