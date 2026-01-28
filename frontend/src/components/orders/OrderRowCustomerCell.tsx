import { Badge } from '@/components/ui/badge';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { CustomerPreviewCard, OrderCustomerCRM } from './CustomerPreviewCard';
import { User } from 'lucide-react';

interface OrderRowCustomerCellProps {
  customerName: string;
  customerPhone?: string;
  customerCRM?: OrderCustomerCRM | null;
  onViewProfile?: (customerId: string) => void;
}

const tagColors: Record<string, string> = {
  VIP: 'bg-amber-500/20 text-amber-400',
  regular: 'bg-blue-500/20 text-blue-400',
  allergy: 'bg-red-500/20 text-red-400',
};

function getInlineTagColor(tag: string): string {
  const key = Object.keys(tagColors).find(k => tag.toLowerCase().includes(k.toLowerCase()));
  return key ? tagColors[key] : 'bg-gray-500/20 text-gray-400';
}

export function OrderRowCustomerCell({ customerName, customerPhone, customerCRM, onViewProfile }: OrderRowCustomerCellProps) {
  const displayName = customerCRM
    ? [customerCRM.first_name, customerCRM.last_name].filter(Boolean).join(' ') || customerName
    : customerName || 'Walk-in';

  const displayPhone = customerCRM?.phone || customerPhone || '';
  const tags = customerCRM?.tags?.slice(0, 2) || [];

  const content = (
    <div className="flex items-center gap-2 min-w-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-white truncate font-medium">{displayName}</span>
          {tags.map(tag => (
            <span key={tag} className={`text-[9px] px-1 py-0 rounded ${getInlineTagColor(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
        {displayPhone && (
          <div className="text-xs text-gray-500 truncate">{displayPhone}</div>
        )}
      </div>
    </div>
  );

  if (!customerCRM) {
    return <div className="py-1">{content}</div>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="text-left py-1 cursor-pointer hover:opacity-80 transition-opacity w-full">
          {content}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 bg-[#1a1a1a] border border-white/10 p-4"
        side="right"
        align="start"
      >
        <CustomerPreviewCard customer={customerCRM} onViewProfile={onViewProfile} />
      </HoverCardContent>
    </HoverCard>
  );
}
