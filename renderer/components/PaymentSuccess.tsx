import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessProps {
  orderId: string;
  orderType: string;
  amount: number;
  customerEmail?: string;
  tableNumber?: string;
  onDownloadReceipt?: () => void;
  onNewOrder?: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  orderId,
  orderType,
  amount,
  customerEmail,
  tableNumber,
  onDownloadReceipt,
  onNewOrder
}) => {
  const navigate = useNavigate();

  const getOrderTypeDisplay = (type: string) => {
    switch (type) {
      case 'dine_in':
        return 'Dine In';
      case 'takeaway':
        return 'Takeaway';
      case 'collection':
        return 'Collection';
      case 'delivery':
        return 'Delivery';
      default:
        return type;
    }
  };

  const getEstimatedTime = (type: string) => {
    switch (type) {
      case 'dine_in':
        return '15-20 minutes';
      case 'takeaway':
      case 'collection':
        return '20-25 minutes';
      case 'delivery':
        return '30-45 minutes';
      default:
        return '20-30 minutes';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Details */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Order ID:</span>
              <span className="text-sm font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Order Type:</span>
              <span>{getOrderTypeDisplay(orderType)}</span>
            </div>
            {tableNumber && (
              <div className="flex justify-between">
                <span className="font-medium">Table:</span>
                <span>{tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Amount Paid:</span>
              <span className="font-semibold text-green-600">£{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Time:</span>
              <span>{getEstimatedTime(orderType)}</span>
            </div>
          </div>

          {/* Receipt Info */}
          {customerEmail && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              A receipt has been sent to: <br />
              <span className="font-medium">{customerEmail}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {onDownloadReceipt && (
              <Button
                onClick={onDownloadReceipt}
                variant="outline"
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            )}
            
            {onNewOrder && (
              <Button
                onClick={onNewOrder}
                className="w-full"
              >
                Place New Order
              </Button>
            )}
            
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Status Message */}
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {orderType === 'dine_in' 
                ? 'Your order is being prepared. Please wait at your table.'
                : orderType === 'delivery'
                ? 'Your order is being prepared and will be delivered shortly.'
                : 'Your order is being prepared. You will be notified when ready for collection.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
