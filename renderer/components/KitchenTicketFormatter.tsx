
import React from 'react';
import { cn } from "@/lib/utils";
import ReceiptPreviewWrapper from "./ReceiptPreviewWrapper";

interface KitchenTicketFormatterProps {
  orderData: any;
  paperWidth: number;
  orderType: string;
  highlightAllergies?: boolean;
  emphasizeQuantities?: boolean;
  showModifiers?: boolean;
  showSpecialInstructions?: boolean;
}

/**
 * A specialized component for formatting kitchen tickets with proper emphasis
 * on critical information and without pricing details
 */
const KitchenTicketFormatter: React.FC<KitchenTicketFormatterProps> = ({
  orderData,
  paperWidth,
  orderType,
  highlightAllergies = true,
  emphasizeQuantities = true,
  showModifiers = true,
  showSpecialInstructions = true
}) => {
  if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
    return (
      <ReceiptPreviewWrapper paperWidth={paperWidth} printType="kitchen">
        <div className="text-center font-bold py-2 border-b border-dashed mb-2">
          ** KITCHEN COPY **
        </div>
        <div className="text-center italic">No order data available</div>
      </ReceiptPreviewWrapper>
    );
  }
  
  // Format timestamp
  const timestamp = orderData.timestamp 
    ? new Date(orderData.timestamp).toLocaleString()
    : new Date().toLocaleString();
  
  // Format order type label
  const getOrderTypeLabel = () => {
    switch(orderType?.toLowerCase()) {
      case 'delivery': return 'DELIVERY';
      case 'collection': return 'COLLECTION';
      case 'dine-in': return 'DINE-IN';
      case 'online': return 'ONLINE ORDER';
      case 'voice': return 'PHONE ORDER';
      default: return 'ORDER';
    }
  };

  return (
    <ReceiptPreviewWrapper paperWidth={paperWidth} printType="kitchen">
      {/* Header - Always displayed on kitchen tickets */}
      <div className="text-center font-bold py-1 border-b border-double border-black mb-2">
        ** KITCHEN COPY **
      </div>
      
      <div className="text-center font-bold mb-1">{getOrderTypeLabel()}</div>
      <div className="text-center text-xs mb-2">{timestamp}</div>
      
      {/* Order Identification */}
      <div className="text-center font-bold border border-dashed p-1 mb-2">
        ORDER #{orderData.orderId || '12345'}
      </div>
      
      {/* Customer Info - Only display what's needed in the kitchen */}
      {orderType === 'delivery' && (
        <div className="border border-dashed p-1 mb-3 text-xs">
          <div className="font-bold">Customer: {orderData.customer?.name || 'Customer'}</div>
          {orderData.customer?.phone && <div>Tel: {orderData.customer.phone}</div>}
          {orderData.delivery?.address && (
            <div className="mt-1">
              <div className="font-bold">DELIVERY ADDRESS:</div>
              <div>{orderData.delivery.address}</div>
            </div>
          )}
        </div>
      )}
      
      {orderType === 'collection' && (
        <div className="border border-dashed p-1 mb-3 text-xs">
          <div className="font-bold">Collection: {orderData.collection?.time || 'ASAP'}</div>
          <div>Customer: {orderData.customer?.name || 'Customer'}</div>
          {orderData.customer?.phone && <div>Tel: {orderData.customer.phone}</div>}
        </div>
      )}
      
      {orderType === 'dine-in' && (
        <div className="text-center font-bold border border-dashed p-1 mb-3">
          TABLE: {orderData.tableNumber || 'N/A'} 
          {orderData.guestCount && ` | GUESTS: ${orderData.guestCount}`}
          {orderData.serverName && ` | SERVER: ${orderData.serverName}`}
        </div>
      )}
      
      {/* Items Section with better formatting */}
      <div className="border-t-2 border-dashed mt-3 pt-3">
        <div className="font-bold text-center mb-3 text-lg">═══ ORDER ITEMS ═══</div>
        {orderData.items.map((item: any, index: number) => {
          const quantity = emphasizeQuantities ? `【${item.quantity || 1}×】` : `${item.quantity || 1}x`;
          const itemName = item.name || item.item_name || 'Unknown Item';
          
          return (
            <div key={index} className="mb-4 pb-3 border-b border-dotted border-gray-400">
              {/* Quantity and Item Name with enhanced visibility */}
              <div className="font-bold text-base mb-2">
                <span className="text-xl">{quantity}</span> {itemName.toUpperCase()}
              </div>
              
              {/* Item modifiers - indented */}
              {showModifiers && item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                <div className="ml-6 text-xs">
                  {item.modifiers.map((mod: any, modIndex: number) => (
                    <div key={modIndex} className="italic">
                      - {mod.name} {mod.quantity > 1 ? `(x${mod.quantity})` : ''}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Allergies - highlighted */}
              {highlightAllergies && item.allergies && (
                <div className="text-xs bg-gray-100 dark:bg-gray-800 ml-6 p-1 mt-1 font-bold">
                  ⚠️ ALLERGY: {Array.isArray(item.allergies) 
                    ? item.allergies.join(', ').toUpperCase() 
                    : String(item.allergies).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Special Instructions */}
      {showSpecialInstructions && orderData.specialInstructions && (
        <div className="border-t border-dashed mt-3 pt-1 text-xs">
          <div className="font-bold underline">SPECIAL INSTRUCTIONS:</div>
          <div className="italic">{orderData.specialInstructions}</div>
        </div>
      )}
      
      {/* Timestamp at bottom */}
      <div className="text-xs text-center border-t border-dashed mt-3 pt-1">
        Printed: {new Date().toLocaleTimeString()}
      </div>
    </ReceiptPreviewWrapper>
  );
};

export default KitchenTicketFormatter;
