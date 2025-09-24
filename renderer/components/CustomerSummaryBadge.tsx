

import React from 'react';
import { User, Users, MapPin, Phone, Edit3, Mail, FileText, Trash2 } from 'lucide-react';
import { useCustomerDataStore } from 'utils/customerDataStore';
import { globalColors } from 'utils/QSAIDesign';
import { OrderType } from 'utils/customerTypes';

interface CustomerSummaryBadgeProps {
  orderType: OrderType;
  onClick?: () => void;
  onClear?: () => void; // Add clear callback
  className?: string;
}

export const CustomerSummaryBadge: React.FC<CustomerSummaryBadgeProps> = ({ 
  orderType, 
  onClick, 
  onClear, // Add onClear prop
  className = '' 
}) => {
  const { customerData, hasRequiredCustomerData } = useCustomerDataStore();
  
  const hasData = hasRequiredCustomerData(orderType);
  
  const getIcon = () => {
    switch (orderType) {
      case 'DINE-IN': return <Users className="w-5 h-5" />;
      case 'DELIVERY': return hasData ? <MapPin className="w-5 h-5" /> : null;
      case 'COLLECTION':
      case 'WAITING':
        return hasData ? <User className="w-5 h-5" /> : null;
      default: 
        return hasData ? <User className="w-5 h-5" /> : null;
    }
  };
  
  const getText = () => {
    if (!hasData) {
      switch (orderType) {
        case 'DINE-IN': return 'Select Table';
        case 'DELIVERY': return 'TAKE ORDER';
        default: return 'TAKE ORDER';
      }
    }
    
    if (orderType === 'DINE-IN' && customerData.tableNumber) {
      return `Table ${customerData.tableNumber} (${customerData.guestCount || 2} guests)`;
    }
    
    if (customerData.firstName || customerData.lastName) {
      const name = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
      return name;
    }
    
    return 'Customer Details';
  };
  
  const getPhoneDisplay = () => {
    if ((orderType === 'DELIVERY' || orderType === 'COLLECTION' || orderType === 'WAITING') && 
        hasData && customerData.phone) {
      return customerData.phone;
    }
    return null;
  };
  
  const getAddressDisplay = () => {
    if (orderType === 'DELIVERY' && hasData) {
      // Build full address from individual components
      const addressParts = [];
      
      if (customerData.street) {
        addressParts.push(customerData.street);
      }
      if (customerData.city) {
        addressParts.push(customerData.city);
      }
      if (customerData.postcode) {
        addressParts.push(customerData.postcode);
      }
      
      // If we have individual components, use them
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
      
      // Fallback to the combined address field
      if (customerData.address) {
        return customerData.address;
      }
    }
    return null;
  };

  // Get email display for non-dine-in orders
  const getEmailDisplay = () => {
    if ((orderType === 'DELIVERY' || orderType === 'COLLECTION' || orderType === 'WAITING') && 
        hasData && customerData.email) {
      return customerData.email;
    }
    return null;
  };

  // Get notes display for all order types
  const getNotesDisplay = () => {
    if (hasData && customerData.notes) {
      return customerData.notes;
    }
    return null;
  };

  // Get delivery notes display for delivery orders
  const getDeliveryNotesDisplay = () => {
    if (orderType === 'DELIVERY' && hasData && customerData.deliveryNotes) {
      return customerData.deliveryNotes;
    }
    return null;
  };

  const getSubtext = () => {
    // Show CTA message for TAKE ORDER state
    if (!hasData && getText() === 'TAKE ORDER') {
      return 'Add customer info';
    }
    
    return null;
  };

  const isTakeOrderState = ['COLLECTION', 'DELIVERY', 'WAITING'].includes(orderType) && getText() === 'TAKE ORDER';
  const phone = getPhoneDisplay();
  const address = getAddressDisplay();
  const email = getEmailDisplay();
  const notes = getNotesDisplay();
  const deliveryNotes = getDeliveryNotesDisplay();

  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-start gap-3 px-5 py-4 rounded-lg transition-all duration-300 w-full text-left
        hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
        group
        ${
          isTakeOrderState 
            ? 'shimmer-animation font-bold' 
            : 'hover:bg-opacity-90'
        }
      `}
      style={{
        background: isTakeOrderState 
          ? `linear-gradient(145deg, ${globalColors.purple.primary}, ${globalColors.purple.light})`
          : `linear-gradient(145deg, rgba(30, 30, 30, 0.95), rgba(26, 26, 26, 0.95))`,
        backdropFilter: 'blur(12px)',
        border: isTakeOrderState 
          ? `2px solid ${globalColors.purple.light}`
          : `1px solid rgba(124, 93, 250, 0.2)`,
        boxShadow: isTakeOrderState 
          ? `0 8px 32px ${globalColors.purple.glow}40, 0 0 0 1px ${globalColors.purple.primary}60`
          : `0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(124, 93, 250, 0.1)`,
        color: isTakeOrderState ? '#ffffff' : '#f3f4f6'
      }}
    >
      {/* Enhanced Border System for TAKE ORDER state */}
      {isTakeOrderState && (
        <>
          {/* Inner Glow Ring */}
          <div 
            className="absolute inset-1 rounded-lg pointer-events-none"
            style={{
              border: `1px solid rgba(255, 255, 255, 0.4)`,
              background: 'transparent'
            }}
          />
          
          {/* Outer Shimmer Ring */}
          <div 
            className="absolute -inset-0.5 rounded-xl pointer-events-none shimmer-border"
            style={{
              background: `linear-gradient(135deg, ${globalColors.purple.primary} 30%, ${globalColors.purple.light} 100%)`,
              padding: '2px',
              zIndex: -1
            }}
          >
            <div 
              className="w-full h-full rounded-lg" 
              style={{ 
                background: `linear-gradient(135deg, ${globalColors.purple.primary} 30%, ${globalColors.purple.light} 100%)`
              }}
            />
          </div>
        </>
      )}
      
      {/* Icon with QSAI styling - only render container if icon exists */}
      {getIcon() && (
        <div className={`
          flex items-center justify-center flex-shrink-0
          ${isTakeOrderState ? 'w-10 h-10' : 'w-8 h-8'}
          transition-all duration-300
        `}>
          <div 
            className={`
              transition-all duration-300
              ${
                isTakeOrderState 
                  ? 'scale-110 group-hover:scale-125'
                  : 'group-hover:scale-110'
              }
            `}
            style={{
              filter: isTakeOrderState 
                ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.4))'
                : `drop-shadow(0 0 8px ${globalColors.purple.glow}60)`,
              color: isTakeOrderState ? '#ffffff' : globalColors.purple.light
            }}
          >
            {getIcon()}
          </div>
        </div>
      )}
      
      {/* Customer Information with QSAI Typography */}
      <div className={`min-w-0 flex-1 ${
        isTakeOrderState ? 'text-center' : 'space-y-1.5'
      }`}>
        {/* Click to text for TAKE ORDER state */}
        {isTakeOrderState && (
          <div className="text-sm text-purple-100 group-hover:text-white">
            Click to
          </div>
        )}
        
        {/* Customer Name with Gradient Text */}
        <div className={`truncate transition-all duration-300 ${
          isTakeOrderState 
            ? 'text-lg font-bold text-white group-hover:text-purple-100' 
            : hasData 
              ? 'text-sm font-semibold text-white' 
              : 'text-sm font-medium text-gray-300'
        }`}>
          {getText()}
        </div>
        
        {/* Phone Number with QSAI styling */}
        {phone && !isTakeOrderState && (
          <div className="flex items-center gap-2">
            <Phone 
              className="w-3.5 h-3.5 flex-shrink-0" 
              style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow}60)`
              }} 
            />
            <span className="text-xs text-white truncate">
              {phone}
            </span>
          </div>
        )}
        
        {/* Email Address with QSAI styling */}
        {email && !isTakeOrderState && (
          <div className="flex items-center gap-2">
            <Mail 
              className="w-3.5 h-3.5 flex-shrink-0" 
              style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow}60)`
              }} 
            />
            <span className="text-xs text-white break-words">
              {email}
            </span>
          </div>
        )}
        
        {/* Full Address with QSAI styling */}
        {address && !isTakeOrderState && (
          <div className="flex items-start gap-2">
            <MapPin 
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" 
              style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow}60)`
              }} 
            />
            <span 
              className="text-xs break-words leading-relaxed text-white" 
              title={address}
            >
              {address}
            </span>
          </div>
        )}
        
        {/* Order Notes with QSAI styling */}
        {notes && !isTakeOrderState && (
          <div className="flex items-start gap-2">
            <FileText 
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" 
              style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow}60)`
              }} 
            />
            <span 
              className="text-xs break-words line-clamp-2 leading-relaxed text-white" 
              title={notes}
            >
              {notes}
            </span>
          </div>
        )}
        
        {/* Delivery Notes with QSAI styling (for delivery orders) */}
        {deliveryNotes && !isTakeOrderState && (
          <div className="flex items-start gap-2">
            <FileText 
              className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" 
              style={{ 
                color: globalColors.purple.primary,
                filter: `drop-shadow(0 0 6px ${globalColors.purple.glow}60)`
              }} 
            />
            <span 
              className="text-xs break-words line-clamp-2 leading-relaxed text-green-300" 
              title={`Delivery Notes: ${deliveryNotes}`}
            >
              Delivery: {deliveryNotes}
            </span>
          </div>
        )}
        
        {/* Subtext for TAKE ORDER state */}
        {getSubtext() && (
          <div className={`truncate transition-all duration-300 ${
            isTakeOrderState 
              ? 'text-sm text-purple-100 group-hover:text-white mt-1' 
              : 'text-xs'
          }`}
          style={{
            color: isTakeOrderState ? undefined : '#9ca3af'
          }}>
            {getSubtext()}
          </div>
        )}
      </div>
      
      {/* Action Icons - Edit and Clear */}
      {!isTakeOrderState && hasData && (
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Clear/Reset Button */}
          {onClear && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="opacity-60 hover:opacity-100 transition-all duration-300 p-1 rounded-md hover:bg-red-500/20 cursor-pointer"
              title="Clear customer details"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onClear();
                }
              }}
            >
              <Trash2 
                className="w-4 h-4" 
                style={{ 
                  color: '#ef4444',
                  filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.4))'
                }} 
              />
            </div>
          )}
          
          {/* Edit Button with white styling */}
          <div className="opacity-60 group-hover:opacity-100 transition-all duration-300">
            <Edit3 
              className="w-4 h-4" 
              style={{ 
                color: '#ffffff',
                filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.4))'
              }} 
            />
          </div>
        </div>
      )}
    </button>
  );
};

export default CustomerSummaryBadge;
