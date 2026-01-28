import { Badge } from '@/components/ui/badge';
import { Phone, Mail, ShoppingBag, DollarSign, Clock, User } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { formatDistanceToNow } from 'date-fns';

export interface OrderCustomerCRM {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  customer_reference_number?: string;
  total_orders?: number;
  total_spend?: number;
  last_order_at?: string;
  tags?: string[];
  notes_summary?: string;
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  regular: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  allergy: 'bg-red-500/20 text-red-400 border-red-500/30',
  complaint: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  new: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function getTagColor(tag: string): string {
  const key = Object.keys(tagColors).find(k => tag.toLowerCase().includes(k.toLowerCase()));
  return key ? tagColors[key] : 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

interface CustomerPreviewCardProps {
  customer: OrderCustomerCRM;
  onViewProfile?: (customerId: string) => void;
}

export function CustomerPreviewCard({ customer, onViewProfile }: CustomerPreviewCardProps) {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Unknown';
  const initials = [customer.first_name?.[0], customer.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="w-72 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-white truncate">{fullName}</div>
          {customer.customer_reference_number && (
            <div className="text-xs text-gray-500">{customer.customer_reference_number}</div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-1.5 text-sm">
        {customer.phone && (
          <div className="flex items-center gap-2 text-gray-300">
            <Phone className="h-3.5 w-3.5 text-gray-500" />
            <span>{customer.phone}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-sm font-semibold text-white">{customer.total_orders ?? 0}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Orders</div>
        </div>
        <div className="bg-white/5 rounded-lg px-2.5 py-1.5 text-center">
          <div className="text-sm font-semibold text-white">{formatCurrency(customer.total_spend ?? 0)}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Spent</div>
        </div>
      </div>

      {customer.last_order_at && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          Last order {formatDistanceToNow(new Date(customer.last_order_at), { addSuffix: true })}
        </div>
      )}

      {/* Tags */}
      {customer.tags && customer.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {customer.tags.map(tag => (
            <Badge key={tag} variant="outline" className={`text-[10px] px-1.5 py-0 ${getTagColor(tag)}`}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Notes */}
      {customer.notes_summary && (
        <div className="text-xs text-gray-400 italic border-l-2 border-gray-700 pl-2 line-clamp-2">
          {customer.notes_summary}
        </div>
      )}

      {/* View Profile */}
      {onViewProfile && (
        <button
          onClick={() => onViewProfile(customer.id)}
          className="w-full text-xs text-purple-400 hover:text-purple-300 py-1 border-t border-white/5 mt-1"
        >
          View Full Profile
        </button>
      )}
    </div>
  );
}
