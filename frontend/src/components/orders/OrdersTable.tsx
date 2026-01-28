import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Printer, Users, Truck, Package, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';
import { OrderRowCustomerCell } from './OrderRowCustomerCell';
import { OrderCustomerCRM } from './CustomerPreviewCard';
import { OrderData } from '../OrderDetailDialog';

interface OrdersTableProps {
  orders: OrderData[];
  onViewOrder: (order: OrderData) => void;
  onPrintOrder?: (order: OrderData) => void;
  onViewCustomerProfile?: (customerId: string) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  confirmed: 'bg-blue-500/20 text-blue-500',
  preparing: 'bg-purple-500/20 text-purple-500',
  ready: 'bg-green-500/20 text-green-500',
  completed: 'bg-green-700/20 text-green-600',
  cancelled: 'bg-red-500/20 text-red-500',
  paid: 'bg-green-700/20 text-green-600',
};

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'dine-in': { label: 'Dine-In', color: 'bg-green-500/20 text-green-400', icon: <Users className="h-3 w-3" /> },
  delivery: { label: 'Delivery', color: 'bg-blue-500/20 text-blue-400', icon: <Truck className="h-3 w-3" /> },
  pickup: { label: 'Collection', color: 'bg-purple-500/20 text-purple-400', icon: <Package className="h-3 w-3" /> },
};

const sourceLabels: Record<string, string> = {
  pos: 'POS',
  online: 'Online',
};

export function OrdersTable({ orders, onViewOrder, onPrintOrder, onViewCustomerProfile }: OrdersTableProps) {
  if (orders.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-3 font-medium">Order</th>
            <th className="text-left py-3 px-3 font-medium">Customer</th>
            <th className="text-left py-3 px-3 font-medium">Type</th>
            <th className="text-left py-3 px-3 font-medium">Source</th>
            <th className="text-left py-3 px-3 font-medium">Status</th>
            <th className="text-right py-3 px-3 font-medium">Total</th>
            <th className="text-left py-3 px-3 font-medium">Payment</th>
            <th className="text-left py-3 px-3 font-medium">Created</th>
            <th className="text-right py-3 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const type = typeConfig[order.type] || typeConfig.pickup;

            return (
              <tr
                key={order.id}
                onClick={() => onViewOrder(order)}
                className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <td className="py-2.5 px-3">
                  <span className="text-white font-mono text-xs">
                    {order.orderNumber || order.id.slice(0, 8)}
                  </span>
                </td>
                <td className="py-2.5 px-3 max-w-[200px]">
                  <OrderRowCustomerCell
                    customerName={order.customer.name}
                    customerPhone={order.customer.phone}
                    customerCRM={(order as any).customerCRM}
                    onViewProfile={onViewCustomerProfile}
                  />
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 gap-1 ${type.color}`}>
                    {type.icon}
                    {type.label}
                  </Badge>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs text-gray-400">
                    {sourceLabels[order.source] || order.source}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusColors[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {order.status}
                  </Badge>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-white font-medium text-xs">
                    {formatCurrency(order.payment.amount)}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs text-gray-400 capitalize">
                    {order.payment.method || '—'}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs text-gray-500">
                    {order.timestamps.created
                      ? format(new Date(order.timestamps.created), 'dd/MM HH:mm')
                      : '—'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                      onClick={() => onViewOrder(order)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {onPrintOrder && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                        onClick={() => onPrintOrder(order)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
