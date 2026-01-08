import { KitchenOrderItem } from "utils/kitchenTypes";
import { Badge } from "@/components/ui/badge";
import cn from "classnames";

interface Props {
  item: KitchenOrderItem;
}

// Check if item is newly arrived (< 30 seconds)
const isItemNew = (item: KitchenOrderItem): boolean => {
  if (!item.createdAt) return false;
  const now = new Date().getTime();
  const createdTime = new Date(item.createdAt).getTime();
  return (now - createdTime) < 30 * 1000; // 30 seconds
};

export function OrderItemRow({ item }: Props) {
  const isNew = isItemNew(item);
  
  return (
    <div className={cn(
      "flex items-start justify-between py-2 px-2 rounded transition-all",
      isNew && "animate-pulse bg-red-500/10 border border-red-500/30",
      !isNew && item.status === 'READY' && "bg-green-500/10",
      !isNew && item.status === 'PREPARING' && "bg-purple-500/10"
    )}>
      <div className="flex-1 pr-2">
        <div className="font-medium text-foreground">x{item.quantity} {item.name}</div>
        {item.modifiers && item.modifiers.length > 0 && (
          <div className="text-xs text-muted-foreground">{item.modifiers.join(", ")}</div>
        )}
        {item.notes && (
          <div className="text-xs text-amber-400 mt-0.5">Note: {item.notes}</div>
        )}
      </div>
      
      {/* Item Status Badges */}
      <div className="flex flex-col gap-1 items-end">
        {isNew && (
          <Badge className="text-xs font-bold bg-red-600 animate-pulse">
            NEW ITEM
          </Badge>
        )}
        {!isNew && item.status && (
          <Badge 
            variant={item.status === 'READY' ? 'default' : 'secondary'}
            className={cn(
              "text-xs",
              item.status === 'READY' && "bg-green-600",
              item.status === 'PREPARING' && "bg-purple-600",
              item.status === 'PENDING' && "bg-slate-600"
            )}
          >
            {item.status}
          </Badge>
        )}
      </div>
    </div>
  );
}
