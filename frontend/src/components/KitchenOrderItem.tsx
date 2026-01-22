

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableOrderItem } from "../utils/tableTypes";
import { CheckCircle, Clock, Coffee, Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { QSAITheme } from "../utils/QSAIDesign";

interface KitchenOrderItemProps {
  item: TableOrderItem;
  orderType: 'DINE-IN' | 'COLLECTION' | 'DELIVERY' | 'WAITING';
  onUpdateItemStatus?: (itemId: string, status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => void;
}

export const KitchenOrderItem = ({ item, orderType, onUpdateItemStatus }: KitchenOrderItemProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Determine item status classes
  const getStatusClasses = () => {
    switch (item.itemStatus) {
      case 'NEW':
        return 'border-purple-500 bg-purple-500/10';
      case 'PREPARING':
        return 'border-blue-500 bg-blue-500/10';
      case 'READY':
        return 'border-green-500 bg-green-500/10';
      case 'SERVED':
        return 'border-gray-500 bg-gray-500/10';
      default:
        return 'border-gray-700';
    }
  };
  
  // Get status icon
  const getStatusIcon = () => {
    switch (item.itemStatus) {
      case 'NEW':
        return <Clock className="h-4 w-4 text-purple-400" />;
      case 'PREPARING':
        return <Coffee className="h-4 w-4 text-blue-400" />;
      case 'READY':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'SERVED':
        return <CheckCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };
  
  // Get wait time based on when the item was added
  const getWaitTime = () => {
    const now = new Date();
    const added = new Date(item.addedAt);
    const diffMs = now.getTime() - added.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    return `${diffMins}m ago`;
  };
  
  return (
    <motion.div 
      layoutId={`item-${item.id}`}
      className={`p-3 rounded-md border ${getStatusClasses()} ${item.isNewItem ? 'border-l-4 border-l-amber-500' : ''}`}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-medium text-base">{item.quantity}x</span>
            <span className="ml-2 text-base">{item.name}</span>
            <div className="flex items-center ml-2 gap-1">
              {item.isNewItem && (
                <Badge className="bg-amber-600 text-white text-xs font-bold animate-pulse">
                  NEW
                </Badge>
              )}
              {orderType === 'WAITING' && (
                <Badge className="bg-red-600 text-white text-xs font-bold">
                  URGENT
                </Badge>
              )}
            </div>
          </div>
          
          {expanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-sm text-gray-300"
            >
              {/* Item variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-2">
                  <p className="text-gray-400 mb-1">Variations:</p>
                  <ul className="list-disc list-inside pl-2">
                    {item.variations.map((variation, index) => (
                      <li key={index}>{variation.name}: {variation.option}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Special instructions */}
              {item.specialInstructions && (
                <div className="mb-2 p-2 border border-amber-500/40 bg-amber-500/10 rounded">
                  <p className="flex items-center text-amber-400 mb-1">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Special Instructions:
                  </p>
                  <p className="text-white">{item.specialInstructions}</p>
                </div>
              )}
              
              {/* Kitchen notes */}
              {item.kitchenNotes && (
                <div className="mb-2">
                  <p className="text-gray-400 mb-1">Kitchen Notes:</p>
                  <p>{item.kitchenNotes}</p>
                </div>
              )}
              
              {/* Time info */}
              <div className="flex justify-between text-xs text-gray-400 mt-3">
                <span>Added: {getWaitTime()}</span>
                {item.lastKitchenPrintAt && (
                  <span>Printed: {new Date(item.lastKitchenPrintAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="flex flex-col items-center">
          <Badge 
            style={{
              backgroundColor: item.itemStatus === 'NEW' ? QSAITheme.purple.primary : 
                item.itemStatus === 'PREPARING' ? '#2563eb' : 
                item.itemStatus === 'READY' ? '#16a34a' : '#6b7280'
            }}
            className={`flex items-center px-2 py-1 text-white`}
          >
            {getStatusIcon()}
            <span className="ml-1">{item.itemStatus}</span>
          </Badge>
        </div>
      </div>
      
      {/* Status update buttons - only show if handler provided */}
      {onUpdateItemStatus && expanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 grid grid-cols-3 gap-2"
        >
          {item.itemStatus !== 'PREPARING' && (
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-600/20 border-blue-500 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateItemStatus(item.id, 'PREPARING');
              }}
            >
              Preparing
            </Button>
          )}
          
          {item.itemStatus !== 'READY' && (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-600/20 border-green-500 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateItemStatus(item.id, 'READY');
              }}
            >
              Ready
            </Button>
          )}
          
          {item.itemStatus !== 'SERVED' && (
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-600/20 border-gray-500 text-white text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateItemStatus(item.id, 'SERVED');
              }}
            >
              Served
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
